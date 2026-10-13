import type { Animacion } from '@lumina/types/animation';
import type { TabsFicha, TabsTransicion, TabsVariante, TabsWidget } from '@lumina/types/widget';
import type { EntradaVariante } from '../../_efectos/motion/motion-presets.js';

/**
 * Opciones de T12 (variantes, transición, icono e insignia por ficha): viven en `TabsWidget` de
 * `@lumina/types`; estos alias conservan los nombres que ya usaba el kit.
 */
export type { TabsFicha, TabsTransicion, TabsVariante };
export type TabsOpcionesT12 = Pick<TabsWidget['configuracion'], 'variante' | 'transicion'>;
export type TabsFichaT12 = Pick<TabsFicha, 'icono' | 'insignia'>;
export type TabsConfigT12 = TabsWidget['configuracion'];
export type TabsWidgetT12 = TabsWidget & { animaciones?: Animacion[] };

export const TABS_VARIANTES: { id: TabsVariante; label: string }[] = [
  { id: 'underline', label: 'Subrayado' },
  { id: 'pills', label: 'Píldoras' },
  { id: 'enclosed', label: 'Pestañas' },
  { id: 'segmented', label: 'Segmentado' },
  { id: 'vertical', label: 'Lateral' },
];

export const TABS_TRANSICIONES: { id: TabsTransicion; label: string }[] = [
  { id: 'ninguna', label: 'Ninguna' },
  { id: 'fundido', label: 'Fundido' },
  { id: 'deslizar', label: 'Deslizar' },
];

const VARIANTES = new Set<TabsVariante>(['underline', 'pills', 'enclosed', 'segmented', 'vertical']);
const TRANSICIONES = new Set<TabsTransicion>(['ninguna', 'fundido', 'deslizar']);

export function leerOpcionesT12(configuracion: unknown): Required<TabsOpcionesT12> {
  const c = (configuracion ?? {}) as TabsOpcionesT12;
  return {
    variante: VARIANTES.has(c.variante as TabsVariante) ? (c.variante as TabsVariante) : 'underline',
    transicion: TRANSICIONES.has(c.transicion as TabsTransicion)
      ? (c.transicion as TabsTransicion)
      : 'ninguna',
  };
}

/** Entrada de `WidgetMotion` para cada transición (`null` = sin movimiento). */
export function entradaDeTransicion(t: TabsTransicion): EntradaVariante | null {
  if (t === 'fundido') return 'fade';
  if (t === 'deslizar') return 'slide-left';
  return null;
}

export const TABS_INSIGNIA_MAX = 12;

export function leerFichaT12(ficha: unknown): { icono: string | null; insignia: string } {
  const f = (ficha ?? {}) as TabsFichaT12;
  return {
    icono: typeof f.icono === 'string' && f.icono ? f.icono : null,
    insignia: typeof f.insignia === 'string' ? f.insignia.trim().slice(0, TABS_INSIGNIA_MAX) : '',
  };
}
