import { evaluateActivityResponse } from "@lumina/scoring";
import { createDefaultAnagrama } from "lumina-frontend/activities/anagrama";
import type { ElementDefinition } from "@lumina/element-kit-core";
import {
  AnagramaEditor,
  AnagramaPropiedades,
  AnagramaViewer,
} from "./anagrama-adapters.js";
import {
  ANAGRAMA_TIPO,
  type AnagramaConfig,
  type AnagramaEstado,
} from "./anagrama-types.js";

/**
 * Evalúa una respuesta contra el estado del Anagrama.
 * Delegado puro a `@lumina/scoring` — mismo `correct` / `details` / `score`
 * (este último ya es `notaColombiana(...)`).
 */
export function evaluarAnagrama(estado: AnagramaEstado, respuesta: unknown) {
  return evaluateActivityResponse("anagrama", estado, respuesta);
}

/**
 * Piloto E2.3 — Anagrama como `ElementDefinition` evaluable.
 * `puntuacion` ejercita el delegado que el Botón (E1.4) no usó.
 */
export const anagramaDefinition = {
  tipo: ANAGRAMA_TIPO,
  crearPorDefecto: () => createDefaultAnagrama(),
  Editor: AnagramaEditor,
  Viewer: AnagramaViewer,
  Propiedades: AnagramaPropiedades,
  apariencia: {
    color: false,
    tipografia: false,
    animacion: false,
  },
  puntuacion: (estado: AnagramaEstado, respuesta?: unknown) =>
    evaluarAnagrama(estado, respuesta).score ?? 0,
} as const satisfies ElementDefinition<AnagramaEstado, AnagramaConfig>;

export type AnagramaDefinition = typeof anagramaDefinition;
