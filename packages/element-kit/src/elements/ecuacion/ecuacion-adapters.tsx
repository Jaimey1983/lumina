import type { ReactElement } from "react";
import {
  RenderEcuacion,
  EcuacionProperties,
} from "../../blocks/ecuacion/index.js";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { EcuacionConfig, EcuacionEstado } from "./ecuacion-types.js";
import { primitivePropertyApplyProps } from "../_shared/primitive-property-bridge.js";

/** En el lienzo la ecuación se edita desde el panel de propiedades. */
export function EcuacionEditor({
  estado,
}: ElementEditorProps<EcuacionEstado, EcuacionConfig>): ReactElement {
  return <RenderEcuacion block={estado} modo="editor" />;
}

export function EcuacionViewer({
  estado,
}: ElementViewerProps<EcuacionEstado, EcuacionConfig>): ReactElement {
  return <RenderEcuacion block={estado} modo="viewer" />;
}

export function EcuacionPropiedades({
  estado,
  config,
  onChange,
}: ElementPropsPanelProps<EcuacionEstado, EcuacionConfig>): ReactElement {
  const applyProps = primitivePropertyApplyProps(
    config.persistHost,
    onChange,
    estado,
    "ecuacion",
  );
  return <EcuacionProperties block={estado} {...applyProps} />;
}
