// ─── Temas del diagrama (Y21) ─────────────────────────────────────────────────
// Un tema es una acción que colorea por ramas con una de las paletas de `PALETAS_DIAGRAMA` (DY23); la escena no recuerda cuál (DY24).

import { aplicarPaleta, type Escena } from "@lumina/drawing";
import type { DiagramaPaletaId } from "@lumina/types/slide";
import { PALETAS_DIAGRAMA } from "../../diagrama-temas.js";
import { hojasEditables } from "./propiedades.js";

export interface AmbitoDeTema {
  /** Ids de las formas que se colorean. */
  ids: string[];
  /** `true` si salen de la selección; `false` si es todo el diagrama (no había formas elegidas). */
  deSeleccion: boolean;
}

/** Las formas editables elegidas (también dentro de grupos) o, si no hay ninguna, todas las del diagrama. */
export function ambitoDeTema(escena: Escena, seleccion: readonly string[]): AmbitoDeTema {
  const formas = (ids: readonly string[]): string[] => hojasEditables(escena, ids).filter((h) => h.tipo === "forma").map((h) => h.id);
  const elegidas = formas(seleccion);
  if (elegidas.length > 0) return { ids: elegidas, deSeleccion: true };
  return { ids: formas(escena.elementos.map((e) => e.id)), deSeleccion: false };
}

/** Aplica la paleta al alcance. Devuelve la misma escena si no hay formas o ya están coloreadas así. */
export function aplicarTema(escena: Escena, seleccion: readonly string[], paleta: DiagramaPaletaId): Escena {
  const p = PALETAS_DIAGRAMA[paleta];
  if (!p) return escena;
  return aplicarPaleta(escena, ambitoDeTema(escena, seleccion).ids, { acento: p.acentoPrincipal, colores: p.colores });
}
