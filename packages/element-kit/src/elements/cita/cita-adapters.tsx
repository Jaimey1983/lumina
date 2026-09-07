import type { ReactElement } from "react";
import {
  RenderQuote as LegacyRenderQuote,
  CitaProperties as LegacyCitaProperties,
  type QuoteBlock,
} from "lumina-frontend/blocks/cita";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { CitaConfig, CitaEstado } from "./cita-types.js";

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
  onChange,
}: ElementPropsPanelProps<CitaEstado, CitaConfig>): ReactElement {
  return (
    <LegacyCitaProperties
      block={estado}
      applyNow={async (actualizar) => {
        const siguiente = actualizar(estado as unknown);
        if ((siguiente as { tipo?: string }).tipo === "cita") {
          onChange(siguiente as QuoteBlock);
        }
      }}
      scheduleApply={(actualizar) => {
        const siguiente = actualizar(estado as unknown);
        if ((siguiente as { tipo?: string }).tipo === "cita") {
          onChange(siguiente as QuoteBlock);
        }
      }}
      clearDebounce={() => undefined}
      onChange={onChange}
    />
  );
}
