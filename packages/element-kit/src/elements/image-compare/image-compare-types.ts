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
}

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
