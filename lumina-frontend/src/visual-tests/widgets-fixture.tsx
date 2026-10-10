/**
 * T0 — fixtures de la línea base visual de widgets.
 *
 * Cada widget se monta por su `ElementDefinition` real (registry) con el estado
 * de `crearPorDefecto()` y, para los que declaran `presets`, con cada preset
 * aplicado encima. Sirve de red de seguridad (Regla 7) de la etapa T: un cambio
 * que altere el aspecto por defecto o de un preset lo delata un diff de imagen.
 */
import type { ReactNode } from 'react';

import { elementRegistry } from '@/lib/element-registry-bootstrap';

export const WIDGET_VISUAL_WIDTH = 360;
export const WIDGET_VISUAL_HEIGHT = 240;

/** Widgets de `packages/element-kit/src/widgets/` (14), por `tipo` del registry. */
export const WIDGET_TIPOS = [
  'boton',
  'progreso',
  'contador',
  'ruleta',
  'flip-cards',
  'tabs',
  'carousel',
  'click-reveal',
  'timeline',
  'hotspot',
  'tooltip',
  'popup',
  'molecula',
  'tabla_periodica',
] as const;

export type WidgetTipo = (typeof WIDGET_TIPOS)[number];

interface PresetLike {
  readonly id: string;
  readonly estadoPatch?: unknown;
}

/** Parche de estado del preset (`estadoPatch`, T2). Se aplica con un spread superficial, como línea base. */
export function parcheDe(preset: PresetLike): Record<string, unknown> {
  const parche = preset.estadoPatch;
  return typeof parche === 'object' && parche !== null
    ? (parche as Record<string, unknown>)
    : {};
}

export function presetsDe(tipo: WidgetTipo): readonly PresetLike[] {
  const def = elementRegistry.obtener(tipo);
  if (!def) throw new Error(`El registry no tiene el widget "${tipo}"`);
  return (def.presets ?? []) as readonly PresetLike[];
}

/** Estado por defecto del widget, con el preset (si hay) aplicado encima. */
export function estadoDe(tipo: WidgetTipo, presetId?: string): unknown {
  const def = elementRegistry.obtener(tipo);
  if (!def) throw new Error(`El registry no tiene el widget "${tipo}"`);
  const base = def.crearPorDefecto() as Record<string, unknown>;
  if (!presetId) return base;
  const preset = presetsDe(tipo).find((p) => p.id === presetId);
  if (!preset) throw new Error(`"${tipo}" no tiene el preset "${presetId}"`);
  return { ...base, ...parcheDe(preset) };
}

/**
 * Sin animaciones ni transiciones, para que la captura no dependa del instante
 * en que se toma. Un widget con movimiento propio (ruleta, contador) se captura
 * en su estado inicial.
 */
const SIN_MOVIMIENTO = `
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
    caret-color: transparent !important;
  }
`;

export function WidgetVisualHost({ children }: { children: ReactNode }) {
  return (
    <div
      data-testid="widget-visual-host"
      style={{
        position: 'relative',
        width: WIDGET_VISUAL_WIDTH,
        height: WIDGET_VISUAL_HEIGHT,
        overflow: 'hidden',
        background: '#ffffff',
      }}
    >
      <style>{SIN_MOVIMIENTO}</style>
      {children}
    </div>
  );
}
