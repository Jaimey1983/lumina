'use client';

import { useEffect, useRef } from 'react';

/**
 * Canal «abrir popup / hotspot por id» (T15). Un widget (p. ej. el Botón) pide abrir otro
 * overlay con `pedirOverlay(id)`; el Popup y el Hotspot que tienen ese `bloqueId` lo escuchan.
 * Es un evento de documento: no hace falta que los widgets se conozcan entre sí ni pasan por
 * el motor de interacción (el catálogo de eventos de `@lumina/types` es cerrado).
 */
export const ABRIR_OVERLAY_EVENTO = 'lumina:abrir-overlay';

export type AccionOverlay = 'abrir' | 'cerrar' | 'alternar';

export interface AbrirOverlayDetalle {
  /** `bloqueId` del popup o hotspot de destino. */
  id: string;
  accion?: AccionOverlay;
}

/** Pide al overlay con ese `bloqueId` que se abra (o cierre / alterne). Sin documento, no hace nada. */
export function pedirOverlay(id: string, accion: AccionOverlay = 'abrir'): void {
  if (typeof document === 'undefined' || !id) return;
  document.dispatchEvent(
    new CustomEvent<AbrirOverlayDetalle>(ABRIR_OVERLAY_EVENTO, { detail: { id, accion } }),
  );
}

/**
 * Escucha los pedidos dirigidos a `bloqueId`. Sin `bloqueId` (el bloque no participa en
 * reglas) o con `activo: false` (miniatura) no escucha nada.
 */
export function useAbrirOverlayPorId(
  bloqueId: string | undefined,
  alPedir: (accion: AccionOverlay) => void,
  activo = true,
): void {
  const ultima = useRef(alPedir);
  useEffect(() => {
    ultima.current = alPedir;
  });
  useEffect(() => {
    if (!bloqueId || !activo || typeof document === 'undefined') return;
    const escuchar = (e: Event) => {
      const d = (e as CustomEvent<AbrirOverlayDetalle>).detail;
      if (d?.id === bloqueId) ultima.current(d.accion ?? 'abrir');
    };
    document.addEventListener(ABRIR_OVERLAY_EVENTO, escuchar);
    return () => document.removeEventListener(ABRIR_OVERLAY_EVENTO, escuchar);
  }, [bloqueId, activo]);
}
