import type { ReactElement } from "react";

/** Stub de tipos para el build de `@lumina/element-kit` (runtime = workspace). */
export type AnagramaActivity = {
  tipo: "anagrama";
  configuracion: {
    mostrarPista: boolean;
    tiempoLimite?: number;
    intentos: number;
  };
  palabras: { texto: string; pista?: string; imagen?: string }[];
};

export declare function createDefaultAnagrama(): AnagramaActivity;

export declare function AnagramaEditor(props: {
  actividad: AnagramaActivity;
  onActivityChange?: (actividad: AnagramaActivity) => void;
}): ReactElement;

export declare function AnagramaViewer(props: {
  actividad: AnagramaActivity;
  onComplete?: (response: unknown) => void;
}): ReactElement;

export declare function AnagramaProperties(props: {
  actividad: AnagramaActivity;
  onChange: (actividad: AnagramaActivity) => void;
}): ReactElement;
