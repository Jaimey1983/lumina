import type { ReactNode } from 'react';
import type { Socket } from 'socket.io-client';
import type { EscapeRoomSala } from '@lumina/types/slide';

/**
 * Config de runtime que `RenderActivity` pasa a `elementRegistry.obtener`.
 * Une los campos de las 22 actividades (clásicas + Grupo 4) sin `Record<string, unknown>`.
 */
export interface ActivityRuntimeConfig {
  /** Canal de respuesta unificado (etapa U / DU2): todas las actividades lo usan. */
  readonly onResponse?: (response: unknown) => void;
  readonly variant?: 'dark' | 'light';
  readonly editorSyncKey?: string;
  readonly isSelected?: boolean;
  readonly activityCanvasLayout?: boolean;
  readonly liveSocket?: Socket | null;
  readonly torneoSocket?: Socket | null;
  readonly viewerStudentId?: string;
  readonly viewerStudentName?: string;
  readonly viewerClassId?: string;
  readonly blockId?: string;
  /** Slide donde vive el bloque (identifica la partida en vivo del escape room). */
  readonly slideId?: string;
  /** Pinta el lienzo de una sala del escape room: lo pone el renderer, que es quien sabe pintar bloques. */
  readonly renderSalaCanvas?: (sala: EscapeRoomSala) => ReactNode;
}
