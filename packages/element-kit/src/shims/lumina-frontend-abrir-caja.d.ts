import type { ReactElement } from "react";

/** Stub de tipos para el build de `@lumina/element-kit` (runtime = workspace). */
export type AbrirCajaActivity = { tipo: "abrir_caja"; [key: string]: unknown };

export declare function createDefaultAbrirCaja(): AbrirCajaActivity;

export declare function AbrirCajaEditor(props: {
  actividad: AbrirCajaActivity;
  onChange?: (actividad: AbrirCajaActivity) => void;
  onActivityChange?: (actividad: AbrirCajaActivity) => void;
  isSelected?: boolean;
}): ReactElement;

export declare function AbrirCajaViewer(props: {
  actividad: AbrirCajaActivity;
  onComplete?: (response: unknown) => void;
}): ReactElement;

export declare function AbrirCajaProperties(props: {
  actividad: AbrirCajaActivity;
  onChange: (actividad: AbrirCajaActivity) => void;
}): ReactElement;
