'use client';

/**
 * Runtime del motor de interacción (Etapa K / K4).
 *
 * Mantiene el estado del motor para UN alumno (D2), procesa los eventos que
 * emiten los elementos con `@lumina/interactions` y ejecuta el único efecto
 * posible, `navegar`, a través de la función `navigate` del reproductor — la
 * misma que se publica en `SlideNavContext` (`navigate: null` en clase en vivo).
 *
 * Reglas de oro:
 *  - D1: `enabled: false` (clase en vivo, presentación) o `navigate: null` →
 *    el runtime es INERTE: no expone `emitir` y no navega.
 *  - C1/C4: este hook no importa `@lumina/scoring` ni toca la red. El motor
 *    decide el flujo; la nota sigue su camino (`onResponse` del reproductor).
 *    Navegar, reintentar o saltar un slide no crea ni sobrescribe resultados.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { recolectarReglas, type EstadoMotor, type EventoMotor } from '@lumina/interactions';
import type { EstadoObjeto, EventoTipo, VariableDef } from '@lumina/types/interaction';
import type { Slide } from '@lumina/types/slide';
import type { SlideNavAction } from '@lumina/editor-shared/slide-nav-context';
import { migrarAccionesLegacyARegla } from '@/lib/class-slide-normalize';
import { ejecutarEvento } from '@/lib/interaction-runtime';

/** Lo que `SlideRenderer` reenvía a `config` de cada elemento. */
export interface SlideInteractionRuntime {
  emitir: (bloqueId: string, evento: EventoTipo) => void;
  estadoDe: (bloqueId: string) => EstadoObjeto | undefined;
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
}: UseInteractionRuntimeOptions): UseInteractionRuntimeResult {
  const slides = useMemo(
    () => (enabled ? migrarAccionesLegacyARegla(slidesEntrada) : (slidesEntrada as Slide[])),
    [enabled, slidesEntrada],
  );
  const reglas = useMemo(() => (enabled ? recolectarReglas(slides) : []), [enabled, slides]);
  const contexto = useMemo(() => ({ variables }), [variables]);

  /** `null` hasta el primer evento: mientras tanto el estado se deriva de los slides. */
  const [estadoGuardado, setEstadoGuardado] = useState<EstadoMotor | null>(null);
  const estadoRef = useRef<EstadoMotor | null>(null);

  // Refs al último valor: los manejadores no deben quedar con una clausura vieja.
  const vivo = useRef({ slides, reglas, contexto, navigate, enabled });
  // Declarado antes que los efectos que despachan: React los corre en orden.
  useEffect(() => {
    vivo.current = { slides, reglas, contexto, navigate, enabled };
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

  const runtime = useMemo<SlideInteractionRuntime | undefined>(() => {
    if (!enabled) return undefined;
    return {
      emitir,
      estadoDe: (bloqueId) => estadoGuardado?.estados[bloqueId],
    };
  }, [enabled, emitir, estadoGuardado]);

  return { slides, runtime, estado: estadoGuardado };
}
