import type { MemoriaActivity } from "lumina-frontend/activities/memoria";

/** Estado del elemento Memoria = la actividad completa. */
export type MemoriaEstado = MemoriaActivity;

/** Config de runtime del viewer. `onComplete` se reenvía al legacy. */
export interface MemoriaConfig {
  readonly onComplete?: (response: unknown) => void;
}

export const MEMORIA_TIPO = "memoria" as const;
