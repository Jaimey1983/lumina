// ─── Catálogo de formas (W2) ──────────────────────────────────────────────────
// Cada forma declara su geometría como función del tamaño: el trazado se vuelve a
// calcular para cada (ancho, alto), nunca se estira, así que el grosor del
// contorno no se deforma. Coordenadas locales: (0, 0) es la esquina superior
// izquierda de la caja de la forma.

import type { Punto, TipoForma } from '../tipos.js';

export type GrupoForma = 'basicas' | 'flechas' | 'diagramas';

export interface Rectangulo {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

/** Ajuste propio de una forma, siempre como proporción para que escale con el tamaño. */
export interface ParametroForma {
  clave: string;
  etiqueta: string;
  min: number;
  max: number;
  porDefecto: number;
  paso: number;
}

export type ValoresParametros = Record<string, number>;

export interface DefinicionForma {
  id: TipoForma;
  nombre: string;
  grupo: GrupoForma;
  /** Tamaño con el que se inserta con un clic. */
  tamano: { ancho: number; alto: number };
  parametros: readonly ParametroForma[];
  /** Vértices, si la forma es un polígono (lo usan el trazado y las pruebas). */
  poligono?: (ancho: number, alto: number, p: ValoresParametros) => Punto[];
  /** Path SVG (`d`). `radio` solo lo usa el rectángulo. */
  trazado: (ancho: number, alto: number, p: ValoresParametros, radio: number) => string;
  /** Zona donde se escribe el texto de la forma. */
  rectanguloTexto: (ancho: number, alto: number, p: ValoresParametros) => Rectangulo;
  /** Puntos de unión de conectores. Orden: arriba, derecha, abajo, izquierda (y los que sumen después). */
  puertos: (ancho: number, alto: number, p: ValoresParametros) => Punto[];
}

// ─── Utilidades de trazado ────────────────────────────────────────────────────

const fmt = (v: number): string => String(Math.round(v * 100) / 100);
const par = (x: number, y: number): string => `${fmt(x)},${fmt(y)}`;

/** `M x,y L x,y … Z` */
export function trazadoPoligono(puntos: readonly Punto[]): string {
  if (puntos.length === 0) return '';
  return `M${puntos.map((p) => par(p.x, p.y)).join(' L')} Z`;
}

function trazadoElipse(cx: number, cy: number, rx: number, ry: number): string {
  return `M${par(cx - rx, cy)} A${par(rx, ry)} 0 1 0 ${par(cx + rx, cy)} A${par(rx, ry)} 0 1 0 ${par(cx - rx, cy)} Z`;
}

function trazadoRectanguloRedondeado(ancho: number, alto: number, radio: number): string {
  const r = Math.min(Math.max(radio, 0), ancho / 2, alto / 2);
  if (r <= 0) return trazadoPoligono([{ x: 0, y: 0 }, { x: ancho, y: 0 }, { x: ancho, y: alto }, { x: 0, y: alto }]);
  return [
    `M${par(r, 0)}`,
    `L${par(ancho - r, 0)} A${par(r, r)} 0 0 1 ${par(ancho, r)}`,
    `L${par(ancho, alto - r)} A${par(r, r)} 0 0 1 ${par(ancho - r, alto)}`,
    `L${par(r, alto)} A${par(r, r)} 0 0 1 ${par(0, alto - r)}`,
    `L${par(0, r)} A${par(r, r)} 0 0 1 ${par(r, 0)} Z`,
  ].join(' ');
}

/** Escala los puntos para que su caja envolvente ocupe exactamente `ancho × alto`. */
function ajustarACaja(puntos: readonly Punto[], ancho: number, alto: number): { puntos: Punto[]; sx: number; sy: number; ox: number; oy: number } {
  const xs = puntos.map((p) => p.x);
  const ys = puntos.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const sx = ancho / (Math.max(...xs) - minX || 1);
  const sy = alto / (Math.max(...ys) - minY || 1);
  return { puntos: puntos.map((p) => ({ x: (p.x - minX) * sx, y: (p.y - minY) * sy })), sx, sy, ox: minX, oy: minY };
}

const puntosCardinales = (ancho: number, alto: number): Punto[] => [
  { x: ancho / 2, y: 0 },
  { x: ancho, y: alto / 2 },
  { x: ancho / 2, y: alto },
  { x: 0, y: alto / 2 },
];

const cajaCompleta = (ancho: number, alto: number): Rectangulo => ({ x: 0, y: 0, ancho, alto });

/** Punto dentro de un polígono (trazado de rayos; vale también para polígonos cóncavos). */
function puntoEnPoligono(punto: Punto, poligono: readonly Punto[]): boolean {
  let dentro = false;
  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const a = poligono[i];
    const b = poligono[j];
    if (a.y > punto.y !== b.y > punto.y && punto.x < ((b.x - a.x) * (punto.y - a.y)) / (b.y - a.y) + a.x) dentro = !dentro;
  }
  return dentro;
}

function espejar(p: Punto, ancho: number): Punto {
  return { x: ancho - p.x, y: p.y };
}

// ─── Geometría por forma ──────────────────────────────────────────────────────

/** Vértices de un polígono regular de `n` lados con un vértice hacia arriba, ya ajustado a la caja. */
function poligonoRegular(n: number, ancho: number, alto: number): Punto[] {
  const crudo = Array.from({ length: n }, (_, k) => {
    const a = -Math.PI / 2 + (2 * Math.PI * k) / n;
    return { x: Math.cos(a), y: Math.sin(a) };
  });
  return ajustarACaja(crudo, ancho, alto).puntos;
}

function geometriaEstrella(ancho: number, alto: number, p: ValoresParametros) {
  const n = Math.round(p.puntas);
  const crudo: Punto[] = [];
  for (let k = 0; k < n * 2; k++) {
    const radio = k % 2 === 0 ? 1 : p.radioInterior;
    const a = -Math.PI / 2 + (Math.PI * k) / n;
    crudo.push({ x: radio * Math.cos(a), y: radio * Math.sin(a) });
  }
  // Se ajusta la caja del contorno exterior; el centro (0, 0) se transforma igual.
  const { puntos, sx, sy, ox, oy } = ajustarACaja(crudo, ancho, alto);
  return { puntos, centro: { x: (0 - ox) * sx, y: (0 - oy) * sy }, sx, sy };
}

function flechaDerecha(ancho: number, alto: number, p: ValoresParametros): Punto[] {
  const x0 = (1 - p.cabeza) * ancho;
  const y1 = ((1 - p.cuerpo) / 2) * alto;
  const y2 = ((1 + p.cuerpo) / 2) * alto;
  return [
    { x: 0, y: y1 },
    { x: x0, y: y1 },
    { x: x0, y: 0 },
    { x: ancho, y: alto / 2 },
    { x: x0, y: alto },
    { x: x0, y: y2 },
    { x: 0, y: y2 },
  ];
}

const PARAMETRO_CABEZA: ParametroForma = { clave: 'cabeza', etiqueta: 'Largo de la punta', min: 0.2, max: 0.7, porDefecto: 0.4, paso: 0.05 };
const PARAMETRO_CUERPO: ParametroForma = { clave: 'cuerpo', etiqueta: 'Grosor del cuerpo', min: 0.2, max: 0.8, porDefecto: 0.5, paso: 0.05 };
const PARAMETRO_INCLINACION: ParametroForma = { clave: 'inclinacion', etiqueta: 'Inclinación', min: 0, max: 0.45, porDefecto: 0.2, paso: 0.05 };

// Nube: curvas fijas en una caja de 100 × 54, escaladas a la caja real.
const NUBE_ANCHO = 100;
const NUBE_ALTO = 54;
const NUBE_D = 'M22,52 C8,52 0,42 3,32 C5,22 14,16 22,19 C24,8 36,3 45,8 C51,0 64,1 70,9 C80,4 94,12 92,23 C99,27 100,40 94,46 C92,52 85,54 78,52 Z';

function trazadoNube(ancho: number, alto: number): string {
  const sx = ancho / NUBE_ANCHO;
  const sy = alto / NUBE_ALTO;
  return NUBE_D.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x: string, y: string) => par(Number(x) * sx, Number(y) * sy));
}

/** Llave `{`: el eje se curva y se cierra con una copia desplazada `grosor` hacia la derecha. */
function trazadoLlave(ancho: number, alto: number, grosor: number): string {
  const t = grosor * ancho;
  const w = ancho - t;
  const h = alto;
  const eje: Array<[Punto, Punto, Punto]> = [
    [{ x: 0.5 * w, y: 0 }, { x: 0.55 * w, y: 0.08 * h }, { x: 0.55 * w, y: 0.25 * h }],
    [{ x: 0.55 * w, y: 0.4 * h }, { x: 0.55 * w, y: 0.42 * h }, { x: 0, y: 0.5 * h }],
    [{ x: 0.55 * w, y: 0.58 * h }, { x: 0.55 * w, y: 0.6 * h }, { x: 0.55 * w, y: 0.75 * h }],
    [{ x: 0.55 * w, y: 0.92 * h }, { x: 0.5 * w, y: h }, { x: w, y: h }],
  ];
  const ida = `M${par(w, 0)} ` + eje.map(([a, b, c]) => `C${par(a.x, a.y)} ${par(b.x, b.y)} ${par(c.x, c.y)}`).join(' ');
  // Vuelta: mismos tramos en sentido inverso y desplazados a la derecha.
  const inicios: Punto[] = [{ x: w, y: 0 }, eje[0][2], eje[1][2], eje[2][2]];
  const vuelta = [3, 2, 1, 0]
    .map((i) => {
      const [a, b] = eje[i];
      const destino = inicios[i];
      return `C${par(b.x + t, b.y)} ${par(a.x + t, a.y)} ${par(destino.x + t, destino.y)}`;
    })
    .join(' ');
  return `${ida} L${par(w + t, h)} ${vuelta} Z`;
}

function geometriaCallout(ancho: number, alto: number, p: ValoresParametros) {
  const cuerpoAlto = alto * 0.8;
  const r = Math.min(0.15 * Math.min(ancho, cuerpoAlto), ancho / 2);
  const x1 = Math.min(p.cola * ancho, ancho - r - 0.14 * ancho);
  const x2 = x1 + 0.14 * ancho;
  return { cuerpoAlto, r, x1, x2 };
}

// ─── Catálogo ─────────────────────────────────────────────────────────────────

function poligonal(
  base: Omit<DefinicionForma, 'trazado'> & { poligono: NonNullable<DefinicionForma['poligono']> },
): DefinicionForma {
  return { ...base, trazado: (ancho, alto, p) => trazadoPoligono(base.poligono(ancho, alto, p)) };
}

export const FORMAS: Record<TipoForma, DefinicionForma> = {
  rectangulo: {
    id: 'rectangulo',
    nombre: 'Rectángulo',
    grupo: 'basicas',
    tamano: { ancho: 160, alto: 100 },
    parametros: [],
    poligono: (ancho, alto) => [{ x: 0, y: 0 }, { x: ancho, y: 0 }, { x: ancho, y: alto }, { x: 0, y: alto }],
    trazado: (ancho, alto, _p, radio) => trazadoRectanguloRedondeado(ancho, alto, radio),
    rectanguloTexto: cajaCompleta,
    puertos: puntosCardinales,
  },
  'rectangulo-redondeado': {
    id: 'rectangulo-redondeado',
    nombre: 'Rectángulo redondeado',
    grupo: 'basicas',
    tamano: { ancho: 160, alto: 100 },
    parametros: [{ clave: 'esquina', etiqueta: 'Redondeo', min: 0.05, max: 0.5, porDefecto: 0.2, paso: 0.05 }],
    trazado: (ancho, alto, p) => trazadoRectanguloRedondeado(ancho, alto, p.esquina * Math.min(ancho, alto)),
    rectanguloTexto: (ancho, alto, p) => {
      const m = (p.esquina * Math.min(ancho, alto)) * 0.3;
      return { x: m, y: m, ancho: ancho - 2 * m, alto: alto - 2 * m };
    },
    puertos: puntosCardinales,
  },
  elipse: {
    id: 'elipse',
    nombre: 'Elipse',
    grupo: 'basicas',
    tamano: { ancho: 160, alto: 100 },
    parametros: [],
    trazado: (ancho, alto) => trazadoElipse(ancho / 2, alto / 2, ancho / 2, alto / 2),
    // Rectángulo inscrito: lados 1/√2 del eje, con las esquinas exactamente sobre la elipse.
    rectanguloTexto: (ancho, alto) => ({
      x: ((1 - Math.SQRT1_2) / 2) * ancho,
      y: ((1 - Math.SQRT1_2) / 2) * alto,
      ancho: Math.SQRT1_2 * ancho,
      alto: Math.SQRT1_2 * alto,
    }),
    puertos: puntosCardinales,
  },
  circulo: {
    id: 'circulo',
    nombre: 'Círculo',
    grupo: 'basicas',
    tamano: { ancho: 100, alto: 100 },
    parametros: [],
    trazado: (ancho, alto) => {
      const r = Math.min(ancho, alto) / 2;
      return trazadoElipse(ancho / 2, alto / 2, r, r);
    },
    rectanguloTexto: (ancho, alto) => {
      const lado = Math.min(ancho, alto) * Math.SQRT1_2;
      return { x: (ancho - lado) / 2, y: (alto - lado) / 2, ancho: lado, alto: lado };
    },
    puertos: (ancho, alto) => {
      const r = Math.min(ancho, alto) / 2;
      const cx = ancho / 2;
      const cy = alto / 2;
      return [{ x: cx, y: cy - r }, { x: cx + r, y: cy }, { x: cx, y: cy + r }, { x: cx - r, y: cy }];
    },
  },
  rombo: poligonal({
    id: 'rombo',
    nombre: 'Rombo',
    grupo: 'diagramas',
    tamano: { ancho: 140, alto: 100 },
    parametros: [],
    poligono: (ancho, alto) => puntosCardinales(ancho, alto),
    rectanguloTexto: (ancho, alto) => ({ x: ancho * 0.25, y: alto * 0.25, ancho: ancho * 0.5, alto: alto * 0.5 }),
    puertos: puntosCardinales,
  }),
  triangulo: poligonal({
    id: 'triangulo',
    nombre: 'Triángulo',
    grupo: 'basicas',
    tamano: { ancho: 140, alto: 120 },
    parametros: [],
    poligono: (ancho, alto) => [{ x: ancho / 2, y: 0 }, { x: ancho, y: alto }, { x: 0, y: alto }],
    rectanguloTexto: (ancho, alto) => ({ x: ancho * 0.25, y: alto * 0.5, ancho: ancho * 0.5, alto: alto * 0.5 }),
    puertos: (ancho, alto) => [{ x: ancho / 2, y: 0 }, { x: ancho * 0.75, y: alto / 2 }, { x: ancho / 2, y: alto }, { x: ancho * 0.25, y: alto / 2 }],
  }),
  'triangulo-rectangulo': poligonal({
    id: 'triangulo-rectangulo',
    nombre: 'Triángulo rectángulo',
    grupo: 'basicas',
    tamano: { ancho: 140, alto: 120 },
    parametros: [],
    poligono: (ancho, alto) => [{ x: 0, y: 0 }, { x: ancho, y: alto }, { x: 0, y: alto }],
    rectanguloTexto: (ancho, alto) => ({ x: 0, y: alto * 0.5, ancho: ancho * 0.5, alto: alto * 0.5 }),
    puertos: (ancho, alto) => [{ x: 0, y: 0 }, { x: ancho / 2, y: alto / 2 }, { x: ancho / 2, y: alto }, { x: 0, y: alto / 2 }],
  }),
  trapecio: poligonal({
    id: 'trapecio',
    nombre: 'Trapecio',
    grupo: 'basicas',
    tamano: { ancho: 160, alto: 100 },
    parametros: [PARAMETRO_INCLINACION],
    poligono: (ancho, alto, p) => [{ x: p.inclinacion * ancho, y: 0 }, { x: (1 - p.inclinacion) * ancho, y: 0 }, { x: ancho, y: alto }, { x: 0, y: alto }],
    rectanguloTexto: (ancho, alto, p) => ({ x: p.inclinacion * ancho, y: 0, ancho: (1 - 2 * p.inclinacion) * ancho, alto }),
    puertos: (ancho, alto, p) => [
      { x: ancho / 2, y: 0 },
      { x: ancho - (p.inclinacion * ancho) / 2, y: alto / 2 },
      { x: ancho / 2, y: alto },
      { x: (p.inclinacion * ancho) / 2, y: alto / 2 },
    ],
  }),
  paralelogramo: poligonal({
    id: 'paralelogramo',
    nombre: 'Paralelogramo',
    grupo: 'diagramas',
    tamano: { ancho: 160, alto: 90 },
    parametros: [PARAMETRO_INCLINACION],
    poligono: (ancho, alto, p) => [{ x: p.inclinacion * ancho, y: 0 }, { x: ancho, y: 0 }, { x: (1 - p.inclinacion) * ancho, y: alto }, { x: 0, y: alto }],
    rectanguloTexto: (ancho, alto, p) => ({ x: p.inclinacion * ancho, y: 0, ancho: (1 - 2 * p.inclinacion) * ancho, alto }),
    puertos: (ancho, alto, p) => [
      { x: (ancho + p.inclinacion * ancho) / 2, y: 0 },
      { x: ancho - (p.inclinacion * ancho) / 2, y: alto / 2 },
      { x: (ancho - p.inclinacion * ancho) / 2, y: alto },
      { x: (p.inclinacion * ancho) / 2, y: alto / 2 },
    ],
  }),
  pentagono: poligonal({
    id: 'pentagono',
    nombre: 'Pentágono',
    grupo: 'basicas',
    tamano: { ancho: 120, alto: 115 },
    parametros: [],
    poligono: (ancho, alto) => poligonoRegular(5, ancho, alto),
    rectanguloTexto: (ancho, alto) => ({ x: ancho * 0.2, y: alto * 0.4, ancho: ancho * 0.6, alto: alto * 0.6 }),
    puertos: (ancho, alto) => {
      const v = poligonoRegular(5, ancho, alto);
      // arriba: vértice superior · derecha: mitad del lado derecho · abajo: mitad de la base · izquierda: mitad del lado izquierdo
      return [v[0], { x: (v[1].x + v[2].x) / 2, y: (v[1].y + v[2].y) / 2 }, { x: (v[2].x + v[3].x) / 2, y: (v[2].y + v[3].y) / 2 }, { x: (v[3].x + v[4].x) / 2, y: (v[3].y + v[4].y) / 2 }];
    },
  }),
  hexagono: poligonal({
    id: 'hexagono',
    nombre: 'Hexágono',
    grupo: 'basicas',
    tamano: { ancho: 150, alto: 100 },
    parametros: [{ clave: 'inclinacion', etiqueta: 'Puntas laterales', min: 0.1, max: 0.45, porDefecto: 0.25, paso: 0.05 }],
    poligono: (ancho, alto, p) => [
      { x: p.inclinacion * ancho, y: 0 },
      { x: (1 - p.inclinacion) * ancho, y: 0 },
      { x: ancho, y: alto / 2 },
      { x: (1 - p.inclinacion) * ancho, y: alto },
      { x: p.inclinacion * ancho, y: alto },
      { x: 0, y: alto / 2 },
    ],
    rectanguloTexto: (ancho, alto, p) => ({ x: p.inclinacion * ancho, y: 0, ancho: (1 - 2 * p.inclinacion) * ancho, alto }),
    puertos: puntosCardinales,
  }),
  octogono: poligonal({
    id: 'octogono',
    nombre: 'Octógono',
    grupo: 'basicas',
    tamano: { ancho: 120, alto: 120 },
    parametros: [{ clave: 'corte', etiqueta: 'Corte de esquinas', min: 0.1, max: 0.45, porDefecto: 0.29, paso: 0.01 }],
    poligono: (ancho, alto, p) => {
      const c = p.corte;
      return [
        { x: c * ancho, y: 0 },
        { x: (1 - c) * ancho, y: 0 },
        { x: ancho, y: c * alto },
        { x: ancho, y: (1 - c) * alto },
        { x: (1 - c) * ancho, y: alto },
        { x: c * ancho, y: alto },
        { x: 0, y: (1 - c) * alto },
        { x: 0, y: c * alto },
      ];
    },
    rectanguloTexto: (ancho, alto, p) => ({ x: (p.corte * ancho) / 2, y: (p.corte * alto) / 2, ancho: (1 - p.corte) * ancho, alto: (1 - p.corte) * alto }),
    puertos: puntosCardinales,
  }),
  estrella: {
    id: 'estrella',
    nombre: 'Estrella',
    grupo: 'basicas',
    tamano: { ancho: 120, alto: 115 },
    parametros: [
      { clave: 'puntas', etiqueta: 'Puntas', min: 3, max: 12, porDefecto: 5, paso: 1 },
      { clave: 'radioInterior', etiqueta: 'Profundidad', min: 0.2, max: 0.8, porDefecto: 0.4, paso: 0.05 },
    ],
    poligono: (ancho, alto, p) => geometriaEstrella(ancho, alto, p).puntos,
    trazado: (ancho, alto, p) => trazadoPoligono(geometriaEstrella(ancho, alto, p).puntos),
    rectanguloTexto: (ancho, alto, p) => {
      const { puntos, centro } = geometriaEstrella(ancho, alto, p);
      // Rectángulo centrado, 2,2 veces más ancho que alto, lo más grande que quepa dentro de la estrella.
      const razon = 2.2;
      const cabe = (medioAlto: number): boolean =>
        [-1, 0, 1].every((i) =>
          [-1, 0, 1].every((j) => (i === 0 && j === 0) || puntoEnPoligono({ x: centro.x + i * medioAlto * razon, y: centro.y + j * medioAlto }, puntos)),
        );
      let bajo = 0;
      let alta = Math.min(ancho, alto) / 2;
      for (let k = 0; k < 24; k++) {
        const medio = (bajo + alta) / 2;
        if (cabe(medio)) bajo = medio;
        else alta = medio;
      }
      return { x: centro.x - bajo * razon, y: centro.y - bajo, ancho: 2 * bajo * razon, alto: 2 * bajo };
    },
    puertos: (ancho, alto, p) => {
      const { puntos } = geometriaEstrella(ancho, alto, p);
      const puntas = puntos.filter((_, i) => i % 2 === 0);
      const masArriba = puntas.reduce((a, b) => (b.y < a.y ? b : a));
      const masAbajo = puntas.reduce((a, b) => (b.y > a.y ? b : a));
      const masDerecha = puntas.reduce((a, b) => (b.x > a.x ? b : a));
      const masIzquierda = puntas.reduce((a, b) => (b.x < a.x ? b : a));
      return [masArriba, masDerecha, masAbajo, masIzquierda];
    },
  },
  cruz: poligonal({
    id: 'cruz',
    nombre: 'Cruz',
    grupo: 'basicas',
    tamano: { ancho: 110, alto: 110 },
    parametros: [{ clave: 'grosor', etiqueta: 'Grosor de brazos', min: 0.2, max: 0.5, porDefecto: 0.33, paso: 0.01 }],
    poligono: (ancho, alto, p) => {
      const a = (1 - p.grosor) / 2;
      const b = 1 - a;
      return [
        { x: a * ancho, y: 0 },
        { x: b * ancho, y: 0 },
        { x: b * ancho, y: a * alto },
        { x: ancho, y: a * alto },
        { x: ancho, y: b * alto },
        { x: b * ancho, y: b * alto },
        { x: b * ancho, y: alto },
        { x: a * ancho, y: alto },
        { x: a * ancho, y: b * alto },
        { x: 0, y: b * alto },
        { x: 0, y: a * alto },
        { x: a * ancho, y: a * alto },
      ];
    },
    rectanguloTexto: (ancho, alto, p) => {
      const a = (1 - p.grosor) / 2;
      return { x: a * ancho, y: a * alto, ancho: p.grosor * ancho, alto: p.grosor * alto };
    },
    puertos: puntosCardinales,
  }),
  'flecha-derecha': poligonal({
    id: 'flecha-derecha',
    nombre: 'Flecha a la derecha',
    grupo: 'flechas',
    tamano: { ancho: 160, alto: 80 },
    parametros: [PARAMETRO_CABEZA, PARAMETRO_CUERPO],
    poligono: flechaDerecha,
    rectanguloTexto: (ancho, alto, p) => ({ x: 0, y: ((1 - p.cuerpo) / 2) * alto, ancho: (1 - p.cabeza) * ancho, alto: p.cuerpo * alto }),
    puertos: (ancho, alto, p) => {
      const x0 = (1 - p.cabeza) * ancho;
      return [{ x: x0 / 2, y: ((1 - p.cuerpo) / 2) * alto }, { x: ancho, y: alto / 2 }, { x: x0 / 2, y: ((1 + p.cuerpo) / 2) * alto }, { x: 0, y: alto / 2 }];
    },
  }),
  'flecha-izquierda': poligonal({
    id: 'flecha-izquierda',
    nombre: 'Flecha a la izquierda',
    grupo: 'flechas',
    tamano: { ancho: 160, alto: 80 },
    parametros: [PARAMETRO_CABEZA, PARAMETRO_CUERPO],
    poligono: (ancho, alto, p) => flechaDerecha(ancho, alto, p).map((pt) => espejar(pt, ancho)),
    rectanguloTexto: (ancho, alto, p) => ({ x: p.cabeza * ancho, y: ((1 - p.cuerpo) / 2) * alto, ancho: (1 - p.cabeza) * ancho, alto: p.cuerpo * alto }),
    puertos: (ancho, alto, p) => {
      const x0 = (1 - p.cabeza) * ancho;
      const arriba = espejar({ x: x0 / 2, y: ((1 - p.cuerpo) / 2) * alto }, ancho);
      const abajo = espejar({ x: x0 / 2, y: ((1 + p.cuerpo) / 2) * alto }, ancho);
      return [arriba, { x: ancho, y: alto / 2 }, abajo, { x: 0, y: alto / 2 }];
    },
  }),
  'flecha-doble': poligonal({
    id: 'flecha-doble',
    nombre: 'Flecha doble',
    grupo: 'flechas',
    tamano: { ancho: 180, alto: 80 },
    parametros: [{ ...PARAMETRO_CABEZA, max: 0.45, porDefecto: 0.25 }, PARAMETRO_CUERPO],
    poligono: (ancho, alto, p) => {
      const x0 = p.cabeza * ancho;
      const x1 = (1 - p.cabeza) * ancho;
      const y1 = ((1 - p.cuerpo) / 2) * alto;
      const y2 = ((1 + p.cuerpo) / 2) * alto;
      return [
        { x: 0, y: alto / 2 },
        { x: x0, y: 0 },
        { x: x0, y: y1 },
        { x: x1, y: y1 },
        { x: x1, y: 0 },
        { x: ancho, y: alto / 2 },
        { x: x1, y: alto },
        { x: x1, y: y2 },
        { x: x0, y: y2 },
        { x: x0, y: alto },
      ];
    },
    rectanguloTexto: (ancho, alto, p) => ({ x: p.cabeza * ancho, y: ((1 - p.cuerpo) / 2) * alto, ancho: (1 - 2 * p.cabeza) * ancho, alto: p.cuerpo * alto }),
    puertos: (ancho, alto, p) => [
      { x: ancho / 2, y: ((1 - p.cuerpo) / 2) * alto },
      { x: ancho, y: alto / 2 },
      { x: ancho / 2, y: ((1 + p.cuerpo) / 2) * alto },
      { x: 0, y: alto / 2 },
    ],
  }),
  cilindro: {
    id: 'cilindro',
    nombre: 'Cilindro',
    grupo: 'diagramas',
    tamano: { ancho: 100, alto: 130 },
    parametros: [{ clave: 'tapa', etiqueta: 'Altura de la tapa', min: 0.1, max: 0.4, porDefecto: 0.2, paso: 0.05 }],
    trazado: (ancho, alto, p) => {
      const ry = (p.tapa * alto) / 2;
      const silueta = `M${par(0, ry)} A${par(ancho / 2, ry)} 0 0 1 ${par(ancho, ry)} L${par(ancho, alto - ry)} A${par(ancho / 2, ry)} 0 0 1 ${par(0, alto - ry)} Z`;
      return `${silueta} ${trazadoElipse(ancho / 2, ry, ancho / 2, ry)}`;
    },
    rectanguloTexto: (ancho, alto, p) => {
      const tapa = p.tapa * alto;
      return { x: 0, y: tapa, ancho, alto: alto - tapa - tapa / 2 };
    },
    puertos: puntosCardinales,
  },
  nube: {
    id: 'nube',
    nombre: 'Nube',
    grupo: 'diagramas',
    tamano: { ancho: 180, alto: 110 },
    parametros: [],
    trazado: (ancho, alto) => trazadoNube(ancho, alto),
    rectanguloTexto: (ancho, alto) => ({ x: ancho * 0.14, y: alto * 0.25, ancho: ancho * 0.72, alto: alto * 0.55 }),
    puertos: (ancho, alto) => {
      const sx = ancho / NUBE_ANCHO;
      const sy = alto / NUBE_ALTO;
      // Puntos que están sobre las curvas: ápice del tramo superior, mitad del tramo derecho, ancla izquierda y base.
      return [{ x: 57.5 * sx, y: 2.5 * sy }, { x: 97.875 * sx, y: 33.75 * sy }, { x: 50 * sx, y: 52 * sy }, { x: 3 * sx, y: 32 * sy }];
    },
  },
  llave: {
    id: 'llave',
    nombre: 'Llave',
    grupo: 'diagramas',
    tamano: { ancho: 50, alto: 160 },
    parametros: [{ clave: 'grosor', etiqueta: 'Grosor', min: 0.04, max: 0.3, porDefecto: 0.12, paso: 0.01 }],
    trazado: (ancho, alto, p) => trazadoLlave(ancho, alto, p.grosor),
    // El texto de una llave va a su lado: se ofrece la zona a la derecha de la punta.
    rectanguloTexto: (ancho, alto) => ({ x: ancho * 0.55, y: alto * 0.35, ancho: ancho * 0.45, alto: alto * 0.3 }),
    puertos: (ancho, alto, p) => {
      const t = p.grosor * ancho;
      const w = ancho - t;
      return [{ x: w + t / 2, y: 0 }, { x: 0.55 * w + t, y: 0.25 * alto }, { x: w + t / 2, y: alto }, { x: 0, y: alto / 2 }];
    },
  },
  callout: {
    id: 'callout',
    nombre: 'Globo de texto',
    grupo: 'diagramas',
    tamano: { ancho: 180, alto: 110 },
    parametros: [{ clave: 'cola', etiqueta: 'Posición de la cola', min: 0.1, max: 0.7, porDefecto: 0.25, paso: 0.05 }],
    trazado: (ancho, alto, p) => {
      const { cuerpoAlto, r, x1, x2 } = geometriaCallout(ancho, alto, p);
      return [
        `M${par(r, 0)}`,
        `L${par(ancho - r, 0)} A${par(r, r)} 0 0 1 ${par(ancho, r)}`,
        `L${par(ancho, cuerpoAlto - r)} A${par(r, r)} 0 0 1 ${par(ancho - r, cuerpoAlto)}`,
        `L${par(x2, cuerpoAlto)} L${par(x1, alto)} L${par(x1 + (x2 - x1) * 0.1, cuerpoAlto)}`,
        `L${par(r, cuerpoAlto)} A${par(r, r)} 0 0 1 ${par(0, cuerpoAlto - r)}`,
        `L${par(0, r)} A${par(r, r)} 0 0 1 ${par(r, 0)} Z`,
      ].join(' ');
    },
    rectanguloTexto: (ancho, alto, p) => {
      const { cuerpoAlto, r } = geometriaCallout(ancho, alto, p);
      return { x: r / 2, y: r / 2, ancho: ancho - r, alto: cuerpoAlto - r };
    },
    puertos: (ancho, alto, p) => {
      const { cuerpoAlto, x1 } = geometriaCallout(ancho, alto, p);
      return [{ x: ancho / 2, y: 0 }, { x: ancho, y: cuerpoAlto / 2 }, { x: x1, y: alto }, { x: 0, y: cuerpoAlto / 2 }];
    },
  },
};
