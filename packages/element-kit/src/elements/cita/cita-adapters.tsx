import type { ReactElement } from "react";
import {
  RenderQuote as LegacyRenderQuote,
  CitaProperties as LegacyCitaProperties,
  type QuoteBlock,
} from "../../blocks/cita/index.js";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { CitaConfig, CitaEstado } from "./cita-types.js";
import { primitivePropertyApplyProps } from "../_shared/primitive-property-bridge.js";

/** Adapta el Editor legacy a las props del contrato ElementDefinition. */
export function CitaEditor({
  estado,
}: ElementEditorProps<CitaEstado, CitaConfig>): ReactElement {
  return <LegacyRenderQuote block={estado} />;
}

/** Adapta el Viewer legacy. */
export function CitaViewer({
  estado,
}: ElementViewerProps<CitaEstado, CitaConfig>): ReactElement {
  return <LegacyRenderQuote block={estado} />;
}

/** Adapta el panel de propiedades a `onChange` del contrato. */
export function CitaPropiedades({
  estado,
  config,
  onChange,
}: ElementPropsPanelProps<CitaEstado, CitaConfig>): ReactElement {
  const applyProps = primitivePropertyApplyProps(
    config.persistHost,
    onChange,
    estado,
    "cita",
  );
  return <LegacyCitaProperties block={estado} {...applyProps} />;
}
