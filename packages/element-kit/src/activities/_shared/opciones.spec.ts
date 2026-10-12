import { describe, expect, it } from "vitest";
import { hayJuicioDefinido, idsCorrectos, leerCorrecta, normalizarOpcionesTexto, seleccionEsCorrecta } from "./opciones.js";

describe("banco de opciones (U10.1)", () => {
  it("lee `esCorrecta` y, si no está, `correcta`; sin ninguna, `undefined`", () => {
    expect(leerCorrecta({ esCorrecta: true })).toBe(true);
    expect(leerCorrecta({ correcta: false })).toBe(false);
    expect(leerCorrecta({ esCorrecta: false, correcta: true })).toBe(false);
    expect(leerCorrecta({ texto: "x" })).toBeUndefined();
    expect(leerCorrecta({ esCorrecta: "sí" })).toBeUndefined();
    expect(leerCorrecta(null)).toBeUndefined();
  });

  it("`hayJuicioDefinido`: basta UNA opción que declare si es correcta (aunque sea que no)", () => {
    expect(hayJuicioDefinido([{ texto: "a" }, { esCorrecta: false }])).toBe(true);
    expect(hayJuicioDefinido([{ texto: "a" }, { texto: "b" }])).toBe(false);
    expect(hayJuicioDefinido([])).toBe(false);
  });

  it("`idsCorrectos` ignora las sin id y las no correctas", () => {
    expect(idsCorrectos([{ id: "a", esCorrecta: true }, { id: "b", esCorrecta: false }, { esCorrecta: true }, { id: "c", correcta: true }])).toEqual(["a", "c"]);
  });

  it("`seleccionEsCorrecta` exige EXACTAMENTE el conjunto de correctas", () => {
    expect(seleccionEsCorrecta(["a", "b"], ["b", "a"])).toBe(true);
    expect(seleccionEsCorrecta(["a", "b"], ["a"])).toBe(false);
    expect(seleccionEsCorrecta(["a"], ["a", "x"])).toBe(false);
    expect(seleccionEsCorrecta([], [])).toBe(false);
  });

  it("`normalizarOpcionesTexto` recorta, descarta vacías y garantiza una correcta", () => {
    const def = () => [{ texto: "def", correcta: true }];
    expect(normalizarOpcionesTexto([{ texto: " A ", correcta: false }, { texto: "", correcta: true }, { texto: "B" }], 2, def)).toEqual([
      { texto: "A", correcta: true },
      { texto: "B", correcta: false },
    ]);
    expect(normalizarOpcionesTexto([{ texto: "A", correcta: true }, { texto: "B", correcta: true }], 2, def)).toEqual([
      { texto: "A", correcta: true },
      { texto: "B", correcta: true },
    ]);
    expect(normalizarOpcionesTexto([{ texto: "A", correcta: true }], 2, def)).toEqual(def());
  });
});
