import type { ReactNode } from "react";
import type { ColumnsBlock, Block } from "../../blocks/columnas/index.js";
import type { PrimitivePanelConfig } from "../_shared/primitive-config.js";

export const COLUMNAS_TIPO = "columnas" as const;
export type ColumnasEstado = ColumnsBlock;
export type ColumnasConfig = PrimitivePanelConfig & {
  renderInnerBlock?: (innerBlock: Block, colIdx: number, blockIdx: number) => ReactNode;
};
