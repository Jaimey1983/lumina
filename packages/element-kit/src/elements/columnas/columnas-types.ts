import type { ReactNode } from "react";
import type { ColumnsBlock, Block } from "lumina-frontend/blocks/columnas";

export const COLUMNAS_TIPO = "columnas" as const;
export type ColumnasEstado = ColumnsBlock;
export type ColumnasConfig = {
  renderInnerBlock?: (innerBlock: Block, colIdx: number, blockIdx: number) => ReactNode;
};
