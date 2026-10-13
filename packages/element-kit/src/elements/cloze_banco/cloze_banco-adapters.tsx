import {
  ClozeBancoEditor as LegacyEditor,
  ClozeBancoProperties as LegacyProperties,
  ClozeBancoViewer as LegacyViewer,
} from "../../activities/cloze-banco/index.js";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { ClozeBancoConfig, ClozeBancoEstado } from "./cloze_banco-types.js";

/** Vista del lienzo en el editor. */
export function ClozeBancoEditor({
  estado,
}: ElementEditorProps<ClozeBancoEstado, ClozeBancoConfig>) {
  return <LegacyEditor actividad={estado} />;
}

/** Viewer del alumno. */
export function ClozeBancoViewer({
  estado,
  config,
}: ElementViewerProps<ClozeBancoEstado, ClozeBancoConfig>) {
  return <LegacyViewer actividad={estado} onResponse={config.onResponse} />;
}

/** Panel de propiedades: `onChange` del contrato = el de las propiedades. */
export function ClozeBancoPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<ClozeBancoEstado, ClozeBancoConfig>) {
  return <LegacyProperties actividad={estado} onChange={onChange} />;
}
