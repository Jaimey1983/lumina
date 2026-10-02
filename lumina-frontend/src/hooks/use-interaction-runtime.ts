'use client';

/**
 * Runtime del motor de interacción (Etapa K / K4).
 *
 * Mantiene el estado del motor para UN alumno (D2), procesa los eventos que
 * emiten los elementos con `@lumina/interactions` y ejecuta el efecto
 * `navegar` a través de la función `navigate` del reproductor — la
 * misma que se publica en `SlideNavContext` (`navigate: null` en clase en vivo).
 * `cerrarCapa` (Escape sobre una capa, K8a) solo filtra `capasAbiertas`.
 *
 * Reglas de oro:
 *  - D1: `enabled: false` (clase en vivo, presentación) o `navigate: null` →
 *    el runtime es INERTE: no expone `emitir` y no navega.
 *  - C1/C4: este hook no importa `@lumina/scoring` ni toca la red. El motor
 *    decide el flujo; la nota sigue su camino (`onResponse` del reproductor).
 *    Navegar, reintentar o saltar un slide no crea ni sobrescribe resultados.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  asignarVariable as asignarVariableEnEstado,
  crearEstadoInicial,
  recolectarReglas,
  type EstadoMotor,
  type EventoMotor,
} from '@lumina/interactions';
import type {
  EstadoObjeto,
  EventoTipo,
  VariableDef,
  VariableValor,
} from '@lumina/types/interaction';
import type { Slide } from '@lumina/types/slide';
import type { SlideNavAction } from '@lumina/editor-shared/slide-nav-context';
import { migrarAccionesLegacyARegla } from '@/lib/class-slide-normalize';
import { ejecutarEvento, hidratarEstado } from '@/lib/interaction-runtime';

/** Lo que `SlideRenderer` reenvía a `config` de cada elemento. */
export interface SlideInteractionRuntime {
  emitir: (bloqueId: string, evento: EventoTipo) => void;
  estadoDe: (bloqueId: string) => EstadoObjeto | undefined;
  /** K8a — `false` = el reproductor omite el bloque. Ausente = visible. */
  visibles: Readonly<Record<string, boolean>>;
  /** K8a — ids de capas abiertas, en orden de apertura. */
  capasAbiertas: readonly string[];
  /** K8a — Escape. Solo quita la capa; no navega ni puntúa. */
  cerrarCapa: (capaId: string) => void;
  /** M2 — valor actual de cada variable de clase (solo lectura). */
  variables?: Readonly<Record<string, VariableValor>>;
  /** M2 — cambia una variable de flujo desde un elemento (valida existencia y tipo; nunca toca notas). */
  asignarVariable?: (variableId: string, valor: VariableValor) => void;
}

export interface UseInteractionRuntimeOptions {
  /** `false` en clase en vivo y presentación (D1). */
  enabled: boolean;
  slides: readonly Slide[];
  variables?: readonly VariableDef[];
  /** Id del slide visible; al cambiar se emite `al_entrar_slide`. */
  slideId: string | null;
  /** Misma función que va en `SlideNavContext`; `null` = no se puede navegar. */
  navigate: ((action: SlideNavAction) => void) | null;
  /** K5: estado persistido a restaurar al montar (se lee una sola vez). */
  estadoInicial?: unknown;
  /** K5: se llama tras cada evento con el estado nuevo (para persistirlo). */
  onEstadoChange?: (estado: EstadoMotor) => void;
}

export interface UseInteractionRuntimeResult {
  /** Slides con las acciones legadas traducidas a reglas (sin persistir). */
  slides: Slide[];
  /** `undefined` cuando el runtime está inerte. */
  runtime: SlideInteractionRuntime | undefined;
  /** Estado actual del motor (K5 lo persistirá). */
  estado: EstadoMotor | null;
}

const SIN_VARIABLES: readonly VariableDef[] = [];

export function useInteractionRuntime({
  enabled,
  slides: slidesEntrada,
  variables = SIN_VARIABLES,
  slideId,
  navigate,
  estadoInicial,
  onEstadoChange,
}: UseInteractionRuntimeOptions): UseInteractionRuntimeResult {
  const slides = useMemo(
    () => (enabled ? migrarAccionesLegacyARegla(slidesEntrada) : (slidesEntrada as Slide[])),
    [enabled, slidesEntrada],
  );
  const reglas = useMemo(() => (enabled ? recolectarReglas(slides) : []), [enabled, slides]);
  const contexto = useMemo(() => ({ variables }), [variables]);

  /** `null` hasta el primer evento: mientras tanto el estado se deriva de los slides. */
  const [restaurado] = useState<EstadoMotor | null>(() =>
    enabled ? hidratarEstado(estadoInicial, variables, slides) : null,
  );
  const [estadoGuardado, setEstadoGuardado] = useState<EstadoMotor | null>(restaurado);
  const estadoRef = useRef<EstadoMotor | null>(restaurado);

  // Refs al último valor: los manejadores no deben quedar con una clausura vieja.
  const vivo = useRef({ slides, reglas, contexto, navigate, enabled, onEstadoChange });
  // Declarado antes que los efectos que despachan: React los corre en orden.
  useEffect(() => {
    vivo.current = { slides, reglas, contexto, navigate, enabled, onEstadoChange };
  });

  const slideDeBloque = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const slide of slides) {
      for (const b of slide.bloques ?? []) {
        const id = (b as { id?: string }).id;
        if (typeof id === 'string' && id !== '') mapa.set(id, slide.id);
      }
    }
    return mapa;
  }, [slides]);

  const despachar = useCallback((evento: EventoMotor) => {
    const v = vivo.current;
    if (!v.enabled || v.reglas.length === 0) return;
    const nuevo = ejecutarEvento({
      reglas: v.reglas,
      estado: estadoRef.current,
      variables: v.contexto.variables,
      slides: v.slides,
      evento,
      // D1: sin `navigate` (vivo / presentación) los efectos se descartan.
      navigate: v.navigate,
    });
    estadoRef.current = nuevo;
    setEstadoGuardado(nuevo);
    v.onEstadoChange?.(nuevo);
  }, []);

  const emitir = useCallback(
    (bloqueId: string, tipo: EventoTipo) => {
      despachar({ tipo, bloqueId, slideId: slideDeBloque.get(bloqueId) });
    },
    [despachar, slideDeBloque],
  );

  // `al_entrar_slide`: una vez por entrada (StrictMode monta dos veces en dev).
  const ultimoSlideEntrado = useRef<string | null>(null);
  useEffect(() => {
    if (!enabled || !slideId) return;
    if (ultimoSlideEntrado.current === slideId) return;
    ultimoSlideEntrado.current = slideId;
    despachar({ tipo: 'al_entrar_slide', slideId });
  }, [enabled, slideId, despachar]);

  const estadoParaPintar = useMemo(
    () => (enabled ? (estadoGuardado ?? crearEstadoInicial(variables, slides)) : null),
    [enabled, estadoGuardado, variables, slides],
  );

  const cerrarCapa = useCallback((capaId: string) => {
    const v = vivo.current;
    if (!v.enabled) return;
    const base = estadoRef.current ?? crearEstadoInicial(v.contexto.variables, v.slides);
    if (!base.capasAbiertas.includes(capaId)) return;
    const nuevo: EstadoMotor = {
      ...base,
      capasAbiertas: base.capasAbiertas.filter((id) => id !== capaId),
    };
    estadoRef.current = nuevo;
    setEstadoGuardado(nuevo);
    v.onEstadoChange?.(nuevo);
  }, []);

  const asignarVariable = useCallback((variableId: string, valor: VariableValor) => {
    const v = vivo.current;
    if (!v.enabled) return;
    const base = estadoRef.current ?? crearEstadoInicial(v.contexto.variables, v.slides);
    const nuevo = asignarVariableEnEstado(base, v.contexto.variables, variableId, valor);
    if (nuevo === base) return;
    estadoRef.current = nuevo;
    setEstadoGuardado(nuevo);
    v.onEstadoChange?.(nuevo);
  }, []);

  const runtime = useMemo<SlideInteractionRuntime | undefined>(() => {
    if (!enabled || !estadoParaPintar) return undefined;
    return {
      emitir,
      estadoDe: (bloqueId) => estadoParaPintar.estados[bloqueId],
      visibles: estadoParaPintar.visibles,
      capasAbiertas: estadoParaPintar.capasAbiertas,
      cerrarCapa,
      variables: estadoParaPintar.variables,
      asignarVariable,
    };
  }, [enabled, emitir, estadoParaPintar, cerrarCapa, asignarVariable]);

  return { slides, runtime, estado: estadoGuardado };
}
