// ─── Zoom y desplazamiento del lienzo (W5) ────────────────────────────────────
// Lógica pura: sin React ni DOM. `pantalla = escena · zoom + (x, y)`.

import type { Punto } from "@lumina/drawing";

export interface Vista {
  zoom: number;
  /** Traslación en píxeles de pantalla. */
  x: number;
  y: number;
}

export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 8;

export const acotarZoom = (zoom: number): number => (Number.isFinite(zoom) ? Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom)) : 1);

export function pantallaAEscena(v: Vista, p: Punto): Punto {
  return { x: (p.x - v.x) / v.zoom, y: (p.y - v.y) / v.zoom };
}

export function escenaAPantalla(v: Vista, p: Punto): Punto {
  return { x: p.x * v.zoom + v.x, y: p.y * v.zoom + v.y };
}

/** Cambia el zoom multiplicándolo por `factor` y deja fijo el punto de pantalla `centro` (el cursor). */
export function zoomEn(v: Vista, centro: Punto, factor: number): Vista {
  const zoom = acotarZoom(v.zoom * factor);
  if (zoom === v.zoom) return v;
  const ancla = pantallaAEscena(v, centro);
  return { zoom, x: centro.x - ancla.x * zoom, y: centro.y - ancla.y * zoom };
}

export function desplazar(v: Vista, dx: number, dy: number): Vista {
  return dx === 0 && dy === 0 ? v : { ...v, x: v.x + dx, y: v.y + dy };
}

/** Vista que muestra la escena entera, centrada, dentro de una ventana de `ancho` × `alto` píxeles. */
export function ajustarAVentana(escena: { ancho: number; alto: number }, ventana: { ancho: number; alto: number }, margen = 32): Vista {
  const libreX = Math.max(1, ventana.ancho - margen * 2);
  const libreY = Math.max(1, ventana.alto - margen * 2);
  const zoom = acotarZoom(Math.min(libreX / Math.max(1, escena.ancho), libreY / Math.max(1, escena.alto)));
  return { zoom, x: (ventana.ancho - escena.ancho * zoom) / 2, y: (ventana.alto - escena.alto * zoom) / 2 };
}

/** Ajusta una distancia en píxeles de pantalla a unidades de escena (para tolerancias que no deben depender del zoom). */
export const pxAEscena = (v: Vista, px: number): number => px / v.zoom;
