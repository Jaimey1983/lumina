import type { CSSProperties } from 'react';
import type { TextBlock } from '@lumina/types/slide';

export const REVEAL_STYLE_ID = 'lumina-text-reveal-styles';

/** Keyframes del revelado (inyectados una vez por `ensureRevealStyles`). */
export const REVEAL_CSS = `
@keyframes lumina-reveal-aparecer { from { opacity: 0 } to { opacity: 1 } }
@keyframes lumina-reveal-subir { from { opacity: 0; transform: translateY(0.5em) } to { opacity: 1; transform: none } }
@keyframes lumina-reveal-zoom { from { opacity: 0; transform: scale(0.85) } to { opacity: 1; transform: none } }
@media (prefers-reduced-motion: reduce) {
  [data-reveal-unit] { animation: none !important; opacity: 1 !important; transform: none !important }
}
`;

const ANIM: Record<NonNullable<TextBlock['revelado']>['efecto'], string> = {
  aparecer: 'lumina-reveal-aparecer',
  subir: 'lumina-reveal-subir',
  zoom: 'lumina-reveal-zoom',
};

export interface RevealPlan {
  unit: 'palabra' | 'linea';
  animName: string;
  /** ms entre unidades. */
  stagger: number;
  /** ms de duración de cada unidad. */
  durationMs: number;
}

/** Plan de revelado del bloque, o `null` si no tiene. */
export function textBlockRevealPlan(block: TextBlock): RevealPlan | null {
  const r = block.revelado;
  if (!r) return null;
  const stagger = r.retraso ?? (r.por === 'linea' ? 140 : 60);
  return {
    unit: r.por,
    animName: ANIM[r.efecto] ?? ANIM.aparecer,
    stagger,
    durationMs: r.por === 'linea' ? 420 : 320,
  };
}

/** Estilo de una unidad (palabra/línea) con su retraso escalonado. */
export function revealUnitCss(plan: RevealPlan, index: number): CSSProperties {
  return {
    display: plan.unit === 'linea' ? 'block' : 'inline-block',
    animationName: plan.animName,
    animationDuration: `${plan.durationMs}ms`,
    animationTimingFunction: 'ease-out',
    animationFillMode: 'both',
    animationDelay: `${index * plan.stagger}ms`,
    willChange: 'opacity, transform',
  };
}

export function ensureRevealStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(REVEAL_STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = REVEAL_STYLE_ID;
  el.textContent = REVEAL_CSS;
  document.head.appendChild(el);
}
