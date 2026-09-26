import type { CSSProperties } from 'react';

import { VIRTUAL_CANVAS_HEIGHT, VIRTUAL_CANVAS_WIDTH } from './virtual-canvas';

/**
 * Escala virtual→píxel única para el slide (G-scale.0).
 *
 * Problema que resuelve: hoy cada superficie que renderiza un slide (editor,
 * preview, present, viewer, autónomo, miniaturas) es una caja fluida 16:9 de
 * tamaño en píxeles distinto. Las posiciones/cajas de bloque son `%` (invariantes
 * a escala, contrato 3.2 del canvas), pero el **contenido** (tamaño de fuente,
 * paddings, borders) está autorizado en unidades absolutas (`px`/`rem`) o de
 * viewport (`vw`/`vh`), que NO siguen el tamaño real del slide → el mismo slide
 * se ve distinto en cada superficie.
 *
 * Forma única para todo (modelo Canva/Google Slides, y lo que ya pide el
 * contrato del editor §6: «transform scale() en el wrapper del viewport, no en
 * los bloques»): renderizar el contenido en una **superficie de tamaño virtual
 * fijo** (1280×720) y aplicar **un solo `transform: scale(S)`** en el wrapper.
 * Así todo lo autorizado en píxeles virtuales escala de forma uniforme y el
 * slide es idéntico en todas las superficies.
 *
 * Este módulo es la lógica pura (sin React ni DOM): calcula la escala y los
 * estilos del frame (footprint que ocupa el layout) y de la superficie (caja
 * fija 1280×720 escalada). El wrapper React `<VirtualSlideSurface>` que mide el
 * contenedor con `ResizeObserver` y consume estos helpers llega en G-scale.1.
 */

export interface VirtualSlideScaleInput {
  /** Ancho disponible del contenedor, en píxeles CSS. */
  containerWidth: number;
  /**
   * Alto disponible del contenedor, en píxeles CSS. Cuando es finito y > 0, la
   * escala hace «contain» sobre ambos ejes (el slide entra completo, 16:9). Si
   * se omite (o ≤ 0), la escala es dirigida por el ancho (caso `aspect-video`
   * `w-full`, donde el alto lo deriva la relación de aspecto).
   */
  containerHeight?: number;
  /** Zoom del usuario (p. ej. `canvasZoom` del editor). Por defecto 1. */
  zoom?: number;
  /** Límite inferior opcional de la escala resultante. */
  minScale?: number;
  /** Límite superior opcional de la escala resultante. */
  maxScale?: number;
}

const EPSILON = 1e-6;

function isFinitePositive(n: number | undefined): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n > 0;
}

/**
 * Escala uniforme a aplicar a la superficie fija 1280×720.
 *
 * `S = fit × zoom`, con `fit = min(ancho/1280, alto/720)` (o solo `ancho/1280`
 * si no se da alto), luego clampeada a `[minScale, maxScale]` si se indican.
 * Devuelve 0 cuando el contenedor todavía no tiene tamaño medible (ancho ≤ 0 o
 * no finito) — el consumidor puede omitir el render hasta que mida > 0.
 */
export function computeVirtualSlideScale(input: VirtualSlideScaleInput): number {
  const { containerWidth, containerHeight, zoom, minScale, maxScale } = input;

  if (!isFinitePositive(containerWidth)) return 0;

  const effectiveZoom = isFinitePositive(zoom) ? zoom : 1;

  const byWidth = containerWidth / VIRTUAL_CANVAS_WIDTH;
  const byHeight = isFinitePositive(containerHeight)
    ? containerHeight / VIRTUAL_CANVAS_HEIGHT
    : Number.POSITIVE_INFINITY;

  const fit = Math.min(byWidth, byHeight);
  let scale = fit * effectiveZoom;

  if (isFinitePositive(minScale) && scale < minScale) scale = minScale;
  if (isFinitePositive(maxScale) && scale > maxScale) scale = maxScale;

  if (!Number.isFinite(scale) || scale < 0) return 0;
  return scale;
}

export interface VirtualSlideSurfaceStyleOptions {
  /**
   * Redondea el footprint (frame) a píxeles enteros de dispositivo para evitar
   * bordes borrosos / huecos sub-píxel. Por defecto 1 (píxel CSS entero). Pasar
   * `window.devicePixelRatio` para cuadrar con píxeles físicos.
   */
  devicePixelRatio?: number;
  /** `zIndex` opcional para la superficie. */
  zIndex?: number;
}

export interface VirtualSlideSurfaceStyles {
  /** Footprint que la superficie ocupa en el layout (px CSS, redondeado). */
  width: number;
  height: number;
  /** Estilo del elemento externo: reserva el footprint escalado en el flujo. */
  frameStyle: CSSProperties;
  /**
   * Estilo del elemento interno: caja fija 1280×720 escalada desde la esquina
   * superior izquierda. El contenido del slide (posiciones `%`, fuentes en px
   * virtuales) va dentro de este elemento.
   */
  surfaceStyle: CSSProperties;
}

function roundToDevicePx(valuePx: number, devicePixelRatio: number): number {
  const dpr = isFinitePositive(devicePixelRatio) ? devicePixelRatio : 1;
  return Math.round(valuePx * dpr) / dpr;
}

/**
 * Estilos de frame + superficie a partir de una escala ya calculada.
 *
 * - `surfaceStyle`: **siempre** 1280×720 fijos + `transform: scale(S)` con
 *   origen `top left` (invariante: el contenido siempre se autoriza en el mismo
 *   espacio virtual, independientemente del tamaño renderizado).
 * - `frameStyle`: `position: relative` con el footprint escalado (px redondeado)
 *   para que el layout reserve el espacio correcto y el centrado funcione.
 */
export function virtualSlideSurfaceStyles(
  scale: number,
  options?: VirtualSlideSurfaceStyleOptions,
): VirtualSlideSurfaceStyles {
  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 0;
  const dpr = options?.devicePixelRatio ?? 1;

  const width = roundToDevicePx(VIRTUAL_CANVAS_WIDTH * safeScale, dpr);
  const height = roundToDevicePx(VIRTUAL_CANVAS_HEIGHT * safeScale, dpr);

  const frameStyle: CSSProperties = {
    position: 'relative',
    width,
    height,
  };

  const surfaceStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: VIRTUAL_CANVAS_WIDTH,
    height: VIRTUAL_CANVAS_HEIGHT,
    transform: safeScale > EPSILON ? `scale(${safeScale})` : 'scale(0)',
    transformOrigin: 'top left',
  };

  if (options?.zIndex !== undefined) surfaceStyle.zIndex = options.zIndex;

  return { width, height, frameStyle, surfaceStyle };
}

export interface VirtualSlideLayoutInput
  extends VirtualSlideScaleInput,
    VirtualSlideSurfaceStyleOptions {}

export interface VirtualSlideLayout extends VirtualSlideSurfaceStyles {
  /** Escala uniforme aplicada (fit × zoom, clampeada). */
  scale: number;
}

/**
 * Cálculo completo en un paso: mide → escala → estilos. Es lo que consumirá el
 * wrapper `<VirtualSlideSurface>` (G-scale.1) tras medir el contenedor.
 */
export function virtualSlideLayout(input: VirtualSlideLayoutInput): VirtualSlideLayout {
  const scale = computeVirtualSlideScale(input);
  const styles = virtualSlideSurfaceStyles(scale, {
    devicePixelRatio: input.devicePixelRatio,
    zIndex: input.zIndex,
  });
  return { scale, ...styles };
}
