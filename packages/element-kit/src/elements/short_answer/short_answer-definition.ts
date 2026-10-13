import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { evaluateActivityResponse } from "@lumina/scoring";
import {
  shortAnswerTemplate,
  ShortAnswerActivityEditor,
  ShortAnswerViewer,
} from "../../activities/_classic/index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { crearAdaptadoresClasicos } from "../_shared/classic-adapters.js";
import { crearPropiedadesConAjustes } from "../_shared/propiedades-con-ajustes.js";
import { PRESETS_SHORT_ANSWER } from "./short_answer-estilos.js";
import {
  SHORT_ANSWER_TIPO,
  type ShortAnswerConfig,
  type ShortAnswerEstado,
} from "./short_answer-types.js";

const { Editor, Viewer, Propiedades: PropiedadesBase } = crearAdaptadoresClasicos<
  ShortAnswerEstado,
  ShortAnswerConfig
>({
  Editor: ShortAnswerActivityEditor,
  viewer: { via: "component", Viewer: ShortAnswerViewer },
  editorNeedsSyncKey: true,
});

/** U9a.1: el panel suma estilos y ajustes comunes al editor de siempre. */
const Propiedades = crearPropiedadesConAjustes(PropiedadesBase, {
  presets: PRESETS_SHORT_ANSWER,
  storageKey: "actividad.short_answer.estilos",
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
  // U9a.1: el estilo (`ajustes.estilo`) es color; la tipografía no se toca y no hay movimiento.
  apariencia: {
    color: true,
    tipografia: false,
    animacion: false,
  },
  presets: PRESETS_SHORT_ANSWER,
  puntuacion: (estado: ShortAnswerEstado, respuesta?: unknown) =>
    evaluarShortAnswer(estado, respuesta).score ?? 0,
  catalogo: CATALOGO_ELEMENTOS["short_answer"],
} as const satisfies ElementDefinition<ShortAnswerEstado, ShortAnswerConfig>;

export type ShortAnswerDefinition = typeof shortAnswerDefinition;
