import type { MemoriaActivity } from "../../activities/memoria/index.js";

/** Estado del elemento Memoria = la actividad completa. */
export type MemoriaEstado = MemoriaActivity;

/** Config de runtime del viewer. */
export interface MemoriaConfig {
  /** Canal de respuesta unificado (etapa U / DU2). */
  readonly onResponse?: (response: unknown) => void;
}

export const MEMORIA_TIPO = "memoria" as const;
