import type { ReactElement } from "react";
import {
  RenderDivider as LegacyRenderDivider,
  SeparadorProperties as LegacySeparadorProperties,
  type DividerBlock,
} from "../../blocks/separador/index.js";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { SeparadorConfig, SeparadorEstado } from "./separador-types.js";
import { primitivePropertyApplyProps } from "../_shared/primitive-property-bridge.js";

/** Adapta el Editor legacy a las props del contrato ElementDefinition. */
export function SeparadorEditor({
  estado,
}: ElementEditorProps<SeparadorEstado, SeparadorConfig>): ReactElement {
  return <LegacyRenderDivider block={estado} />;
}

/** Adapta el Viewer legacy. */
export function SeparadorViewer({
  estado,
}: ElementViewerProps<SeparadorEstado, SeparadorConfig>): ReactElement {
  return <LegacyRenderDivider block={estado} />;
}

/** Adapta el panel de propiedades a `onChange` del contrato. */
export function SeparadorPropiedades({
  estado,
  config,
  onChange,
}: ElementPropsPanelProps<SeparadorEstado, SeparadorConfig>): ReactElement {
  const applyProps = primitivePropertyApplyProps(
    config.persistHost,
    onChange,
    estado,
    "separador",
  );
  return <LegacySeparadorProperties block={estado} {...applyProps} />;
}
