import type { ComponentType, ReactElement } from "react";

/** Stub de tipos para el build de `@lumina/element-kit` (runtime = workspace). */
export type BotonWidget = {
  tipo: "boton";
  texto: string;
  variante: string;
  outline?: boolean;
  tamano?: "sm" | "md" | "lg";
  forma?: "redondeado" | "pill";
  accion?: "ninguna" | "url" | "siguiente" | "anterior" | "ir_a";
  url?: string;
  slideIndex?: number;
  deshabilitado?: boolean;
  x?: number;
  y?: number;
  ancho?: number;
  alto?: number;
  zIndex?: number;
};

export declare function createDefaultBotonBlock(): BotonWidget;

export declare function BotonEditor(props: {
  block: BotonWidget;
  onEnsureBlockSelected: () => void;
}): ReactElement;

export declare function BotonViewer(props: {
  block: BotonWidget;
  isThumbnail?: boolean;
}): ReactElement;

export declare function BotonProperties(props: {
  block: BotonWidget;
  applyNow: (fn: (b: BotonWidget) => BotonWidget) => Promise<void>;
}): ReactElement;

export declare const SlideNavContext: {
  Provider: ComponentType<{
    value: {
      navigate: ((action: unknown) => void) | null;
      slideCount: number;
      slideIndex: number;
    };
    children?: React.ReactNode;
  }>;
};

export type SlideNavAction =
  | { kind: "siguiente" }
  | { kind: "anterior" }
  | { kind: "ir_a"; index: number };
