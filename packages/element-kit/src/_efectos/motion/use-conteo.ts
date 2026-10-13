'use client';

import { animate } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { CONTEO_DURACION, MOTION_EASE } from './motion-presets.js';
import { useWidgetReducedMotion } from './reduced-motion.js';

export interface UseConteoOptions {
  /** Duración del conteo, en segundos. */
  duracion?: number;
  /** Decimales del valor mostrado. */
  decimales?: number;
  /** En el primer render cuenta desde 0 hasta `valor` (por defecto muestra `valor` directo). */
  desdeCero?: boolean;
}

/**
 * Número animado: devuelve el valor a mostrar, que se acerca a `valor` con una
 * curva suave cada vez que `valor` cambia. Con «reducir movimiento» salta directo.
 */
export function useConteo(valor: number, opciones: UseConteoOptions = {}): number {
  const { duracion = CONTEO_DURACION, decimales = 0, desdeCero = false } = opciones;
  const reducido = useWidgetReducedMotion();
  const [mostrado, setMostrado] = useState(desdeCero ? 0 : valor);
  const actualRef = useRef(mostrado);

  useEffect(() => {
    if (reducido || !Number.isFinite(valor)) {
      actualRef.current = valor;
      setMostrado(valor);
      return;
    }
    const factor = 10 ** decimales;
    const control = animate(actualRef.current, valor, {
      duration: duracion,
      ease: MOTION_EASE as unknown as [number, number, number, number],
      onUpdate: (v) => {
        const redondeado = Math.round(v * factor) / factor;
        actualRef.current = redondeado;
        setMostrado(redondeado);
      },
    });
    return () => control.stop();
  }, [valor, reducido, duracion, decimales]);

  return mostrado;
}
