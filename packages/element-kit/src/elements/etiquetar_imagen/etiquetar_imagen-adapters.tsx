import {
  EtiquetarImagenEditor as LegacyEditor,
  EtiquetarImagenProperties as LegacyProperties,
  EtiquetarImagenViewer as LegacyViewer,
} from "../../activities/etiquetar-imagen/index.js";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { EtiquetarImagenConfig, EtiquetarImagenEstado } from "./etiquetar_imagen-types.js";

/** Vista del lienzo en el editor. */
export function EtiquetarImagenEditor({
  estado,
}: ElementEditorProps<EtiquetarImagenEstado, EtiquetarImagenConfig>) {
  return <LegacyEditor actividad={estado} />;
}

/** Viewer del alumno. */
export function EtiquetarImagenViewer({
  estado,
  config,
}: ElementViewerProps<EtiquetarImagenEstado, EtiquetarImagenConfig>) {
  return <LegacyViewer actividad={estado} onResponse={config.onResponse} />;
}

/** Panel de propiedades: `onChange` del contrato = el de las propiedades. */
export function EtiquetarImagenPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<EtiquetarImagenEstado, EtiquetarImagenConfig>) {
  return <LegacyProperties actividad={estado} onChange={onChange} />;
}
