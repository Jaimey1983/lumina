/**
 * Reglas puras de juego de Escape Room (Fase 5, capa 1).
 *
 * Fuente de verdad compartida por el reproductor del estudiante
 * (`escape-room-viewer.tsx`) y el motor en vivo del backend.
 *
 * Espejo: `lumina-backend/src/escape-room/escape-room-logic.ts`.
 * NO reinterpretar ni "mejorar" al portar. Si hace falta un cambio, se cambia
 * primero aquí y se re-porta.
 *
 * TODO(workspace): extraer a un paquete compartido para eliminar este espejo.
 */

/** Subconjunto de `EscapeRoomSala` que la lógica de juego necesita. */
export interface EscapeRoomSalaLogic {
  respuestaCorrecta: string;
  ignorarMayusculas: boolean;
  intentosMaximos?: number;
  /** Formato canónico (capa 3). */
  pistas?: string[];
  /** Formato legado: una sola pista por sala. */
  pista?: string;
}

export const ESCAPE_ROOM_PUNTOS_BASE_DEFAULT = 300;
export const ESCAPE_ROOM_INTENTOS_DEFAULT = 3;
/** Valor de `intentosMaximos` que significa "sin límite". */
export const ESCAPE_ROOM_INTENTOS_ILIMITADOS = -1;

export function esCorrecta(
  sala: EscapeRoomSalaLogic,
  respuesta: string,
): boolean {
  const r = respuesta.trim();
  const c = sala.respuestaCorrecta.trim();
  if (!r) return false;
  return sala.ignorarMayusculas ? r.toLowerCase() === c.toLowerCase() : r === c;
}

export function calcularPuntos(intento: number, puntosBase: number): number {
  if (intento <= 1) return puntosBase;
  if (intento === 2) return Math.round(puntosBase * (150 / 300));
  return Math.round(puntosBase * (50 / 300));
}

/** `Infinity` si la sala es de intentos ilimitados. */
export function intentosMaximosDeSala(sala: EscapeRoomSalaLogic): number {
  const raw = sala.intentosMaximos;
  if (raw === ESCAPE_ROOM_INTENTOS_ILIMITADOS) return Infinity;
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 1) {
    return ESCAPE_ROOM_INTENTOS_DEFAULT;
  }
  return Math.floor(raw);
}

/** Lee `pistas` y acepta el formato legado `pista: string`. */
export function pistasDeSala(sala: EscapeRoomSalaLogic): string[] {
  if (Array.isArray(sala.pistas)) {
    return sala.pistas.map((p) => String(p ?? '')).filter((p) => p.trim().length > 0);
  }
  const legado = typeof sala.pista === 'string' ? sala.pista.trim() : '';
  return legado ? [legado] : [];
}

/** Índice de la última pista revelable tras `intentos` fallos (−1 = ninguna). */
export function pistasReveladasPorIntentos(
  sala: EscapeRoomSalaLogic,
  intentos: number,
): number {
  const total = pistasDeSala(sala).length;
  if (total === 0 || intentos < 1) return 0;
  return Math.min(intentos, total);
}
