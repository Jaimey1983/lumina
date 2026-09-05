import type { ReactElement } from "react";

/** Stub de tipos para el build de `@lumina/element-kit` (runtime = workspace). */
export type HistoriaRamificadaActivity = { tipo: "historia_ramificada"; [key: string]: unknown };

export declare function createDefaultHistoriaRamificada(): HistoriaRamificadaActivity;

export declare function HistoriaRamificadaEditor(props: {
  actividad: HistoriaRamificadaActivity;
  onChange?: (actividad: HistoriaRamificadaActivity) => void;
  onActivityChange?: (actividad: HistoriaRamificadaActivity) => void;
  isSelected?: boolean;
}): ReactElement;

export declare function HistoriaRamificadaViewer(props: {
  actividad: HistoriaRamificadaActivity;
  onComplete?: (response: unknown) => void;
}): ReactElement;

export declare function HistoriaRamificadaProperties(props: {
  actividad: HistoriaRamificadaActivity;
  onChange: (actividad: HistoriaRamificadaActivity) => void;
}): ReactElement;
