// ─── Conectar formas en cadena (Y9) ───────────────────────────────────────────
// Puro: enlaza formas consecutivas con conectores padre→hijo sin duplicar aristas existentes.

import { conectarFormas, existeConector } from '../conectores/enlazar.js';
import { formasVisibles } from '../conectores/puertos.js';
import type { Escena } from '../tipos.js';
import { cajaDeElemento } from './geometria.js';

/** Orden de lectura en diagrama: izquierda→derecha, arriba→abajo (centro de cada forma). */
export function ordenEspacialParaCadena(escena: Escena, ids: readonly string[]): string[] {
  const visibles = new Set(formasVisibles(escena).map((f) => f.id));
  const unicos = [...new Set(ids.filter((id) => visibles.has(id)))];
  return unicos.sort((a, b) => {
    const ca = cajaDeElemento(escena, escena.elementos.find((e) => e.id === a)!);
    const cb = cajaDeElemento(escena, escena.elementos.find((e) => e.id === b)!);
    if (!ca || !cb) return 0;
    const ax = ca.x + ca.ancho / 2;
    const bx = cb.x + cb.ancho / 2;
    if (ax !== bx) return ax - bx;
    return ca.y + ca.alto / 2 - (cb.y + cb.alto / 2);
  });
}

/** Conserva el orden de `ids` y deja solo formas visibles, sin repetir. */
export function filtrarFormasParaCadena(escena: Escena, ids: readonly string[]): string[] {
  const visibles = new Set(formasVisibles(escena).map((f) => f.id));
  const vistos = new Set<string>();
  const salida: string[] = [];
  for (const id of ids) {
    if (!visibles.has(id) || vistos.has(id)) continue;
    vistos.add(id);
    salida.push(id);
  }
  return salida;
}

/**
 * Conecta `idsEnOrden` de dos en dos (0→1, 1→2, …). Menos de dos formas válidas: escena sin cambios.
 * No crea un conector que ya exista en el mismo sentido.
 */
export function conectarEnCadena(escena: Escena, idsEnOrden: readonly string[]): Escena {
  const cadena = filtrarFormasParaCadena(escena, idsEnOrden);
  if (cadena.length < 2) return escena;
  let actual = escena;
  for (let i = 0; i < cadena.length - 1; i++) {
    const de = cadena[i]!;
    const a = cadena[i + 1]!;
    if (existeConector(actual, de, a)) continue;
    actual = conectarFormas(actual, de, a);
  }
  return actual;
}



