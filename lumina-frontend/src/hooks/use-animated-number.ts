import { useEffect, useRef, useState } from 'react';

/**
 * Anima suavemente un número desde su valor actual hacia `target`.
 * Usa requestAnimationFrame con easing ease-out cúbico.
 *
 * @param target   Valor de destino
 * @param duration Duración de la animación en ms (default 700)
 * @returns        Valor animado redondeado al entero más cercano
 */
export function useAnimatedNumber(target: number, duration = 700): number {
  const [display, setDisplay] = useState(target);

  // Refs para no depender de closures viejas en el frame loop
  const startValueRef = useRef(target);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef(target);

  useEffect(() => {
    // Guardar el valor desde el que arrancamos esta transición
    startValueRef.current = display;
    startTimeRef.current = null;
    targetRef.current = target;

    // Cancelar animación anterior si existía
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // Si ya estamos en el target, no animar
    if (startValueRef.current === target) return;

    function frame(now: number) {
      if (startTimeRef.current === null) {
        startTimeRef.current = now;
      }

      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cúbico: f(t) = 1 - (1 - t)^3
      const ease = 1 - Math.pow(1 - progress, 3);

      const value = startValueRef.current + (targetRef.current - startValueRef.current) * ease;
      setDisplay(Math.round(value));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        setDisplay(targetRef.current);
        rafRef.current = null;
      }
    }

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return display;
}
