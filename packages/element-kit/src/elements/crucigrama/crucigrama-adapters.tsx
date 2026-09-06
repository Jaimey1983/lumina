import {
  CrucigramaEditor as LegacyCrucigramaEditor,
  CrucigramaViewer as LegacyCrucigramaViewer,
  CrucigramaProperties as LegacyCrucigramaProperties,
} from "lumina-frontend/activities/crucigrama";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { CrucigramaConfig, CrucigramaEstado } from "./crucigrama-types.js";

/** Adapta el Editor legacy a las props del contrato ElementDefinition. */
export function CrucigramaEditor({
  estado,
}: ElementEditorProps<CrucigramaEstado, CrucigramaConfig>) {
  return <LegacyCrucigramaEditor actividad={estado} />;
}

/** Adapta el Viewer legacy sin cambiar su comportamiento. */
export function CrucigramaViewer({
  estado,
  config,
}: ElementViewerProps<CrucigramaEstado, CrucigramaConfig>) {
  return (
    <LegacyCrucigramaViewer actividad={estado} onComplete={config.onComplete} />
  );
}

/** Adapta el panel de propiedades: `onChange` del contrato = el del legacy. */
export function CrucigramaPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<CrucigramaEstado, CrucigramaConfig>) {
  return <LegacyCrucigramaProperties actividad={estado} onChange={onChange} />;
}
