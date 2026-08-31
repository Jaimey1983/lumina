/**
 * Lectura tolerante del Escape Room serializado en `Slide.content`.
 *
 * El diseño de la actividad (salas, desafíos, pistas) es contenido de autoría y
 * vive en JSON — no hay tablas de salas. El equivalente de autoría en frontend
 * es `normalizeSala` / `normalizeEscapeRoomActivity`; aquí solo se leen los
 * campos que el motor en vivo necesita para validar, con los mismos defaults.
 */

import {
  ESCAPE_ROOM_INTENTOS_DEFAULT,
  ESCAPE_ROOM_INTENTOS_ILIMITADOS,
  ESCAPE_ROOM_PUNTOS_BASE_DEFAULT,
  type EscapeRoomSalaLogic,
} from './escape-room-logic';

export interface EscapeRoomSalaServer extends EscapeRoomSalaLogic {
  id: string;
  nombre: string;
  intentosMaximos: number;
}

export interface EscapeRoomActivityServer {
  titulo: string;
  puntosBase: number;
  /** 0 = sin límite. */
  tiempoLimiteMinutos: number;
  mostrarRanking: boolean;
  salas: EscapeRoomSalaServer[];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function intentosDe(value: unknown): number {
  if (value === ESCAPE_ROOM_INTENTOS_ILIMITADOS) {
    return ESCAPE_ROOM_INTENTOS_ILIMITADOS;
  }
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < 1) return ESCAPE_ROOM_INTENTOS_DEFAULT;
  return Math.floor(n);
}

function readSala(raw: unknown, index: number): EscapeRoomSalaServer | null {
  const o = asRecord(raw);
  if (!o) return null;
  const id = str(o.id).trim();
  if (!id) return null;
  return {
    id,
    nombre: str(o.nombre) || `Sala ${index + 1}`,
    respuestaCorrecta: str(o.respuestaCorrecta),
    // `normalizeSala` usa `!== false` como default true.
    ignorarMayusculas: o.ignorarMayusculas !== false,
    intentosMaximos: intentosDe(o.intentosMaximos),
    ...(Array.isArray(o.pistas) ? { pistas: o.pistas as string[] } : {}),
    ...(typeof o.pista === 'string' ? { pista: o.pista } : {}),
  };
}

function readActivity(raw: unknown): EscapeRoomActivityServer | null {
  const o = asRecord(raw);
  if (!o || o.tipo !== 'escape_room') return null;

  const salasRaw = Array.isArray(o.salas) ? o.salas : [];
  const salas = salasRaw
    .map((s, i) => readSala(s, i))
    .filter((s): s is EscapeRoomSalaServer => s !== null);

  const puntosBaseRaw = Number(o.puntosBase);
  const tiempoRaw = Number(o.tiempoLimiteMinutos);

  return {
    titulo: str(o.titulo) || 'Escape Room',
    puntosBase:
      Number.isFinite(puntosBaseRaw) && puntosBaseRaw > 0
        ? puntosBaseRaw
        : ESCAPE_ROOM_PUNTOS_BASE_DEFAULT,
    tiempoLimiteMinutos:
      Number.isFinite(tiempoRaw) && tiempoRaw > 0 ? Math.floor(tiempoRaw) : 0,
    mostrarRanking: o.mostrarRanking !== false,
    salas,
  };
}

/**
 * Primer Escape Room encontrado en el árbol de bloques del slide.
 * Misma semántica que `findEscapeRoomSlide` en el editor dedicado del frontend.
 */
export function findEscapeRoomActivity(
  content: unknown,
): EscapeRoomActivityServer | null {
  const walk = (node: unknown): EscapeRoomActivityServer | null => {
    if (!node || typeof node !== 'object') return null;
    if (Array.isArray(node)) {
      for (const item of node) {
        const found = walk(item);
        if (found) return found;
      }
      return null;
    }
    const o = node as Record<string, unknown>;
    if (o.tipo === 'actividad') {
      const activity = readActivity(o.actividad);
      if (activity) return activity;
    }
    if ('bloques' in o) {
      const found = walk(o.bloques);
      if (found) return found;
    }
    if ('columnas' in o) {
      const found = walk(o.columnas);
      if (found) return found;
    }
    return null;
  };
  return walk(content);
}
