import type { ReactElement } from "react";

export interface AudioBlock {
  id?: string;
  tipo: "audio";
  url: string;
  autoplay?: boolean;
  bucle?: boolean;
  controles?: boolean;
  x?: number;
  y?: number;
  ancho?: number;
  alto?: number;
  rotacion?: number;
  [key: string]: unknown;
}

export declare function createDefaultAudioBlock(extra?: Partial<AudioBlock>): AudioBlock;

export interface RenderAudioProps {
  block: AudioBlock;
}

export declare function RenderAudio(props: RenderAudioProps): ReactElement;

export interface AudioPropertiesProps {
  block: AudioBlock;
  applyNow?: (fn: (b: unknown) => unknown) => Promise<void>;
  scheduleApply?: (fn: (b: unknown) => unknown) => void;
  clearDebounce?: () => void;
  onChange?: (updated: AudioBlock) => void;
}

export declare function AudioProperties(props: AudioPropertiesProps): ReactElement;

