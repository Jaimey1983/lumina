import type { ImageBlock } from "../../blocks/imagen/index.js";
import type { PrimitivePanelConfig } from "../_shared/primitive-config.js";

export const IMAGEN_TIPO = "imagen" as const;
export type ImagenEstado = ImageBlock;
export type ImagenConfig = PrimitivePanelConfig & {
  forceFill?: boolean;
};
