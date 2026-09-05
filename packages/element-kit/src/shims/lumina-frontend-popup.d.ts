import type { ReactElement } from "react";

/** Stub de tipos para el build aislado de element-kit (runtime = workspace). */
export interface PopupOverlayContent {
  id: string;
  etiqueta?: string;
  encabezado?: string;
  subtitulo?: string;
  cuerpo?: string;
  imagen?: string;
  layoutId?: string;
  [key: string]: unknown;
}

export interface PopupWidget {
  tipo: "popup";
  configuracion: {
    triggerVisual: "boton" | "icono" | "imagen" | "texto";
    triggerTexto?: string;
    triggerIcono?: string;
    triggerColorFondo: string;
    triggerColorTexto: string;
    triggerForma: "pill" | "redondo" | "cuadrado";
    triggerEvento: "click" | "hover" | "auto";
    efectoApertura: "fade" | "instant" | "slide-up";
    colorBackdrop: string;
    opacidadBackdrop: number;
    colorFondoModal: string;
    mostrarBotonCerrar: boolean;
    [key: string]: unknown;
  };
  overlay: PopupOverlayContent;
  tituloWidget?: string;
  subtituloWidget?: string;
  instruccion?: string;
  x?: number;
  y?: number;
  ancho?: number;
  alto?: number;
  zIndex?: number;
}

export declare const DEFAULT_POPUP_CONFIG: PopupWidget["configuracion"];
export declare function createDefaultPopupBlock(): PopupWidget;
export declare function createDefaultPopupOverlay(): PopupOverlayContent;
export declare function normalizePopupWidget(block: PopupWidget): PopupWidget;

export declare function PopupEditor(props: {
  block: PopupWidget;
  onChange: (block: PopupWidget) => void;
  onEnsureBlockSelected?: () => void;
  innerSelection?: unknown;
  onInnerSelectionChange?: (selection: unknown) => void;
}): ReactElement;
export declare function PopupViewer(props: {
  block: PopupWidget;
  isThumbnail?: boolean;
}): ReactElement;
export declare function PopupProperties(props: {
  block: PopupWidget;
  applyNow: (fn: (block: PopupWidget) => PopupWidget) => Promise<void>;
}): ReactElement;
