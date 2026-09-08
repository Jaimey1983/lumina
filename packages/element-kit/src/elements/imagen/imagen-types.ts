import type { ImageBlock } from "../../blocks/imagen/index.js";

export const IMAGEN_TIPO = "imagen" as const;
export type ImagenEstado = ImageBlock;
export type ImagenConfig = {
  forceFill?: boolean;
};
