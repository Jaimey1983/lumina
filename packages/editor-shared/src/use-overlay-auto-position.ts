'use client';

import { useLayoutEffect, useState } from 'react';
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  platform as domPlatform,
  shift,
  type Placement,
} from '@floating-ui/dom';

import {
  OVERLAY_SLIDE_PAD_PX,
  type OverlayPlacement,
  type OverlaySide,
} from './overlay-auto-position';

const DEFAULT_PLACEMENT: OverlayPlacement = { side: 'abajo', shiftX: 0, shiftY: 0, arrowShift: 0 };

const LADO_A_PLACEMENT: Record<OverlaySide, Placement> = {
  arriba: 'top',
  abajo: 'bottom',
  izquierda: 'left',
  derecha: 'right',
};
const PLACEMENT_A_LADO: Record<string, OverlaySide> = {
  top: 'arriba',
  bottom: 'abajo',
  left: 'izquierda',
  right: 'derecha',
};

/**
 * El recorte que importa es el del slide (lo que ve el estudiante), no el de la ventana: con el
 * canvas ampliado el slide puede salirse del viewport y no hay que apretar la burbuja contra él.
 */
const SIN_LIMITE_RAIZ = { x: -1e6, y: -1e6, width: 2e6, height: 2e6 };

/** La flecha no se corre más allá de esto desde el centro (que no se salga de la burbuja). */
const FLECHA_MARGEN_PX = 14;

export interface CalcularOverlayInput {
  reference: Element;
  floating: HTMLElement;
  /** El `.canvas-slide`: límite de colisión. */
  boundary: Element;
  side: OverlaySide | 'auto';
  gap: number;
  fallbackSize?: { width: number; height: number };
}

/**
 * Coloca una burbuja respecto de su disparador con Floating UI: `offset` (separación),
 * `flip` (solo con `auto`: abajo → arriba → derecha → izquierda, y si ninguno cabe, el de menos
 * desborde) y `shift` (la mantiene dentro del slide). Un lado explícito nunca cambia de lado.
 *
 * Devuelve lado y desplazamientos en px del propio slide (no de pantalla), así que valen con el
 * canvas ampliado o reducido. La burbuja se sigue colocando por CSS (`pos*` + variables).
 */
export async function calcularOverlay({
  reference,
  floating,
  boundary,
  side,
  gap,
  fallbackSize,
}: CalcularOverlayInput): Promise<OverlayPlacement> {
  // El margen de 4 px es del slide: con el canvas a otro zoom se escala a pantalla (Floating UI
  // aplica el padding en px de pantalla).
  const ancho = boundary instanceof HTMLElement ? boundary.offsetWidth : 0;
  const escala = ancho > 0 ? boundary.getBoundingClientRect().width / ancho : 1;
  const limites = {
    boundary,
    rootBoundary: SIN_LIMITE_RAIZ,
    padding: OVERLAY_SLIDE_PAD_PX * (Number.isFinite(escala) && escala > 0 ? escala : 1),
  };
  const middleware = [
    offset(gap),
    ...(side === 'auto'
      ? [
          flip({
            ...limites,
            crossAxis: false,
            fallbackPlacements: ['top', 'right', 'left'],
            fallbackStrategy: 'bestFit',
          }),
        ]
      : []),
    shift(limites),
  ];

  const { placement, middlewareData } = await computePosition(reference, floating, {
    placement: side === 'auto' ? 'bottom' : LADO_A_PLACEMENT[side],
    strategy: 'absolute',
    middleware,
    platform: {
      ...domPlatform,
      getDimensions: async (el) => {
        const d = await domPlatform.getDimensions(el);
        // Burbuja aún sin medida (oculta): se usa la estimada.
        if (el === floating && (d.width <= 0 || d.height <= 0) && fallbackSize) return fallbackSize;
        return d;
      },
    },
  });

  const lado = PLACEMENT_A_LADO[placement.split('-')[0]] ?? 'abajo';
  const horizontal = lado === 'arriba' || lado === 'abajo';
  const desplazado = middlewareData.shift;
  const shiftX = horizontal ? Math.round(desplazado?.x ?? 0) : 0;
  const shiftY = horizontal ? 0 : Math.round(desplazado?.y ?? 0);
  const medida = horizontal ? floating.offsetWidth || fallbackSize?.width || 0 : floating.offsetHeight || fallbackSize?.height || 0;
  const tope = Math.max(0, medida / 2 - FLECHA_MARGEN_PX);
  const arrowShift = Math.max(-tope, Math.min(tope, -(horizontal ? shiftX : shiftY))) || 0;

  return { side: lado, shiftX, shiftY, arrowShift };
}

export function useOverlayAutoPosition({
  active,
  configuredSide,
  triggerRef,
  bubbleRef,
  gap,
  fallbackSize,
  layoutKey,
}: {
  active: boolean;
  configuredSide: OverlaySide | 'auto';
  triggerRef: { current: HTMLElement | null };
  bubbleRef: { current: HTMLElement | null };
  gap: number;
  fallbackSize?: { width: number; height: number };
  /** Cambia al mover el pin (x/y) para recalcular contra el 16:9. */
  layoutKey?: string;
}): OverlayPlacement {
  const [placement, setPlacement] = useState<OverlayPlacement>(DEFAULT_PLACEMENT);
  const fallbackAncho = fallbackSize?.width;
  const fallbackAlto = fallbackSize?.height;

  useLayoutEffect(() => {
    if (!active) return;

    const trigger = triggerRef.current;
    const bubble = bubbleRef.current;
    if (!trigger || !bubble) return;
    const slide = trigger.closest('.canvas-slide');
    if (!slide) return;

    let cancelado = false;
    const aplicar = () => {
      void calcularOverlay({
        reference: trigger,
        floating: bubble,
        boundary: slide,
        side: configuredSide,
        gap,
        fallbackSize:
          fallbackAncho !== undefined && fallbackAlto !== undefined
            ? { width: fallbackAncho, height: fallbackAlto }
            : undefined,
      }).then((next) => {
        if (cancelado) return;
        setPlacement((prev) =>
          prev.side === next.side &&
          prev.shiftX === next.shiftX &&
          prev.shiftY === next.shiftY &&
          prev.arrowShift === next.arrowShift
            ? prev
            : next,
        );
      });
    };

    // `autoUpdate` recalcula al cambiar el tamaño de la burbuja o del disparador, al hacer
    // scroll en un ancestro, al redimensionar la ventana y ante cambios de layout.
    const limpiar = autoUpdate(trigger, bubble, aplicar);
    return () => {
      cancelado = true;
      limpiar();
    };
  }, [
    active,
    configuredSide,
    gap,
    fallbackAncho,
    fallbackAlto,
    layoutKey,
    triggerRef,
    bubbleRef,
  ]);

  return placement;
}
