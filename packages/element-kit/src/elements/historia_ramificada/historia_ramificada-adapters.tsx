import {
  HistoriaRamificadaEditor as LegacyHistoriaRamificadaEditor,
  HistoriaRamificadaViewer as LegacyHistoriaRamificadaViewer,
  HistoriaRamificadaProperties as LegacyHistoriaRamificadaProperties,
} from "lumina-frontend/activities/historia-ramificada";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "../../contract.js";
import type { HistoriaRamificadaConfig, HistoriaRamificadaEstado } from "./historia_ramificada-types.js";

/** Adapta el Editor legacy a las props del contrato ElementDefinition. */
export function HistoriaRamificadaEditor({
  estado,
  onChange,
}: ElementEditorProps<HistoriaRamificadaEstado, HistoriaRamificadaConfig>) {
  return <LegacyHistoriaRamificadaEditor actividad={estado} onChange={onChange} />;
}

/** Adapta el Viewer legacy sin cambiar su comportamiento. */
export function HistoriaRamificadaViewer({
  estado,
  config,
}: ElementViewerProps<HistoriaRamificadaEstado, HistoriaRamificadaConfig>) {
  return (
    <LegacyHistoriaRamificadaViewer actividad={estado} onComplete={config.onComplete} />
  );
}

/** Adapta el panel de propiedades: `onChange` del contrato = el del legacy. */
export function HistoriaRamificadaPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<HistoriaRamificadaEstado, HistoriaRamificadaConfig>) {
  return <LegacyHistoriaRamificadaProperties actividad={estado} onChange={onChange} />;
}
