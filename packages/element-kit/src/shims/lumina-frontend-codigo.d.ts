import type { ReactElement } from "react";

export interface CodeBlock {
  id?: string;
  tipo: "codigo";
  codigo: string;
  lenguaje?: string;
  titulo?: string;
  lineas?: boolean;
  x?: number;
  y?: number;
  ancho?: number;
  alto?: number;
  rotacion?: number;
  [key: string]: unknown;
}

export declare function createDefaultCodeBlock(extra?: Partial<CodeBlock>): CodeBlock;

export interface RenderCodeProps {
  block: CodeBlock;
}

export declare function RenderCode(props: RenderCodeProps): ReactElement;

export interface CodigoPropertiesProps {
  block: CodeBlock;
  applyNow?: (fn: (b: unknown) => unknown) => Promise<void>;
  scheduleApply?: (fn: (b: unknown) => unknown) => void;
  clearDebounce?: () => void;
  onChange?: (updated: CodeBlock) => void;
}

export declare function CodigoProperties(props: CodigoPropertiesProps): ReactElement;

