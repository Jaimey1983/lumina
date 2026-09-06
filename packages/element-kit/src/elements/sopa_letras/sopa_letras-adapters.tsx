import {
  SopaLetrasEditor as LegacySopaLetrasEditor,
  SopaLetrasViewer as LegacySopaLetrasViewer,
  SopaLetrasProperties as LegacySopaLetrasProperties,
} from "lumina-frontend/activities/sopa-letras";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { SopaLetrasConfig, SopaLetrasEstado } from "./sopa_letras-types.js";

/** Adapta el Editor legacy a las props del contrato ElementDefinition. */
export function SopaLetrasEditor({
  estado,
}: ElementEditorProps<SopaLetrasEstado, SopaLetrasConfig>) {
  return <LegacySopaLetrasEditor actividad={estado} />;
}

/** Adapta el Viewer legacy sin cambiar su comportamiento. */
export function SopaLetrasViewer({
  estado,
  config,
}: ElementViewerProps<SopaLetrasEstado, SopaLetrasConfig>) {
  return (
    <LegacySopaLetrasViewer actividad={estado} onComplete={config.onComplete} />
  );
}

/** Adapta el panel de propiedades: `onChange` del contrato = el del legacy. */
export function SopaLetrasPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<SopaLetrasEstado, SopaLetrasConfig>) {
  return <LegacySopaLetrasProperties actividad={estado} onChange={onChange} />;
}
