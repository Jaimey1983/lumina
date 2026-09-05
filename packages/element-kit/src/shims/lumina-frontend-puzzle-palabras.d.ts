import type { ReactElement } from "react";

/** Stub de tipos para el build de `@lumina/element-kit` (runtime = workspace). */
export type PuzzlePalabrasActivity = { tipo: "puzzle_palabras"; [key: string]: unknown };

export declare function createDefaultPuzzlePalabras(): PuzzlePalabrasActivity;

export declare function PuzzlePalabrasEditor(props: {
  actividad: PuzzlePalabrasActivity;
  onChange?: (actividad: PuzzlePalabrasActivity) => void;
  onActivityChange?: (actividad: PuzzlePalabrasActivity) => void;
  isSelected?: boolean;
}): ReactElement;

export declare function PuzzlePalabrasViewer(props: {
  actividad: PuzzlePalabrasActivity;
  onComplete?: (response: unknown) => void;
}): ReactElement;

export declare function PuzzlePalabrasProperties(props: {
  actividad: PuzzlePalabrasActivity;
  onChange: (actividad: PuzzlePalabrasActivity) => void;
}): ReactElement;
