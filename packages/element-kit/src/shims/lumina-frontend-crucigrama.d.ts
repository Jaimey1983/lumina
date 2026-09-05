import type { ReactElement } from "react";

/** Stub de tipos para el build de `@lumina/element-kit` (runtime = workspace). */
export type CrucigramaActivity = { tipo: "crucigrama"; [key: string]: unknown };

export declare function createDefaultCrucigrama(): CrucigramaActivity;

export declare function CrucigramaEditor(props: {
  actividad: CrucigramaActivity;
  onChange?: (actividad: CrucigramaActivity) => void;
  onActivityChange?: (actividad: CrucigramaActivity) => void;
  isSelected?: boolean;
}): ReactElement;

export declare function CrucigramaViewer(props: {
  actividad: CrucigramaActivity;
  onComplete?: (response: unknown) => void;
}): ReactElement;

export declare function CrucigramaProperties(props: {
  actividad: CrucigramaActivity;
  onChange: (actividad: CrucigramaActivity) => void;
}): ReactElement;
