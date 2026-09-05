import type { ReactElement } from "react";

/** Stub de tipos para el build de `@lumina/element-kit` (runtime = workspace). */
export type SopaLetrasActivity = { tipo: "sopa_letras"; [key: string]: unknown };

export declare function createDefaultSopaLetras(): SopaLetrasActivity;

export declare function SopaLetrasEditor(props: {
  actividad: SopaLetrasActivity;
  onChange?: (actividad: SopaLetrasActivity) => void;
  onActivityChange?: (actividad: SopaLetrasActivity) => void;
  isSelected?: boolean;
}): ReactElement;

export declare function SopaLetrasViewer(props: {
  actividad: SopaLetrasActivity;
  onComplete?: (response: unknown) => void;
}): ReactElement;

export declare function SopaLetrasProperties(props: {
  actividad: SopaLetrasActivity;
  onChange: (actividad: SopaLetrasActivity) => void;
}): ReactElement;
