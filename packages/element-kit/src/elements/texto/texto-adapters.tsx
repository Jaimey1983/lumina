import type { ReactElement } from "react";
import {
  RenderText as LegacyRenderText,
  TextoProperties as LegacyTextoProperties,
  type TextBlock,
} from "lumina-frontend/blocks/texto";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { TextoConfig, TextoEstado } from "./texto-types.js";

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
  onChange,
}: ElementPropsPanelProps<TextoEstado, TextoConfig>): ReactElement {
  return (
    <LegacyTextoProperties
      block={estado}
      applyNow={async (actualizar) => {
        const siguiente = actualizar(estado as unknown);
        if ((siguiente as { tipo?: string }).tipo === "texto") {
          onChange(siguiente as TextBlock);
        }
      }}
      scheduleApply={(actualizar) => {
        const siguiente = actualizar(estado as unknown);
        if ((siguiente as { tipo?: string }).tipo === "texto") {
          onChange(siguiente as TextBlock);
        }
      }}
      clearDebounce={() => undefined}
      onChange={onChange}
    />
  );
}
