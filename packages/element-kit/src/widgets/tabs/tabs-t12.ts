import type { Animacion } from '@lumina/types/animation';
import type { TabsWidget, WidgetSlideContent } from '@lumina/types/widget';
import type { EntradaVariante } from '../_motion/motion-presets.js';

/**
 * Opciones de T12 que aún no están en `TabsWidget` de `@lumina/types` (fuera del alcance de esa
 * ficha). Las globales viven dentro de `configuracion`; el icono y la insignia, en cada ficha.
 * Subirlas a `@lumina/types` queda como seguimiento (igual que T6–T11).
 */
export type TabsVariante = 'underline' | 'pills' | 'enclosed' | 'segmented' | 'vertical';
export type TabsTransicion = 'ninguna' | 'fundido' | 'deslizar';

export interface TabsOpcionesT12 {
  /** Estilo de la barra de pestañas. Por defecto `underline` (el de siempre). */
  variante?: TabsVariante;
  /** Cómo entra el panel al cambiar de pestaña. Por defecto `ninguna`. */
  transicion?: TabsTransicion;
}

export interface TabsFichaT12 {
  /** Id de un icono de `TABS_ICONOS`. */
  icono?: string;
  /** Texto corto junto a la etiqueta (p. ej. «Nuevo», «3»). */
  insignia?: string;
}

export type TabsFicha = WidgetSlideContent & TabsFichaT12;
export type TabsConfigT12 = TabsWidget['configuracion'] & TabsOpcionesT12;
export type TabsWidgetT12 = Omit<TabsWidget, 'configuracion' | 'fichas'> & {
  configuracion: TabsConfigT12;
  fichas: TabsFicha[];
  animaciones?: Animacion[];
};

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
