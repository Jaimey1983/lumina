import type { VideoBlock } from "../../blocks/video/index.js";
import type { PrimitivePanelConfig } from "../_shared/primitive-config.js";

export const VIDEO_TIPO = "video" as const;
export type VideoEstado = VideoBlock;
/** G-scale.5: sin `isThumbnail` — miniatura escala el mismo bloque (VirtualSlideSurface). */
export type VideoConfig = PrimitivePanelConfig;
