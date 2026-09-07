import { createDefaultVideoBlock } from "lumina-frontend/blocks/video";
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
} as const satisfies ElementDefinition<VideoEstado, VideoConfig>;

export type VideoDefinition = typeof videoDefinition;
