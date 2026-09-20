import type { WidgetCanvasConfig } from "../_shared/widget-runtime-config.js";

export const CHECKLIST_TIPO = "interactive-checklist" as const;

export interface ChecklistItem {
  id: string;
  texto: string;
  descripcion?: string;
  completadoPorDefecto?: boolean;
}

export interface ChecklistConfiguracion {
  items: ChecklistItem[];
  mostrarBarraProgreso: boolean;
  mostrarContador: boolean;
  permitirReinicio: boolean;
  mostrarCelebracion: boolean;
  mensajeCelebracion?: string;
  estiloVisual: "tarjetas" | "minimal" | "numerado";
}

export interface ChecklistEstado {
  id?: string;
  tipo: typeof CHECKLIST_TIPO;
  x: number;
  y: number;
  ancho: number;
  alto: number;
  zIndex?: number;
  tituloWidget?: string;
  subtituloWidget?: string;
  instruccion?: string;
  configuracion: ChecklistConfiguracion;
}

export type ChecklistConfig = WidgetCanvasConfig;
