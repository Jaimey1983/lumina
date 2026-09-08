import type { VideoBlock } from "../../blocks/video/index.js";

export const VIDEO_TIPO = "video" as const;
export type VideoEstado = VideoBlock;
export type VideoConfig = {
  isThumbnail?: boolean;
};
