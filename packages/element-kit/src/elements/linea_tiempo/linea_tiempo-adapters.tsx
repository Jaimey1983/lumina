import {
  LineaTiempoEditor as LegacyEditor,
  LineaTiempoProperties as LegacyProperties,
  LineaTiempoViewer as LegacyViewer,
} from "../../activities/linea-tiempo/index.js";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { LineaTiempoConfig, LineaTiempoEstado } from "./linea_tiempo-types.js";

/** Vista del lienzo en el editor. */
export function LineaTiempoEditor({
  estado,
}: ElementEditorProps<LineaTiempoEstado, LineaTiempoConfig>) {
  return <LegacyEditor actividad={estado} />;
}

/** Viewer del alumno. */
export function LineaTiempoViewer({
  estado,
  config,
}: ElementViewerProps<LineaTiempoEstado, LineaTiempoConfig>) {
  return <LegacyViewer actividad={estado} onResponse={config.onResponse} />;
}

/** Panel de propiedades: `onChange` del contrato = el de las propiedades. */
export function LineaTiempoPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<LineaTiempoEstado, LineaTiempoConfig>) {
  return <LegacyProperties actividad={estado} onChange={onChange} />;
}
