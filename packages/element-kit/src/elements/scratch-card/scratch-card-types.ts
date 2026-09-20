import type { WidgetCanvasConfig } from "../_shared/widget-runtime-config.js";

export const SCRATCH_CARD_TIPO = "scratch-card" as const;

export type ScratchContenidoTipo = "texto" | "imagen" | "premio";

export interface ScratchCardConfiguracion {
  contenidoTipo: ScratchContenidoTipo;
  textoSecreto?: string;
  imagenSecretaUrl?: string;
  imagenSecretaAlt?: string;
  premioTitulo?: string;
  premioSubtitulo?: string;
  colorCobertura: string;
  textoCobertura: string;
  grosorPincel: number;
  umbralAutoRevelado: number; // porcentaje 10 a 90 (ej. 45%)
  permitirBotonRevelar: boolean;
  permitirReinicio: boolean;
}

export interface ScratchCardEstado {
  id?: string;
  tipo: typeof SCRATCH_CARD_TIPO;
  x: number;
  y: number;
  ancho: number;
  alto: number;
  zIndex?: number;
  tituloWidget?: string;
  subtituloWidget?: string;
  instruccion?: string;
  configuracion: ScratchCardConfiguracion;
}

export type ScratchCardConfig = WidgetCanvasConfig;
