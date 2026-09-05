import type { ReactElement } from "react";

/** Stub de tipos para el build de element-kit (runtime = workspace). */
export interface HotspotWidget {
  tipo: "hotspot";
  configuracion: {
    colorPulso: string;
    tamanoPunto: "pequeno" | "mediano" | "grande";
    triggerEvento: "click" | "hover";
    posicionBurbuja: "auto" | "arriba" | "abajo" | "izquierda" | "derecha";
    efectoApertura: "fade" | "instant" | "slide-up";
    colorFondoBurbuja: string;
    mostrarBotonCerrar: boolean;
    anchoBurbuja: number;
  };
  overlay: { id: string; encabezado?: string; cuerpo?: string };
  x?: number;
  y?: number;
  ancho?: number;
  alto?: number;
  zIndex?: number;
}

export declare function createDefaultHotspotBlock(): HotspotWidget;
export declare function HotspotEditor(props: {
  block: HotspotWidget;
  onChange: (block: HotspotWidget) => void;
  onEnsureBlockSelected?: () => void;
  innerSelection: null;
}): ReactElement;
export declare function HotspotViewer(props: {
  block: HotspotWidget;
  isThumbnail?: boolean;
}): ReactElement;
export declare function HotspotProperties(props: {
  block: HotspotWidget;
  applyNow: (fn: (block: HotspotWidget) => HotspotWidget) => Promise<void>;
}): ReactElement;
