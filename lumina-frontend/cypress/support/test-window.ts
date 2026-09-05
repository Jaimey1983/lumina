/**
 * Formas reales de los globales que el propio código de la app (no los tests)
 * cuelga de `window` durante los specs de video interactivo, para poder
 * inspeccionarlos/pilotearlos desde Cypress sin `any`.
 */
import type { TimelineEngine, TimelinePolicy } from '../../src/lib/video-interactive/timeline-engine';

export interface VideoEventLog {
  event: string;
  payload?: Record<string, unknown>;
  timestamp: number;
}

export interface TestYouTubePlayer {
  seekTo: (seconds: number) => void;
}

export interface TestVimeoPlayer {
  postMessage: (message: { method: string; value?: number }) => void;
}

export interface VideoTestWindow extends Window {
  __videoEventLogs?: VideoEventLog[];
  __videoErrors?: unknown[];
  __testVideoUrl?: string;
  __testQuestions?: unknown[];
  __testSeekPolicy?: Partial<TimelinePolicy>;
  __youtubeApiLoadCount?: number;
  testSetup?: Record<string, unknown>;
  currentYouTubePlayer?: TestYouTubePlayer | null;
  currentVimeoPlayer?: TestVimeoPlayer | null;
  currentHtml5Player?: HTMLVideoElement | null;
  timelineEngine?: TimelineEngine | null;
}

/** Único punto de cast — el resto del archivo que lo use queda tipado de verdad. */
export function asTestWindow(win: Cypress.AUTWindow): VideoTestWindow {
  return win as unknown as VideoTestWindow;
}
