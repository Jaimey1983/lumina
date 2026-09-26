import { describe, expect, it } from 'vitest';

import { VIRTUAL_CANVAS_HEIGHT, VIRTUAL_CANVAS_WIDTH } from './virtual-canvas';
import {
  computeVirtualSlideScale,
  virtualSlideLayout,
  virtualSlideSurfaceStyles,
} from './virtual-slide-scale';

const VW = VIRTUAL_CANVAS_WIDTH; // 1280
const VH = VIRTUAL_CANVAS_HEIGHT; // 720

describe('computeVirtualSlideScale — escala virtual→píxel única', () => {
  it('escala dirigida por el ancho cuando no se da alto (aspect-video w-full)', () => {
    expect(computeVirtualSlideScale({ containerWidth: VW })).toBeCloseTo(1, 10);
    expect(computeVirtualSlideScale({ containerWidth: VW / 2 })).toBeCloseTo(0.5, 10);
    expect(computeVirtualSlideScale({ containerWidth: VW * 2 })).toBeCloseTo(2, 10);
  });

  it('hace «contain» sobre ambos ejes cuando el alto limita', () => {
    // ancho da fit=1 pero alto da fit=0.5 → gana el menor (contain)
    expect(
      computeVirtualSlideScale({ containerWidth: VW, containerHeight: VH / 2 }),
    ).toBeCloseTo(0.5, 10);
    // alto de sobra → manda el ancho
    expect(
      computeVirtualSlideScale({ containerWidth: VW, containerHeight: VH * 3 }),
    ).toBeCloseTo(1, 10);
  });

  it('multiplica por el zoom del usuario (default 1)', () => {
    expect(computeVirtualSlideScale({ containerWidth: VW, zoom: 2 })).toBeCloseTo(2, 10);
    expect(computeVirtualSlideScale({ containerWidth: VW, zoom: 0.5 })).toBeCloseTo(0.5, 10);
    // zoom inválido → se ignora (usa 1)
    expect(computeVirtualSlideScale({ containerWidth: VW, zoom: 0 })).toBeCloseTo(1, 10);
    expect(computeVirtualSlideScale({ containerWidth: VW, zoom: NaN })).toBeCloseTo(1, 10);
  });

  it('respeta los límites minScale / maxScale', () => {
    expect(
      computeVirtualSlideScale({ containerWidth: VW, zoom: 4, maxScale: 1.5 }),
    ).toBeCloseTo(1.5, 10);
    expect(
      computeVirtualSlideScale({ containerWidth: VW / 10, minScale: 0.25 }),
    ).toBeCloseTo(0.25, 10);
  });

  it('devuelve 0 con contenedor no medible (0, negativo o no finito)', () => {
    expect(computeVirtualSlideScale({ containerWidth: 0 })).toBe(0);
    expect(computeVirtualSlideScale({ containerWidth: -100 })).toBe(0);
    expect(computeVirtualSlideScale({ containerWidth: NaN })).toBe(0);
    expect(computeVirtualSlideScale({ containerWidth: Infinity })).toBe(0);
  });
});

describe('virtualSlideSurfaceStyles — superficie fija + frame escalado', () => {
  it('la superficie SIEMPRE mide 1280×720 (invariante del espacio virtual)', () => {
    for (const scale of [0.2, 0.5, 1, 1.75, 3]) {
      const { surfaceStyle } = virtualSlideSurfaceStyles(scale);
      expect(surfaceStyle.width).toBe(VW);
      expect(surfaceStyle.height).toBe(VH);
      expect(surfaceStyle.transform).toBe(`scale(${scale})`);
      expect(surfaceStyle.transformOrigin).toBe('top left');
      expect(surfaceStyle.position).toBe('absolute');
    }
  });

  it('el frame reserva el footprint escalado (px redondeado) y es relative', () => {
    const { width, height, frameStyle } = virtualSlideSurfaceStyles(0.5);
    expect(width).toBe(VW * 0.5); // 640
    expect(height).toBe(VH * 0.5); // 360
    expect(frameStyle.position).toBe('relative');
    expect(frameStyle.width).toBe(640);
    expect(frameStyle.height).toBe(360);
  });

  it('redondea el footprint a píxel entero (device px) para evitar sub-píxel', () => {
    // 1000/1280 = 0.78125 → ancho exacto 1000; alto 720*0.78125 = 562.5 → 563
    const scale = 1000 / VW;
    const { width, height } = virtualSlideSurfaceStyles(scale);
    expect(width).toBe(1000);
    expect(height).toBe(563);
  });

  it('redondea a píxeles físicos cuando se pasa devicePixelRatio', () => {
    const scale = 1000 / VW; // alto virtual 562.5
    const { height } = virtualSlideSurfaceStyles(scale, { devicePixelRatio: 2 });
    // 562.5 * 2 = 1125 (entero) / 2 = 562.5 → se preserva media px física
    expect(height).toBe(562.5);
  });

  it('escala 0 (o inválida) colapsa el footprint y usa scale(0)', () => {
    const { width, height, surfaceStyle } = virtualSlideSurfaceStyles(0);
    expect(width).toBe(0);
    expect(height).toBe(0);
    expect(surfaceStyle.transform).toBe('scale(0)');
    expect(virtualSlideSurfaceStyles(NaN).surfaceStyle.transform).toBe('scale(0)');
  });

  it('propaga zIndex a la superficie cuando se indica', () => {
    expect(virtualSlideSurfaceStyles(1, { zIndex: 5 }).surfaceStyle.zIndex).toBe(5);
    expect(virtualSlideSurfaceStyles(1).surfaceStyle.zIndex).toBeUndefined();
  });
});

describe('virtualSlideLayout — cálculo completo en un paso', () => {
  it('combina escala + estilos', () => {
    const layout = virtualSlideLayout({ containerWidth: VW / 2 });
    expect(layout.scale).toBeCloseTo(0.5, 10);
    expect(layout.width).toBe(640);
    expect(layout.height).toBe(360);
    expect(layout.surfaceStyle.width).toBe(VW);
    expect(layout.surfaceStyle.height).toBe(VH);
  });

  it('una única forma: contenedores muy distintos → MISMA superficie virtual (1280×720)', () => {
    // Editor amplio, present a pantalla completa, y miniatura diminuta:
    const editor = virtualSlideLayout({ containerWidth: 1100 });
    const present = virtualSlideLayout({ containerWidth: 1920 });
    const thumb = virtualSlideLayout({ containerWidth: 180 });

    // La caja donde vive el contenido es idéntica en las tres → un slide
    // autorizado en px virtuales se ve igual en todas, solo cambia la escala.
    for (const l of [editor, present, thumb]) {
      expect(l.surfaceStyle.width).toBe(VW);
      expect(l.surfaceStyle.height).toBe(VH);
      expect(l.surfaceStyle.transformOrigin).toBe('top left');
    }
    // Escalas distintas, footprints distintos:
    expect(editor.scale).not.toBeCloseTo(present.scale, 3);
    expect(thumb.scale).toBeLessThan(editor.scale);
    // Proporción del footprint siempre 16:9.
    for (const l of [editor, present, thumb]) {
      if (l.height > 0) expect(l.width / l.height).toBeCloseTo(VW / VH, 2);
    }
  });
});
