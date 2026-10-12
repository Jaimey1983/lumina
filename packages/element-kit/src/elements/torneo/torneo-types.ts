import type { Socket } from "socket.io-client";
import type { TorneoActivity } from "../../activities/torneo/index.js";

/** Estado del elemento Torneo = la actividad completa. */
export type TorneoEstado = TorneoActivity;

/**
 * Config de runtime del torneo. El socket y la identidad del alumno los inyecta el
 * anfitrión (el kit no importa nada del frontend); sin `liveSocket` el viewer juega en modo autónomo.
 */
export interface TorneoConfig {
  /** Canal de respuesta unificado (etapa U / DU2). */
  readonly onResponse?: (response: unknown) => void;
  readonly variant?: "dark" | "light";
  readonly editorSyncKey?: string;
  readonly isSelected?: boolean;
  readonly activityCanvasLayout?: boolean;
  /** Socket del namespace `/live` del alumno. */
  readonly liveSocket?: Socket | null;
  /** Socket dedicado al torneo; si falta se usa `liveSocket` (como siempre). */
  readonly torneoSocket?: Socket | null;
  readonly viewerStudentId?: string;
  readonly viewerStudentName?: string;
  readonly viewerClassId?: string;
}

export const TORNEO_TIPO = "torneo" as const;
