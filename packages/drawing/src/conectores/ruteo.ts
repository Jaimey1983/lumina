// ─── Enrutado de conectores (W7) ──────────────────────────────────────────────
// Geometría pura de las rutas: en ángulo recto (busca el camino con menos codos que rodea las
// formas a las que está pegado), curvas y esquinas redondeadas. Sin React ni DOM.

import type { Punto } from '../tipos.js';
import { LADO_OPUESTO, VECTOR_LADO, type Lado } from './puertos.js';

export interface Rect {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

export interface OpcionesRuta {
  /** Distancia que el conector sale en línea recta del puerto antes de poder girar (por defecto 20). */
  margen?: number;
}

const EPS = 1e-6;
/** Lo que «cuesta» cada codo, en unidades de escena: se prefiere un camino con menos codos aunque sea algo más largo. */
const COSTE_CODO = 30;
export const MARGEN_POR_DEFECTO = 20;

const suma = (p: Punto, v: Punto, k = 1): Punto => ({ x: p.x + v.x * k, y: p.y + v.y * k });
const distancia = (a: Punto, b: Punto): number => Math.hypot(a.x - b.x, a.y - b.y);
const igual = (a: Punto, b: Punto): boolean => Math.abs(a.x - b.x) < EPS && Math.abs(a.y - b.y) < EPS;

// ─── Utilidades de polilíneas ─────────────────────────────────────────────────

/** Quita puntos repetidos y los que están en línea recta con sus vecinos (no aportan nada a la forma). */
export function simplificar(ruta: readonly Punto[]): Punto[] {
  const sinRepetir: Punto[] = [];
  for (const p of ruta) {
    const ultimo = sinRepetir[sinRepetir.length - 1];
    if (!ultimo || !igual(ultimo, p)) sinRepetir.push({ x: p.x, y: p.y });
  }
  if (sinRepetir.length < 3) return sinRepetir;
  const salida: Punto[] = [sinRepetir[0] as Punto];
  for (let i = 1; i < sinRepetir.length - 1; i++) {
    const a = salida[salida.length - 1] as Punto;
    const b = sinRepetir[i] as Punto;
    const c = sinRepetir[i + 1] as Punto;
    const cruz = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (Math.abs(cruz) > EPS) salida.push(b);
  }
  salida.push(sinRepetir[sinRepetir.length - 1] as Punto);
  return salida;
}

export function largoDe(ruta: readonly Punto[]): number {
  let total = 0;
  for (let i = 1; i < ruta.length; i++) total += distancia(ruta[i - 1] as Punto, ruta[i] as Punto);
  return total;
}

/** Punto que está a la mitad del recorrido de la polilínea. */
export function puntoMedio(ruta: readonly Punto[]): Punto {
  const primero = ruta[0] ?? { x: 0, y: 0 };
  const total = largoDe(ruta);
  if (ruta.length < 2 || total < EPS) return { ...primero };
  let falta = total / 2;
  for (let i = 1; i < ruta.length; i++) {
    const a = ruta[i - 1] as Punto;
    const b = ruta[i] as Punto;
    const largo = distancia(a, b);
    if (falta <= largo + EPS) {
      const t = largo < EPS ? 0 : falta / largo;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    falta -= largo;
  }
  return { ...(ruta[ruta.length - 1] as Punto) };
}

const num = (v: number): number => Math.round(v * 100) / 100;
const fp = (p: Punto): string => `${num(p.x)},${num(p.y)}`;

/** Dónde empieza y termina la curva que redondea la esquina `esquina` (nunca más de la mitad de cada tramo). */
function recortarEsquina(anterior: Punto, esquina: Punto, siguiente: Punto, radio: number): { entrada: Punto; salida: Punto } | null {
  const l1 = distancia(anterior, esquina);
  const l2 = distancia(esquina, siguiente);
  const r = Math.min(radio, l1 / 2, l2 / 2);
  if (r < EPS || l1 < EPS || l2 < EPS) return null;
  return {
    entrada: { x: esquina.x + ((anterior.x - esquina.x) / l1) * r, y: esquina.y + ((anterior.y - esquina.y) / l1) * r },
    salida: { x: esquina.x + ((siguiente.x - esquina.x) / l2) * r, y: esquina.y + ((siguiente.y - esquina.y) / l2) * r },
  };
}

/** Trazado SVG de una polilínea; con `radio` > 0 las esquinas se redondean (nunca más de la mitad de cada tramo). */
export function trazadoPoligonal(ruta: readonly Punto[], radio = 0): string {
  if (ruta.length === 0) return '';
  if (radio <= 0 || ruta.length < 3) return `M${ruta.map(fp).join(' L')}`;
  let d = `M${fp(ruta[0] as Punto)}`;
  for (let i = 1; i < ruta.length - 1; i++) {
    const esquina = ruta[i] as Punto;
    const corte = recortarEsquina(ruta[i - 1] as Punto, esquina, ruta[i + 1] as Punto, radio);
    d += corte ? ` L${fp(corte.entrada)} Q${fp(esquina)} ${fp(corte.salida)}` : ` L${fp(esquina)}`;
  }
  return `${d} L${fp(ruta[ruta.length - 1] as Punto)}`;
}

/** La misma polilínea con las esquinas redondeadas, como puntos (para detectar clics y ubicar la etiqueta). */
export function polilineaRedondeada(ruta: readonly Punto[], radio: number, pasos = 8): Punto[] {
  if (radio <= 0 || ruta.length < 3) return ruta.map((p) => ({ ...p }));
  const salida: Punto[] = [{ ...(ruta[0] as Punto) }];
  for (let i = 1; i < ruta.length - 1; i++) {
    const esquina = ruta[i] as Punto;
    const corte = recortarEsquina(ruta[i - 1] as Punto, esquina, ruta[i + 1] as Punto, radio);
    if (!corte) {
      salida.push({ ...esquina });
      continue;
    }
    for (let k = 0; k <= pasos; k++) {
      const t = k / pasos;
      const u = 1 - t;
      salida.push({
        x: u * u * corte.entrada.x + 2 * u * t * esquina.x + t * t * corte.salida.x,
        y: u * u * corte.entrada.y + 2 * u * t * esquina.y + t * t * corte.salida.y,
      });
    }
  }
  salida.push({ ...(ruta[ruta.length - 1] as Punto) });
  return salida;
}

// ─── Ruta en ángulo recto ─────────────────────────────────────────────────────

/** ¿El segmento horizontal o vertical `p`–`q` atraviesa el interior del rectángulo? (rozar el borde no cuenta) */
function atraviesa(p: Punto, q: Punto, o: Rect): boolean {
  const x0 = o.x + EPS;
  const x1 = o.x + o.ancho - EPS;
  const y0 = o.y + EPS;
  const y1 = o.y + o.alto - EPS;
  if (Math.abs(p.y - q.y) < EPS) {
    if (p.y <= y0 || p.y >= y1) return false;
    return Math.min(Math.max(p.x, q.x), x1) - Math.max(Math.min(p.x, q.x), x0) > EPS;
  }
  if (p.x <= x0 || p.x >= x1) return false;
  return Math.min(Math.max(p.y, q.y), y1) - Math.max(Math.min(p.y, q.y), y0) > EPS;
}

const DIRECCIONES: readonly Lado[] = ['arriba', 'derecha', 'abajo', 'izquierda'];
const SIN_DIRECCION = 4;

/** Cola de prioridad mínima (montículo binario). */
class Cola {
  private readonly items: Array<{ clave: number; valor: number }> = [];
  get vacia(): boolean {
    return this.items.length === 0;
  }
  poner(clave: number, valor: number): void {
    const a = this.items;
    a.push({ clave, valor });
    let i = a.length - 1;
    while (i > 0) {
      const padre = (i - 1) >> 1;
      if ((a[padre] as { clave: number }).clave <= (a[i] as { clave: number }).clave) break;
      [a[padre], a[i]] = [a[i] as (typeof a)[number], a[padre] as (typeof a)[number]];
      i = padre;
    }
  }
  sacar(): { clave: number; valor: number } | undefined {
    const a = this.items;
    const primero = a[0];
    const ultimo = a.pop();
    if (!primero || !ultimo) return primero;
    if (a.length > 0) {
      a[0] = ultimo;
      let i = 0;
      for (;;) {
        const izq = 2 * i + 1;
        const der = izq + 1;
        let menor = i;
        if (izq < a.length && (a[izq] as { clave: number }).clave < (a[menor] as { clave: number }).clave) menor = izq;
        if (der < a.length && (a[der] as { clave: number }).clave < (a[menor] as { clave: number }).clave) menor = der;
        if (menor === i) break;
        [a[menor], a[i]] = [a[i] as (typeof a)[number], a[menor] as (typeof a)[number]];
        i = menor;
      }
    }
    return primero;
  }
}

function unicos(valores: number[]): number[] {
  const ordenados = [...valores].sort((a, b) => a - b);
  const salida: number[] = [];
  for (const v of ordenados) if (salida.length === 0 || v - (salida[salida.length - 1] as number) > EPS) salida.push(v);
  return salida;
}

const indiceDe = (lista: readonly number[], v: number): number => {
  let mejor = 0;
  for (let i = 1; i < lista.length; i++) if (Math.abs((lista[i] as number) - v) < Math.abs((lista[mejor] as number) - v)) mejor = i;
  return mejor;
};

interface Tramo {
  desde: Punto;
  ladoDesde: Lado | undefined;
  hasta: Punto;
  ladoHasta: Lado | undefined;
}

/**
 * Camino de menor coste (largo + codos) entre dos puntos por la «rejilla» que forman las coordenadas
 * relevantes (los dos extremos y los bordes de las formas con su margen). `null` si no hay camino.
 */
function buscarTramo(t: Tramo, obstaculos: readonly Rect[], margen: number): Punto[] | null {
  const a2 = t.ladoDesde ? suma(t.desde, VECTOR_LADO[t.ladoDesde], margen) : t.desde;
  const b2 = t.ladoHasta ? suma(t.hasta, VECTOR_LADO[t.ladoHasta], margen) : t.hasta;

  const xs = unicos([a2.x, b2.x, (a2.x + b2.x) / 2, ...obstaculos.flatMap((o) => [o.x - margen, o.x + o.ancho + margen])]);
  const ys = unicos([a2.y, b2.y, (a2.y + b2.y) / 2, ...obstaculos.flatMap((o) => [o.y - margen, o.y + o.alto + margen])]);
  const nx = xs.length;
  const nodo = (i: number, j: number): number => j * nx + i;
  const total = nx * ys.length * 5;
  const coste = new Float64Array(total).fill(Infinity);
  const padre = new Int32Array(total).fill(-1);
  const estado = (n: number, d: number): number => n * 5 + d;

  const inicio = nodo(indiceDe(xs, a2.x), indiceDe(ys, a2.y));
  const meta = nodo(indiceDe(xs, b2.x), indiceDe(ys, b2.y));
  const dirInicial = t.ladoDesde ? DIRECCIONES.indexOf(t.ladoDesde) : SIN_DIRECCION;
  const medioX = (a2.x + b2.x) / 2;
  const medioY = (a2.y + b2.y) / 2;
  const escala = Math.abs(a2.x - b2.x) + Math.abs(a2.y - b2.y) + 1;
  // Sin lado de salida se prefiere arrancar en el eje en el que hay más distancia que recorrer.
  const prefiereHorizontal = Math.abs(b2.x - a2.x) >= Math.abs(b2.y - a2.y);

  const cola = new Cola();
  coste[estado(inicio, dirInicial)] = 0;
  cola.poner(0, estado(inicio, dirInicial));

  while (!cola.vacia) {
    const actual = cola.sacar();
    if (!actual) break;
    const s = actual.valor;
    if (actual.clave > (coste[s] as number) + EPS) continue;
    const n = Math.floor(s / 5);
    const d = s % 5;
    const i = n % nx;
    const j = Math.floor(n / nx);
    for (let nd = 0; nd < 4; nd++) {
      if (d !== SIN_DIRECCION && DIRECCIONES[nd] === LADO_OPUESTO[DIRECCIONES[d] as Lado]) continue;
      const v = VECTOR_LADO[DIRECCIONES[nd] as Lado];
      const ni = i + v.x;
      const nj = j + v.y;
      if (ni < 0 || nj < 0 || ni >= nx || nj >= ys.length) continue;
      const p = { x: xs[i] as number, y: ys[j] as number };
      const q = { x: xs[ni] as number, y: ys[nj] as number };
      if (obstaculos.some((o) => atraviesa(p, q, o))) continue;
      const largo = distancia(p, q);
      const horizontal = v.y === 0;
      let extra = 0;
      if (d === SIN_DIRECCION) extra = horizontal === prefiereHorizontal ? 0 : 0.5;
      else if (nd !== d) extra = COSTE_CODO;
      // Desempate: entre caminos igual de buenos, el que pasa más cerca del medio.
      const centrado = horizontal ? Math.abs(q.y - medioY) : Math.abs(q.x - medioX);
      const nuevo = (coste[s] as number) + largo + extra + (0.02 * largo * centrado) / escala;
      const sn = estado(nodo(ni, nj), nd);
      if (nuevo < (coste[sn] as number) - EPS) {
        coste[sn] = nuevo;
        padre[sn] = s;
        cola.poner(nuevo, sn);
      }
    }
  }

  // Llegada: si el conector entra en una forma, tiene que hacerlo en línea recta desde el puerto.
  const entrada = t.ladoHasta ? DIRECCIONES.indexOf(LADO_OPUESTO[t.ladoHasta]) : -1;
  let mejor = -1;
  let mejorCoste = Infinity;
  for (let d = 0; d < 5; d++) {
    const c = coste[estado(meta, d)] as number;
    if (!Number.isFinite(c)) continue;
    let total2 = c;
    if (t.ladoHasta && d !== SIN_DIRECCION) {
      if (DIRECCIONES[d] === t.ladoHasta) continue; // llegaría desde dentro de la forma
      if (d !== entrada) total2 += COSTE_CODO;
    }
    if (total2 < mejorCoste) {
      mejorCoste = total2;
      mejor = estado(meta, d);
    }
  }
  if (mejor < 0) return null;

  const camino: Punto[] = [];
  for (let s = mejor; s >= 0; s = padre[s] as number) {
    const n = Math.floor(s / 5);
    camino.push({ x: xs[n % nx] as number, y: ys[Math.floor(n / nx)] as number });
  }
  camino.reverse();
  return simplificar([...(t.ladoDesde ? [t.desde] : []), ...camino, ...(t.ladoHasta ? [t.hasta] : [])]);
}

/** Camino sencillo (en L o en Z) para cuando la búsqueda no encuentra salida. */
function tramoDeEmergencia(t: Tramo): Punto[] {
  const a = t.desde;
  const b = t.hasta;
  const horizontal = t.ladoDesde ? t.ladoDesde === 'derecha' || t.ladoDesde === 'izquierda' : Math.abs(b.x - a.x) >= Math.abs(b.y - a.y);
  const ruta = horizontal
    ? [a, { x: (a.x + b.x) / 2, y: a.y }, { x: (a.x + b.x) / 2, y: b.y }, b]
    : [a, { x: a.x, y: (a.y + b.y) / 2 }, { x: b.x, y: (b.y + a.y) / 2 }, b];
  return simplificar(ruta);
}

const memoria = new Map<string, Punto[]>();
const MEMORIA_MAX = 2000;

/**
 * Un desnivel de hasta tantas unidades entre dos puertos casi alineados no se dibuja como un codo
 * diminuto: el conector queda recto, con una inclinación imperceptible.
 */
export const UMBRAL_ENDEREZAR = 8;

function enderezar(ruta: Punto[]): Punto[] {
  if (ruta.length !== 4) return ruta;
  const [a, p1, p2, b] = ruta as [Punto, Punto, Punto, Punto];
  return distancia(p1, p2) <= UMBRAL_ENDEREZAR ? [a, b] : ruta;
}

function claveTramo(t: Tramo, obstaculos: readonly Rect[], margen: number): string {
  return [
    num(t.desde.x),
    num(t.desde.y),
    t.ladoDesde ?? '-',
    num(t.hasta.x),
    num(t.hasta.y),
    t.ladoHasta ?? '-',
    margen,
    ...obstaculos.flatMap((o) => [num(o.x), num(o.y), num(o.ancho), num(o.alto)]),
  ].join('|');
}

/** Ruta en ángulo recto de un tramo; si con el margen pedido no hay camino, prueba con márgenes menores. */
function tramoOrtogonal(t: Tramo, obstaculos: readonly Rect[], margen: number): Punto[] {
  // Sin ninguna forma de por medio (los dos extremos libres) no hay nada que rodear: la «Z» de siempre, con el codo a mitad de camino.
  if (!t.ladoDesde && !t.ladoHasta) return tramoDeEmergencia(t);
  const clave = claveTramo(t, obstaculos, margen);
  const guardado = memoria.get(clave);
  if (guardado) return guardado.map((p) => ({ ...p }));
  let ruta: Punto[] | null = null;
  for (const m of [margen, margen / 2, 4, 0]) {
    if (m > margen) continue;
    ruta = buscarTramo(t, obstaculos, m);
    if (ruta) break;
  }
  const resultado = enderezar(ruta ?? tramoDeEmergencia(t));
  if (memoria.size >= MEMORIA_MAX) memoria.clear();
  memoria.set(clave, resultado);
  return resultado.map((p) => ({ ...p }));
}

/**
 * Si los dos puertos se miran de frente y están más cerca que dos márgenes, el margen se reduce para
 * que el codo quede justo a mitad de camino (con el margen entero, las dos salidas se cruzarían en zigzag).
 */
function margenDelTramo(t: Tramo, margen: number): number {
  if (!t.ladoDesde || !t.ladoHasta || t.ladoDesde !== LADO_OPUESTO[t.ladoHasta]) return margen;
  const v = VECTOR_LADO[t.ladoDesde];
  const hueco = (t.hasta.x - t.desde.x) * v.x + (t.hasta.y - t.desde.y) * v.y;
  return hueco > 0 ? Math.min(margen, Math.max(hueco / 2, 2)) : margen;
}

export interface EntradaRuta {
  /** Extremos y puntos intermedios por los que pasa la ruta, en orden (mínimo 2). */
  puntos: readonly Punto[];
  /** Lado por el que sale el primer extremo / entra el último, si están pegados a una forma. */
  ladoInicio?: Lado | undefined;
  ladoFin?: Lado | undefined;
  /** Formas a las que está pegado (la ruta las rodea). */
  obstaculos?: readonly Rect[];
}

export interface ResultadoOrtogonal {
  ruta: Punto[];
  /** La ruta de cada tramo entre dos puntos consecutivos de `puntos` (para ofrecer un punto de arrastre en cada uno). */
  tramos: Punto[][];
}

/** Ruta en ángulo recto que pasa por todos los `puntos`, saliendo y entrando de las formas en línea recta. */
export function rutaOrtogonal(entrada: EntradaRuta, opciones: OpcionesRuta = {}): ResultadoOrtogonal {
  const margen = Math.max(0, opciones.margen ?? MARGEN_POR_DEFECTO);
  const puntos = entrada.puntos;
  const obstaculos = entrada.obstaculos ?? [];
  const tramos: Punto[][] = [];
  for (let i = 0; i < puntos.length - 1; i++) {
    const tramo: Tramo = {
      desde: puntos[i] as Punto,
      ladoDesde: i === 0 ? entrada.ladoInicio : undefined,
      hasta: puntos[i + 1] as Punto,
      ladoHasta: i === puntos.length - 2 ? entrada.ladoFin : undefined,
    };
    tramos.push(tramoOrtogonal(tramo, obstaculos, margenDelTramo(tramo, margen)));
  }
  return { ruta: simplificar(tramos.flat()), tramos };
}

// ─── Ruta curva ───────────────────────────────────────────────────────────────

export interface SegmentoCurvo {
  c1: Punto;
  c2: Punto;
  fin: Punto;
}

export interface ResultadoCurvo {
  inicio: Punto;
  segmentos: SegmentoCurvo[];
}

const limitar = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

/** Curva suave (cúbicas de Bézier) que pasa por todos los puntos y sale/entra de las formas en perpendicular a su lado. */
export function rutaCurva(entrada: Pick<EntradaRuta, 'puntos' | 'ladoInicio' | 'ladoFin'>): ResultadoCurvo {
  const puntos = entrada.puntos;
  const primero = puntos[0] as Punto;
  const ultimo = puntos[puntos.length - 1] as Punto;
  const segmentos: SegmentoCurvo[] = [];

  if (puntos.length === 2) {
    const cuerda = distancia(primero, ultimo);
    const k = limitar(cuerda * 0.4, 24, 180);
    const horizontal = Math.abs(ultimo.x - primero.x) >= Math.abs(ultimo.y - primero.y);
    const hacia = (de: Punto, a: Punto): Punto => {
      const l = distancia(de, a) || 1;
      return { x: (a.x - de.x) / l, y: (a.y - de.y) / l };
    };
    let c1: Punto;
    let c2: Punto;
    if (!entrada.ladoInicio && !entrada.ladoFin) {
      // Libre: la «S» clásica sobre el eje con más recorrido.
      c1 = horizontal ? { x: (primero.x + ultimo.x) / 2, y: primero.y } : { x: primero.x, y: (primero.y + ultimo.y) / 2 };
      c2 = horizontal ? { x: (primero.x + ultimo.x) / 2, y: ultimo.y } : { x: ultimo.x, y: (primero.y + ultimo.y) / 2 };
    } else {
      c1 = entrada.ladoInicio ? suma(primero, VECTOR_LADO[entrada.ladoInicio], k) : suma(primero, hacia(primero, ultimo), k);
      c2 = entrada.ladoFin ? suma(ultimo, VECTOR_LADO[entrada.ladoFin], k) : suma(ultimo, hacia(ultimo, primero), k);
    }
    segmentos.push({ c1, c2, fin: ultimo });
    return { inicio: primero, segmentos };
  }

  // Varios puntos: Catmull-Rom → cúbicas (la curva pasa por todos); en los extremos pegados se respeta el lado.
  for (let i = 0; i < puntos.length - 1; i++) {
    const p0 = puntos[Math.max(0, i - 1)] as Punto;
    const p1 = puntos[i] as Punto;
    const p2 = puntos[i + 1] as Punto;
    const p3 = puntos[Math.min(puntos.length - 1, i + 2)] as Punto;
    let c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    let c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    const k = limitar(distancia(p1, p2) * 0.4, 12, 120);
    if (i === 0 && entrada.ladoInicio) c1 = suma(p1, VECTOR_LADO[entrada.ladoInicio], k);
    if (i === puntos.length - 2 && entrada.ladoFin) c2 = suma(p2, VECTOR_LADO[entrada.ladoFin], k);
    segmentos.push({ c1, c2, fin: p2 });
  }
  return { inicio: primero, segmentos };
}

export const trazadoCurvo = (c: ResultadoCurvo): string =>
  `M${fp(c.inicio)}${c.segmentos.map((s) => ` C${fp(s.c1)} ${fp(s.c2)} ${fp(s.fin)}`).join('')}`;

/** La curva como polilínea (para ubicar el punto medio, orientar extremos y detectar clics). */
export function muestrearCurva(c: ResultadoCurvo, pasos = 16): Punto[] {
  const salida: Punto[] = [c.inicio];
  let desde = c.inicio;
  for (const s of c.segmentos) {
    for (let k = 1; k <= pasos; k++) {
      const t = k / pasos;
      const u = 1 - t;
      salida.push({
        x: u * u * u * desde.x + 3 * u * u * t * s.c1.x + 3 * u * t * t * s.c2.x + t * t * t * s.fin.x,
        y: u * u * u * desde.y + 3 * u * u * t * s.c1.y + 3 * u * t * t * s.c2.y + t * t * t * s.fin.y,
      });
    }
    desde = s.fin;
  }
  return salida;
}
