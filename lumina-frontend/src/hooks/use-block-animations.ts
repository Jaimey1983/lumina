'use client';

import { useEffect, useRef } from 'react';
import type { Animacion } from '@/types/animation.types';

/**
 * Aplica las animaciones CSS configuradas al elemento referenciado.
 *
 * - Animaciones `trigger: 'auto'` → se disparan cuando `isActive` pasa a true
 * - Animaciones `trigger: 'click'` → se disparan al click en el elemento
 * - Animaciones `trigger: 'hover'` → se disparan al mouseenter en el elemento
 *
 * Múltiples animaciones se encadenan en secuencia:
 * cada animación espera delay_configurado + sum(duracion de animaciones anteriores del mismo trigger).
 */
export function useBlockAnimations(
  ref: React.RefObject<HTMLElement | null>,
  animaciones: Animacion[] | undefined,
  isActive: boolean,
) {
  // Refs para cleanup de event listeners
  const clickCleanupRef = useRef<(() => void) | null>(null);
  const hoverCleanupRef = useRef<(() => void) | null>(null);

  // ── Auto animations (disparan al activarse el slide) ──────────────────────
  useEffect(() => {
    const el = ref.current;
    if (!el || !animaciones || animaciones.length === 0) return;
    if (!isActive) return;

    const autoAnims = animaciones.filter((a) => a.trigger === 'auto');
    if (autoAnims.length === 0) return;

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    // Calcular offset acumulado por momento para encadenar en secuencia
    const offsetByMomento: Record<string, number> = {};

    autoAnims.forEach((anim) => {
      const base = offsetByMomento[anim.momento] ?? 0;
      const absoluteDelay = base + anim.delay;

      const t = setTimeout(() => {
        playAnimation(el, anim);
      }, absoluteDelay);

      timeouts.push(t);
      offsetByMomento[anim.momento] = base + anim.delay + anim.duracion;
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [ref, animaciones, isActive]);

  // ── Click animations ───────────────────────────────────────────────────────
  useEffect(() => {
    const el = ref.current;
    if (!el || !animaciones || animaciones.length === 0) return;

    const clickAnims = animaciones.filter((a) => a.trigger === 'click');
    if (clickAnims.length === 0) return;

    const handler = () => {
      const offsetByMomento: Record<string, number> = {};
      clickAnims.forEach((anim) => {
        const base = offsetByMomento[anim.momento] ?? 0;
        const absoluteDelay = base + anim.delay;
        setTimeout(() => playAnimation(el, anim), absoluteDelay);
        offsetByMomento[anim.momento] = base + anim.delay + anim.duracion;
      });
    };

    el.addEventListener('click', handler);
    clickCleanupRef.current = () => el.removeEventListener('click', handler);

    return () => {
      el.removeEventListener('click', handler);
      clickCleanupRef.current = null;
    };
  }, [ref, animaciones]);

  // ── Hover animations ───────────────────────────────────────────────────────
  useEffect(() => {
    const el = ref.current;
    if (!el || !animaciones || animaciones.length === 0) return;

    const hoverAnims = animaciones.filter((a) => a.trigger === 'hover');
    if (hoverAnims.length === 0) return;

    const handler = () => {
      const offsetByMomento: Record<string, number> = {};
      hoverAnims.forEach((anim) => {
        const base = offsetByMomento[anim.momento] ?? 0;
        const absoluteDelay = base + anim.delay;
        setTimeout(() => playAnimation(el, anim), absoluteDelay);
        offsetByMomento[anim.momento] = base + anim.delay + anim.duracion;
      });
    };

    el.addEventListener('mouseenter', handler);
    hoverCleanupRef.current = () => el.removeEventListener('mouseenter', handler);

    return () => {
      el.removeEventListener('mouseenter', handler);
      hoverCleanupRef.current = null;
    };
  }, [ref, animaciones]);
}

// ─── Internal helper ──────────────────────────────────────────────────────────

function playAnimation(el: HTMLElement, anim: Animacion) {
  // Nombre de la clase corresponde al keyframe en lumina-animations.css
  const className = `lumina-anim-${anim.tipo}`;

  // Limpiar animación previa del mismo tipo si existe
  el.classList.remove(className);
  // Forzar reflow para reiniciar la animación
  void el.offsetWidth;

  // Aplicar propiedades inline de animación
  el.style.animationName = `lumina-${anim.tipo}`;
  el.style.animationDuration = `${anim.duracion}ms`;
  el.style.animationDelay = '0ms'; // ya aplicamos el delay via setTimeout
  el.style.animationTimingFunction = anim.easing;
  el.style.animationFillMode = 'both';
  el.style.animationIterationCount =
    anim.iteraciones === -1 ? 'infinite' : String(anim.iteraciones);

  el.classList.add(className);

  // Limpiar estilos inline al terminar (excepto énfasis infinito)
  if (anim.iteraciones !== -1) {
    const totalDuration = anim.duracion * anim.iteraciones;
    setTimeout(() => {
      el.classList.remove(className);
      el.style.animationName = '';
      el.style.animationDuration = '';
      el.style.animationTimingFunction = '';
      el.style.animationFillMode = '';
      el.style.animationIterationCount = '';
    }, totalDuration + 50);
  }
}
