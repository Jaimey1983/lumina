import type { EtiquetarImagenActivity } from "../../activities/etiquetar-imagen/index.js";

/** Estado del elemento = la actividad completa. */
export type EtiquetarImagenEstado = EtiquetarImagenActivity;

/** Config de runtime del viewer. */
export interface EtiquetarImagenConfig {
  /** Canal de respuesta unificado (etapa U / DU2). */
  readonly onResponse?: (response: unknown) => void;
}

export const ETIQUETAR_IMAGEN_TIPO = "etiquetar_imagen" as const;
