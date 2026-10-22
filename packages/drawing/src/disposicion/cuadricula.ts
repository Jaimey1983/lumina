// ─── Cuadrícula para lo que no está conectado a nada (Y13) ────────────────────

import type { NodoDisposicion, Posiciones } from './grafo.js';

export interface OpcionesCuadricula {
  separacion?: number;
}

/** Los nodos en filas de `ceil(√n)` columnas, en su orden, con la esquina superior izquierda de la cuadrícula en (0, 0). */
export function disponerCuadricula(nodos: readonly NodoDisposicion[], opciones: OpcionesCuadricula = {}): Posiciones {
  const hueco = opciones.separacion ?? 40;
  const columnas = Math.max(1, Math.ceil(Math.sqrt(nodos.length)));
  const posiciones: Posiciones = new Map();
  let y = 0;
  for (let inicio = 0; inicio < nodos.length; inicio += columnas) {
    const fila = nodos.slice(inicio, inicio + columnas);
    let x = 0;
    for (const n of fila) {
      posiciones.set(n.id, { x, y });
      x += n.ancho + hueco;
    }
    y += Math.max(...fila.map((n) => n.alto)) + hueco;
  }
  return posiciones;
}
