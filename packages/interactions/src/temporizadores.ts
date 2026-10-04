import type { EstadoMotor, ReglaAplicable } from './tipos.js';
import { esSegundosValidos } from './eventos.js';
import { marcaDeTemporizador } from './estado.js';

/**
 * Segundos de los temporizadores de un slide que todavía NO dispararon en este
 * intento (N5). Ordenados y sin repetir. Pura: el runtime programa un reloj por
 * cada valor y emite `temporizador` con `detalle.segundos`. Al emitirlo, el
 * motor deja una marca en `visibles` (se persiste con K5), así que tras una
 * recarga solo se vuelven a programar los pendientes y ninguno dispara dos
 * veces en el mismo intento.
 */
export function temporizadoresPendientes(
  reglas: readonly ReglaAplicable[],
  estado: EstadoMotor,
  slideId: string,
): number[] {
  const out = new Set<number>();
  for (const { regla, origen } of reglas) {
    if (!regla.activa || regla.evento !== 'temporizador') continue;
    if (origen.slideId !== slideId) continue;
    const seg = regla.parametro;
    if (!esSegundosValidos(seg)) continue;
    if (estado.visibles[marcaDeTemporizador(slideId, seg)] === true) continue;
    out.add(seg);
  }
  return [...out].sort((a, b) => a - b);
}

/** ¿Alguna regla activa escucha este evento (opcionalmente con este parámetro)? */
export function hayReglaDeEvento(
  reglas: readonly ReglaAplicable[],
  evento: ReglaAplicable['regla']['evento'],
  parametro?: string | number,
): boolean {
  return reglas.some(
    ({ regla }) =>
      regla.activa && regla.evento === evento && (parametro === undefined || regla.parametro === parametro),
  );
}
