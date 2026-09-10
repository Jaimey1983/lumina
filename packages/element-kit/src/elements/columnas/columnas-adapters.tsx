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
import { primitivePropertyApplyProps } from "../_shared/primitive-property-bridge.js";

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
  config,
  onChange,
}: ElementPropsPanelProps<ColumnasEstado, ColumnasConfig>): ReactElement {
  const applyProps = primitivePropertyApplyProps(
    config.persistHost,
    onChange,
    estado,
    "columnas",
  );
  return <LegacyColumnasProperties block={estado} {...applyProps} />;
}
