import {
  MemoriaEditor as LegacyMemoriaEditor,
  MemoriaViewer as LegacyMemoriaViewer,
  MemoriaProperties as LegacyMemoriaProperties,
} from "lumina-frontend/activities/memoria";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "../../contract.js";
import type { MemoriaConfig, MemoriaEstado } from "./memoria-types.js";

/** Adapta el Editor legacy a las props del contrato ElementDefinition. */
export function MemoriaEditor({
  estado,
}: ElementEditorProps<MemoriaEstado, MemoriaConfig>) {
  return <LegacyMemoriaEditor actividad={estado} />;
}

/** Adapta el Viewer legacy sin cambiar su comportamiento. */
export function MemoriaViewer({
  estado,
  config,
}: ElementViewerProps<MemoriaEstado, MemoriaConfig>) {
  return (
    <LegacyMemoriaViewer actividad={estado} onComplete={config.onComplete} />
  );
}

/** Adapta el panel de propiedades: `onChange` del contrato = el del legacy. */
export function MemoriaPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<MemoriaEstado, MemoriaConfig>) {
  return <LegacyMemoriaProperties actividad={estado} onChange={onChange} />;
}
