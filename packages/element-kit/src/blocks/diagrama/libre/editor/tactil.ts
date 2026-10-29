// ─── Dos dedos (Y30) ──────────────────────────────────────────────────────────
// Lógica pura: sin React ni DOM. El pellizco es solo la `Vista` (como la rueda): no toca el modelo ni el historial.

import type { Punto } from "@lumina/drawing";
import { acotarZoom, pantallaAEscena, type Vista } from "./vista.js";

export type ParDeDedos = readonly [Punto, Punto];

/** Zonas de acierto con el dedo (radio en píxeles de pantalla): 22 px = un objetivo de 44 px. */
export const RADIO_ACIERTO_TACTIL_PX = 22;
/** Lado del cuadrado de una asa de tamaño dibujada con el dedo (con ratón, 9). */
export const TAMANO_ASA_TACTIL_PX = 14;
/** Radio del círculo de la asa de giro dibujada con el dedo (con ratón, 5). */
export const RADIO_ASA_GIRO_TACTIL_PX = 8;

const medio = (a: Punto, b: Punto): Punto => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const distancia = (a: Punto, b: Punto): number => Math.hypot(a.x - b.x, a.y - b.y);
const finito = (p: Punto): boolean => Number.isFinite(p.x) && Number.isFinite(p.y);

/**
 * La vista que deja el punto de la escena que estaba bajo el punto medio de los dedos al empezar bajo el punto medio de ahora:
 * acercar o alejar los dedos hace zoom y moverlos juntos desplaza. Con una entrada rota o dedos juntos, la vista no cambia.
 */
export function vistaConDosDedos(base: Vista, inicio: ParDeDedos, ahora: ParDeDedos): Vista {
  const d0 = distancia(inicio[0], inicio[1]);
  const d1 = distancia(ahora[0], ahora[1]);
  if (![...inicio, ...ahora].every(finito) || !(d0 > 0) || !Number.isFinite(d1)) return base;
  const zoom = acotarZoom(base.zoom * (d1 / d0));
  const ancla = pantallaAEscena(base, medio(inicio[0], inicio[1]));
  const centro = medio(ahora[0], ahora[1]);
  return { zoom, x: centro.x - ancla.x * zoom, y: centro.y - ancla.y * zoom };
}

/** Los punteros táctiles apretados. Solo los dos primeros forman el pellizco; un tercero se ignora. */
export class Dedos {
  private readonly puntos = new Map<number, Punto>();
  private readonly orden: number[] = [];

  /** Registra un dedo nuevo. Devuelve `false` si ya hay dos (el tercero no cuenta). */
  apretar(id: number, p: Punto): boolean {
    if (this.puntos.has(id)) return true;
    if (this.orden.length >= 2) return false;
    this.puntos.set(id, p);
    this.orden.push(id);
    return true;
  }

  /** Mueve un dedo registrado; para uno desconocido no hace nada. */
  mover(id: number, p: Punto): void {
    if (this.puntos.has(id)) this.puntos.set(id, p);
  }

  soltar(id: number): void {
    this.puntos.delete(id);
    const i = this.orden.indexOf(id);
    if (i >= 0) this.orden.splice(i, 1);
  }

  limpiar(): void {
    this.puntos.clear();
    this.orden.length = 0;
  }

  get cantidad(): number {
    return this.orden.length;
  }

  tiene(id: number): boolean {
    return this.puntos.has(id);
  }

  /** Los dos dedos, en el orden en que llegaron; `null` si no son dos. */
  par(): ParDeDedos | null {
    const [a, b] = this.orden;
    if (a === undefined || b === undefined) return null;
    const pa = this.puntos.get(a);
    const pb = this.puntos.get(b);
    return pa && pb ? [pa, pb] : null;
  }
}
