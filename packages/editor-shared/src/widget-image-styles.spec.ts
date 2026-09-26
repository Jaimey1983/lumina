import { describe, expect, it } from 'vitest';

import {
  containerPercentToPanPx,
  framedCoverStyle,
  getImageStyle,
  panPxToContainerPercent,
} from './widget-image-styles';

function num(px: string | number | undefined): number {
  return parseFloat(String(px ?? '0'));
}

describe('framedCoverStyle — encuadre independiente de la resolución', () => {
  const IMG_W = 1200;
  const IMG_H = 800;

  it('produce el mismo encuadre relativo en contenedores de distinto tamaño', () => {
    // Editor (grande) y viewer móvil (chico), mismo aspect ratio 16:9.
    const editor = framedCoverStyle(IMG_W, IMG_H, 720, 405, 1.4, 16.7, -10);
    const mobile = framedCoverStyle(IMG_W, IMG_H, 320, 180, 1.4, 16.7, -10);

    // left/width y top/height deben coincidir como fracción del contenedor.
    const editorLeftRatio = num(editor.left) / 720;
    const mobileLeftRatio = num(mobile.left) / 320;
    const editorTopRatio = num(editor.top) / 405;
    const mobileTopRatio = num(mobile.top) / 180;

    expect(Math.abs(editorLeftRatio - mobileLeftRatio)).toBeLessThan(0.01);
    expect(Math.abs(editorTopRatio - mobileTopRatio)).toBeLessThan(0.01);
  });

  it('la imagen siempre cubre el contenedor (nunca deja franjas en blanco)', () => {
    for (const [cw, ch] of [
      [720, 405],
      [320, 180],
      [1000, 300],
    ] as const) {
      // Offset extremo (100%): con px absolutos dejaría hueco; con %+clamp no.
      const style = framedCoverStyle(IMG_W, IMG_H, cw, ch, 1.4, 100, 100);
      const w = num(style.width);
      const h = num(style.height);
      const left = num(style.left);
      const top = num(style.top);
      // Cover: la imagen es >= al contenedor en ambos ejes...
      expect(w).toBeGreaterThanOrEqual(cw);
      expect(h).toBeGreaterThanOrEqual(ch);
      // ...y sus bordes cubren el contenedor completo (sin blanco).
      expect(left).toBeLessThanOrEqual(0.5);
      expect(top).toBeLessThanOrEqual(0.5);
      expect(left + w).toBeGreaterThanOrEqual(cw - 0.5);
      expect(top + h).toBeGreaterThanOrEqual(ch - 0.5);
    }
  });

  it('un offset en px absolutos (modelo viejo) sí puede dejar blanco en un contenedor chico', () => {
    // Prueba de regresión: documenta el bug que motivó el cambio.
    const style = getImageStyle(IMG_W, IMG_H, 320, 180, 1.4, 120, 0);
    const left = num(style.left);
    // left > 0 significa que el borde izquierdo de la imagen entra al contenedor
    // dejando una franja en blanco a la izquierda.
    expect(left).toBeGreaterThan(0);
  });

  it('cae al fallback cover cuando faltan dimensiones', () => {
    const style = framedCoverStyle(0, 0, 320, 180, 1, 20, 20);
    expect(style.objectFit).toBe('cover');
  });
});

describe('conversión px <-> % del contenedor', () => {
  it('round-trip aproximado px -> % -> px', () => {
    const px = 120;
    const cw = 720;
    const pct = panPxToContainerPercent(px, cw);
    expect(pct).toBeCloseTo(16.7, 1);
    const back = containerPercentToPanPx(pct, cw);
    expect(Math.abs(back - px)).toBeLessThanOrEqual(1);
  });

  it('el mismo % da distinto px según el ancho del contenedor', () => {
    expect(containerPercentToPanPx(20, 720)).toBeCloseTo(144, 5);
    expect(containerPercentToPanPx(20, 320)).toBeCloseTo(64, 5);
  });

  it('es robusto ante contenedor 0', () => {
    expect(panPxToContainerPercent(100, 0)).toBe(0);
  });
});
