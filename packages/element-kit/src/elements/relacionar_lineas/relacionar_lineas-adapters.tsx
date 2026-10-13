import {
  RelacionarLineasEditor as LegacyEditor,
  RelacionarLineasProperties as LegacyProperties,
  RelacionarLineasViewer as LegacyViewer,
} from "../../activities/relacionar-lineas/index.js";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { RelacionarLineasConfig, RelacionarLineasEstado } from "./relacionar_lineas-types.js";

/** Vista del lienzo en el editor. */
export function RelacionarLineasEditor({
  estado,
}: ElementEditorProps<RelacionarLineasEstado, RelacionarLineasConfig>) {
  return <LegacyEditor actividad={estado} />;
}

/** Viewer del alumno. */
export function RelacionarLineasViewer({
  estado,
  config,
}: ElementViewerProps<RelacionarLineasEstado, RelacionarLineasConfig>) {
  return <LegacyViewer actividad={estado} onResponse={config.onResponse} />;
}

/** Panel de propiedades: `onChange` del contrato = el de las propiedades. */
export function RelacionarLineasPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<RelacionarLineasEstado, RelacionarLineasConfig>) {
  return <LegacyProperties actividad={estado} onChange={onChange} />;
}
