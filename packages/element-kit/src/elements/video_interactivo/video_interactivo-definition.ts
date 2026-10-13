import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { evaluateActivityResponse } from "@lumina/scoring";
import {
  videoInteractiveTemplate,
  VideoInteractiveActivityEditor,
  VideoInteractiveActivity,
} from "../../activities/_classic/index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { crearAdaptadoresClasicos } from "../_shared/classic-adapters.js";
import { crearPropiedadesConAjustes } from "../_shared/propiedades-con-ajustes.js";
import { PRESETS_VIDEO_INTERACTIVO } from "./video_interactivo-estilos.js";
import {
  VIDEO_INTERACTIVO_TIPO,
  type VideoInteractivoConfig,
  type VideoInteractivoEstado,
} from "./video_interactivo-types.js";

const { Editor, Viewer, Propiedades: PropiedadesBase } = crearAdaptadoresClasicos<
  VideoInteractivoEstado,
  VideoInteractivoConfig
>({
  Editor: VideoInteractiveActivityEditor,
  viewer: { via: "modo", Activity: VideoInteractiveActivity },
  editorNeedsSyncKey: true,
});

/** U9d.5: el panel suma estilos y ajustes comunes al editor de siempre. */
const Propiedades = crearPropiedadesConAjustes(PropiedadesBase, {
  presets: PRESETS_VIDEO_INTERACTIVO,
  storageKey: "actividad.video_interactivo.estilos",
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
  // U9d.5: el estilo (`ajustes.estilo`) es color; la tipografía no se toca y no hay movimiento.
  apariencia: {
    color: true,
    tipografia: false,
    animacion: false,
  },
  presets: PRESETS_VIDEO_INTERACTIVO,
  puntuacion: (estado: VideoInteractivoEstado, respuesta?: unknown) =>
    evaluarVideoInteractivo(estado, respuesta).score ?? 0,
  catalogo: CATALOGO_ELEMENTOS["video_interactivo"],
} as const satisfies ElementDefinition<VideoInteractivoEstado, VideoInteractivoConfig>;

export type VideoInteractivoDefinition = typeof videoInteractivoDefinition;
