import { evaluateActivityResponse } from "@lumina/scoring";
import {
  videoInteractiveTemplate,
  VideoInteractiveActivityEditor,
  VideoInteractiveActivity,
} from "lumina-frontend/editor-activities";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { crearAdaptadoresClasicos } from "../_shared/classic-adapters.js";
import {
  VIDEO_INTERACTIVO_TIPO,
  type VideoInteractivoConfig,
  type VideoInteractivoEstado,
} from "./video_interactivo-types.js";

const { Editor, Viewer, Propiedades } = crearAdaptadoresClasicos<
  VideoInteractivoEstado,
  VideoInteractivoConfig
>({
  Editor: VideoInteractiveActivityEditor,
  viewer: { via: "modo", Activity: VideoInteractiveActivity },
  editorNeedsSyncKey: true,
});

export {
  Editor as VideoInteractivoEditor,
  Viewer as VideoInteractivoViewer,
  Propiedades as VideoInteractivoPropiedades,
};

/** Delegado puro a `@lumina/scoring`. */
export function evaluarVideoInteractivo(estado: VideoInteractivoEstado, respuesta: unknown) {
  return evaluateActivityResponse("video_interactivo", estado, respuesta);
}

/** E2.5 — video_interactivo (familia clásica) como `ElementDefinition`. */
export const videoInteractivoDefinition = {
  tipo: VIDEO_INTERACTIVO_TIPO,
  crearPorDefecto: () => videoInteractiveTemplate() as VideoInteractivoEstado,
  Editor,
  Viewer,
  Propiedades,
  apariencia: {
    color: false,
    tipografia: false,
    animacion: false,
  },
  puntuacion: (estado: VideoInteractivoEstado, respuesta?: unknown) =>
    evaluarVideoInteractivo(estado, respuesta).score ?? 0,
} as const satisfies ElementDefinition<VideoInteractivoEstado, VideoInteractivoConfig>;

export type VideoInteractivoDefinition = typeof videoInteractivoDefinition;
