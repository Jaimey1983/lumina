import type { ReactElement } from "react";
import {
  RenderDivider as LegacyRenderDivider,
  SeparadorProperties as LegacySeparadorProperties,
  type DividerBlock,
} from "lumina-frontend/blocks/separador";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { SeparadorConfig, SeparadorEstado } from "./separador-types.js";

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
  onChange,
}: ElementPropsPanelProps<SeparadorEstado, SeparadorConfig>): ReactElement {
  return (
    <LegacySeparadorProperties
      block={estado}
      applyNow={async (actualizar) => {
        const siguiente = actualizar(estado as unknown);
        if ((siguiente as { tipo?: string }).tipo === "separador") {
          onChange(siguiente as DividerBlock);
        }
      }}
      scheduleApply={(actualizar) => {
        const siguiente = actualizar(estado as unknown);
        if ((siguiente as { tipo?: string }).tipo === "separador") {
          onChange(siguiente as DividerBlock);
        }
      }}
      onChange={onChange}
    />
  );
}
