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
  esTeclaPermitida,
  hayReglaDeEvento,
  recolectarReglas,
  temporizadoresPendientes,
  type EstadoMotor,
  type EventoMotor,
} from '@lumina/interactions';
import type {
  EstadoDeBloque,
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
  estadoDe: (bloqueId: string) => EstadoDeBloque | undefined;
  /** K8a — `false` = el reproductor omite el bloque. Ausente = visible. */
  visibles: Readonly<Record<string, boolean>>;
  /** K8a — ids de capas abiertas, en orden de apertura. */
  capasAbiertas: readonly string[];
  /** K8a — Escape. Solo quita la capa; no navega ni puntúa. */
  cerrarCapa: (capaId: string) => void;
  /**
   * N5 — ids de bloques con reglas de hover. El renderizador solo engancha
   * `onPointerEnter/Leave` en esos bloques.
   */
  escuchaHover?: ReadonlySet<string>;
  /** N5 — el puntero entró (`true`) o salió (`false`) del bloque; con anti-rebote. */
  hover?: (bloqueId: string, dentro: boolean) => void;
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

/** N5 — espera antes de confirmar un hover, para filtrar el parpadeo al cruzar bordes. */
const HOVER_ANTIREBOTE_MS = 80;

/** N5 — un atajo de teclado no debe pisar a quien está escribiendo ni a un control con foco. */
function teclaDebeIgnorarse(e: KeyboardEvent): boolean {
  if (e.defaultPrevented || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return true;
  const t = e.target;
  if (!(t instanceof HTMLElement)) return false;
  if (t.isContentEditable || t.closest('input, textarea, select, [contenteditable="true"]')) return true;
  // Intro/Espacio sobre un botón o enlace ya lo activa el propio control.
  if ((e.code === 'Enter' || e.code === 'Space') && t.closest('button, a, [role="button"]')) return true;
  return false;
}

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
  const vivo = useRef({ slides, reglas, contexto, navigate, enabled, onEstadoChange, slideId });
  // Declarado antes que los efectos que despachan: React los corre en orden.
  useEffect(() => {
    vivo.current = { slides, reglas, contexto, navigate, enabled, onEstadoChange, slideId };
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
  // `salir_slide` (N5) se emite justo antes, con el id del slide que se deja.
  const ultimoSlideEntrado = useRef<string | null>(null);
  useEffect(() => {
    if (!enabled || !slideId) return;
    if (ultimoSlideEntrado.current === slideId) return;
    const anterior = ultimoSlideEntrado.current;
    ultimoSlideEntrado.current = slideId;
    if (anterior !== null) despachar({ tipo: 'salir_slide', slideId: anterior });
    despachar({ tipo: 'al_entrar_slide', slideId });
  }, [enabled, slideId, despachar]);

  // `temporizador` (N5): un reloj por cada valor pendiente del slide actual. Se
  // cancelan al salir o desmontar; los que ya dispararon en este intento (marca
  // persistida por K5) no se vuelven a programar.
  useEffect(() => {
    if (!enabled || !slideId) return;
    const base = estadoRef.current ?? crearEstadoInicial(vivo.current.contexto.variables, slides);
    const pendientes = temporizadoresPendientes(reglas, base, slideId);
    const relojes = pendientes.map((segundos) =>
      window.setTimeout(() => {
        despachar({ tipo: 'temporizador', slideId, detalle: { segundos } });
      }, segundos * 1000),
    );
    return () => relojes.forEach((r) => window.clearTimeout(r));
  }, [enabled, slideId, reglas, slides, despachar]);

  // `tecla` (N5): un solo oyente, solo si alguna regla lo usa, y solo con teclas
  // de la lista cerrada. Nunca es la única vía de acción (lo revisa K14).
  const hayTeclas = useMemo(() => hayReglaDeEvento(reglas, 'tecla'), [reglas]);
  useEffect(() => {
    if (!enabled || !hayTeclas) return;
    const alPulsar = (e: KeyboardEvent) => {
      if (!esTeclaPermitida(e.code) || teclaDebeIgnorarse(e)) return;
      const actual = vivo.current.slideId;
      if (!actual) return;
      despachar({ tipo: 'tecla', slideId: actual, detalle: { tecla: e.code } });
    };
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, [enabled, hayTeclas, despachar]);

  // `hover_entra` / `hover_sale` (N5) con anti-rebote por bloque.
  const escuchaHover = useMemo(() => {
    const ids = new Set<string>();
    for (const { regla, origen } of reglas) {
      if (
        regla.activa &&
        origen.tipo === 'bloque' &&
        (regla.evento === 'hover_entra' || regla.evento === 'hover_sale')
      ) {
        ids.add(origen.bloqueId);
      }
    }
    return ids;
  }, [reglas]);
  const hoverRef = useRef(new Map<string, { dentro: boolean; reloj?: number }>());
  useEffect(() => {
    const mapa = hoverRef.current;
    return () => {
      for (const h of mapa.values()) if (h.reloj !== undefined) window.clearTimeout(h.reloj);
      mapa.clear();
    };
  }, []);
  const hover = useCallback(
    (bloqueId: string, dentro: boolean) => {
      const mapa = hoverRef.current;
      const h = mapa.get(bloqueId) ?? { dentro: false };
      if (h.reloj !== undefined) window.clearTimeout(h.reloj);
      h.reloj = undefined;
      mapa.set(bloqueId, h);
      // Ya está en el estado pedido (o el cambio fue un parpadeo): no hay nada que emitir.
      if (h.dentro === dentro) return;
      h.reloj = window.setTimeout(() => {
        h.reloj = undefined;
        h.dentro = dentro;
        despachar({
          tipo: dentro ? 'hover_entra' : 'hover_sale',
          bloqueId,
          slideId: slideDeBloque.get(bloqueId),
        });
      }, HOVER_ANTIREBOTE_MS);
    },
    [despachar, slideDeBloque],
  );

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
    // N5: cambiar una variable desde un elemento también es un `cambio_variable`.
    if (v.slideId && hayReglaDeEvento(v.reglas, 'cambio_variable', variableId)) {
      despachar({ tipo: 'cambio_variable', slideId: v.slideId, detalle: { variableId } });
    }
  }, [despachar]);

  const runtime = useMemo<SlideInteractionRuntime | undefined>(() => {
    if (!enabled || !estadoParaPintar) return undefined;
    return {
      emitir,
      estadoDe: (bloqueId) => estadoParaPintar.estados[bloqueId],
      visibles: estadoParaPintar.visibles,
      capasAbiertas: estadoParaPintar.capasAbiertas,
      cerrarCapa,
      escuchaHover,
      hover,
      variables: estadoParaPintar.variables,
      asignarVariable,
    };
  }, [enabled, emitir, estadoParaPintar, cerrarCapa, escuchaHover, hover, asignarVariable]);

  return { slides, runtime, estado: estadoGuardado };
}
