import {
  ProblemaPasosEditor as LegacyEditor,
  ProblemaPasosProperties as LegacyProperties,
  ProblemaPasosViewer as LegacyViewer,
} from "../../activities/problema-pasos/index.js";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { ProblemaPasosConfig, ProblemaPasosEstado } from "./problema_pasos-types.js";

/** Vista del lienzo en el editor. */
export function ProblemaPasosEditor({
  estado,
}: ElementEditorProps<ProblemaPasosEstado, ProblemaPasosConfig>) {
  return <LegacyEditor actividad={estado} />;
}

/** Viewer del alumno. */
export function ProblemaPasosViewer({
  estado,
  config,
}: ElementViewerProps<ProblemaPasosEstado, ProblemaPasosConfig>) {
  return <LegacyViewer actividad={estado} onResponse={config.onResponse} />;
}

/** Panel de propiedades: `onChange` del contrato = el de las propiedades. */
export function ProblemaPasosPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<ProblemaPasosEstado, ProblemaPasosConfig>) {
  return <LegacyProperties actividad={estado} onChange={onChange} />;
}
