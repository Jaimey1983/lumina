import {
  PuzzlePalabrasEditor as LegacyPuzzlePalabrasEditor,
  PuzzlePalabrasViewer as LegacyPuzzlePalabrasViewer,
  PuzzlePalabrasProperties as LegacyPuzzlePalabrasProperties,
} from "lumina-frontend/activities/puzzle-palabras";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "../../contract.js";
import type { PuzzlePalabrasConfig, PuzzlePalabrasEstado } from "./puzzle_palabras-types.js";

/** Adapta el Editor legacy a las props del contrato ElementDefinition. */
export function PuzzlePalabrasEditor({
  estado,
  onChange,
}: ElementEditorProps<PuzzlePalabrasEstado, PuzzlePalabrasConfig>) {
  return <LegacyPuzzlePalabrasEditor actividad={estado} onActivityChange={onChange} />;
}

/** Adapta el Viewer legacy sin cambiar su comportamiento. */
export function PuzzlePalabrasViewer({
  estado,
  config,
}: ElementViewerProps<PuzzlePalabrasEstado, PuzzlePalabrasConfig>) {
  return (
    <LegacyPuzzlePalabrasViewer actividad={estado} onComplete={config.onComplete} />
  );
}

/** Adapta el panel de propiedades: `onChange` del contrato = el del legacy. */
export function PuzzlePalabrasPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<PuzzlePalabrasEstado, PuzzlePalabrasConfig>) {
  return <LegacyPuzzlePalabrasProperties actividad={estado} onChange={onChange} />;
}
