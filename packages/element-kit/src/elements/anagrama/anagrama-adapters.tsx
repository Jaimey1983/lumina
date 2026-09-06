import {
  AnagramaEditor as LegacyAnagramaEditor,
  AnagramaViewer as LegacyAnagramaViewer,
  AnagramaProperties as LegacyAnagramaProperties,
} from "lumina-frontend/activities/anagrama";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { AnagramaConfig, AnagramaEstado } from "./anagrama-types.js";

/** Adapta el Editor legacy a las props del contrato ElementDefinition. */
export function AnagramaEditor({
  estado,
  onChange,
}: ElementEditorProps<AnagramaEstado, AnagramaConfig>) {
  return (
    <LegacyAnagramaEditor actividad={estado} onActivityChange={onChange} />
  );
}

/** Adapta el Viewer legacy (DnD, intentos y overlay de resultado intactos). */
export function AnagramaViewer({
  estado,
  config,
}: ElementViewerProps<AnagramaEstado, AnagramaConfig>) {
  return (
    <LegacyAnagramaViewer actividad={estado} onComplete={config.onComplete} />
  );
}

/** Adapta el panel de propiedades: `onChange` del contrato = el del legacy. */
export function AnagramaPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<AnagramaEstado, AnagramaConfig>) {
  return <LegacyAnagramaProperties actividad={estado} onChange={onChange} />;
}
