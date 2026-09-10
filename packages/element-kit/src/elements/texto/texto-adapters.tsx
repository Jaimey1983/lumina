import type { ReactElement } from "react";
import {
  RenderText as LegacyRenderText,
  TextoProperties as LegacyTextoProperties,
} from "../../blocks/texto/index.js";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { TextoConfig, TextoEstado } from "./texto-types.js";
import { primitivePropertyApplyProps } from "../_shared/primitive-property-bridge.js";

/** Adapta el Editor legacy a las props del contrato ElementDefinition. */
export function TextoEditor({
  estado,
  config,
}: ElementEditorProps<TextoEstado, TextoConfig>): ReactElement {
  return (
    <LegacyRenderText
      block={estado}
      modo="editor"
      isEditing={config.isEditing}
      onCommit={config.onCommit}
      onDiscard={config.onDiscard}
    />
  );
}

/** Adapta el Viewer legacy. */
export function TextoViewer({
  estado,
}: ElementViewerProps<TextoEstado, TextoConfig>): ReactElement {
  return <LegacyRenderText block={estado} modo="viewer" />;
}

/** Adapta el panel de propiedades a `onChange` del contrato. */
export function TextoPropiedades({
  estado,
  config,
  onChange,
}: ElementPropsPanelProps<TextoEstado, TextoConfig>): ReactElement {
  const applyProps = primitivePropertyApplyProps(
    config.persistHost,
    onChange,
    estado,
    "texto",
  );
  return (
    <LegacyTextoProperties
      block={estado}
      slideBackground={config.slideBackground}
      {...applyProps}
    />
  );
}
