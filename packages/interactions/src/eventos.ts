import type { EventoTipo, Regla } from '@lumina/types/interaction';

/**
 * Eventos de la Etapa N / N5 que NO emite un elemento concreto sino el motor o
 * el reproductor, así que cualquier elemento dueño de reglas puede usarlos.
 */
export const EVENTOS_DE_ENTORNO: readonly EventoTipo[] = Object.freeze([
  'cambio_variable',
  'tecla',
  'temporizador',
  'salir_slide',
]);

/**
 * Eventos que ocurren «en el slide» (no en un bloque): una regla de bloque o de
 * slide reacciona cuando el evento ocurre en SU slide.
 */
export const EVENTOS_DE_SLIDE: ReadonlySet<EventoTipo> = new Set<EventoTipo>([
  'tecla',
  'temporizador',
  'salir_slide',
]);

export const TEMPORIZADOR_MIN_S = 1;
export const TEMPORIZADOR_MAX_S = 600;

/**
 * Teclas admitidas (`KeyboardEvent.code`). Lista CERRADA a propósito (D5):
 * `Tab` y `Escape` quedan fuera (navegación por teclado y cierre de capas) y
 * las combinaciones con Ctrl/Alt/Meta nunca disparan.
 */
export const TECLAS_PERMITIDAS: Readonly<Record<string, string>> = Object.freeze({
  Enter: 'Intro',
  Space: 'Espacio',
  ArrowLeft: 'Flecha izquierda',
  ArrowRight: 'Flecha derecha',
  ArrowUp: 'Flecha arriba',
  ArrowDown: 'Flecha abajo',
  ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`Digit${i}`, String(i)])),
  ...Object.fromEntries(
    Array.from({ length: 26 }, (_, i) => {
      const letra = String.fromCharCode(65 + i);
      return [`Key${letra}`, letra];
    }),
  ),
});

export function esTeclaPermitida(codigo: unknown): codigo is string {
  return typeof codigo === 'string' && Object.hasOwn(TECLAS_PERMITIDAS, codigo);
}

export function etiquetaTecla(codigo: string): string {
  return Object.hasOwn(TECLAS_PERMITIDAS, codigo) ? (TECLAS_PERMITIDAS[codigo] as string) : codigo;
}

export function esSegundosValidos(v: unknown): v is number {
  return (
    typeof v === 'number' &&
    Number.isInteger(v) &&
    v >= TEMPORIZADOR_MIN_S &&
    v <= TEMPORIZADOR_MAX_S
  );
}

/** ¿Este evento necesita `Regla.parametro`? */
export function eventoUsaParametro(e: EventoTipo): boolean {
  return e === 'cambio_variable' || e === 'tecla' || e === 'temporizador';
}

/**
 * Mensaje de error del parámetro, o `undefined` si es válido o el evento no lo
 * usa. `variableIds` permite comprobar que la variable observada existe.
 */
export function errorDeParametro(
  regla: Pick<Regla, 'evento' | 'parametro'>,
  variableIds?: ReadonlySet<string>,
): string | undefined {
  const p = regla.parametro;
  switch (regla.evento) {
    case 'cambio_variable':
      if (typeof p !== 'string' || p === '') return 'Elige la variable que se observa.';
      if (variableIds && !variableIds.has(p)) return 'La variable ya no existe.';
      return undefined;
    case 'tecla':
      return esTeclaPermitida(p) ? undefined : 'Elige una tecla de la lista.';
    case 'temporizador':
      return esSegundosValidos(p)
        ? undefined
        : `Indica un número entero de segundos entre ${TEMPORIZADOR_MIN_S} y ${TEMPORIZADOR_MAX_S}.`;
    default:
      return undefined;
  }
}
