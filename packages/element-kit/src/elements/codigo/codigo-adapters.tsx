import type { ReactElement } from "react";
import {
  RenderCode as LegacyRenderCode,
  CodigoProperties as LegacyCodigoProperties,
  type CodeBlock,
} from "lumina-frontend/blocks/codigo";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { CodigoConfig, CodigoEstado } from "./codigo-types.js";

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
  onChange,
}: ElementPropsPanelProps<CodigoEstado, CodigoConfig>): ReactElement {
  return (
    <LegacyCodigoProperties
      block={estado}
      applyNow={async (actualizar) => {
        const siguiente = actualizar(estado as unknown);
        if ((siguiente as { tipo?: string }).tipo === "codigo") {
          onChange(siguiente as CodeBlock);
        }
      }}
      scheduleApply={(actualizar) => {
        const siguiente = actualizar(estado as unknown);
        if ((siguiente as { tipo?: string }).tipo === "codigo") {
          onChange(siguiente as CodeBlock);
        }
      }}
      clearDebounce={() => undefined}
      onChange={onChange}
    />
  );
}
