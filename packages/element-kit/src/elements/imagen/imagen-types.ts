import type { ImageBlock } from "lumina-frontend/blocks/imagen";

export const IMAGEN_TIPO = "imagen" as const;
export type ImagenEstado = ImageBlock;
export type ImagenConfig = {
  forceFill?: boolean;
};
