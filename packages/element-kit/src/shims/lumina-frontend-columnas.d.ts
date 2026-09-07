import type { ReactElement, ReactNode } from "react";

export interface Block {
  id?: string;
  tipo: string;
  [key: string]: unknown;
}

export interface ColumnsBlock {
  id?: string;
  tipo: "columnas";
  columnas: Block[][];
  proporcion?: string;
  x?: number;
  y?: number;
  ancho?: number;
  alto?: number;
  rotacion?: number;
  [key: string]: unknown;
}

export declare function createDefaultColumnsBlock(extra?: Partial<ColumnsBlock>): ColumnsBlock;

export interface RenderColumnsProps {
  block: ColumnsBlock;
  renderInnerBlock?: (innerBlock: Block, colIdx: number, blockIdx: number) => ReactNode;
}

export declare function RenderColumns(props: RenderColumnsProps): ReactElement;

export interface ColumnasPropertiesProps {
  block: ColumnsBlock;
  applyNow?: (fn: (b: unknown) => unknown) => Promise<void>;
  scheduleApply?: (fn: (b: unknown) => unknown) => void;
  onChange?: (updated: ColumnsBlock) => void;
}

export declare function ColumnasProperties(props: ColumnasPropertiesProps): ReactElement;

