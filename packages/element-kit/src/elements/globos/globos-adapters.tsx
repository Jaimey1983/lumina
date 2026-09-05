import {
  GlobosEditor as LegacyGlobosEditor,
  GlobosViewer as LegacyGlobosViewer,
  GlobosProperties as LegacyGlobosProperties,
} from "lumina-frontend/activities/globos";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "../../contract.js";
import type { GlobosConfig, GlobosEstado } from "./globos-types.js";

/** Adapta el Editor legacy a las props del contrato ElementDefinition. */
export function GlobosEditor({
  estado,
}: ElementEditorProps<GlobosEstado, GlobosConfig>) {
  return <LegacyGlobosEditor actividad={estado} />;
}

/** Adapta el Viewer legacy sin cambiar su comportamiento. */
export function GlobosViewer({
  estado,
  config,
}: ElementViewerProps<GlobosEstado, GlobosConfig>) {
  return (
    <LegacyGlobosViewer actividad={estado} onComplete={config.onComplete} />
  );
}

/** Adapta el panel de propiedades: `onChange` del contrato = el del legacy. */
export function GlobosPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<GlobosEstado, GlobosConfig>) {
  return <LegacyGlobosProperties actividad={estado} onChange={onChange} />;
}
