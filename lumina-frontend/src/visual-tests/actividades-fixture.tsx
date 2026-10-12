/**
 * U0 — fixtures de la línea base visual de actividades.
 *
 * Cada actividad se monta por su `ElementDefinition` real (registry) con el
 * estado de `crearPorDefecto()`. Es la red de seguridad (Regla 7) de la etapa U:
 * un cambio que altere el aspecto inicial de una actividad lo delata un diff.
 *
 * El azar se fija con un PRNG sembrado (`fijarAzar`) para que el barajado de
 * Memoria, Clasificar, Globos, etc. sea reproducible entre corridas.
 */
import type { ReactNode } from 'react';
import { vi } from 'vitest';

import { elementRegistry } from '@/lib/element-registry-bootstrap';

export const ACTIVIDAD_VISUAL_WIDTH = 640;
export const ACTIVIDAD_VISUAL_HEIGHT = 420;

/** Las 30 actividades del kit (`familia: 'actividad'`), por `tipo` del registry. */
export const ACTIVIDAD_TIPOS = [
  // Clásicas
  'quiz_multiple',
  'verdadero_falso',
  'short_answer',
  'respuesta_matematica',
  'completar_blancos',
  'arrastrar_soltar',
  'emparejar',
  'ordenar_pasos',
  'video_interactivo',
  'encuesta_viva',
  'nube_palabras',
  'balancear_ecuacion',
  'ubicar_elemento',
  'formular_compuesto',
  // Grupo 4
  'clasificar',
  'memoria',
  'puzzle_imagen',
  'sopa_letras',
  'crucigrama',
  'anagrama',
  'ahorcado',
  'puzzle_palabras',
  'abrir_caja',
  'globos',
  'topo',
  'historia_ramificada',
  // Catálogo nuevo (U14+)
  'relacionar_lineas',
  'problema_pasos',
  'etiquetar_imagen',
  'linea_tiempo',
] as const;

export type ActividadTipo = (typeof ACTIVIDAD_TIPOS)[number];

/** Estado por defecto de la actividad (`crearPorDefecto()`). */
export function estadoActividad(tipo: ActividadTipo): unknown {
  const def = elementRegistry.obtener(tipo);
  if (!def) throw new Error(`El registry no tiene la actividad "${tipo}"`);
  return def.crearPorDefecto();
}

/** mulberry32: PRNG de 32 bits, suficiente para fijar barajados. */
function mulberry32(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Sustituye `Math.random` por un PRNG sembrado. Devuelve la función de restauración. */
export function fijarAzar(semilla = 20261011): () => void {
  const espia = vi.spyOn(Math, 'random').mockImplementation(mulberry32(semilla));
  return () => espia.mockRestore();
}

/**
 * Congela el tiempo del navegador: `requestAnimationFrame` pasa a una cola que solo
 * avanza con `avanzarFrames`, y `setInterval` no dispara (cuentas regresivas, cronómetros).
 * Sin esto, Globos y los temporizadores dependerían del instante de la captura.
 * `setTimeout` NO se toca (el runner de pruebas lo usa). Devuelve `{ avanzarFrames, restaurar }`.
 */
export function congelarTiempo() {
  const originales = {
    raf: window.requestAnimationFrame,
    caf: window.cancelAnimationFrame,
    si: window.setInterval,
  };
  let cola = new Map<number, FrameRequestCallback>();
  let siguiente = 1;
  let ahora = 0;
  window.requestAnimationFrame = (cb) => {
    cola.set(siguiente, cb);
    return siguiente++;
  };
  window.cancelAnimationFrame = (id) => {
    cola.delete(id);
  };
  window.setInterval = (() => 0) as unknown as typeof window.setInterval;
  return {
    avanzarFrames(n: number) {
      for (let i = 0; i < n; i += 1) {
        ahora += 1000 / 60;
        const pendientes = cola;
        cola = new Map();
        for (const cb of pendientes.values()) cb(ahora);
      }
    },
    restaurar() {
      window.requestAnimationFrame = originales.raf;
      window.cancelAnimationFrame = originales.caf;
      window.setInterval = originales.si;
    },
  };
}

const SIN_MOVIMIENTO = `
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
    caret-color: transparent !important;
  }
`;

export function ActividadVisualHost({ children }: { children: ReactNode }) {
  return (
    <div
      data-testid="actividad-visual-host"
      style={{
        position: 'relative',
        width: ACTIVIDAD_VISUAL_WIDTH,
        height: ACTIVIDAD_VISUAL_HEIGHT,
        overflow: 'hidden',
        background: '#ffffff',
      }}
    >
      <style>{SIN_MOVIMIENTO}</style>
      {children}
    </div>
  );
}
