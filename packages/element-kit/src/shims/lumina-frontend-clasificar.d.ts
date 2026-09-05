import type { ReactElement } from "react";

/** Stub de tipos para el build de `@lumina/element-kit` (runtime = workspace). */
export type ClasificarActivity = { tipo: "clasificar"; [key: string]: unknown };

export declare function createDefaultClasificar(): ClasificarActivity;

export declare function ClasificarEditor(props: {
  actividad: ClasificarActivity;
  onChange?: (actividad: ClasificarActivity) => void;
  onActivityChange?: (actividad: ClasificarActivity) => void;
  isSelected?: boolean;
}): ReactElement;

export declare function ClasificarViewer(props: {
  actividad: ClasificarActivity;
  onComplete?: (response: unknown) => void;
}): ReactElement;

export declare function ClasificarProperties(props: {
  actividad: ClasificarActivity;
  onChange: (actividad: ClasificarActivity) => void;
}): ReactElement;
