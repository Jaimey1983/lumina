import { describe, expect, it } from "vitest";
import { Dedos, vistaConDosDedos } from "./tactil.js";
import { pantallaAEscena, ZOOM_MAX, ZOOM_MIN, type Vista } from "./vista.js";

const base: Vista = { zoom: 1, x: 10, y: 20 };

describe("vistaConDosDedos", () => {
  it("separar los dedos acerca; juntarlos aleja", () => {
    const a = vistaConDosDedos(base, [{ x: 100, y: 100 }, { x: 200, y: 100 }], [{ x: 50, y: 100 }, { x: 250, y: 100 }]);
    expect(a.zoom).toBeCloseTo(2);
    const b = vistaConDosDedos(base, [{ x: 100, y: 100 }, { x: 300, y: 100 }], [{ x: 150, y: 100 }, { x: 250, y: 100 }]);
    expect(b.zoom).toBeCloseTo(0.5);
  });

  it("mover los dedos juntos desplaza sin cambiar el zoom", () => {
    const v = vistaConDosDedos(base, [{ x: 100, y: 100 }, { x: 200, y: 100 }], [{ x: 130, y: 90 }, { x: 230, y: 90 }]);
    expect(v).toEqual({ zoom: 1, x: 40, y: 10 });
  });

  it("el punto de la escena bajo el punto medio se conserva", () => {
    const casos: Array<[[number, number][], [number, number][]]> = [
      [[[100, 100], [200, 100]], [[80, 120], [260, 140]]],
      [[[300, 50], [320, 90]], [[100, 100], [400, 300]]],
      [[[0, 0], [10, 10]], [[200, 200], [210, 205]]],
    ];
    for (const [i, a] of casos) {
      const ini = [{ x: i[0]![0], y: i[0]![1] }, { x: i[1]![0], y: i[1]![1] }] as const;
      const ahora = [{ x: a[0]![0], y: a[0]![1] }, { x: a[1]![0], y: a[1]![1] }] as const;
      const v = vistaConDosDedos({ zoom: 1.5, x: -30, y: 12 }, ini, ahora);
      const antes = pantallaAEscena({ zoom: 1.5, x: -30, y: 12 }, { x: (ini[0].x + ini[1].x) / 2, y: (ini[0].y + ini[1].y) / 2 });
      const despues = pantallaAEscena(v, { x: (ahora[0].x + ahora[1].x) / 2, y: (ahora[0].y + ahora[1].y) / 2 });
      expect(despues.x).toBeCloseTo(antes.x, 6);
      expect(despues.y).toBeCloseTo(antes.y, 6);
    }
  });

  it("respeta los topes de zoom", () => {
    expect(vistaConDosDedos(base, [{ x: 0, y: 0 }, { x: 1, y: 0 }], [{ x: 0, y: 0 }, { x: 1000, y: 0 }]).zoom).toBe(ZOOM_MAX);
    expect(vistaConDosDedos(base, [{ x: 0, y: 0 }, { x: 1000, y: 0 }], [{ x: 0, y: 0 }, { x: 1, y: 0 }]).zoom).toBe(ZOOM_MIN);
  });

  it("con dedos juntos al empezar o entradas rotas la vista no cambia", () => {
    expect(vistaConDosDedos(base, [{ x: 5, y: 5 }, { x: 5, y: 5 }], [{ x: 0, y: 0 }, { x: 50, y: 0 }])).toBe(base);
    expect(vistaConDosDedos(base, [{ x: 0, y: 0 }, { x: 10, y: 0 }], [{ x: NaN, y: 0 }, { x: 50, y: 0 }])).toBe(base);
    expect(vistaConDosDedos(base, [{ x: 0, y: 0 }, { x: 10, y: 0 }], [{ x: 0, y: 0 }, { x: Infinity, y: 0 }])).toBe(base);
  });
});

describe("Dedos", () => {
  it("guarda dos dedos en orden e ignora el tercero", () => {
    const d = new Dedos();
    expect(d.apretar(1, { x: 0, y: 0 })).toBe(true);
    expect(d.par()).toBeNull();
    expect(d.apretar(2, { x: 10, y: 0 })).toBe(true);
    expect(d.apretar(3, { x: 99, y: 99 })).toBe(false);
    expect(d.cantidad).toBe(2);
    expect(d.par()).toEqual([{ x: 0, y: 0 }, { x: 10, y: 0 }]);
    d.mover(3, { x: 1, y: 1 });
    expect(d.tiene(3)).toBe(false);
    d.mover(2, { x: 20, y: 5 });
    expect(d.par()?.[1]).toEqual({ x: 20, y: 5 });
  });

  it("al soltar uno deja de haber par, y vuelve a haber lugar", () => {
    const d = new Dedos();
    d.apretar(1, { x: 0, y: 0 });
    d.apretar(2, { x: 10, y: 0 });
    d.soltar(1);
    expect(d.par()).toBeNull();
    expect(d.cantidad).toBe(1);
    expect(d.apretar(3, { x: 5, y: 5 })).toBe(true);
    expect(d.par()).toEqual([{ x: 10, y: 0 }, { x: 5, y: 5 }]);
    d.limpiar();
    expect(d.cantidad).toBe(0);
  });
});
