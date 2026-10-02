import type { WidgetCanvasConfig } from "../_shared/widget-runtime-config.js";
import type { WidgetEstilosHeader } from "@lumina/types/widget";

export const ACCORDION_TIPO = "accordion" as const;

export interface AccordionSeccion {
  id: string;
  titulo: string;
  contenido: string;
  imagenUrl?: string;
  imagenAlt?: string;
  abiertoPorDefecto?: boolean;
}

export type AccordionModo = "exclusivo" | "multiple";
export type AccordionEstiloVisual = "tarjetas" | "bordeado" | "separadores" | "minimal";
export type AccordionPosicionIcono = "derecha" | "izquierda";
export type AccordionTamanoIcono = "sm" | "md" | "lg";

export interface AccordionConfiguracion {
  secciones: AccordionSeccion[];
  modo: AccordionModo;
  permitirColapsarTodo: boolean;
  estiloVisual: AccordionEstiloVisual;
  posicionIcono: AccordionPosicionIcono;
  tamanoIcono: AccordionTamanoIcono;
  animacionExpandir: boolean;
}

export interface AccordionEstado {
  id?: string;
  tipo: typeof ACCORDION_TIPO;
  x: number;
  y: number;
  ancho: number;
  alto: number;
  zIndex?: number;
  tituloWidget?: string;
  subtituloWidget?: string;
  instruccion?: string;
  estilosHeader?: WidgetEstilosHeader;
  configuracion: AccordionConfiguracion;
}

export type AccordionConfig = WidgetCanvasConfig;
