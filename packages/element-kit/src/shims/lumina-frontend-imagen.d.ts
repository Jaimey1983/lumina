import type { ReactElement } from "react";

export interface ImageBlock {
  id?: string;
  tipo: "imagen";
  url: string;
  alt?: string;
  caption?: string;
  ajuste?: "cubrir" | "contener" | "llenar";
  bordeRedondeado?: string;
  lockAspectRatio?: boolean;
  x?: number;
  y?: number;
  ancho?: number;
  alto?: number;
  rotacion?: number;
  [key: string]: unknown;
}

export declare function createDefaultImageBlock(extra?: Partial<ImageBlock>): ImageBlock;

export interface RenderImageProps {
  block: ImageBlock;
  forceFill?: boolean;
}

export declare function RenderImage(props: RenderImageProps): ReactElement;

export interface ImagePropertiesProps {
  block: ImageBlock;
  applyNow?: (fn: (b: unknown) => unknown) => Promise<void>;
  scheduleApply?: (fn: (b: unknown) => unknown) => void;
  onChange?: (updated: ImageBlock) => void;
}

export declare function ImageProperties(props: ImagePropertiesProps): ReactElement;

