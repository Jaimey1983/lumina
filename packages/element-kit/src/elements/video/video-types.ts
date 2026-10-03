import type { VideoBlock } from "../../blocks/video/index.js";
import type { ElementRuntimeConfig } from "@lumina/element-kit-core";
import type { PrimitivePanelConfig } from "../_shared/primitive-config.js";

export const VIDEO_TIPO = "video" as const;
export type VideoEstado = VideoBlock;
export type VideoConfig = PrimitivePanelConfig & Pick<ElementRuntimeConfig, "emitir"> & {
  isThumbnail?: boolean;
};
