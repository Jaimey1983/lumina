import type { Animacion } from '@lumina/types/animation';
import type { ClickRevealWidget } from '@lumina/types/widget';

/**
 * Opciones de T13 que aún no están en `ClickRevealConfiguracion` de `@lumina/types` (fuera del
 * alcance de esa ficha). Viven dentro de `configuracion` y se leen con `leerOpcionesT13`.
 * Subirlas a `@lumina/types` queda como seguimiento (igual que T6–T12).
 */
export type ClickRevealDisparo = 'modal' | 'flip' | 'spotlight' | 'blur';

export interface ClickRevealOpcionesT13 {
  /**
   * Qué pasa al tocar una tarjeta. `modal` (por defecto) abre la ventana de siempre; el resto
   * revela el contenido en la propia tarjeta (sin modal).
   */
  disparo?: ClickRevealDisparo;
  /** Muestra «X de Y revelados» y marca las tarjetas ya reveladas. */
  mostrarContador?: boolean;
  /** Avisa de que falta revelar todo; con runtime, `visitado` solo sale al completar. */
  bloquearHastaRevelar?: boolean;
}

export type ClickRevealConfigT13 = ClickRevealWidget['configuracion'] & ClickRevealOpcionesT13;
export type ClickRevealWidgetT13 = Omit<ClickRevealWidget, 'configuracion'> & {
  configuracion: ClickRevealConfigT13;
  animaciones?: Animacion[];
};

export const CLICK_REVEAL_DISPAROS: { id: ClickRevealDisparo; label: string; ayuda: string }[] = [
  { id: 'modal', label: 'Ventana', ayuda: 'Abre el contenido en una ventana (el de siempre).' },
  { id: 'flip', label: 'Voltear', ayuda: 'La tarjeta se da vuelta y muestra el contenido.' },
  { id: 'spotlight', label: 'Foco', ayuda: 'Resalta la tarjeta y atenúa las demás.' },
  { id: 'blur', label: 'Difuminado', ayuda: 'El texto aparece difuminado y se aclara al tocar.' },
];

const DISPAROS = new Set<ClickRevealDisparo>(['modal', 'flip', 'spotlight', 'blur']);

export function leerOpcionesT13(configuracion: unknown): Required<ClickRevealOpcionesT13> {
  const c = (configuracion ?? {}) as ClickRevealOpcionesT13;
  return {
    disparo: DISPAROS.has(c.disparo as ClickRevealDisparo) ? (c.disparo as ClickRevealDisparo) : 'modal',
    mostrarContador: c.mostrarContador === true,
    bloquearHastaRevelar: c.bloquearHastaRevelar === true,
  };
}

/** Texto del contador de progreso. */
export function textoProgreso(reveladas: number, total: number): string {
  return `${reveladas} de ${total} revelados`;
}
