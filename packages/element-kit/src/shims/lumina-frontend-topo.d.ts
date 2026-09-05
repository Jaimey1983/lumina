import type { ReactElement } from "react";

/** Stub de tipos para el build de `@lumina/element-kit` (runtime = workspace). */
export type TopoActivity = { tipo: "topo"; [key: string]: unknown };

export declare function createDefaultTopo(): TopoActivity;

export declare function TopoEditor(props: {
  actividad: TopoActivity;
  onChange?: (actividad: TopoActivity) => void;
  onActivityChange?: (actividad: TopoActivity) => void;
  isSelected?: boolean;
}): ReactElement;

export declare function TopoViewer(props: {
  actividad: TopoActivity;
  onComplete?: (response: unknown) => void;
}): ReactElement;

export declare function TopoProperties(props: {
  actividad: TopoActivity;
  onChange: (actividad: TopoActivity) => void;
}): ReactElement;
