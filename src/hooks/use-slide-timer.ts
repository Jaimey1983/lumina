'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface SlideTimerOptions {
  /** Segundos; 0 = desactivado */
  duration: number;
  /** Solo cuenta cuando la sesión en vivo (u otro modo) está activo */
  isActive: boolean;
  /** Se invoca una vez al llegar a 0 */
  onExpire: () => void;
  /**
   * Opcional: al cambiar (p. ej. otro `slideId` con la misma duración) se reinicia la cuenta.
   */
  resetKey?: string | number | null;
}

export interface SlideTimerResult {
  timeLeft: number;
  isExpired: boolean;
  reset: () => void;
}

/**
 * Cuenta atrás con intervalo de 1 s. Reinicia al cambiar `duration` o al llamar `reset()`.
 */
export function useSlideTimer({
  duration,
  isActive,
  onExpire,
  resetKey = null,
}: SlideTimerOptions): SlideTimerResult {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [resetNonce, setResetNonce] = useState(0);
  const onExpireRef = useRef(onExpire);
  const expiredFiredRef = useRef(false);

  onExpireRef.current = onExpire;

  const reset = useCallback(() => {
    expiredFiredRef.current = false;
    setIsExpired(false);
    setTimeLeft(duration > 0 ? duration : 0);
    setResetNonce((n) => n + 1);
  }, [duration]);

  useEffect(() => {
    expiredFiredRef.current = false;
    setIsExpired(false);
    setTimeLeft(duration > 0 ? duration : 0);
  }, [duration, resetNonce, isActive, resetKey]);

  useEffect(() => {
    if (!isActive || duration <= 0) {
      return;
    }

    const id = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [isActive, duration, resetNonce, resetKey]);

  useEffect(() => {
    if (!isActive || duration <= 0) return;
    if (timeLeft !== 0) return;
    if (expiredFiredRef.current) return;
    expiredFiredRef.current = true;
    setIsExpired(true);
    onExpireRef.current();
  }, [timeLeft, isActive, duration, resetKey]);

  return { timeLeft, isExpired, reset };
}
