import {
  TopoEditor as LegacyTopoEditor,
  TopoViewer as LegacyTopoViewer,
  TopoProperties as LegacyTopoProperties,
} from "lumina-frontend/activities/topo";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { TopoConfig, TopoEstado } from "./topo-types.js";

/** Adapta el Editor legacy a las props del contrato ElementDefinition. */
export function TopoEditor({
  estado,
}: ElementEditorProps<TopoEstado, TopoConfig>) {
  return <LegacyTopoEditor actividad={estado} />;
}

/** Adapta el Viewer legacy sin cambiar su comportamiento. */
export function TopoViewer({
  estado,
  config,
}: ElementViewerProps<TopoEstado, TopoConfig>) {
  return (
    <LegacyTopoViewer actividad={estado} onComplete={config.onComplete} />
  );
}

/** Adapta el panel de propiedades: `onChange` del contrato = el del legacy. */
export function TopoPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<TopoEstado, TopoConfig>) {
  return <LegacyTopoProperties actividad={estado} onChange={onChange} />;
}
