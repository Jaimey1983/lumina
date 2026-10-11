import type { Animacion } from '@lumina/types/animation';
import type { FlipCardsWidget } from '@lumina/types/slide';

/**
 * Opciones de T11 que aún no están en `FlipCardsWidget['configuracion']` de `@lumina/types`
 * (fuera del alcance de esa ficha). Viven dentro de `configuracion` (así las plantillas, que
 * mezclan sobre la config existente, no las pisan) y se leen con `leerOpcionesT11`.
 * Subirlas a `@lumina/types` queda como seguimiento (igual que T6–T10).
 */
export type FlipCardsGiro = 'y' | 'x' | 'deslizar' | 'fundido';
export type FlipCardsModo = 'cuadricula' | 'mazo';

export interface FlipCardsOpcionesT11 {
  /** Cómo se da vuelta una tarjeta. Por defecto `y` (el giro de siempre). */
  giro?: FlipCardsGiro;
  /** Perspectiva más marcada y sombra de elevación (solo tiene efecto visible en los giros 3D). */
  profundidad?: boolean;
  /** Las tarjetas entran una tras otra al mostrarse (apagado por defecto). */
  entradaEscalonada?: boolean;
  /** `mazo`: una tarjeta a la vez, con deslizamiento lateral. */
  modo?: FlipCardsModo;
}

export type FlipCardsConfigT11 = FlipCardsWidget['configuracion'] & FlipCardsOpcionesT11;
export type FlipCardsWidgetT11 = Omit<FlipCardsWidget, 'configuracion'> & {
  configuracion: FlipCardsConfigT11;
  animaciones?: Animacion[];
};

export const FLIP_CARDS_GIROS: { id: FlipCardsGiro; label: string }[] = [
  { id: 'y', label: 'Giro horizontal' },
  { id: 'x', label: 'Giro vertical' },
  { id: 'deslizar', label: 'Deslizar' },
  { id: 'fundido', label: 'Fundido' },
];

const GIROS = new Set<FlipCardsGiro>(['y', 'x', 'deslizar', 'fundido']);
const MODOS = new Set<FlipCardsModo>(['cuadricula', 'mazo']);

export function leerOpcionesT11(configuracion: unknown): Required<FlipCardsOpcionesT11> {
  const c = (configuracion ?? {}) as FlipCardsOpcionesT11;
  return {
    giro: GIROS.has(c.giro as FlipCardsGiro) ? (c.giro as FlipCardsGiro) : 'y',
    profundidad: c.profundidad === true,
    entradaEscalonada: c.entradaEscalonada === true,
    modo: MODOS.has(c.modo as FlipCardsModo) ? (c.modo as FlipCardsModo) : 'cuadricula',
  };
}

/** Umbral del deslizamiento del mazo (px) y del movimiento que ya no cuenta como clic. */
export const MAZO_UMBRAL_SWIPE = 40;
export const MAZO_UMBRAL_CLIC = 8;

/** Ids de los presets de T11 (los de la definición); el resto son las 8 plantillas de color. */
export const FLIP_CARDS_ESTILOS_T11_IDS: ReadonlySet<string> = new Set([
  'giro-vertical',
  'deslizar',
  'fundido',
  'mazo',
  'entrada-escalonada',
]);
