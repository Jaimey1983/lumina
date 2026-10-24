import { describe, expect, it } from "vitest";
import type { CambioDeAjuste } from "@lumina/drawing";
import { ajusteDeSeleccion, elementosConTexto, estadoDelTextoElegido, mensajeDeAjuste, motivoDeAjuste } from "./ajuste-texto.js";
import { escena, forma, linea } from "./util-pruebas.js";

const CINCO = "Uno\nDos\nTres\nCuatro\nCinco";
const cambio = (extra: Partial<CambioDeAjuste> = {}): CambioDeAjuste => ({ id: "a", altoAntes: 60, altoDespues: 108, frenadoPorVecina: false, noCabe: false, ...extra });

describe("mensajeDeAjuste", () => {
  it("sin cambios no dice nada", () => {
    expect(mensajeDeAjuste([])).toBe("");
  });

  it("una forma que crece dice cuánto", () => {
    expect(mensajeDeAjuste([cambio()])).toBe("La forma creció 48 unidades.");
  });

  it("una que se encoge, también", () => {
    expect(mensajeDeAjuste([cambio({ altoAntes: 200, altoDespues: 28 })])).toBe("La forma se encogió 172 unidades.");
  });

  it("una unidad va en singular", () => {
    expect(mensajeDeAjuste([cambio({ altoAntes: 60, altoDespues: 61 })])).toBe("La forma creció 1 unidad.");
  });

  it("si una vecina la frenó, lo dice", () => {
    expect(mensajeDeAjuste([cambio({ altoDespues: 92, frenadoPorVecina: true, noCabe: true })])).toBe("La forma creció 32 unidades; el texto no cabe del todo: hay una forma debajo.");
  });

  it("si no cabe del todo por otro motivo (el tope), lo dice sin culpar a una vecina", () => {
    expect(mensajeDeAjuste([cambio({ altoDespues: 80, noCabe: true })])).toBe("La forma creció 20 unidades; el texto no cabe del todo.");
  });

  it("varias dicen cuántas, y cuántas se detuvieron", () => {
    expect(mensajeDeAjuste([cambio(), cambio({ id: "b" }), cambio({ id: "c" })])).toBe("3 elementos ajustados al texto.");
    expect(mensajeDeAjuste([cambio(), cambio({ id: "b", frenadoPorVecina: true })])).toBe("2 elementos ajustados al texto; 1 se detuvo antes de pisar una forma.");
    expect(mensajeDeAjuste([cambio({ frenadoPorVecina: true }), cambio({ id: "b", frenadoPorVecina: true })])).toBe("2 elementos ajustados al texto; 2 se detuvieron antes de pisar una forma.");
  });
});

describe("el comando: cuándo se puede", () => {
  const e = escena(
    forma("A", 0, 0, 200, 60, { texto: CINCO }),
    forma("B", 300, 0, 200, 200, { texto: "Uno" }),
    forma("C", 600, 0, 200, 28, { texto: "Uno" }),
    forma("S", 900, 0, 200, 60),
    forma("X", 0, 300, 200, 60, { texto: CINCO, bloqueado: true }),
    linea("L", [[0, 500], [100, 500]], { texto: CINCO }),
  );

  it("con una forma cuyo texto no cabe: true", () => {
    expect(motivoDeAjuste(e, ["A"])).toBe(true);
  });

  it("con una que sobra (encogería): true", () => {
    expect(motivoDeAjuste(e, ["B"])).toBe(true);
  });

  it("con una que ya está justa: «Ya cabe»", () => {
    expect(motivoDeAjuste(e, ["C"])).toBe("Ya cabe");
  });

  it("sin texto, bloqueada, un conector o nada elegido: pide una forma o un texto con texto", () => {
    for (const sel of [["S"], ["X"], ["L"], []]) expect(motivoDeAjuste(e, sel)).toBe("Elige una forma o un texto con texto");
  });

  it("elementosConTexto cuenta solo lo editable que tiene texto", () => {
    expect(elementosConTexto(e, ["A", "S", "X", "L"]).map((h) => h.id)).toEqual(["A"]);
  });

  it("recuerda la última cuenta: con la misma escena y selección devuelve el mismo resultado", () => {
    const sel = ["A"];
    expect(ajusteDeSeleccion(e, sel)).toBe(ajusteDeSeleccion(e, sel));
    expect(ajusteDeSeleccion(e, ["A"])).not.toBe(ajusteDeSeleccion(e, sel));
  });
});

describe("estadoDelTextoElegido", () => {
  const e = escena(forma("A", 0, 0, 200, 60, { texto: CINCO }), forma("B", 300, 0, 200, 100, { texto: "Uno" }), linea("L", [[0, 500], [100, 500]]));

  it("de una sola forma: lo que hace el render con su texto", () => {
    expect(estadoDelTextoElegido(e, ["A"])).toEqual({ tipo: "reduce", tamano: 8 });
    expect(estadoDelTextoElegido(e, ["B"])).toEqual({ tipo: "cabe" });
  });

  it("con varias elegidas, un conector o nada: null", () => {
    expect(estadoDelTextoElegido(e, ["A", "B"])).toBeNull();
    expect(estadoDelTextoElegido(e, ["L"])).toBeNull();
    expect(estadoDelTextoElegido(e, [])).toBeNull();
  });
});
