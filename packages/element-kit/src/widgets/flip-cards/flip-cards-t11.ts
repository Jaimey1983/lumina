import type { Animacion } from '@lumina/types/animation';
import type { FlipCardsGiro, FlipCardsModo, FlipCardsWidget } from '@lumina/types/slide';

/**
 * Opciones de T11 (giros, profundidad, entrada escalonada, mazo): viven en
 * `FlipCardsWidget['configuracion']` de `@lumina/types`; estos alias conservan los nombres que
 * ya usaba el kit. Se leen con `leerOpcionesT11`.
 */
export type { FlipCardsGiro, FlipCardsModo };
export type FlipCardsOpcionesT11 = Pick<
  FlipCardsWidget['configuracion'],
  'giro' | 'profundidad' | 'entradaEscalonada' | 'modo'
>;
export type FlipCardsConfigT11 = FlipCardsWidget['configuracion'];
export type FlipCardsWidgetT11 = FlipCardsWidget & { animaciones?: Animacion[] };

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
