import type { ReactElement } from "react";

export interface VideoBlock {
  id?: string;
  tipo: "video";
  url: string;
  autoplay?: boolean;
  bucle?: boolean;
  silenciado?: boolean;
  controles?: boolean;
  x?: number;
  y?: number;
  ancho?: number;
  alto?: number;
  rotacion?: number;
  [key: string]: unknown;
}

export declare function createDefaultVideoBlock(extra?: Partial<VideoBlock>): VideoBlock;
export declare function buildEmbedUrl(url: string, autoplay?: boolean): string;

export interface RenderVideoProps {
  block: VideoBlock;
  isThumbnail?: boolean;
  editorMode?: boolean;
}

export declare function RenderVideo(props: RenderVideoProps): ReactElement;

export interface VideoPropertiesProps {
  block: VideoBlock;
  applyNow?: (fn: (b: unknown) => unknown) => Promise<void>;
  scheduleApply?: (fn: (b: unknown) => unknown) => void;
  clearDebounce?: () => void;
  onChange?: (updated: VideoBlock) => void;
}

export declare function VideoProperties(props: VideoPropertiesProps): ReactElement;

