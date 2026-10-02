import type { Activity } from "../../activities/_classic/index.js";

/** Estado del elemento = la actividad completa. */
export type RespuestaMatematicaEstado = Activity;

export type { ClassicConfig as RespuestaMatematicaConfig } from "../_shared/classic-adapters.js";

export const RESPUESTA_MATEMATICA_TIPO = "respuesta_matematica" as const;
