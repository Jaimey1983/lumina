import type { ReactNode } from "react";
import type { ColumnsBlock, Block } from "../../blocks/columnas/index.js";

export const COLUMNAS_TIPO = "columnas" as const;
export type ColumnasEstado = ColumnsBlock;
export type ColumnasConfig = {
  renderInnerBlock?: (innerBlock: Block, colIdx: number, blockIdx: number) => ReactNode;
};
