import type { WidgetCanvasConfig } from "../_shared/widget-runtime-config.js";

export const IMAGE_COMPARE_TIPO = "image-compare" as const;

export interface ImageCompareConfiguracion {
  imagenAntesUrl: string;
  imagenDespuesUrl: string;
  imagenAntesAlt?: string;
  imagenDespuesAlt?: string;
  etiquetaAntes: string;
  etiquetaDespues: string;
  posicionInicial: number; // 0 a 100
  orientacion: "horizontal" | "vertical";
  mostrarEtiquetas: boolean;
  estiloLinea: "solida" | "discreta";
  colorLinea?: string;
  mostrarBotonDeslizador: boolean;

  // Cabecera del widget
  mostrarTituloWidget?: boolean;
  mostrarSubtitulo?: boolean;
  mostrarInstruccion?: boolean;

  // Encuadre y Zoom — Imagen Antes
  imagenAntesOffsetX?: number; // -40 a +40 (%)
  imagenAntesOffsetY?: number; // -40 a +40 (%)
  imagenAntesEscala?: number; // 50 a 200 (%)
  imagenAntesObjectFit?: "cover" | "contain";
  imagenAntesObjectPosition?: string;

  // Encuadre y Zoom — Imagen Después
  imagenDespuesOffsetX?: number; // -40 a +40 (%)
  imagenDespuesOffsetY?: number; // -40 a +40 (%)
  imagenDespuesEscala?: number; // 50 a 200 (%)
  imagenDespuesObjectFit?: "cover" | "contain";
  imagenDespuesObjectPosition?: string;

  // Sincronización de encuadre entre ambas imágenes
  sincronizarEncuadre?: boolean;
}

export type ImageCompareInnerSelection =
  | { kind: "widget" }
  | { kind: "header-text"; field: "tituloWidget" | "subtituloWidget" | "instruccion" }
  | { kind: "image"; side: "antes" | "despues" };

export interface ImageCompareEstado {
  id?: string;
  tipo: typeof IMAGE_COMPARE_TIPO;
  x: number;
  y: number;
  ancho: number;
  alto: number;
  zIndex?: number;
  tituloWidget?: string;
  subtituloWidget?: string;
  instruccion?: string;
  configuracion: ImageCompareConfiguracion;
}

export type ImageCompareConfig = WidgetCanvasConfig;
