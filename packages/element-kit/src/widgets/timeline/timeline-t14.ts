import { useEffect, useRef, useState, type RefObject } from 'react';
import type { Animacion } from '@lumina/types/animation';
import type {
  TimelineAnimacion,
  TimelineConfiguracion,
  TimelineDensidad,
  TimelineOrientacion,
  TimelineWidget,
} from '@lumina/types/widget';
import type { EntradaVariante } from '../../_efectos/motion/motion-presets.js';

/**
 * Opciones de T14 (orientación, densidad, animación de entrada): viven en `TimelineConfiguracion`
 * de `@lumina/types`; estos alias conservan los nombres que ya usaba el kit.
 */
export type { TimelineAnimacion, TimelineDensidad, TimelineOrientacion };
export type TimelineOpcionesT14 = Pick<TimelineConfiguracion, 'orientacion' | 'densidad' | 'animacion'>;
export type TimelineConfigT14 = TimelineConfiguracion;
export type TimelineWidgetT14 = TimelineWidget & { animaciones?: Animacion[] };

export const TIMELINE_ORIENTACIONES: { id: TimelineOrientacion; label: string }[] = [
  { id: 'horizontal', label: 'Horizontal' },
  { id: 'vertical', label: 'Vertical' },
];
export const TIMELINE_DENSIDADES: { id: TimelineDensidad; label: string }[] = [
  { id: 'compacta', label: 'Compacta' },
  { id: 'normal', label: 'Normal' },
  { id: 'amplia', label: 'Amplia' },
];
export const TIMELINE_ANIMACIONES: { id: TimelineAnimacion; label: string }[] = [
  { id: 'ninguna', label: 'Ninguna' },
  { id: 'fundido', label: 'Fundido' },
  { id: 'subir', label: 'Subir' },
  { id: 'escala', label: 'Escala' },
];

const ORIENTACIONES = new Set<TimelineOrientacion>(['horizontal', 'vertical']);
const DENSIDADES = new Set<TimelineDensidad>(['normal', 'compacta', 'amplia']);
const ANIMACIONES = new Set<TimelineAnimacion>(['ninguna', 'fundido', 'subir', 'escala']);

export function leerOpcionesT14(configuracion: unknown): Required<TimelineOpcionesT14> {
  const c = (configuracion ?? {}) as TimelineOpcionesT14;
  return {
    orientacion: ORIENTACIONES.has(c.orientacion as TimelineOrientacion)
      ? (c.orientacion as TimelineOrientacion)
      : 'horizontal',
    densidad: DENSIDADES.has(c.densidad as TimelineDensidad) ? (c.densidad as TimelineDensidad) : 'normal',
    animacion: ANIMACIONES.has(c.animacion as TimelineAnimacion)
      ? (c.animacion as TimelineAnimacion)
      : 'ninguna',
  };
}

export function entradaDeAnimacion(a: TimelineAnimacion): EntradaVariante | null {
  if (a === 'fundido') return 'fade';
  if (a === 'subir') return 'slide-up';
  if (a === 'escala') return 'scale';
  return null;
}

/**
 * `true` cuando el elemento entra en el área visible (una sola vez). Sin `IntersectionObserver`
 * (servidor, jsdom) se considera visible de inmediato: nunca deja el contenido oculto.
 */
export function useEnVista<T extends Element>(activo: boolean): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(
    () => !activo || typeof IntersectionObserver === 'undefined',
  );
  useEffect(() => {
    if (visible || !activo) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [activo, visible]);
  return [ref, visible || !activo];
}

/** Ids de los presets de T14 (los de la definición); los otros 8 son las variantes de siempre. */
export const TIMELINE_ESTILOS_T14_IDS: ReadonlySet<string> = new Set([
  'eje-vertical',
  'compacta',
  'amplia',
  'entrada-animada',
]);
