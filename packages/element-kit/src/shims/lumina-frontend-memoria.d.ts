import type { ReactElement } from "react";

/** Stub de tipos para el build de `@lumina/element-kit` (runtime = workspace). */
export type MemoriaActivity = { tipo: "memoria"; [key: string]: unknown };

export declare function createDefaultMemoria(): MemoriaActivity;

export declare function MemoriaEditor(props: {
  actividad: MemoriaActivity;
  onChange?: (actividad: MemoriaActivity) => void;
  onActivityChange?: (actividad: MemoriaActivity) => void;
  isSelected?: boolean;
}): ReactElement;

export declare function MemoriaViewer(props: {
  actividad: MemoriaActivity;
  onComplete?: (response: unknown) => void;
}): ReactElement;

export declare function MemoriaProperties(props: {
  actividad: MemoriaActivity;
  onChange: (actividad: MemoriaActivity) => void;
}): ReactElement;
