import type { VideoBlock } from "../../blocks/video/index.js";
import type { PrimitivePanelConfig } from "../_shared/primitive-config.js";

export const VIDEO_TIPO = "video" as const;
export type VideoEstado = VideoBlock;
export type VideoConfig = PrimitivePanelConfig & {
  isThumbnail?: boolean;
};
