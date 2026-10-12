/**
 * Normalizadores de Escape Room (U11.3a, movidos desde el editor y el viewer del frontend para que el
 * viewer del kit no dependa del editor). Misma lógica que antes: hidratan una sala o una actividad
 * tolerando datos viejos (`pista` legado, salas sin id, intentos inválidos).
 */
import type { Background, Block, EscapeRoomActivity, EscapeRoomSala } from '@lumina/types/slide';
import { BLOCK_FALLBACKS } from '@lumina/types/slide';

import {
  ESCAPE_ROOM_INTENTOS_DEFAULT,
  ESCAPE_ROOM_INTENTOS_ILIMITADOS,
} from './escape-room-logic.js';

/** Id local de sala (mismo criterio que `uid` de los helpers del editor). */
function uid(): string {
  return (Date.now() + Math.floor(Math.random() * 1000)).toString();
}

/**
 * Entrada tolerante de `normalizeSala`: acepta arrays de solo lectura, porque
 * `BLOCK_FALLBACKS` está declarado `as const`.
 */
export type EscapeRoomSalaInput = Omit<
  Partial<EscapeRoomSala>,
  'opciones' | 'pistas' | 'bloques'
> & {
  opciones?: readonly string[];
  pistas?: readonly string[];
  bloques?: readonly Block[];
};

/** Entero ≥ 1 o −1 (ilimitado). Cualquier otra cosa cae al default de 3. */
export function normalizeIntentosMaximos(raw: unknown): number {
  if (raw === ESCAPE_ROOM_INTENTOS_ILIMITADOS) return ESCAPE_ROOM_INTENTOS_ILIMITADOS;
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n) || n < 1) return ESCAPE_ROOM_INTENTOS_DEFAULT;
  return Math.floor(n);
}

/**
 * Lee `pistas` y migra el legado `pista: string`.
 *
 * Conserva las entradas vacías del array: el editor necesita poder renderizar un
 * campo recién añadido y todavía sin texto (mismo criterio que `opciones`).
 * Quien lee las pistas descarta los blancos vía `pistasDeSala`.
 */
function normalizePistas(raw: EscapeRoomSalaInput | undefined): string[] {
  if (Array.isArray(raw?.pistas)) {
    return raw.pistas.map((p) => String(p ?? ''));
  }
  const legado = typeof raw?.pista === 'string' ? raw.pista.trim() : '';
  return legado ? [legado] : [];
}

export function normalizeSala(
  raw: EscapeRoomSalaInput | undefined,
  fallbackId?: string,
): EscapeRoomSala {
  const id = raw?.id?.trim() || fallbackId || uid();
  const tipo =
    raw?.tipoRespuesta === 'opcion_multiple' || raw?.tipoRespuesta === 'codigo'
      ? raw.tipoRespuesta
      : 'texto';
  let opciones: string[] | undefined;
  if (tipo === 'opcion_multiple') {
    const opts = [...(raw?.opciones ?? [])].filter((_, i) => i < 20);
    while (opts.length < 2) opts.push('');
    opciones = opts.slice(0, 12);
  }
  let respuestaCorrecta = raw?.respuestaCorrecta ?? '';
  if (tipo === 'opcion_multiple' && opciones) {
    const hit = opciones.find((o) => o === respuestaCorrecta && o.trim());
    if (!hit) {
      respuestaCorrecta = opciones.find((o) => o.trim()) ?? '';
    }
  }
  const intentos = normalizeIntentosMaximos(raw?.intentosMaximos);
  const pistas = normalizePistas(raw);
  return {
    id,
    nombre: raw?.nombre ?? '',
    descripcion: raw?.descripcion ?? '',
    desafio: raw?.desafio ?? '',
    tipoRespuesta: tipo,
    ...(tipo === 'opcion_multiple' ? { opciones } : {}),
    respuestaCorrecta,
    ignorarMayusculas: raw?.ignorarMayusculas !== false,
    ...(pistas.length > 0 ? { pistas } : {}),
    intentosMaximos: intentos,
    ...(Array.isArray(raw?.bloques) ? { bloques: raw.bloques as Block[] } : {}),
    ...(raw?.fondo ? { fondo: raw.fondo as Background } : {}),
  };
}

export function normalizeEscapeRoomActivity(
  raw: EscapeRoomActivity | null | undefined,
): EscapeRoomActivity {
  const fb = BLOCK_FALLBACKS.escape_room;
  if (!raw || raw.tipo !== 'escape_room') {
    return {
      tipo: 'escape_room',
      titulo: fb.titulo,
      introduccion: fb.introduccion,
      tiempoLimiteMinutos: fb.tiempoLimiteMinutos,
      mostrarRanking: fb.mostrarRanking,
      puntosBase: fb.puntosBase,
      salas: fb.salas.map((s) =>
        normalizeSala({
          ...s,
          opciones: s.tipoRespuesta === 'opcion_multiple' ? [...(s.opciones ?? [])] : undefined,
        }),
      ),
    };
  }
  const salas = (raw.salas ?? []).map((s) => normalizeSala(s));
  if (salas.length === 0) {
    return {
      ...raw,
      tipo: 'escape_room',
      titulo: raw.titulo ?? fb.titulo,
      introduccion: raw.introduccion ?? fb.introduccion,
      mostrarRanking: raw.mostrarRanking !== false,
      puntosBase: raw.puntosBase ?? fb.puntosBase,
      tiempoLimiteMinutos:
        raw.tiempoLimiteMinutos === undefined || raw.tiempoLimiteMinutos === 0
          ? undefined
          : raw.tiempoLimiteMinutos,
      salas: fb.salas.map((s) =>
        normalizeSala({
          ...s,
          opciones: s.tipoRespuesta === 'opcion_multiple' ? [...(s.opciones ?? [])] : undefined,
        }),
      ),
    };
  }
  return {
    tipo: 'escape_room',
    titulo: raw.titulo ?? '',
    introduccion: raw.introduccion ?? '',
    salas,
    tiempoLimiteMinutos:
      raw.tiempoLimiteMinutos === undefined || raw.tiempoLimiteMinutos === 0
        ? undefined
        : Math.min(60, Math.max(1, raw.tiempoLimiteMinutos)),
    mostrarRanking: raw.mostrarRanking !== false,
    puntosBase: Math.max(0, raw.puntosBase ?? 300),
  };
}

/**
 * Bloques del lienzo de una sala que el estudiante puede ver.
 * Se descartan los de tipo `actividad`: el acertijo lo sirve el propio viewer y
 * el diseñador tampoco los deja insertar (`EscapeRoomSalaCanvas`).
 */
export function bloquesVisiblesDeSala(sala: EscapeRoomSala): Block[] {
  return (sala.bloques ?? []).filter((b) => b.tipo !== 'actividad');
}

export function salaTieneLienzo(sala: EscapeRoomSala): boolean {
  return bloquesVisiblesDeSala(sala).length > 0;
}
