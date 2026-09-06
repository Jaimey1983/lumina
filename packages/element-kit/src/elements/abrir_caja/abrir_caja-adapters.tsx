import {
  AbrirCajaEditor as LegacyAbrirCajaEditor,
  AbrirCajaViewer as LegacyAbrirCajaViewer,
  AbrirCajaProperties as LegacyAbrirCajaProperties,
} from "lumina-frontend/activities/abrir-caja";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { AbrirCajaConfig, AbrirCajaEstado } from "./abrir_caja-types.js";

/** Adapta el Editor legacy a las props del contrato ElementDefinition. */
export function AbrirCajaEditor({
  estado,
}: ElementEditorProps<AbrirCajaEstado, AbrirCajaConfig>) {
  return <LegacyAbrirCajaEditor actividad={estado} />;
}

/** Adapta el Viewer legacy sin cambiar su comportamiento. */
export function AbrirCajaViewer({
  estado,
  config,
}: ElementViewerProps<AbrirCajaEstado, AbrirCajaConfig>) {
  return (
    <LegacyAbrirCajaViewer actividad={estado} onComplete={config.onComplete} />
  );
}

/** Adapta el panel de propiedades: `onChange` del contrato = el del legacy. */
export function AbrirCajaPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<AbrirCajaEstado, AbrirCajaConfig>) {
  return <LegacyAbrirCajaProperties actividad={estado} onChange={onChange} />;
}
