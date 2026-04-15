import { getSlideContentRecord } from '@/lib/class-slide-normalize';
import type { Slide as ApiSlide } from '@/hooks/api/use-class';

/** Opciones del temporizador global y por slide (segundos). 0 = desactivado. */
export const SLIDE_TIMER_GLOBAL_OPTIONS = [
  { value: 0, label: 'Desactivado' },
  { value: 15, label: '15 s' },
  { value: 30, label: '30 s' },
  { value: 45, label: '45 s' },
  { value: 60, label: '60 s' },
  { value: 90, label: '90 s' },
  { value: 120, label: '120 s' },
] as const;

/** `inherit` = hereda el temporizador global de la clase. */
export const SLIDE_TIMER_PER_SLIDE_OPTIONS = [
  { value: 'inherit', label: 'Usar tiempo global' },
  ...SLIDE_TIMER_GLOBAL_OPTIONS.filter((o) => o.value > 0).map((o) => ({
    value: String(o.value),
    label: o.label,
  })),
  { value: '0', label: 'Sin temporizador (este slide)' },
] as const;

/**
 * Duración efectiva en segundos para un slide en vivo.
 * - Sin `timer` en contenido → usa `timerGlobal` (>0).
 * - `timer` explícito 0 → sin temporizador en este slide.
 * - `timer` > 0 → ese valor.
 */
export function getEffectiveSlideTimerSeconds(
  content: Record<string, unknown>,
  timerGlobal?: number | null,
): number {
  const g =
    typeof timerGlobal === 'number' &&
    Number.isFinite(timerGlobal) &&
    timerGlobal > 0
      ? Math.floor(timerGlobal)
      : 0;
  const raw = content.timer;
  if (raw === undefined || raw === null || raw === '') {
    return g;
  }
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}

export function getEffectiveTimerForApiSlide(
  slide: ApiSlide | null,
  timerGlobal?: number | null,
): number {
  if (!slide) return 0;
  const c = getSlideContentRecord(slide);
  return getEffectiveSlideTimerSeconds(c, timerGlobal);
}
