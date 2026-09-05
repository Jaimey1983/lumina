import type { ReactElement } from "react";

/** Stub de tipos para el build de `@lumina/element-kit` (runtime = workspace). */
export type GlobosActivity = { tipo: "globos"; [key: string]: unknown };

export declare function createDefaultGlobos(): GlobosActivity;

export declare function GlobosEditor(props: {
  actividad: GlobosActivity;
  onChange?: (actividad: GlobosActivity) => void;
  onActivityChange?: (actividad: GlobosActivity) => void;
  isSelected?: boolean;
}): ReactElement;

export declare function GlobosViewer(props: {
  actividad: GlobosActivity;
  onComplete?: (response: unknown) => void;
}): ReactElement;

export declare function GlobosProperties(props: {
  actividad: GlobosActivity;
  onChange: (actividad: GlobosActivity) => void;
}): ReactElement;
