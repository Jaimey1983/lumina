import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { evaluateActivityResponse } from "@lumina/scoring";
import {
  quizMultipleTemplate,
  QuizMultipleActivityEditor,
  QuizMultipleViewer,
} from "lumina-frontend/editor-activities";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { crearAdaptadoresClasicos } from "../_shared/classic-adapters.js";
import {
  QUIZ_MULTIPLE_TIPO,
  type QuizMultipleConfig,
  type QuizMultipleEstado,
} from "./quiz_multiple-types.js";

const { Editor, Viewer, Propiedades } = crearAdaptadoresClasicos<
  QuizMultipleEstado,
  QuizMultipleConfig
>({
  Editor: QuizMultipleActivityEditor,
  viewer: { via: "component", Viewer: QuizMultipleViewer },
  editorNeedsSyncKey: true,
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
  apariencia: {
    color: false,
    tipografia: false,
    animacion: false,
  },
  puntuacion: (estado: QuizMultipleEstado, respuesta?: unknown) =>
    evaluarQuizMultiple(estado, respuesta).score ?? 0,
  catalogo: CATALOGO_ELEMENTOS["quiz_multiple"],
} as const satisfies ElementDefinition<QuizMultipleEstado, QuizMultipleConfig>;

export type QuizMultipleDefinition = typeof quizMultipleDefinition;
