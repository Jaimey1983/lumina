import type { Socket } from 'socket.io-client';

/**
 * Config de runtime que `RenderActivity` pasa a `elementRegistry.obtener`.
 * Une los campos de las 22 actividades (clásicas + Grupo 4) sin `Record<string, unknown>`.
 */
export interface ActivityRuntimeConfig {
  readonly onResponse?: (response: unknown) => void;
  readonly onComplete?: (response: unknown) => void;
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
}
