import {
  ClasificarEditor as LegacyClasificarEditor,
  ClasificarViewer as LegacyClasificarViewer,
  ClasificarProperties as LegacyClasificarProperties,
} from "lumina-frontend/activities/clasificar";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { ClasificarConfig, ClasificarEstado } from "./clasificar-types.js";

/** Adapta el Editor legacy a las props del contrato ElementDefinition. */
export function ClasificarEditor({
  estado,
}: ElementEditorProps<ClasificarEstado, ClasificarConfig>) {
  return <LegacyClasificarEditor actividad={estado} />;
}

/** Adapta el Viewer legacy sin cambiar su comportamiento. */
export function ClasificarViewer({
  estado,
  config,
}: ElementViewerProps<ClasificarEstado, ClasificarConfig>) {
  return (
    <LegacyClasificarViewer actividad={estado} onComplete={config.onComplete} />
  );
}

/** Adapta el panel de propiedades: `onChange` del contrato = el del legacy. */
export function ClasificarPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<ClasificarEstado, ClasificarConfig>) {
  return <LegacyClasificarProperties actividad={estado} onChange={onChange} />;
}
