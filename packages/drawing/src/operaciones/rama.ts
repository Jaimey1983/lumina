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
 * Elimina `raizId` y las formas que solo se alcanzan por ella, bajando por conectores. Una forma que además cuelga de
 * otra fuera de la rama (otra raíz, una forma bloqueada) se queda, y con ella todo lo que solo depende de ella.
 * No borra ramas hermanas ni formas bloqueadas; con ciclos no se cuelga (conjunto visitado).
 * Si la raíz no es una forma visible o está bloqueada, devuelve la misma escena.
 */
export function eliminarRama(escena: Escena, raizId: string): Escena {
  const raiz = escena.elementos.find((e) => e.id === raizId);
  if (raiz?.tipo !== 'forma') return escena;
  const bloqueados = bloqueadosEfectivos(escena);
  if (bloqueados.has(raizId)) return escena;

  // 1. Todo lo que cuelga de la raíz.
  const aBorrar = new Set<string>();
  const visitar = (id: string): void => {
    if (aBorrar.has(id)) return;
    const el = escena.elementos.find((e) => e.id === id);
    if (el?.tipo !== 'forma' || bloqueados.has(id)) return;
    aBorrar.add(id);
    for (const h of hijasPorConector(escena, id)) visitar(h);
  };
  visitar(raizId);

  // 2. Se salvan las que tienen un padre que no se va a borrar, hasta que no cambie nada.
  const padres = new Map<string, string[]>();
  for (const e of escena.elementos) {
    const de = e.tipo === 'linea' ? e.origen?.elementoId : undefined;
    const a = e.tipo === 'linea' ? e.destino?.elementoId : undefined;
    if (de && a) padres.set(a, [...(padres.get(a) ?? []), de]);
  }
  let cambio = true;
  while (cambio) {
    cambio = false;
    for (const id of [...aBorrar]) {
      if (id === raizId) continue;
      if ((padres.get(id) ?? []).some((p) => !aBorrar.has(p))) {
        aBorrar.delete(id);
        cambio = true;
      }
    }
  }
  return eliminar(escena, aBorrar);
}
