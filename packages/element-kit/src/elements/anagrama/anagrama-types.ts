import type { AnagramaActivity } from "../../activities/anagrama/index.js";

/**
 * Estado del elemento Anagrama = la actividad completa.
 * Coincide con `AnagramaActivity` del frontend.
 */
export type AnagramaEstado = AnagramaActivity;

/** Config de runtime del viewer (no es apariencia del panel). */
export interface AnagramaConfig {
  /** Canal de respuesta unificado (etapa U / DU2). */
  readonly onResponse?: (response: unknown) => void;
}

export const ANAGRAMA_TIPO = "anagrama" as const;
