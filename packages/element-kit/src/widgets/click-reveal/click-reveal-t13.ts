import type { Animacion } from '@lumina/types/animation';
import type { ClickRevealConfiguracion, ClickRevealDisparo, ClickRevealWidget } from '@lumina/types/widget';

/**
 * Opciones de T13 (disparo en sitio, contador, bloqueo): viven en `ClickRevealConfiguracion` de
 * `@lumina/types`; estos alias conservan los nombres que ya usaba el kit.
 */
export type { ClickRevealDisparo };
export type ClickRevealOpcionesT13 = Pick<
  ClickRevealConfiguracion,
  'disparo' | 'mostrarContador' | 'bloquearHastaRevelar'
>;
export type ClickRevealConfigT13 = ClickRevealConfiguracion;
export type ClickRevealWidgetT13 = ClickRevealWidget & { animaciones?: Animacion[] };

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
