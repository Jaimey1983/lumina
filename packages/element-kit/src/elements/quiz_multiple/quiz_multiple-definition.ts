import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { evaluateActivityResponse } from "@lumina/scoring";
import {
  quizMultipleTemplate,
  QuizMultipleActivityEditor,
  QuizMultipleViewer,
} from "../../activities/_classic/index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { crearAdaptadoresClasicos } from "../_shared/classic-adapters.js";
import { crearPropiedadesConAjustes } from "../_shared/propiedades-con-ajustes.js";
import { PRESETS_QUIZ_MULTIPLE } from "./quiz_multiple-estilos.js";
import {
  QUIZ_MULTIPLE_TIPO,
  type QuizMultipleConfig,
  type QuizMultipleEstado,
} from "./quiz_multiple-types.js";

const { Editor, Viewer, Propiedades: PropiedadesBase } = crearAdaptadoresClasicos<
  QuizMultipleEstado,
  QuizMultipleConfig
>({
  Editor: QuizMultipleActivityEditor,
  viewer: { via: "component", Viewer: QuizMultipleViewer },
  editorNeedsSyncKey: true,
});

/** U9d.6b: el panel suma estilos y ajustes comunes al editor de siempre. */
const Propiedades = crearPropiedadesConAjustes(PropiedadesBase, {
  presets: PRESETS_QUIZ_MULTIPLE,
  storageKey: "actividad.quiz_multiple.estilos",
});

export {
  Editor as QuizMultipleEditor,
  Viewer as QuizMultipleViewer,
  Propiedades as QuizMultiplePropiedades,
};

/** Delegado puro a `@lumina/scoring`. */
export function evaluarQuizMultiple(estado: QuizMultipleEstado, respuesta: unknown) {
  return evaluateActivityResponse("quiz_multiple", estado, respuesta);
}

/** E2.5 — quiz_multiple (familia clásica) como `ElementDefinition`. */
export const quizMultipleDefinition = {
  tipo: QUIZ_MULTIPLE_TIPO,
  crearPorDefecto: () => quizMultipleTemplate() as QuizMultipleEstado,
  Editor,
  Viewer,
  Propiedades,
  // U9d.6b: el estilo (`ajustes.estilo`) es color; la tipografía no se toca y no hay movimiento.
  apariencia: {
    color: true,
    tipografia: false,
    animacion: false,
  },
  presets: PRESETS_QUIZ_MULTIPLE,
  puntuacion: (estado: QuizMultipleEstado, respuesta?: unknown) =>
    evaluarQuizMultiple(estado, respuesta).score ?? 0,
  catalogo: CATALOGO_ELEMENTOS["quiz_multiple"],
  // Etapa K / K7a: la actividad avisa al motor si la respuesta fue correcta (flujo, no nota).
  eventos: ["respuesta_correcta", "respuesta_incorrecta"],
} as const satisfies ElementDefinition<QuizMultipleEstado, QuizMultipleConfig>;

export type QuizMultipleDefinition = typeof quizMultipleDefinition;
