import {
  PuzzleImagenEditor as LegacyPuzzleImagenEditor,
  PuzzleImagenViewer as LegacyPuzzleImagenViewer,
  PuzzleImagenProperties as LegacyPuzzleImagenProperties,
} from "lumina-frontend/activities/puzzle-imagen";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "../../contract.js";
import type { PuzzleImagenConfig, PuzzleImagenEstado } from "./puzzle_imagen-types.js";

/** Adapta el Editor legacy a las props del contrato ElementDefinition. */
export function PuzzleImagenEditor({
  estado,
}: ElementEditorProps<PuzzleImagenEstado, PuzzleImagenConfig>) {
  return <LegacyPuzzleImagenEditor actividad={estado} />;
}

/** Adapta el Viewer legacy sin cambiar su comportamiento. */
export function PuzzleImagenViewer({
  estado,
  config,
}: ElementViewerProps<PuzzleImagenEstado, PuzzleImagenConfig>) {
  return (
    <LegacyPuzzleImagenViewer actividad={estado} onComplete={config.onComplete} />
  );
}

/** Adapta el panel de propiedades: `onChange` del contrato = el del legacy. */
export function PuzzleImagenPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<PuzzleImagenEstado, PuzzleImagenConfig>) {
  return <LegacyPuzzleImagenProperties actividad={estado} onChange={onChange} />;
}
