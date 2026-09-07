import type { ReactElement } from "react";

export interface TextBlock {
  id?: string;
  tipo: "texto";
  contenido?: string;
  nivel?: number | "h1" | "h2" | "h3" | "p";
  tamanoFuente?: string;
  color?: string;
  negrita?: boolean;
  cursiva?: boolean;
  subrayado?: boolean;
  alineacion?: "izquierda" | "centro" | "derecha" | "justificado";
  lista?: "vinetas" | "numeros";
  fuente?: string;
  interlineado?: number;
  espaciadoLetras?: number;
  x?: number;
  y?: number;
  ancho?: number;
  alto?: number;
  rotacion?: number;
  [key: string]: unknown;
}

export declare function createDefaultTextBlock(extra?: Partial<TextBlock>): TextBlock;

export interface RenderTextProps {
  block: TextBlock;
  modo?: "editor" | "viewer";
  isEditing?: boolean;
  onCommit?: (text: string) => void;
  onDiscard?: () => void;
}

export declare function RenderText(props: RenderTextProps): ReactElement;

export declare function InlineTextEditor(props: {
  block: TextBlock;
  onCommit: (text: string) => void;
  onDiscard: () => void;
}): ReactElement;

export interface TextoPropertiesProps {
  block: TextBlock;
  applyNow?: (fn: (b: unknown) => unknown) => Promise<void>;
  scheduleApply?: (fn: (b: unknown) => unknown) => void;
  clearDebounce?: () => void;
  onChange?: (updated: TextBlock) => void;
}

export declare function TextoProperties(props: TextoPropertiesProps): ReactElement;

