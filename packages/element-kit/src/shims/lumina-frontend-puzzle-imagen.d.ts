import type { ReactElement } from "react";

/** Stub de tipos para el build de `@lumina/element-kit` (runtime = workspace). */
export type PuzzleImagenActivity = { tipo: "puzzle_imagen"; [key: string]: unknown };

export declare function createDefaultPuzzleImagen(): PuzzleImagenActivity;

export declare function PuzzleImagenEditor(props: {
  actividad: PuzzleImagenActivity;
  onChange?: (actividad: PuzzleImagenActivity) => void;
  onActivityChange?: (actividad: PuzzleImagenActivity) => void;
  isSelected?: boolean;
}): ReactElement;

export declare function PuzzleImagenViewer(props: {
  actividad: PuzzleImagenActivity;
  onComplete?: (response: unknown) => void;
}): ReactElement;

export declare function PuzzleImagenProperties(props: {
  actividad: PuzzleImagenActivity;
  onChange: (actividad: PuzzleImagenActivity) => void;
}): ReactElement;
