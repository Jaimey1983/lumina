import type { ReactElement } from "react";
import {
  RenderCode as LegacyRenderCode,
  CodigoProperties as LegacyCodigoProperties,
  type CodeBlock,
} from "../../blocks/codigo/index.js";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { CodigoConfig, CodigoEstado } from "./codigo-types.js";
import { primitivePropertyApplyProps } from "../_shared/primitive-property-bridge.js";

/** Adapta el Editor legacy a las props del contrato ElementDefinition. */
export function CodigoEditor({
  estado,
}: ElementEditorProps<CodigoEstado, CodigoConfig>): ReactElement {
  return <LegacyRenderCode block={estado} />;
}

/** Adapta el Viewer legacy. */
export function CodigoViewer({
  estado,
}: ElementViewerProps<CodigoEstado, CodigoConfig>): ReactElement {
  return <LegacyRenderCode block={estado} />;
}

/** Adapta el panel de propiedades a `onChange` del contrato. */
export function CodigoPropiedades({
  estado,
  config,
  onChange,
}: ElementPropsPanelProps<CodigoEstado, CodigoConfig>): ReactElement {
  const applyProps = primitivePropertyApplyProps(
    config.persistHost,
    onChange,
    estado,
    "codigo",
  );
  return <LegacyCodigoProperties block={estado} {...applyProps} />;
}
