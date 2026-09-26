import { virtualMinVhCapPx, virtualPxFromVh } from './virtual-viewport-units';

/**
 * G-scale.3 — alturas máximas de shells de actividad en el editor (modo no-lienzo).
 * Sustituyen `max-h-[min(Xvh,Ypx)]` atados al viewport del navegador.
 */

export const ACTIVITY_EDITOR_SHELL_MAX_H_CLASS = {
  orderSteps: `max-h-[${virtualMinVhCapPx(52, 380)}px]`,
  shortAnswer: `max-h-[${virtualMinVhCapPx(42, 280)}px]`,
  trueFalse: `max-h-[${virtualMinVhCapPx(50, 300)}px]`,
  fillBlanks: `max-h-[${virtualMinVhCapPx(65, 480)}px]`,
  livePoll: `max-h-[${virtualMinVhCapPx(42, 400)}px]`,
  dragDrop: `max-h-[${virtualMinVhCapPx(60, 400)}px]`,
  videoInteractive: `max-h-[${virtualMinVhCapPx(60, 500)}px]`,
  quizMultiple: `max-h-[${virtualMinVhCapPx(70, 520)}px]`,
  wordCloud: `max-h-[${virtualMinVhCapPx(52, 360)}px]`,
} as const;

/** Panel flotante historia ramificada (antes `80vh`). */
export const HISTORIA_RAMIFICADA_PANEL_MAX_H_CLASS = `max-h-[${virtualPxFromVh(80)}px]`;
