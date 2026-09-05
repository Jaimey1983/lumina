import type { AnagramaActivity } from "lumina-frontend/activities/anagrama";

/**
 * Estado del elemento Anagrama = la actividad completa.
 * Coincide con `AnagramaActivity` del frontend.
 */
export type AnagramaEstado = AnagramaActivity;

/**
 * Config de runtime del viewer (no es apariencia del panel).
 * `onComplete` se reenvía al viewer legacy sin cambiar su comportamiento.
 */
export interface AnagramaConfig {
  readonly onComplete?: (response: unknown) => void;
}

export const ANAGRAMA_TIPO = "anagrama" as const;
