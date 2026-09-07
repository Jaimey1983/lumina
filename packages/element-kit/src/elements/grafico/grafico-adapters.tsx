import {
  GraficoEditor as LegacyGraficoEditor,
  GraficoProperties as LegacyGraficoProperties,
  GraficoViewer as LegacyGraficoViewer,
} from "lumina-frontend/blocks/grafico";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { GraficoConfig, GraficoEstado } from "./grafico-types.js";

/** Adapta el Editor legacy a las props del contrato ElementDefinition. */
export function GraficoEditor({
  estado,
  config,
}: ElementEditorProps<GraficoEstado, GraficoConfig>) {
  return (
    <LegacyGraficoEditor
      block={estado}
      isSelected={config.isSelected === true}
      onEnsureBlockSelected={config.onEnsureBlockSelected ?? (() => undefined)}
    />
  );
}

/** Adapta el Viewer legacy (Recharts + paleta intactos). */
export function GraficoViewer({
  estado,
  config,
}: ElementViewerProps<GraficoEstado, GraficoConfig>) {
  return (
    <LegacyGraficoViewer
      block={estado}
      isThumbnail={config.isThumbnail === true}
    />
  );
}

/** Adapta `applyNow` del canvas a `onChange` del contrato. */
export function GraficoPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<GraficoEstado, GraficoConfig>) {
  return (
    <LegacyGraficoProperties
      block={estado}
      applyNow={async (actualizar) => {
        const siguiente = actualizar(estado);
        if (siguiente.tipo === "grafico") {
          onChange(siguiente);
        }
      }}
    />
  );
}
