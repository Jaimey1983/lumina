import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { evaluateActivityResponse } from "@lumina/scoring";
import {
  shortAnswerTemplate,
  ShortAnswerActivityEditor,
  ShortAnswerViewer,
} from "lumina-frontend/editor-activities";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { crearAdaptadoresClasicos } from "../_shared/classic-adapters.js";
import {
  SHORT_ANSWER_TIPO,
  type ShortAnswerConfig,
  type ShortAnswerEstado,
} from "./short_answer-types.js";

const { Editor, Viewer, Propiedades } = crearAdaptadoresClasicos<
  ShortAnswerEstado,
  ShortAnswerConfig
>({
  Editor: ShortAnswerActivityEditor,
  viewer: { via: "component", Viewer: ShortAnswerViewer },
  editorNeedsSyncKey: true,
});

export {
  Editor as ShortAnswerEditor,
  Viewer as ShortAnswerViewer,
  Propiedades as ShortAnswerPropiedades,
};

/** Delegado puro a `@lumina/scoring`. */
export function evaluarShortAnswer(estado: ShortAnswerEstado, respuesta: unknown) {
  return evaluateActivityResponse("short_answer", estado, respuesta);
}

/** E2.5 — short_answer (familia clásica) como `ElementDefinition`. */
export const shortAnswerDefinition = {
  tipo: SHORT_ANSWER_TIPO,
  crearPorDefecto: () => shortAnswerTemplate() as ShortAnswerEstado,
  Editor,
  Viewer,
  Propiedades,
  apariencia: {
    color: false,
    tipografia: false,
    animacion: false,
  },
  puntuacion: (estado: ShortAnswerEstado, respuesta?: unknown) =>
    evaluarShortAnswer(estado, respuesta).score ?? 0,
  catalogo: CATALOGO_ELEMENTOS["short_answer"],
} as const satisfies ElementDefinition<ShortAnswerEstado, ShortAnswerConfig>;

export type ShortAnswerDefinition = typeof shortAnswerDefinition;
