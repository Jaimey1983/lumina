import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultVideoBlock } from "../../blocks/video/index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import {
  VideoEditor,
  VideoPropiedades,
  VideoViewer,
} from "./video-adapters.js";
import {
  VIDEO_TIPO,
  type VideoConfig,
  type VideoEstado,
} from "./video-types.js";

export const videoDefinition = {
  tipo: VIDEO_TIPO,
  crearPorDefecto: () => createDefaultVideoBlock(),
  Editor: VideoEditor,
  Viewer: VideoViewer,
  Propiedades: VideoPropiedades,
  apariencia: {
    color: false,
    tipografia: false,
    animacion: true,
  },
  catalogo: CATALOGO_ELEMENTOS["video"],
  // Etapa N / N5: solo el <video> nativo emite media_*; el iframe de YouTube no
  // expone eventos sin su API (límite declarado de la ficha).
  eventos: ["media_inicia", "media_termina", "hover_entra", "hover_sale"],
} as const satisfies ElementDefinition<VideoEstado, VideoConfig>;

export type VideoDefinition = typeof videoDefinition;
