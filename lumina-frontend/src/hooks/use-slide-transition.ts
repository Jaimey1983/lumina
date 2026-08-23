'use client';

import { useState, useCallback, useRef } from 'react';
import type { TransicionSlide } from '@/types/animation.types';

export type TransitionPhase = 'idle' | 'exiting' | 'entering';

interface UseSlideTransitionOptions {
  defaultDuration?: number;
}

export function useSlideTransition(options: UseSlideTransitionOptions = {}) {
  const { defaultDuration = 500 } = options;
  const [phase, setPhase] = useState<TransitionPhase>('idle');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runTransition = useCallback(
    (transicion: TransicionSlide | undefined | null, onSwap: () => void) => {
      if (!transicion || transicion.tipo === 'none') {
        onSwap();
        return;
      }

      const duration = transicion.duracion ?? defaultDuration;

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      setPhase('exiting');
      timeoutRef.current = setTimeout(() => {
        onSwap();
        setPhase('entering');
        timeoutRef.current = setTimeout(() => {
          setPhase('idle');
        }, duration);
      }, duration);
    },
    [defaultDuration],
  );

  return { phase, runTransition };
}
