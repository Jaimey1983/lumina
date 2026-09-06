import { evaluateActivityResponse } from "@lumina/scoring";
import {
  livePollTemplate,
  LivePollActivityEditor,
  LivePollViewer,
} from "lumina-frontend/editor-activities";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { crearAdaptadoresClasicos } from "../_shared/classic-adapters.js";
import {
  ENCUESTA_VIVA_TIPO,
  type EncuestaVivaConfig,
  type EncuestaVivaEstado,
} from "./encuesta_viva-types.js";

const { Editor, Viewer, Propiedades } = crearAdaptadoresClasicos<
  EncuestaVivaEstado,
  EncuestaVivaConfig
>({
  Editor: LivePollActivityEditor,
  viewer: { via: "component", Viewer: LivePollViewer },
  editorNeedsSyncKey: true,
});

export {
  Editor as EncuestaVivaEditor,
  Viewer as EncuestaVivaViewer,
  Propiedades as EncuestaVivaPropiedades,
};

/** Delegado puro a `@lumina/scoring`. */
export function evaluarEncuestaViva(estado: EncuestaVivaEstado, respuesta: unknown) {
  return evaluateActivityResponse("encuesta_viva", estado, respuesta);
}

/** E2.5 — encuesta_viva (familia clásica) como `ElementDefinition`. */
export const encuestaVivaDefinition = {
  tipo: ENCUESTA_VIVA_TIPO,
  crearPorDefecto: () => livePollTemplate() as EncuestaVivaEstado,
  Editor,
  Viewer,
  Propiedades,
  apariencia: {
    color: false,
    tipografia: false,
    animacion: false,
  },
  puntuacion: (estado: EncuestaVivaEstado, respuesta?: unknown) =>
    evaluarEncuestaViva(estado, respuesta).score ?? 0,
} as const satisfies ElementDefinition<EncuestaVivaEstado, EncuestaVivaConfig>;

export type EncuestaVivaDefinition = typeof encuestaVivaDefinition;
