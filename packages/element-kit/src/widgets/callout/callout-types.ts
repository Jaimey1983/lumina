/**
 * T16 — Callout / nota. Widget nuevo: nace como `ElementDefinition` (DT6) y su tipo vive aquí, no
 * en el `Block` viejo de `@lumina/types` (Regla 3).
 */
export const CALLOUT_TIPO = "callout" as const;

/** Qué clase de nota es: fija el color (por `--lw-color-*`), el icono y la etiqueta de accesibilidad. */
export type CalloutTono = "info" | "tip" | "aviso" | "peligro" | "exito";

/** Cómo se dibuja: barra lateral, tarjeta con borde o banda a todo color. */
export type CalloutEstilo = "barra" | "tarjeta" | "banda";

export interface CalloutConfiguracion {
  tono: CalloutTono;
  estilo: CalloutEstilo;
  /** Id de `CALLOUT_ICONOS`; `auto` = el del tono. */
  icono: string;
  mostrarIcono: boolean;
  titulo: string;
  mostrarTitulo: boolean;
  /** Texto del cuerpo; admite HTML básico (se sanea al mostrarlo: negrita, cursiva, enlaces…). */
  cuerpo: string;
  /** Color propio (`#RRGGBB`); sin él se usa el del tono. */
  colorAcento?: string;
}

export interface CalloutEstado {
  id?: string;
  tipo: typeof CALLOUT_TIPO;
  x: number;
  y: number;
  ancho: number;
  alto: number;
  zIndex?: number;
  configuracion: CalloutConfiguracion;
}
