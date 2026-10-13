import type { ReactNode } from "react";
import type { Socket } from "socket.io-client";
import type { EscapeRoomActivity, EscapeRoomSala } from "@lumina/types/slide";

/** Estado del elemento Escape Room = la actividad completa. */
export type EscapeRoomEstado = EscapeRoomActivity;

/**
 * Config de runtime del escape room. El socket, la identidad del alumno y el pintado del lienzo de
 * cada sala los inyecta el anfitrión: el kit no importa nada del frontend (ni el `SlideRenderer`).
 */
export interface EscapeRoomConfig {
  /** Canal de respuesta unificado (etapa U / DU2). */
  readonly onResponse?: (response: unknown) => void;
  readonly variant?: "dark" | "light";
  readonly editorSyncKey?: string;
  readonly isSelected?: boolean;
  readonly activityCanvasLayout?: boolean;
  /** Socket del namespace `/live` del alumno; sin él (o sin partida abierta) juega en modo local. */
  readonly liveSocket?: Socket | null;
  readonly viewerStudentId?: string;
  readonly viewerStudentName?: string;
  readonly viewerClassId?: string;
  /** Slide donde vive el bloque: identifica la partida en vivo. */
  readonly slideId?: string;
  /** Pinta el lienzo (`bloques`/`fondo`) de una sala; si falta, la sala es la tarjeta de texto. */
  readonly renderSalaCanvas?: (sala: EscapeRoomSala) => ReactNode;
}

export const ESCAPE_ROOM_TIPO = "escape_room" as const;
