// ─── Plegado local del visor del estudiante (Y38c, DY76) ──────────────────────
// Puro: sin React ni DOM. El visor no guarda nada: lo que el estudiante pliega o despliega vive solo en memoria, como la lista de las
// ramas que ALTERNÓ respecto de lo que dejó el docente.

import { contarOcultos, fijarColapso, tieneHijos, type Escena } from "@lumina/drawing";

/** Sin ramas alternadas: el estado con el que arranca el visor. */
export const SIN_ALTERNADAS: ReadonlySet<string> = new Set<string>();

/** Agrega `id` a las ramas alternadas, o lo quita si ya estaba (alternarla dos veces la deja como el docente la dejó). No modifica el conjunto recibido. */
export function alternar(alternadas: ReadonlySet<string>, id: string): Set<string> {
  const nuevo = new Set(alternadas);
  if (!nuevo.delete(id)) nuevo.add(id);
  return nuevo;
}

/**
 * La escena que ve el estudiante: cada forma **con hijos** de `alternadas` tiene el estado contrario al que le dejó el docente. Un id
 * que ya no existe, que no es una forma o que no tiene hijos se ignora. Devuelve la misma escena si no hay nada que cambiar.
 */
export function aplicarPlegadoLocal(escena: Escena, alternadas: ReadonlySet<string>): Escena {
  if (alternadas.size === 0) return escena;
  let actual = escena;
  for (const e of escena.elementos) {
    if (e.tipo !== "forma" || !alternadas.has(e.id) || !tieneHijos(escena, e.id)) continue;
    actual = fijarColapso(actual, [e.id], e.colapsado !== true);
  }
  return actual;
}

/** Lo que se anuncia a un lector de pantalla tras alternar la rama de `id`; `escena` es la que ya quedó cambiada. Las mismas frases que el editor (Y38b). */
export function anuncioDeRama(escena: Escena, id: string): string {
  const forma = escena.elementos.find((e) => e.id === id);
  if (!forma || forma.tipo !== "forma") return "";
  if (forma.colapsado !== true) return "Rama desplegada.";
  const n = contarOcultos(escena, id);
  return n === 0 ? "Rama plegada: no oculta ningún elemento." : `Rama plegada: ${n} ${n === 1 ? "elemento oculto" : "elementos ocultos"}.`;
}
