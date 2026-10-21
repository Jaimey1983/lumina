import { describe, expect, it } from "vitest";
import { asaEn, cursorDeAsa, DISTANCIA_ASA_ROTAR_PX, marcoDeSeleccion, posicionesDeAsas } from "./asas.js";
import { escena, forma, grupo, linea } from "./util-pruebas.js";

describe("marcoDeSeleccion", () => {
  it("una sola forma: su rectángulo y su giro", () => {
    const e = escena(forma("a", 10, 20, 100, 50, { transformacion: { x: 10, y: 20, ancho: 100, alto: 50, rotacion: 30 } }));
    expect(marcoDeSeleccion(e, ["a"])).toEqual({ x: 10, y: 20, ancho: 100, alto: 50, rotacion: 30, editable: true });
  });
  it("varias, un grupo o una línea: la caja que las envuelve, sin giro", () => {
    const e = escena(forma("a", 0, 0, 50, 50), forma("b", 100, 100, 50, 50), grupo("g", ["a", "b"]), linea("l", [[0, 0], [200, 10]]));
    expect(marcoDeSeleccion(e, ["a", "b"])).toMatchObject({ x: 0, y: 0, ancho: 150, alto: 150, rotacion: 0 });
    expect(marcoDeSeleccion(e, ["g"])).toMatchObject({ ancho: 150, alto: 150, rotacion: 0 });
    expect(marcoDeSeleccion(e, ["l"])).toMatchObject({ ancho: 200, rotacion: 0 });
  });
  it("sin selección o con ids que no existen: null", () => {
    const e = escena(forma("a", 0, 0));
    expect(marcoDeSeleccion(e, [])).toBeNull();
    expect(marcoDeSeleccion(e, ["nada"])).toBeNull();
  });
  it("lo bloqueado se enmarca pero no es editable (ni por sí mismo ni por su grupo)", () => {
    const e = escena(forma("a", 0, 0, 10, 10, { bloqueado: true }), forma("b", 50, 0), forma("c", 100, 0), grupo("g", ["b", "c"], { bloqueado: true }));
    expect(marcoDeSeleccion(e, ["a"])?.editable).toBe(false);
    expect(marcoDeSeleccion(e, ["g"])?.editable).toBe(false);
    expect(marcoDeSeleccion(e, ["a", "g"])?.editable).toBe(false);
  });
});

describe("posicionesDeAsas", () => {
  const m = { x: 100, y: 100, ancho: 200, alto: 100, rotacion: 0, editable: true };
  it("sin giro: esquinas, lados y el asa de rotar encima", () => {
    const p = posicionesDeAsas(m, 1);
    expect(p.nw).toEqual({ x: 100, y: 100 });
    expect(p.se).toEqual({ x: 300, y: 200 });
    expect(p.n).toEqual({ x: 200, y: 100 });
    expect(p.e).toEqual({ x: 300, y: 150 });
    expect(p.rotar).toEqual({ x: 200, y: 100 - DISTANCIA_ASA_ROTAR_PX });
  });
  it("la distancia del asa de rotar es constante en pantalla, sea cual sea el zoom", () => {
    expect(posicionesDeAsas(m, 2).rotar.y).toBeCloseTo(100 - DISTANCIA_ASA_ROTAR_PX / 2, 9);
    expect(posicionesDeAsas(m, 0.5).rotar.y).toBeCloseTo(100 - DISTANCIA_ASA_ROTAR_PX / 0.5, 9);
  });
  it("con giro de 90° el asa «n» queda a la derecha del centro y la de rotar más allá", () => {
    const p = posicionesDeAsas({ ...m, rotacion: 90 }, 1);
    expect(p.n.x).toBeCloseTo(250, 6); // centro (200,150): el borde de arriba, a 50 del centro, pasa al lado derecho
    expect(p.n.y).toBeCloseTo(150, 6);
    expect(p.rotar.x).toBeGreaterThan(p.n.x);
  });
  it("las asas conservan su distancia al centro con cualquier giro", () => {
    for (const rotacion of [0, 33, 90, 200]) {
      const p = posicionesDeAsas({ ...m, rotacion }, 1);
      expect(Math.hypot(p.nw.x - 200, p.nw.y - 150)).toBeCloseTo(Math.hypot(100, 50), 6);
      expect(Math.hypot(p.se.x - 200, p.se.y - 150)).toBeCloseTo(Math.hypot(100, 50), 6);
    }
  });
});

describe("asaEn", () => {
  const m = { x: 100, y: 100, ancho: 200, alto: 100, rotacion: 0, editable: true };
  it("encuentra el asa bajo el cursor dentro de la tolerancia en píxeles", () => {
    expect(asaEn(m, { x: 103, y: 98 }, 1)).toBe("nw");
    expect(asaEn(m, { x: 302, y: 199 }, 1)).toBe("se");
    expect(asaEn(m, { x: 200, y: 100 - DISTANCIA_ASA_ROTAR_PX }, 1)).toBe("rotar");
    expect(asaEn(m, { x: 200, y: 150 }, 1)).toBeNull();
  });
  it("la tolerancia se mide en pantalla: con zoom 2 alcanza la mitad de unidades de escena", () => {
    expect(asaEn(m, { x: 100 + 6, y: 100 }, 1)).toBe("nw");
    expect(asaEn(m, { x: 100 + 6, y: 100 }, 2)).toBeNull();
  });
  it("si no es editable no hay asas", () => {
    expect(asaEn({ ...m, editable: false }, { x: 100, y: 100 }, 1)).toBeNull();
  });
  it("acierta también con el marco girado", () => {
    const g = { ...m, rotacion: 90 };
    const p = posicionesDeAsas(g, 1);
    expect(asaEn(g, { x: p.ne.x + 1, y: p.ne.y - 1 }, 1)).toBe("ne");
  });
});

describe("cursorDeAsa", () => {
  it("sin giro", () => {
    expect(cursorDeAsa("n", 0)).toBe("ns-resize");
    expect(cursorDeAsa("e", 0)).toBe("ew-resize");
    expect(cursorDeAsa("ne", 0)).toBe("nesw-resize");
    expect(cursorDeAsa("se", 0)).toBe("nwse-resize");
    expect(cursorDeAsa("rotar", 0)).toBe("grab");
  });
  it("girado 90° los lados intercambian su cursor", () => {
    expect(cursorDeAsa("n", 90)).toBe("ew-resize");
    expect(cursorDeAsa("e", 90)).toBe("ns-resize");
  });
  it("girado 45° la vertical se vuelve diagonal", () => {
    expect(cursorDeAsa("n", 45)).toBe("nesw-resize");
  });
});
