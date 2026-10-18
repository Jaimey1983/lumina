import { describe, expect, it } from "vitest";
import { ZOOM_MAX, ZOOM_MIN, acotarZoom, ajustarAVentana, desplazar, escenaAPantalla, pantallaAEscena, zoomEn } from "./vista.js";

describe("conversión entre escena y pantalla", () => {
  it("ida y vuelta es la identidad", () => {
    const v = { zoom: 1.7, x: 33, y: -12 };
    for (const p of [{ x: 0, y: 0 }, { x: 250.5, y: 90 }, { x: -40, y: 1000 }]) {
      const r = pantallaAEscena(v, escenaAPantalla(v, p));
      expect(r.x).toBeCloseTo(p.x, 9);
      expect(r.y).toBeCloseTo(p.y, 9);
    }
  });
  it("aplica zoom y traslación", () => {
    expect(escenaAPantalla({ zoom: 2, x: 10, y: 20 }, { x: 5, y: 5 })).toEqual({ x: 20, y: 30 });
  });
});

describe("zoomEn", () => {
  it("el punto bajo el cursor no se mueve", () => {
    const v = { zoom: 1, x: 40, y: 25 };
    const cursor = { x: 300, y: 200 };
    const antes = pantallaAEscena(v, cursor);
    for (const f of [2, 0.5, 1.25, 3]) {
      const n = zoomEn(v, cursor, f);
      const despues = pantallaAEscena(n, cursor);
      expect(despues.x).toBeCloseTo(antes.x, 9);
      expect(despues.y).toBeCloseTo(antes.y, 9);
    }
  });
  it("respeta los límites y no cambia de objeto si ya está en el tope", () => {
    expect(zoomEn({ zoom: 1, x: 0, y: 0 }, { x: 0, y: 0 }, 1000).zoom).toBe(ZOOM_MAX);
    expect(zoomEn({ zoom: 1, x: 0, y: 0 }, { x: 0, y: 0 }, 0.0001).zoom).toBe(ZOOM_MIN);
    const tope = { zoom: ZOOM_MAX, x: 3, y: 4 };
    expect(zoomEn(tope, { x: 9, y: 9 }, 2)).toBe(tope);
  });
  it("un zoom inválido cae a 1", () => {
    expect(acotarZoom(Number.NaN)).toBe(1);
    expect(acotarZoom(Infinity)).toBe(1);
  });
});

describe("desplazar y ajustar", () => {
  it("desplazar suma; sin movimiento devuelve el mismo objeto", () => {
    expect(desplazar({ zoom: 1, x: 1, y: 2 }, 5, -3)).toEqual({ zoom: 1, x: 6, y: -1 });
    const v = { zoom: 1, x: 1, y: 2 };
    expect(desplazar(v, 0, 0)).toBe(v);
  });
  it("ajustarAVentana centra la escena entera dentro de la ventana", () => {
    const v = ajustarAVentana({ ancho: 1000, alto: 500 }, { ancho: 1064, alto: 564 }, 32);
    expect(v.zoom).toBe(1);
    expect(v.x).toBe(32);
    expect(v.y).toBe(32);
    const w = ajustarAVentana({ ancho: 1000, alto: 500 }, { ancho: 532, alto: 1000 }, 16);
    expect(w.zoom).toBeCloseTo(0.5, 6);
    expect(w.x).toBeCloseTo(16, 6);
    expect(w.y).toBeCloseTo((1000 - 250) / 2, 6);
  });
  it("una ventana diminuta no produce zoom inválido", () => {
    const v = ajustarAVentana({ ancho: 1000, alto: 500 }, { ancho: 0, alto: 0 });
    expect(v.zoom).toBeGreaterThanOrEqual(ZOOM_MIN);
    expect(Number.isFinite(v.x) && Number.isFinite(v.y)).toBe(true);
  });
});
