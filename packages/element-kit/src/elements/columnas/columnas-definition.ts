import { createDefaultColumnsBlock } from "lumina-frontend/blocks/columnas";
import type { ElementDefinition } from "@lumina/element-kit-core";
import {
  ColumnasEditor,
  ColumnasPropiedades,
  ColumnasViewer,
} from "./columnas-adapters.js";
import {
  COLUMNAS_TIPO,
  type ColumnasConfig,
  type ColumnasEstado,
} from "./columnas-types.js";

export const columnasDefinition = {
  tipo: COLUMNAS_TIPO,
  crearPorDefecto: () => createDefaultColumnsBlock(),
  Editor: ColumnasEditor,
  Viewer: ColumnasViewer,
  Propiedades: ColumnasPropiedades,
  apariencia: {
    color: false,
    tipografia: false,
    animacion: true,
  },
} as const satisfies ElementDefinition<ColumnasEstado, ColumnasConfig>;

export type ColumnasDefinition = typeof columnasDefinition;
