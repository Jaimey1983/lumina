import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { evaluateActivityResponse } from "@lumina/scoring";
import { createDefaultAnagrama } from "../../activities/anagrama/index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { crearPropiedadesConAjustes } from "../_shared/propiedades-con-ajustes.js";
import { PRESETS_ANAGRAMA } from "./anagrama-estilos.js";
import {
  AnagramaEditor,
  AnagramaPropiedades as AnagramaPropiedadesBase,
  AnagramaViewer,
} from "./anagrama-adapters.js";
import {
  ANAGRAMA_TIPO,
  type AnagramaConfig,
  type AnagramaEstado,
} from "./anagrama-types.js";

/** U9c.2: el panel suma estilos y ajustes comunes al panel de siempre (palabras y pistas). */
const AnagramaPropiedades = crearPropiedadesConAjustes(AnagramaPropiedadesBase, {
  presets: PRESETS_ANAGRAMA,
  storageKey: "actividad.anagrama.estilos",
});

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
  // U9c.2: el estilo (`ajustes.estilo`) es color; la tipografía no se toca y no hay movimiento.
  apariencia: {
    color: true,
    tipografia: false,
    animacion: false,
  },
  presets: PRESETS_ANAGRAMA,
  puntuacion: (estado: AnagramaEstado, respuesta?: unknown) =>
    evaluarAnagrama(estado, respuesta).score ?? 0,
  catalogo: CATALOGO_ELEMENTOS["anagrama"],
  // Etapa K / K7a: la actividad avisa al motor si la respuesta fue correcta (flujo, no nota).
  eventos: ["respuesta_correcta", "respuesta_incorrecta"],
} as const satisfies ElementDefinition<AnagramaEstado, AnagramaConfig>;

export type AnagramaDefinition = typeof anagramaDefinition;
