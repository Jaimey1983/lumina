import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { evaluateActivityResponse } from "@lumina/scoring";
import { createDefaultPuzzleImagen } from "../../activities/puzzle-imagen/index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { crearPropiedadesConAjustes } from "../_shared/propiedades-con-ajustes.js";
import { PRESETS_PUZZLE_IMAGEN } from "./puzzle_imagen-estilos.js";
import {
  PuzzleImagenEditor,
  PuzzleImagenPropiedades as PuzzleImagenPropiedadesBase,
  PuzzleImagenViewer,
} from "./puzzle_imagen-adapters.js";
import { PUZZLE_IMAGEN_TIPO, type PuzzleImagenConfig, type PuzzleImagenEstado } from "./puzzle_imagen-types.js";

/** U9b.5: el panel suma estilos y ajustes comunes al panel de siempre (imagen, filas, dificultad). */
const PuzzleImagenPropiedades = crearPropiedadesConAjustes(PuzzleImagenPropiedadesBase, {
  presets: PRESETS_PUZZLE_IMAGEN,
  storageKey: "actividad.puzzle_imagen.estilos",
});

/** Delegado puro a `@lumina/scoring`. */
export function evaluarPuzzleImagen(estado: PuzzleImagenEstado, respuesta: unknown) {
  return evaluateActivityResponse("puzzle_imagen", estado, respuesta);
}

/** E2.4 — PuzzleImagen como `ElementDefinition` evaluable. */
export const puzzleImagenDefinition = {
  tipo: PUZZLE_IMAGEN_TIPO,
  crearPorDefecto: () => createDefaultPuzzleImagen(),
  Editor: PuzzleImagenEditor,
  Viewer: PuzzleImagenViewer,
  Propiedades: PuzzleImagenPropiedades,
  // U9b.5: el estilo (`ajustes.estilo`) es color; la tipografía no se toca y no hay movimiento.
  apariencia: {
    color: true,
    tipografia: false,
    animacion: false,
  },
  presets: PRESETS_PUZZLE_IMAGEN,
  puntuacion: (estado: PuzzleImagenEstado, respuesta?: unknown) =>
    evaluarPuzzleImagen(estado, respuesta).score ?? 0,
  catalogo: CATALOGO_ELEMENTOS["puzzle_imagen"],
  // Etapa K / K7a: la actividad avisa al motor si la respuesta fue correcta (flujo, no nota).
  eventos: ["respuesta_correcta", "respuesta_incorrecta"],
} as const satisfies ElementDefinition<PuzzleImagenEstado, PuzzleImagenConfig>;

export type PuzzleImagenDefinition = typeof puzzleImagenDefinition;
