'use client';

/**
 * U5 — feedback de acierto, error, pista y logro de una actividad (etapa U / DU5, DU8).
 *
 * `useActivityFeedback()` es lo único que una actividad toca: `emitir('acierto')` suena
 * (con `useSound`) y dispara el movimiento y, en un logro, el confeti. El movimiento lo hace
 * `FeedbackMotion` y el confeti `ActivityFeedbackLayer`; ambos viven en `src/_efectos/` y
 * respetan «reducir movimiento» en UN solo lugar (`useWidgetReducedMotion`). Ninguna
 * actividad importa `motion` ni toca `AudioContext`.
 *
 * El sonido NO es movimiento: sigue sonando con «reducir movimiento». Hoy no hay un ajuste
 * para silenciarlo (`ActivitySettings` no tiene `sonido`); el hook acepta `sonido: false`.
 */
import { useCallback, useMemo, useState } from 'react';
import { useSound, type SoundId } from '@lumina/editor-shared/use-sound';

import { Confeti } from '../../_efectos/confeti.js';
import { useWidgetReducedMotion } from '../../_efectos/motion/reduced-motion.js';
import type { SenalFeedback } from '../../_efectos/motion/motion-presets.js';

export type { SenalFeedback } from '../../_efectos/motion/motion-presets.js';

/** Sonido de cada señal. */
export const SONIDO_POR_SENAL: Readonly<Record<SenalFeedback, SoundId>> = {
  acierto: 'correct',
  error: 'wrong',
  pista: 'reveal',
  logro: 'correct',
};

export interface UseActivityFeedbackOptions {
  /** `false` apaga el sonido. Por defecto `true`. */
  readonly sonido?: boolean;
}

/** Ajustes de UNA emisión. */
export interface EmitirOpciones {
  /** Otro sonido en lugar del de la señal; `null` = en silencio. */
  readonly sonido?: SoundId | null;
  /** `false` = sin movimiento ni confeti (solo el sonido). */
  readonly movimiento?: boolean;
}

export interface ActivityFeedback {
  /** Dispara una señal: sonido + movimiento (+ confeti si es `logro`). */
  emitir(senal: SenalFeedback, opciones?: EmitirOpciones): void;
  /** Última señal emitida y cuántas van; alimentan a `FeedbackMotion`. */
  readonly senal: SenalFeedback | null;
  readonly n: number;
  /** Contador del confeti; sube con cada `logro`. */
  readonly confeti: number;
  /** El usuario pidió reducir movimiento. */
  readonly reducido: boolean;
}

export function useActivityFeedback(opciones: UseActivityFeedbackOptions = {}): ActivityFeedback {
  const { sonido = true } = opciones;
  const { play } = useSound();
  const reducido = useWidgetReducedMotion();
  const [estado, setEstado] = useState<{ senal: SenalFeedback | null; n: number; confeti: number }>({
    senal: null,
    n: 0,
    confeti: 0,
  });

  const emitir = useCallback(
    (senal: SenalFeedback, opciones: EmitirOpciones = {}) => {
      const suena = opciones.sonido === undefined ? SONIDO_POR_SENAL[senal] : opciones.sonido;
      if (sonido && suena) play(suena);
      if (opciones.movimiento === false) return;
      setEstado((prev) => ({
        senal,
        n: prev.n + 1,
        confeti: senal === 'logro' ? prev.confeti + 1 : prev.confeti,
      }));
    },
    [play, sonido],
  );

  return useMemo(
    () => ({ emitir, senal: estado.senal, n: estado.n, confeti: estado.confeti, reducido }),
    [emitir, estado, reducido],
  );
}

/**
 * Capa del confeti de un `logro`. Va dentro de un contenedor con `position: relative`
 * (el `ActivityShell` lo es). Sin efecto con «reducir movimiento».
 */
export function ActivityFeedbackLayer({ feedback }: { readonly feedback: ActivityFeedback }) {
  return <Confeti disparo={feedback.confeti} activo={!feedback.reducido} />;
}
