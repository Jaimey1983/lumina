import type { ReactElement } from "react";

/** Stub de tipos para el build de `@lumina/element-kit` (runtime = workspace). */
export type AhorcadoActivity = { tipo: "ahorcado"; [key: string]: unknown };

export declare function createDefaultAhorcado(): AhorcadoActivity;

export declare function AhorcadoEditor(props: {
  actividad: AhorcadoActivity;
  onChange?: (actividad: AhorcadoActivity) => void;
  onActivityChange?: (actividad: AhorcadoActivity) => void;
  isSelected?: boolean;
}): ReactElement;

export declare function AhorcadoViewer(props: {
  actividad: AhorcadoActivity;
  onComplete?: (response: unknown) => void;
}): ReactElement;

export declare function AhorcadoProperties(props: {
  actividad: AhorcadoActivity;
  onChange: (actividad: AhorcadoActivity) => void;
}): ReactElement;
