import {
  AhorcadoEditor as LegacyAhorcadoEditor,
  AhorcadoViewer as LegacyAhorcadoViewer,
  AhorcadoProperties as LegacyAhorcadoProperties,
} from "lumina-frontend/activities/ahorcado";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { AhorcadoConfig, AhorcadoEstado } from "./ahorcado-types.js";

/** Adapta el Editor legacy a las props del contrato ElementDefinition. */
export function AhorcadoEditor({
  estado,
}: ElementEditorProps<AhorcadoEstado, AhorcadoConfig>) {
  return <LegacyAhorcadoEditor actividad={estado} />;
}

/** Adapta el Viewer legacy sin cambiar su comportamiento. */
export function AhorcadoViewer({
  estado,
  config,
}: ElementViewerProps<AhorcadoEstado, AhorcadoConfig>) {
  return (
    <LegacyAhorcadoViewer actividad={estado} onComplete={config.onComplete} />
  );
}

/** Adapta el panel de propiedades: `onChange` del contrato = el del legacy. */
export function AhorcadoPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<AhorcadoEstado, AhorcadoConfig>) {
  return <LegacyAhorcadoProperties actividad={estado} onChange={onChange} />;
}
