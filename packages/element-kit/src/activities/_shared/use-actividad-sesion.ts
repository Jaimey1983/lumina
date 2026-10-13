'use client';

/**
 * U3 — estado de una sesión de actividad (etapa U / DU1).
 *
 * Reemplaza el puñado de `useState` + `useRef` + `setTimeout` que cada viewer arma por su
 * cuenta. El reducer es PURO (`actividadSesionReducer`): se prueba sin DOM y sin reloj.
 * El único efecto es el cronómetro de `useActividadSesion`, un `setInterval` cancelable.
 *
 * Fases: `intro → jugando → (revision →) resultado`. Una actividad termina por
 * `completar`, por quedarse sin vidas o por agotar el tiempo; `reintentar` vuelve a
 * `jugando` mientras queden intentos. Una acción fuera de su fase se IGNORA (devuelve el
 * mismo objeto), así un `tick` tardío o un doble clic no corrompen el estado.
 *
 * Nada de esto calcula notas: calificar sigue siendo de `@lumina/scoring` (DU7).
 */
import { useEffect, useMemo, useReducer } from 'react';

import type { AjustesResueltos } from './activity-settings.js';

export type FaseActividad = 'intro' | 'jugando' | 'revision' | 'resultado';

/** Por qué terminó la corrida actual. */
export type MotivoFin = 'completada' | 'sin_vidas' | 'sin_tiempo';

/** Límites de la sesión, fijados al crearla desde los ajustes. */
export interface ConfigSesion {
  /** `null` = intentos ilimitados. */
  readonly intentosMax: number | null;
  readonly vidasMax: number | null;
  readonly tiempoMaxSeg: number | null;
  /** `null` = pistas ilimitadas. */
  readonly pistasMax: number | null;
  readonly costoPistaPct: number;
  readonly conIntro: boolean;
  /** Si es `true`, al terminar pasa por `revision` antes de `resultado`. */
  readonly conRevision: boolean;
  /** Cronómetro ascendente (tiempo transcurrido), independiente del tiempo límite. */
  readonly cronometro: boolean;
}

export interface SesionActividad {
  readonly config: ConfigSesion;
  readonly fase: FaseActividad;
  /** Intento en curso, desde 1. */
  readonly intento: number;
  /** Vidas que quedan; `null` si la actividad no usa vidas. */
  readonly vidas: number | null;
  /** Segundos que quedan; `null` si no hay límite. */
  readonly tiempoRestante: number | null;
  /** Segundos jugados en este intento; solo avanza con `config.cronometro`. */
  readonly transcurrido: number;
  readonly progreso: { readonly actual: number; readonly total: number };
  /** Puntos de juego acumulados en este intento (decoración; NO es la nota). */
  readonly puntaje: number;
  readonly pistasUsadas: number;
  readonly motivoFin: MotivoFin | null;
}

export type AccionSesion =
  | { readonly tipo: 'iniciar' }
  | { readonly tipo: 'tick'; readonly segundos?: number }
  | { readonly tipo: 'perderVida' }
  | { readonly tipo: 'sumarPuntaje'; readonly puntos: number }
  | { readonly tipo: 'progreso'; readonly actual: number; readonly total?: number }
  | { readonly tipo: 'usarPista' }
  | { readonly tipo: 'completar' }
  | { readonly tipo: 'verResultado' }
  | { readonly tipo: 'reintentar' };

export interface OpcionesSesion {
  /** Muestra una pantalla de presentación antes de jugar. Por defecto `false`. */
  readonly conIntro?: boolean;
  /** Pasa por `revision` antes del resultado. Por defecto `false`. */
  readonly conRevision?: boolean;
  /** Cuenta el tiempo transcurrido (cronómetro hacia arriba). Por defecto `false`. */
  readonly cronometro?: boolean;
  /** Total de unidades de progreso (preguntas, pares…). Por defecto 0 = sin barra. */
  readonly total?: number;
}

export function crearSesionInicial(
  ajustes: AjustesResueltos,
  opciones: OpcionesSesion = {},
): SesionActividad {
  const config: ConfigSesion = {
    intentosMax: ajustes.intentos,
    vidasMax: ajustes.vidas,
    tiempoMaxSeg: ajustes.tiempoLimiteSeg,
    pistasMax: ajustes.pistas.cantidad,
    costoPistaPct: ajustes.pistas.costoPct,
    conIntro: opciones.conIntro === true,
    conRevision: opciones.conRevision === true,
    cronometro: opciones.cronometro === true,
  };
  return {
    config,
    fase: config.conIntro ? 'intro' : 'jugando',
    intento: 1,
    vidas: config.vidasMax,
    tiempoRestante: config.tiempoMaxSeg,
    transcurrido: 0,
    progreso: { actual: 0, total: Math.max(0, Math.floor(opciones.total ?? 0)) },
    puntaje: 0,
    pistasUsadas: 0,
    motivoFin: null,
  };
}

/** ¿Quedan intentos para volver a jugar desde `revision`/`resultado`? */
export function puedeReintentar(s: SesionActividad): boolean {
  if (s.fase !== 'revision' && s.fase !== 'resultado') return false;
  return s.config.intentosMax === null || s.intento < s.config.intentosMax;
}

/** Pistas que todavía se pueden pedir; `null` = ilimitadas. */
export function pistasRestantes(s: SesionActividad): number | null {
  if (s.config.pistasMax === null) return null;
  return Math.max(0, s.config.pistasMax - s.pistasUsadas);
}

function terminar(s: SesionActividad, motivo: MotivoFin): SesionActividad {
  return { ...s, fase: s.config.conRevision ? 'revision' : 'resultado', motivoFin: motivo };
}

export function actividadSesionReducer(s: SesionActividad, a: AccionSesion): SesionActividad {
  switch (a.tipo) {
    case 'iniciar':
      return s.fase === 'intro' ? { ...s, fase: 'jugando' } : s;

    case 'tick': {
      if (s.fase !== 'jugando' || (s.tiempoRestante === null && !s.config.cronometro)) return s;
      const paso = a.segundos ?? 1;
      if (!Number.isFinite(paso) || paso <= 0) return s;
      const conReloj = s.config.cronometro ? { ...s, transcurrido: s.transcurrido + paso } : s;
      if (conReloj.tiempoRestante === null) return conReloj;
      const restante = Math.max(0, conReloj.tiempoRestante - paso);
      const conTiempo = { ...conReloj, tiempoRestante: restante };
      return restante === 0 ? terminar(conTiempo, 'sin_tiempo') : conTiempo;
    }

    case 'perderVida': {
      if (s.fase !== 'jugando' || s.vidas === null) return s;
      const vidas = Math.max(0, s.vidas - 1);
      const conVidas = { ...s, vidas };
      return vidas === 0 ? terminar(conVidas, 'sin_vidas') : conVidas;
    }

    case 'sumarPuntaje':
      if (s.fase !== 'jugando' || !Number.isFinite(a.puntos)) return s;
      return { ...s, puntaje: Math.max(0, s.puntaje + a.puntos) };

    case 'progreso': {
      if (s.fase !== 'jugando' || !Number.isFinite(a.actual)) return s;
      const total =
        a.total !== undefined && Number.isFinite(a.total)
          ? Math.max(0, Math.floor(a.total))
          : s.progreso.total;
      const actual = Math.min(total, Math.max(0, Math.floor(a.actual)));
      return actual === s.progreso.actual && total === s.progreso.total
        ? s
        : { ...s, progreso: { actual, total } };
    }

    case 'usarPista': {
      if (s.fase !== 'jugando') return s;
      if (s.config.pistasMax !== null && s.pistasUsadas >= s.config.pistasMax) return s;
      return { ...s, pistasUsadas: s.pistasUsadas + 1 };
    }

    case 'completar':
      return s.fase === 'jugando' ? terminar(s, 'completada') : s;

    case 'verResultado':
      return s.fase === 'revision' ? { ...s, fase: 'resultado' } : s;

    case 'reintentar':
      if (!puedeReintentar(s)) return s;
      return {
        ...s,
        fase: 'jugando',
        intento: s.intento + 1,
        vidas: s.config.vidasMax,
        tiempoRestante: s.config.tiempoMaxSeg,
        transcurrido: 0,
        progreso: { actual: 0, total: s.progreso.total },
        puntaje: 0,
        pistasUsadas: 0,
        motivoFin: null,
      };
  }
}

export interface AccionesSesion {
  iniciar(): void;
  completar(): void;
  perderVida(): void;
  sumarPuntaje(puntos: number): void;
  setProgreso(actual: number, total?: number): void;
  usarPista(): void;
  verResultado(): void;
  reintentar(): void;
}

/**
 * Sesión + acciones estables + cronómetro. El intervalo vive solo mientras la fase es
 * `jugando` y hay tiempo límite, y se cancela al terminar, reintentar o desmontar.
 */
export function useActividadSesion(
  ajustes: AjustesResueltos,
  opciones: OpcionesSesion = {},
): { sesion: SesionActividad } & AccionesSesion {
  const [sesion, dispatch] = useReducer(
    actividadSesionReducer,
    undefined,
    () => crearSesionInicial(ajustes, opciones),
  );

  const corriendo =
    sesion.fase === 'jugando' && (sesion.tiempoRestante !== null || sesion.config.cronometro);
  useEffect(() => {
    if (!corriendo) return undefined;
    const id = setInterval(() => dispatch({ tipo: 'tick' }), 1000);
    return () => clearInterval(id);
  }, [corriendo, sesion.intento]);

  const acciones = useMemo<AccionesSesion>(
    () => ({
      iniciar: () => dispatch({ tipo: 'iniciar' }),
      completar: () => dispatch({ tipo: 'completar' }),
      perderVida: () => dispatch({ tipo: 'perderVida' }),
      sumarPuntaje: (puntos) => dispatch({ tipo: 'sumarPuntaje', puntos }),
      setProgreso: (actual, total) => dispatch({ tipo: 'progreso', actual, total }),
      usarPista: () => dispatch({ tipo: 'usarPista' }),
      verResultado: () => dispatch({ tipo: 'verResultado' }),
      reintentar: () => dispatch({ tipo: 'reintentar' }),
    }),
    [],
  );

  return { sesion, ...acciones };
}

/** `m:ss` para un cronómetro. */
export function formatearTiempo(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

