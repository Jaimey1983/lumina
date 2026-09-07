import type { ReactElement } from "react";

export interface QuoteBlock {
  id?: string;
  tipo: "cita";
  texto: string;
  autor?: string;
  fuente?: string;
  x?: number;
  y?: number;
  ancho?: number;
  alto?: number;
  rotacion?: number;
  [key: string]: unknown;
}

export declare function createDefaultQuoteBlock(extra?: Partial<QuoteBlock>): QuoteBlock;

export interface RenderQuoteProps {
  block: QuoteBlock;
}

export declare function RenderQuote(props: RenderQuoteProps): ReactElement;

export interface CitaPropertiesProps {
  block: QuoteBlock;
  applyNow?: (fn: (b: unknown) => unknown) => Promise<void>;
  scheduleApply?: (fn: (b: unknown) => unknown) => void;
  clearDebounce?: () => void;
  onChange?: (updated: QuoteBlock) => void;
}

export declare function CitaProperties(props: CitaPropertiesProps): ReactElement;

