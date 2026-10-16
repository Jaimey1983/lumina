// ─── Geometría de selección (W4) ──────────────────────────────────────────────
// Cajas, ubicar el elemento bajo un punto y los que caen dentro de un rectángulo.
// La rotación se respeta en todo (caja envolvente, pruebas de impacto).

import { poligonoForma } from '../formas/index.js';
import { puntoDePuerto } from '../render/render.js';
import type { Elemento, Escena, Forma, Linea, Punto, Transformacion } from '../tipos.js';
import {
  bloqueadosEfectivos,
  esConCaja,
  expandir,
  mapaPadres,
  mapaPorId,
  ocultosEfectivos,
  raizDe,
  type ElementoConCaja,
} from './utilidades.js';

export interface Caja {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

export function rotarPunto(p: Punto, centro: Punto, grados: number): Punto {
  if (grados === 0) return { ...p };
  const a = (grados * Math.PI) / 180;
  const dx = p.x - centro.x;
  const dy = p.y - centro.y;
  return { x: centro.x + dx * Math.cos(a) - dy * Math.sin(a), y: centro.y + dx * Math.sin(a) + dy * Math.cos(a) };
}

export const centroDe = (t: Transformacion): Punto => ({ x: t.x + t.ancho / 2, y: t.y + t.alto / 2 });

/** Las cuatro esquinas de un elemento con caja, ya rotadas (en el orden: sup-izq, sup-der, inf-der, inf-izq). */
export function esquinas(t: Transformacion): Punto[] {
  const c = centroDe(t);
  return [
    { x: t.x, y: t.y },
    { x: t.x + t.ancho, y: t.y },
    { x: t.x + t.ancho, y: t.y + t.alto },
    { x: t.x, y: t.y + t.alto },
  ].map((p) => rotarPunto(p, c, t.rotacion));
}

export function cajaDePuntos(puntos: readonly Punto[]): Caja | null {
  if (puntos.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of puntos) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { x: minX, y: minY, ancho: maxX - minX, alto: maxY - minY };
}

export function unirCajas(cajas: ReadonlyArray<Caja | null>): Caja | null {
  const validas = cajas.filter((c): c is Caja => c !== null);
  if (validas.length === 0) return null;
  const minX = Math.min(...validas.map((c) => c.x));
  const minY = Math.min(...validas.map((c) => c.y));
  const maxX = Math.max(...validas.map((c) => c.x + c.ancho));
  const maxY = Math.max(...validas.map((c) => c.y + c.alto));
  return { x: minX, y: minY, ancho: maxX - minX, alto: maxY - minY };
}

/** Puntos de una línea tal como se dibujan: los extremos conectados van pegados a su puerto. */
export function puntosResueltos(escena: Escena, linea: Linea): Punto[] {
  const puntos = linea.puntos.map((p) => ({ ...p }));
  const formas = new Map(escena.elementos.filter((e): e is Forma => e.tipo === 'forma').map((f) => [f.id, f]));
  const origen = linea.origen ? formas.get(linea.origen.elementoId) : undefined;
  const destino = linea.destino ? formas.get(linea.destino.elementoId) : undefined;
  if (origen && linea.origen && puntos.length > 0) puntos[0] = puntoDePuerto(origen, linea.origen.puerto);
  if (destino && linea.destino && puntos.length > 0) puntos[puntos.length - 1] = puntoDePuerto(destino, linea.destino.puerto);
  return puntos;
}

/** Caja envolvente (alineada a los ejes, con la rotación aplicada) de un elemento; un grupo, la unión de sus hijos. */
export function cajaDeElemento(escena: Escena, e: Elemento, visitados: Set<string> = new Set()): Caja | null {
  if (esConCaja(e)) return cajaDePuntos(esquinas(e.transformacion));
  if (e.tipo === 'linea') return cajaDePuntos(puntosResueltos(escena, e));
  if (visitados.has(e.id)) return null;
  visitados.add(e.id);
  const porId = mapaPorId(escena);
  return unirCajas(
    e.hijos.map((id) => {
      const h = porId.get(id);
      return h ? cajaDeElemento(escena, h, visitados) : null;
    }),
  );
}

/** Caja que envuelve a todos los elementos pedidos (y los hijos de los grupos); `null` si no hay ninguno. */
export function cajaDeSeleccion(escena: Escena, ids: Iterable<string>): Caja | null {
  const objetivo = expandir(escena, ids);
  return unirCajas(escena.elementos.filter((e) => e.tipo !== 'grupo' && objetivo.has(e.id)).map((e) => cajaDeElemento(escena, e)));
}

// ─── Pruebas de impacto ───────────────────────────────────────────────────────

function distanciaASegmento(p: Punto, a: Punto, b: Punto): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const largo2 = dx * dx + dy * dy;
  const t = largo2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / largo2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function distanciaAPoligono(p: Punto, poligono: readonly Punto[]): number {
  let mejor = Infinity;
  for (let i = 0; i < poligono.length; i++) {
    const a = poligono[i];
    const b = poligono[(i + 1) % poligono.length];
    if (a && b) mejor = Math.min(mejor, distanciaASegmento(p, a, b));
  }
  return mejor;
}

function puntoEnPoligono(p: Punto, poligono: readonly Punto[]): boolean {
  let dentro = false;
  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const a = poligono[i];
    const b = poligono[j];
    if (!a || !b) continue;
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) dentro = !dentro;
  }
  return dentro;
}

/** Contorno aproximado de la forma en coordenadas locales: sus vértices si es un polígono, o 48 puntos si es elíptica. */
function contornoLocal(f: Forma): Punto[] | undefined {
  const t = f.transformacion;
  const poligono = poligonoForma(f.forma, t.ancho, t.alto, { parametros: f.parametros, radio: 0 });
  if (poligono) return poligono;
  if (f.forma === 'elipse' || f.forma === 'circulo') {
    const puntos: Punto[] = [];
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      puntos.push({ x: t.ancho / 2 + (t.ancho / 2) * Math.cos(a), y: t.alto / 2 + (t.alto / 2) * Math.sin(a) });
    }
    return puntos;
  }
  return undefined; // formas con curvas libres (nube, cilindro, llave, globo…): se usa la caja
}

function impactaCaja(e: ElementoConCaja, p: Punto, tolerancia: number): boolean {
  const t = e.transformacion;
  const local = rotarPunto(p, centroDe(t), -t.rotacion);
  const lx = local.x - t.x;
  const ly = local.y - t.y;
  const caja = [
    { x: 0, y: 0 },
    { x: t.ancho, y: 0 },
    { x: t.ancho, y: t.alto },
    { x: 0, y: t.alto },
  ];
  const sinRelleno = e.tipo === 'forma' && e.estilo.relleno.tipo === 'ninguno';
  const contorno = e.tipo === 'forma' ? (contornoLocal(e) ?? caja) : caja;
  const margen = tolerancia + (e.tipo === 'forma' ? e.estilo.contorno.grosor / 2 : 0);
  const cerca = distanciaAPoligono({ x: lx, y: ly }, contorno) <= margen;
  if (sinRelleno) return cerca;
  return cerca || puntoEnPoligono({ x: lx, y: ly }, contorno);
}

function impactaLinea(escena: Escena, l: Linea, p: Punto, tolerancia: number): boolean {
  const puntos = puntosResueltos(escena, l);
  const margen = tolerancia + l.estilo.contorno.grosor / 2;
  for (let i = 0; i + 1 < puntos.length; i++) {
    const a = puntos[i];
    const b = puntos[i + 1];
    if (a && b && distanciaASegmento(p, a, b) <= margen) return true;
  }
  return false;
}

export interface OpcionesImpacto {
  /** Distancia en unidades de escena a la que un clic «acierta» (por defecto 6). */
  tolerancia?: number;
  /** Devolver el hijo en vez del grupo que lo contiene (por defecto no). */
  entrarEnGrupos?: boolean;
  /** Considerar también elementos bloqueados (por defecto no: no se seleccionan). */
  incluirBloqueados?: boolean;
}

/** Elemento visible más alto bajo `punto`. Si pertenece a un grupo se devuelve el grupo más externo. */
export function elementoEn(escena: Escena, punto: Punto, opciones: OpcionesImpacto = {}): string | undefined {
  const tolerancia = opciones.tolerancia ?? 6;
  const ocultos = ocultosEfectivos(escena);
  const bloqueados = opciones.incluirBloqueados ? new Set<string>() : bloqueadosEfectivos(escena);
  const padres = mapaPadres(escena);
  for (let i = escena.elementos.length - 1; i >= 0; i--) {
    const e = escena.elementos[i];
    if (!e || e.tipo === 'grupo' || ocultos.has(e.id) || bloqueados.has(e.id)) continue;
    const acierta = e.tipo === 'linea' ? impactaLinea(escena, e, punto, tolerancia) : impactaCaja(e, punto, tolerancia);
    if (acierta) return opciones.entrarEnGrupos ? e.id : raizDe(e.id, padres);
  }
  return undefined;
}

export interface OpcionesRectangulo {
  /** `contenidos` (por defecto): solo los que caben enteros; `cruzan`: también los que lo tocan. */
  modo?: 'contenidos' | 'cruzan';
  incluirBloqueados?: boolean;
}

const cajasSeCruzan = (a: Caja, b: Caja): boolean =>
  a.x <= b.x + b.ancho && b.x <= a.x + a.ancho && a.y <= b.y + b.alto && b.y <= a.y + a.alto;

const cajaContiene = (marco: Caja, c: Caja): boolean =>
  c.x >= marco.x && c.y >= marco.y && c.x + c.ancho <= marco.x + marco.ancho && c.y + c.alto <= marco.y + marco.alto;

/** Elementos de primer nivel (o grupos enteros) dentro o tocando el rectángulo, en orden de apilado. */
export function elementosEn(escena: Escena, rectangulo: Caja, opciones: OpcionesRectangulo = {}): string[] {
  const modo = opciones.modo ?? 'contenidos';
  const ocultos = ocultosEfectivos(escena);
  const bloqueados = opciones.incluirBloqueados ? new Set<string>() : bloqueadosEfectivos(escena);
  const padres = mapaPadres(escena);
  const salida: string[] = [];
  for (const e of escena.elementos) {
    if (padres.has(e.id) || ocultos.has(e.id) || bloqueados.has(e.id)) continue;
    const caja = cajaDeElemento(escena, e);
    if (!caja) continue;
    if (modo === 'contenidos' ? cajaContiene(rectangulo, caja) : cajasSeCruzan(rectangulo, caja)) salida.push(e.id);
  }
  return salida;
}
