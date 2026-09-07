import type { VideoBlock } from "lumina-frontend/blocks/video";

export const VIDEO_TIPO = "video" as const;
export type VideoEstado = VideoBlock;
export type VideoConfig = {
  isThumbnail?: boolean;
};
