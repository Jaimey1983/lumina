import type { LineaTiempoActivity, LineaTiempoEvento } from '@lumina/types/slide';

import { barajar } from '../_shared/barajar.js';

export const LINEA_MAX_EVENTOS = 12;
export const LINEA_MIN_EVENTOS = 3;

export function generarIdLinea(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizarEvento(raw: unknown, indice: number): LineaTiempoEvento {
  const o = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const orden = typeof o.orden === 'number' && Number.isFinite(o.orden) ? o.orden : indice + 1;
  const evento: LineaTiempoEvento = {
    id: typeof o.id === 'string' && o.id ? o.id : generarIdLinea(),
    texto: typeof o.texto === 'string' ? o.texto : '',
    fechaTexto: typeof o.fechaTexto === 'string' ? o.fechaTexto : '',
    orden,
  };
  if (typeof o.imagen === 'string' && o.imagen.length > 0) evento.imagen = o.imagen;
  return evento;
}

/**
 * Hidrata una actividad tal como se guardó: completa los campos que falten (un evento sin `orden`
 * toma su posición) y fija `mostrarFechasAlFinal` en `true` si no viene. No toca `ajustes` ni lo
 * que no conoce.
 */
export function normalizarLineaTiempo(actividad: LineaTiempoActivity | Record<string, unknown>): LineaTiempoActivity {
  const raw = actividad as Partial<LineaTiempoActivity>;
  return {
    ...(raw as LineaTiempoActivity),
    tipo: 'linea_tiempo',
    instruccion: typeof raw.instruccion === 'string' ? raw.instruccion : '',
    eventos: (Array.isArray(raw.eventos) ? raw.eventos : []).map(normalizarEvento),
    mostrarFechasAlFinal: typeof raw.mostrarFechasAlFinal === 'boolean' ? raw.mostrarFechasAlFinal : true,
  };
}

/** Los eventos en su orden cronológico correcto (los empates de `orden` se rompen por posición). */
export function eventosEnOrden(eventos: readonly LineaTiempoEvento[]): LineaTiempoEvento[] {
  return eventos
    .map((e, i) => ({ e, i }))
    .sort((a, b) => a.e.orden - b.e.orden || a.i - b.i)
    .map(({ e }) => e);
}

const mismoOrden = (a: readonly LineaTiempoEvento[], b: readonly LineaTiempoEvento[]) =>
  a.length === b.length && a.every((e, i) => e.id === b[i]!.id);

/**
 * Orden inicial que ve el alumno: barajado (reproducible con `semilla`), pero NUNCA ya resuelto.
 * Si el barajado cae en el orden correcto se vuelve a barajar de forma determinista y, si aun así
 * no hay suerte, se rota una posición. Con menos de 2 eventos no hay nada que desordenar.
 */
export function ordenInicial(
  eventos: readonly LineaTiempoEvento[],
  semilla: number | null | undefined,
  corrida: number,
): LineaTiempoEvento[] {
  const correcto = eventosEnOrden(eventos);
  if (eventos.length < 2) return [...eventos];
  for (let k = 0; k < 8; k++) {
    const candidato = barajar(eventos, semilla, corrida * 8 + k);
    if (!mismoOrden(candidato, correcto)) return candidato;
  }
  return [...correcto.slice(1), correcto[0]!];
}

/** Reasigna `orden` 1..n según la posición actual (el botón «ordenar» del editor). */
export function renumerarEventos(eventos: readonly LineaTiempoEvento[]): LineaTiempoEvento[] {
  return eventosEnOrden(eventos).map((e, i) => ({ ...e, orden: i + 1 }));
}

/** Huella del CONTENIDO: cambiar un ajuste (estilo, sonido…) no reinicia la actividad. */
export function lineaTiempoFingerprint(a: LineaTiempoActivity): string {
  return JSON.stringify([a.instruccion, a.eventos, a.mostrarFechasAlFinal]);
}
