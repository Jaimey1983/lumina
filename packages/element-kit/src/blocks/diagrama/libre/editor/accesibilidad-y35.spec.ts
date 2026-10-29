import { describe, expect, it } from "vitest";
import { conectarFormas, fijarColapso, type Elemento, type Escena } from "@lumina/drawing";
import {
  anuncioDeGiro,
  anuncioDeMovimiento,
  anuncioDeRecorrido,
  anuncioDeTamano,
  conexionesDe,
  describirDibujo,
  MAX_CONEXIONES_DICHAS,
} from "./accesibilidad-y35.js";
import { escena, forma, getForma } from "./util-pruebas.js";

const nombre = (e: Elemento): string => (e.tipo === "forma" ? `Forma ${e.id}` : e.tipo === "linea" ? "Flecha" : e.tipo === "texto" ? "Texto" : "Grupo");

describe("anuncioDeMovimiento", () => {
  it("una forma dice dónde quedó", () => {
    const e = escena(forma("a", 101.4, 99.6));
    expect(anuncioDeMovimiento(e, ["a"], nombre, 1, 0)).toBe("Forma a, en X 101, Y 100.");
  });

  it("varios elementos dicen cuánto y hacia dónde", () => {
    const e = escena(forma("a", 0, 0), forma("b", 200, 0), forma("c", 400, 0));
    expect(anuncioDeMovimiento(e, ["a", "b", "c"], nombre, 10, 0)).toBe("3 elementos movidos 10 a la derecha.");
    expect(anuncioDeMovimiento(e, ["a", "b"], nombre, -1, 0)).toBe("2 elementos movidos 1 a la izquierda.");
    expect(anuncioDeMovimiento(e, ["a", "b"], nombre, 0, 10)).toBe("2 elementos movidos 10 hacia abajo.");
    expect(anuncioDeMovimiento(e, ["a", "b"], nombre, 0, -10)).toBe("2 elementos movidos 10 hacia arriba.");
  });

  it("nunca sale NaN ni undefined", () => {
    const e = escena(forma("a", 0, 0));
    expect(anuncioDeMovimiento(e, ["a"], nombre, Number.NaN, 0)).not.toMatch(/NaN|undefined/);
    expect(anuncioDeMovimiento(e, [], nombre, 1, 0)).toBe("0 elementos movidos 1 a la derecha.");
  });
});

describe("anuncioDeTamano y anuncioDeGiro", () => {
  it("una forma dice su tamaño", () => {
    expect(anuncioDeTamano(escena(forma("a", 0, 0, 110, 60.4)), ["a"], nombre)).toBe("Forma a, 110 por 60.");
  });

  it("varios dicen la caja que los abarca", () => {
    const e = escena(forma("a", 0, 0, 100, 50), forma("b", 200, 100, 100, 50));
    expect(anuncioDeTamano(e, ["a", "b"], nombre)).toBe("2 elementos, 300 por 150.");
    expect(anuncioDeTamano(e, [], nombre)).toBe("Nada cambió de tamaño.");
  });

  it("el giro dice el ángulo de la forma o cuánto giraron varias", () => {
    const e = escena(forma("a", 0, 0, 100, 50, { transformacion: { x: 0, y: 0, ancho: 100, alto: 50, rotacion: 30 } }), forma("b", 200, 0));
    expect(anuncioDeGiro(e, ["a"], nombre, 15)).toBe("Forma a, girado a 30°.");
    expect(anuncioDeGiro(e, ["a", "b"], nombre, 15)).toBe("2 elementos girados 15° a la derecha.");
    expect(anuncioDeGiro(e, ["a", "b"], nombre, -15)).toBe("2 elementos girados 15° a la izquierda.");
  });
});

describe("anuncioDeRecorrido", () => {
  it("dice cuál es de cuántos, contando desde 1", () => {
    expect(anuncioDeRecorrido("Forma a", 0, 5)).toBe("Forma a, seleccionado, 1 de 5.");
    expect(anuncioDeRecorrido("Forma e", 4, 5)).toBe("Forma e, seleccionado, 5 de 5.");
  });
});

const arbol = (): Escena => {
  let e = escena(...["a", "b", "c", "d"].map((id, i) => forma(id, 20 + i * 150, 40 + (i % 2) * 100)));
  for (const [p, h] of [["a", "b"], ["a", "c"], ["b", "d"]] as const) e = conectarFormas(e, p, h);
  return e;
};

describe("conexionesDe", () => {
  it("los destinos de los conectores que salen de la forma", () => {
    const e = arbol();
    expect(conexionesDe(e, "a", nombre)).toEqual(["Forma b", "Forma c"]);
    expect(conexionesDe(e, "d", nombre)).toEqual([]);
  });
});

describe("describirDibujo", () => {
  it("un dibujo vacío", () => {
    expect(describirDibujo(escena(), nombre)).toBe("El dibujo está vacío.");
  });

  it("cuenta lo que hay y dice qué se conecta con qué", () => {
    const t = describirDibujo(arbol(), nombre);
    expect(t).toContain("Dibujo de 1000 por 600: 4 formas y 3 conectores.");
    expect(t).toContain("Forma a conecta con Forma b y Forma c.");
    expect(t).toContain("Forma b conecta con Forma d.");
    expect(t).not.toMatch(/NaN|undefined/);
  });

  it("sin conectores solo dice los conteos", () => {
    expect(describirDibujo(escena(forma("a", 0, 0)), nombre)).toBe("Dibujo de 1000 por 600: 1 forma y 0 conectores.");
  });

  it("dice los ocultos y las ramas plegadas", () => {
    const e = fijarColapso(arbol(), ["a"], true);
    expect(describirDibujo(e, nombre)).toContain("1 rama plegada.");
    const oculta = escena(forma("a", 0, 0, 100, 60, { oculto: true }), forma("b", 200, 0));
    expect(describirDibujo(oculta, nombre)).toContain("1 elemento oculto.");
  });

  it("cuenta textos y grupos", () => {
    const e = escena(forma("a", 0, 0), forma("b", 200, 0), { id: "t", tipo: "texto", texto: "hola", transformacion: { x: 0, y: 200, ancho: 100, alto: 30, rotacion: 0 } }, { id: "g", tipo: "grupo", hijos: ["a", "b"] });
    expect(describirDibujo(e, nombre)).toContain("2 formas, 0 conectores, 1 texto y 1 grupo");
  });

  it(`dice como mucho ${MAX_CONEXIONES_DICHAS} formas con conexiones y cuenta el resto`, () => {
    const ids = Array.from({ length: 12 }, (_, i) => `n${String(i).padStart(2, "0")}`);
    let e = escena(...ids.flatMap((id, i) => [forma(id, i * 10, 0), forma(`${id}x`, i * 10, 200)]));
    for (const id of ids) e = conectarFormas(e, id, `${id}x`);
    const t = describirDibujo(e, nombre);
    expect(t.match(/ conecta con /g)).toHaveLength(MAX_CONEXIONES_DICHAS);
    expect(t).toContain("Y 4 formas más con conexiones.");
  });

  it("usa el nombre que le dan las demás partes del editor", () => {
    expect(describirDibujo(arbol(), () => "X")).toContain("X conecta con X y X.");
  });

  it("una escena de 500 elementos se describe sin trabarse (por proporción)", () => {
    const grande = (n: number): Escena => {
      let e = escena(...Array.from({ length: n }, (_, i) => forma(`f${i}`, (i % 25) * 40, Math.floor(i / 25) * 40, 30, 30)));
      for (let i = 1; i < n; i += 2) e = conectarFormas(e, `f${i - 1}`, `f${i}`);
      return e;
    };
    const chico = grande(50);
    const gran = grande(500);
    const medir = (e: Escena): number => {
      const t0 = performance.now();
      for (let i = 0; i < 3; i++) describirDibujo(e, nombre);
      return performance.now() - t0;
    };
    medir(chico);
    const base = Math.max(medir(chico), 0.05);
    // Diez veces más elementos: el tiempo no debe crecer más de ~100x (cuadrático) con holgura para la CI.
    expect(medir(gran)).toBeLessThan(base * 400);
    expect(getForma(gran, "f0").id).toBe("f0");
  });
});
