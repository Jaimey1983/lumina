import type { ReactElement } from "react";

export interface DividerBlock {
  id?: string;
  tipo: "separador";
  color?: string;
  estilo?: "solido" | "punteado" | "guionado";
  grosor?: number;
  x?: number;
  y?: number;
  ancho?: number;
  alto?: number;
  rotacion?: number;
  [key: string]: unknown;
}

export declare function createDefaultSeparadorBlock(): DividerBlock;

export interface RenderDividerProps {
  block: DividerBlock;
}

export declare function RenderDivider(props: RenderDividerProps): ReactElement;

export interface SeparadorPropertiesProps {
  block: DividerBlock;
  applyNow?: (fn: (b: unknown) => unknown) => Promise<void>;
  scheduleApply?: (fn: (b: unknown) => unknown) => void;
  onChange?: (updated: DividerBlock) => void;
}

export declare function SeparadorProperties(props: SeparadorPropertiesProps): ReactElement;

