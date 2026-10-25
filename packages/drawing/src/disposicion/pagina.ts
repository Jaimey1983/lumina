// ─── Encajar una disposición en la página (Y37b) ──────────────────────────────
// Puro. Trabaja con las posiciones de los nodos (esquina superior izquierda) y el tamaño de la página; no sabe de la escena. Nada acá
// cambia el tamaño de una caja: se traslada o, como último recurso, se acercan los centros entre sí (y solo si no se pisan).

import type { NodoDisposicion, Posiciones } from './grafo.js';

export interface Pagina {
  ancho: number;
  alto: number;
}

export interface CajaDeNodos {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

/** Distancia que se deja entre lo organizado y el borde de la página cuando se coloca de cero (esquema). */
export const MARGEN_PAGINA = 24;

/** La caja que envuelve a todos los nodos con sus posiciones; `null` si no hay ninguno con posición. */
export function cajaDeNodos(nodos: readonly NodoDisposicion[], posiciones: Posiciones): CajaDeNodos | null {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const n of nodos) {
    const p = posiciones.get(n.id);
    if (!p) continue;
    x0 = Math.min(x0, p.x);
    y0 = Math.min(y0, p.y);
    x1 = Math.max(x1, p.x + n.ancho);
    y1 = Math.max(y1, p.y + n.alto);
  }
  return Number.isFinite(x0) ? { x: x0, y: y0, ancho: x1 - x0, alto: y1 - y0 } : null;
}

/** La caja está entera dentro de la página, a `margen` de sus bordes. */
export function entraEnPagina(caja: CajaDeNodos, pagina: Pagina, margen = 0): boolean {
  const e = 1e-6;
  return caja.x >= margen - e && caja.y >= margen - e && caja.x + caja.ancho <= pagina.ancho - margen + e && caja.y + caja.alto <= pagina.alto - margen + e;
}

/** Suma de las áreas de los nodos: sirve para descartar enseguida lo que no cabría ni muy compacto. */
export function superficieDeNodos(nodos: readonly NodoDisposicion[]): number {
  return nodos.reduce((suma, n) => suma + n.ancho * n.alto, 0);
}

/**
 * Traslada todo con el **menor** desplazamiento que lo mete en la página (a `margen` de los bordes). Devuelve la misma referencia si ya
 * entraba, y `null` si la caja es mayor que el espacio disponible (trasladar no alcanza).
 */
export function trasladarAPagina(posiciones: Posiciones, nodos: readonly NodoDisposicion[], pagina: Pagina, margen = 0): Posiciones | null {
  const caja = cajaDeNodos(nodos, posiciones);
  if (!caja) return posiciones;
  if (caja.ancho > pagina.ancho - 2 * margen + 1e-6 || caja.alto > pagina.alto - 2 * margen + 1e-6) return null;
  const desplazar = (inicio: number, largo: number, total: number): number => {
    if (inicio < margen) return margen - inicio;
    if (inicio + largo > total - margen) return total - margen - (inicio + largo);
    return 0;
  };
  const dx = desplazar(caja.x, caja.ancho, pagina.ancho);
  const dy = desplazar(caja.y, caja.alto, pagina.alto);
  if (dx === 0 && dy === 0) return posiciones;
  return new Map([...posiciones].map(([id, p]) => [id, { x: p.x + dx, y: p.y + dy }]));
}

/**
 * Acerca los centros entre sí (`fx`, `fy` entre 0 y 1) respecto del centro de la caja que los envuelve. **Solo mueve posiciones**: los
 * tamaños no cambian. Con `fx = fy = 1` devuelve las mismas posiciones.
 */
export function comprimir(posiciones: Posiciones, nodos: readonly NodoDisposicion[], factores: { fx: number; fy: number }): Posiciones {
  const caja = cajaDeNodos(nodos, posiciones);
  if (!caja || (factores.fx === 1 && factores.fy === 1)) return posiciones;
  const cx = caja.x + caja.ancho / 2;
  const cy = caja.y + caja.alto / 2;
  const porId = new Map(nodos.map((n) => [n.id, n]));
  const salida: Posiciones = new Map();
  for (const [id, p] of posiciones) {
    const n = porId.get(id);
    if (!n) {
      salida.set(id, p);
      continue;
    }
    const centroX = cx + (p.x + n.ancho / 2 - cx) * factores.fx;
    const centroY = cy + (p.y + n.alto / 2 - cy) * factores.fy;
    salida.set(id, { x: centroX - n.ancho / 2, y: centroY - n.alto / 2 });
  }
  return salida;
}

/**
 * Acerca los centros lo **mínimo** necesario para que la caja entre en la página (a `margen` de los bordes), cada eje por separado y sin
 * bajar de `minimo` (por ejemplo 0,55). Como los tamaños no cambian, la caja no se encoge tanto como el factor: se busca el mayor factor
 * que cabe. Devuelve `null` si ni con `minimo` cabe. Si ya cabía devuelve las mismas posiciones.
 */
export function comprimirParaQueQuepa(posiciones: Posiciones, nodos: readonly NodoDisposicion[], pagina: Pagina, margen: number, minimo: number): Posiciones | null {
  const caja = cajaDeNodos(nodos, posiciones);
  if (!caja) return posiciones;
  const disponibleX = pagina.ancho - 2 * margen;
  const disponibleY = pagina.alto - 2 * margen;
  const e = 1e-6;
  const factor = (eje: 'x' | 'y'): number | null => {
    const disponible = eje === 'x' ? disponibleX : disponibleY;
    const medida = (f: number): number => {
      const c = cajaDeNodos(nodos, comprimir(posiciones, nodos, eje === 'x' ? { fx: f, fy: 1 } : { fx: 1, fy: f })) as CajaDeNodos;
      return eje === 'x' ? c.ancho : c.alto;
    };
    if ((eje === 'x' ? caja.ancho : caja.alto) <= disponible + e) return 1;
    if (medida(minimo) > disponible + e) return null;
    let cabe = minimo;
    let noCabe = 1;
    for (let i = 0; i < 24; i++) {
      const medio = (cabe + noCabe) / 2;
      if (medida(medio) <= disponible + e) cabe = medio;
      else noCabe = medio;
    }
    return cabe;
  };
  const fx = factor('x');
  const fy = factor('y');
  if (fx === null || fy === null) return null;
  return comprimir(posiciones, nodos, { fx, fy });
}

/** Hay dos rectángulos que se solapan (si solo se tocan por el borde, no cuenta). */
export function hayPisadas(nodos: readonly NodoDisposicion[], posiciones: Posiciones): boolean {
  const e = 1e-6;
  for (let i = 0; i < nodos.length; i++) {
    const a = nodos[i] as NodoDisposicion;
    const pa = posiciones.get(a.id);
    if (!pa) continue;
    for (let j = i + 1; j < nodos.length; j++) {
      const b = nodos[j] as NodoDisposicion;
      const pb = posiciones.get(b.id);
      if (!pb) continue;
      if (pa.x < pb.x + b.ancho - e && pb.x < pa.x + a.ancho - e && pa.y < pb.y + b.alto - e && pb.y < pa.y + a.alto - e) return true;
    }
  }
  return false;
}
