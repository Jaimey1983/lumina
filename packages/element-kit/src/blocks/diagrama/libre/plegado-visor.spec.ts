import { describe, expect, it } from "vitest";
import { conectarFormas, fijarColapso, normalizarEscena, type Escena, type Forma } from "@lumina/drawing";
import { alternar, anuncioDeRama, aplicarPlegadoLocal, SIN_ALTERNADAS } from "./plegado-visor.js";

const forma = (id: string, x = 0, y = 0, extra: Record<string, unknown> = {}) => ({ id, tipo: "forma", forma: "rectangulo", transformacion: { x, y, ancho: 100, alto: 60, rotacion: 0 }, ...extra });
/** raiz → a, b; a → a1, a2; b → b1. */
const arbol = (): Escena => {
  let e = normalizarEscena({ ancho: 800, alto: 400, elementos: ["raiz", "a", "b", "a1", "a2", "b1"].map((id, i) => forma(id, 20 + i * 120, 20 + (i % 3) * 90)) });
  for (const [p, h] of [["raiz", "a"], ["raiz", "b"], ["a", "a1"], ["a", "a2"], ["b", "b1"]] as const) e = conectarFormas(e, p, h);
  return e;
};
const plegada = (e: Escena, id: string): boolean => (e.elementos.find((x) => x.id === id) as Forma).colapsado === true;

describe("Y38c — alternar", () => {
  it("agrega y quita, sin tocar el conjunto recibido", () => {
    const a = alternar(SIN_ALTERNADAS, "x");
    expect([...a]).toEqual(["x"]);
    expect(SIN_ALTERNADAS.size).toBe(0);
    const b = alternar(a, "x");
    expect(b.size).toBe(0);
    expect([...a]).toEqual(["x"]);
  });
});

describe("Y38c — aplicarPlegadoLocal", () => {
  it("sin ramas alternadas devuelve la misma escena", () => {
    const e = arbol();
    expect(aplicarPlegadoLocal(e, SIN_ALTERNADAS)).toBe(e);
  });

  it("pliega una rama que el docente dejó desplegada", () => {
    const r = aplicarPlegadoLocal(arbol(), new Set(["a"]));
    expect(plegada(r, "a")).toBe(true);
    expect(plegada(r, "b")).toBe(false);
  });

  it("despliega una que el docente dejó plegada", () => {
    const docente = fijarColapso(arbol(), ["a"], true);
    expect(plegada(aplicarPlegadoLocal(docente, new Set(["a"])), "a")).toBe(false);
  });

  it("varias a la vez, cada una respecto de lo suyo", () => {
    const docente = fijarColapso(arbol(), ["a"], true);
    const r = aplicarPlegadoLocal(docente, new Set(["a", "b"]));
    expect(plegada(r, "a")).toBe(false);
    expect(plegada(r, "b")).toBe(true);
  });

  it("ignora lo que no se puede plegar: un id que no existe, una forma sin hijos", () => {
    const e = arbol();
    expect(aplicarPlegadoLocal(e, new Set(["no-existe", "a1", "b1"]))).toBe(e);
  });

  it("no modifica la escena de origen", () => {
    const e = arbol();
    aplicarPlegadoLocal(e, new Set(["a"]));
    expect(plegada(e, "a")).toBe(false);
  });

  it("alternar dos veces la misma rama deja la escena del docente", () => {
    const e = arbol();
    const una = aplicarPlegadoLocal(e, alternar(SIN_ALTERNADAS, "a"));
    const dos = aplicarPlegadoLocal(e, alternar(alternar(SIN_ALTERNADAS, "a"), "a"));
    expect(plegada(una, "a")).toBe(true);
    expect(dos).toBe(e);
  });
});

describe("Y38c — anuncioDeRama (las frases del editor)", () => {
  it("rama plegada: cuántos elementos oculta, en singular y plural", () => {
    expect(anuncioDeRama(fijarColapso(arbol(), ["a"], true), "a")).toBe("Rama plegada: 2 elementos ocultos.");
    expect(anuncioDeRama(fijarColapso(arbol(), ["b"], true), "b")).toBe("Rama plegada: 1 elemento oculto.");
  });

  it("rama desplegada", () => {
    expect(anuncioDeRama(arbol(), "a")).toBe("Rama desplegada.");
  });

  it("una plegada que no oculta nada (sus hijos se ven por otro camino)", () => {
    let e = normalizarEscena({ elementos: ["r", "p", "q", "h"].map((id, i) => forma(id, i * 120)) });
    for (const [a, b] of [["r", "p"], ["r", "q"], ["p", "h"], ["q", "h"]] as const) e = conectarFormas(e, a, b);
    expect(anuncioDeRama(fijarColapso(e, ["p"], true), "p")).toBe("Rama plegada: no oculta ningún elemento.");
  });

  it("un id que no es una forma, nada que decir", () => {
    expect(anuncioDeRama(arbol(), "no-existe")).toBe("");
  });
});
