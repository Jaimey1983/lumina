// ─── Borrar rama de un diagrama (Y9) ──────────────────────────────────────────
// Puro: quita la forma raíz y todo lo que solo se alcanza siguiendo conectores salientes (padre→hijo).

import type { Escena } from '../tipos.js';
import { eliminar } from './edicion.js';
import { bloqueadosEfectivos } from './utilidades.js';

/** Hijas directas por conector (origen = padre, destino = forma). */
function hijasPorConector(escena: Escena, padreId: string): string[] {
  const salida: string[] = [];
  for (const e of escena.elementos) {
    if (e.tipo !== 'linea') continue;
    const dest = e.destino?.elementoId;
    if (e.origen?.elementoId === padreId && dest) salida.push(dest);
  }
  return salida;
}

/**
 * Elimina `raizId` y las formas alcanzables solo bajando por conectores desde ella.
 * No borra ramas hermanas ni formas bloqueadas; con ciclos no se cuelga (conjunto visitado).
 * Si la raíz no es una forma visible o está bloqueada, devuelve la misma escena.
 */
export function eliminarRama(escena: Escena, raizId: string): Escena {
  const raiz = escena.elementos.find((e) => e.id === raizId);
  if (raiz?.tipo !== 'forma') return escena;
  const bloqueados = bloqueadosEfectivos(escena);
  if (bloqueados.has(raizId)) return escena;

  const aBorrar = new Set<string>();
  const visitados = new Set<string>();

  const visitar = (id: string): void => {
    if (visitados.has(id)) return;
    visitados.add(id);
    const el = escena.elementos.find((e) => e.id === id);
    if (el?.tipo !== 'forma') return;
    if (bloqueados.has(id)) return;
    aBorrar.add(id);
    for (const h of hijasPorConector(escena, id)) visitar(h);
  };

  visitar(raizId);
  if (aBorrar.size === 0) return escena;
  return eliminar(escena, aBorrar);
}



