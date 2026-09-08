import type { ReactElement } from "react";
import {
  RenderColumns as LegacyRenderColumns,
  ColumnasProperties as LegacyColumnasProperties,
  type ColumnsBlock,
} from "../../blocks/columnas/index.js";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { ColumnasConfig, ColumnasEstado } from "./columnas-types.js";

/** Adapta el Editor legacy a las props del contrato ElementDefinition. */
export function ColumnasEditor({
  estado,
  config,
}: ElementEditorProps<ColumnasEstado, ColumnasConfig>): ReactElement {
  return (
    <LegacyRenderColumns
      block={estado}
      renderInnerBlock={config.renderInnerBlock}
    />
  );
}

/** Adapta el Viewer legacy. */
export function ColumnasViewer({
  estado,
  config,
}: ElementViewerProps<ColumnasEstado, ColumnasConfig>): ReactElement {
  return (
    <LegacyRenderColumns
      block={estado}
      renderInnerBlock={config.renderInnerBlock}
    />
  );
}

/** Adapta el panel de propiedades a `onChange` del contrato. */
export function ColumnasPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<ColumnasEstado, ColumnasConfig>): ReactElement {
  return (
    <LegacyColumnasProperties
      block={estado}
      applyNow={async (actualizar) => {
        const siguiente = actualizar(estado);
        if ((siguiente as { tipo?: string }).tipo === "columnas") {
          onChange(siguiente as ColumnsBlock);
        }
      }}
      onChange={onChange}
    />
  );
}
