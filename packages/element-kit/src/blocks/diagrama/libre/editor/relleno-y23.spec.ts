import { describe, expect, it } from "vitest";
import type { Relleno } from "@lumina/drawing";
import { controlesDeMiniBarra } from "./mini-barra.js";
import {
  MAX_PARADAS,
  agregarParada,
  cambiarParada,
  conFormaDeDegradado,
  fijarSombraInterior,
  hojasEditables,
  mezclarColores,
  quitarParada,
  rellenoDeTipo,
  type RellenoDegradado,
} from "./propiedades.js";
import { escena, forma, getForma, linea } from "./util-pruebas.js";

const degradado = (extra: Partial<RellenoDegradado> = {}): RellenoDegradado => ({ tipo: "degradado", desde: "#000000", hasta: "#FFFFFF", angulo: 90, ...extra });
const claves = (o: object): string[] => Object.keys(o);

describe("rellenoDeTipo con patrón", () => {
  it("conserva el color como el de las líneas, sin fondo, diagonal y de 12", () => {
    expect(rellenoDeTipo("patron", { tipo: "solido", color: "#FF0000" })).toEqual({ tipo: "patron", patron: "diagonal", color: "#FF0000", fondo: null, escala: 12 });
    expect(rellenoDeTipo("patron", degradado({ desde: "#00FF00" }))).toMatchObject({ tipo: "patron", color: "#00FF00" });
    expect(rellenoDeTipo("patron", { tipo: "solido", color: "var(--primary)" })).toMatchObject({ color: "var(--primary)" });
  });

  it.each(["#FFFFFF", "#ffffff", "#FFF", "#fff"])("si el relleno de partida es blanco (%s) las líneas son el gris de siempre", (blanco) => {
    expect(rellenoDeTipo("patron", { tipo: "solido", color: blanco })).toMatchObject({ color: "#334155" });
  });

  it("sin relleno o sin nada de partida, también el gris", () => {
    expect(rellenoDeTipo("patron", { tipo: "ninguno" })).toMatchObject({ color: "#334155" });
    expect(rellenoDeTipo("patron", null)).toMatchObject({ color: "#334155" });
  });

  it("de un patrón a sólido o a degradado conserva el color de las líneas", () => {
    const p: Relleno = { tipo: "patron", patron: "puntos", color: "#123456", fondo: "#FEF3C7", escala: 30 };
    expect(rellenoDeTipo("solido", p)).toEqual({ tipo: "solido", color: "#123456" });
    expect(rellenoDeTipo("degradado", p)).toMatchObject({ tipo: "degradado", desde: "#123456", hasta: "#2563EB", angulo: 90 });
  });

  it("de sólido a degradado sigue como siempre, sin campos nuevos", () => {
    expect(claves(rellenoDeTipo("degradado", { tipo: "solido", color: "#FF0000" }))).toEqual(["tipo", "desde", "hasta", "angulo"]);
  });
});

describe("conFormaDeDegradado", () => {
  it("radial conserva ángulo y paradas", () => {
    const r = conFormaDeDegradado(degradado({ angulo: 45, paradas: [{ posicion: 0.5, color: "#FF0000" }] }), "radial");
    expect(r).toEqual({ tipo: "degradado", desde: "#000000", hasta: "#FFFFFF", angulo: 45, forma: "radial", paradas: [{ posicion: 0.5, color: "#FF0000" }] });
  });

  it("lineal quita el campo (lo de antes) y conserva el resto", () => {
    const r = conFormaDeDegradado(degradado({ angulo: 45, forma: "radial", paradas: [{ posicion: 0.5, color: "#FF0000" }] }), "lineal");
    expect(claves(r)).toEqual(["tipo", "desde", "hasta", "angulo", "paradas"]);
    expect(r.angulo).toBe(45);
  });

  it("pasar a lineal un degradado que ya lo era no deja rastro", () => {
    expect(claves(conFormaDeDegradado(degradado(), "lineal"))).toEqual(["tipo", "desde", "hasta", "angulo"]);
  });
});

describe("mezclarColores", () => {
  it.each([
    ["#000000", "#FFFFFF", "#808080"],
    ["#fff", "#000", "#808080"],
    ["#FF0000", "#0000FF", "#800080"],
    ["#FF000080", "#0000FF", "#800080"],
    ["#102030", "#304050", "#203040"],
  ])("%s y %s dan %s", (a, b, esperado) => {
    expect(mezclarColores(a, b)).toBe(esperado);
  });

  it("con un token en cualquiera de los dos, el de la izquierda", () => {
    expect(mezclarColores("#FF0000", "var(--primary)")).toBe("#FF0000");
    expect(mezclarColores("var(--primary)", "#FF0000")).toBe("var(--primary)");
    expect(mezclarColores("var(--primary)", "var(--muted)")).toBe("var(--primary)");
  });
});

describe("agregarParada", () => {
  it("en un degradado sin paradas pone una en el medio con el promedio de los extremos", () => {
    expect(agregarParada(degradado()).paradas).toEqual([{ posicion: 0.5, color: "#808080" }]);
  });

  it("va al punto medio del tramo más ancho", () => {
    // tramos: 0–0,2 (0,2), 0,2–1 (0,8) → el segundo: 0,6
    const r = agregarParada(degradado({ paradas: [{ posicion: 0.2, color: "#FF0000" }] }));
    expect(r.paradas?.map((p) => p.posicion)).toEqual([0.2, 0.6]);
    expect(r.paradas?.[1]?.color).toBe(mezclarColores("#FF0000", "#FFFFFF"));
  });

  it("con el tramo más ancho a la izquierda, ahí", () => {
    const r = agregarParada(degradado({ paradas: [{ posicion: 0.8, color: "#FF0000" }] }));
    expect(r.paradas?.map((p) => p.posicion)).toEqual([0.4, 0.8]);
    expect(r.paradas?.[0]?.color).toBe(mezclarColores("#000000", "#FF0000"));
  });

  it("si empatan, el primer tramo", () => {
    const r = agregarParada(degradado({ paradas: [{ posicion: 0.5, color: "#FF0000" }] }));
    expect(r.paradas?.map((p) => p.posicion)).toEqual([0.25, 0.5]);
  });

  it("con un token vecino usa el color de la izquierda", () => {
    const r = agregarParada(degradado({ desde: "var(--primary)", hasta: "#FFFFFF" }));
    expect(r.paradas).toEqual([{ posicion: 0.5, color: "var(--primary)" }]);
  });

  it("deja las paradas ordenadas", () => {
    const r = agregarParada(degradado({ paradas: [{ posicion: 0.9, color: "#FF0000" }] }));
    const pos = r.paradas?.map((p) => p.posicion) ?? [];
    expect(pos).toEqual([...pos].sort((a, b) => a - b));
  });

  it("con el tope devuelve el mismo relleno", () => {
    const lleno = degradado({ paradas: [{ posicion: 0.2, color: "#111111" }, { posicion: 0.5, color: "#222222" }, { posicion: 0.8, color: "#333333" }] });
    expect(MAX_PARADAS).toBe(3);
    expect(agregarParada(lleno)).toBe(lleno);
  });

  it("no toca lo demás (forma, ángulo, extremos)", () => {
    const r = agregarParada(degradado({ forma: "radial", angulo: 33 }));
    expect(r).toMatchObject({ forma: "radial", angulo: 33, desde: "#000000", hasta: "#FFFFFF" });
  });
});

describe("quitarParada y cambiarParada", () => {
  const tres = degradado({ paradas: [{ posicion: 0.2, color: "#111111" }, { posicion: 0.5, color: "#222222" }, { posicion: 0.8, color: "#333333" }] });

  it("quitar una deja las otras", () => {
    expect(quitarParada(tres, 1).paradas?.map((p) => p.color)).toEqual(["#111111", "#333333"]);
  });

  it("quitar la última quita el campo entero (lo de antes)", () => {
    const una = degradado({ paradas: [{ posicion: 0.5, color: "#111111" }] });
    expect(claves(quitarParada(una, 0))).toEqual(["tipo", "desde", "hasta", "angulo"]);
  });

  it("cambiar el color no mueve la posición", () => {
    expect(cambiarParada(tres, 1, { color: "#ABCDEF" }).paradas?.[1]).toEqual({ posicion: 0.5, color: "#ABCDEF" });
  });

  it("cambiar la posición la acota a [0,05; 0,95] y reordena", () => {
    expect(cambiarParada(tres, 0, { posicion: 0.6 }).paradas?.map((p) => p.posicion)).toEqual([0.5, 0.6, 0.8]);
    expect(cambiarParada(tres, 0, { posicion: -3 }).paradas?.[0]?.posicion).toBe(0.05);
    expect(cambiarParada(tres, 2, { posicion: 9 }).paradas?.[2]?.posicion).toBe(0.95);
  });

  it("un índice que no existe devuelve el mismo relleno", () => {
    expect(cambiarParada(tres, 7, { color: "#000000" })).toBe(tres);
  });
});

describe("fijarSombraInterior", () => {
  const e = escena(
    forma("A", 0, 0, 100, 60, { estilo: { sombra: { color: "#00000055", desenfoque: 8, dx: 2, dy: 4 } } }),
    forma("B", 200, 0, 100, 60),
    linea("L", [[0, 100], [100, 100]]),
  );
  const destino = (ids: string[]) => hojasEditables(e, ids);

  it("la pone y la quita sin dejar rastro, conservando el resto de la sombra", () => {
    const con = fijarSombraInterior(e, destino(["A"]), true);
    expect(getForma(con, "A").estilo.sombra).toEqual({ color: "#00000055", desenfoque: 8, dx: 2, dy: 4, interior: true });
    const sin = fijarSombraInterior(con, hojasEditables(con, ["A"]), false);
    expect(claves(getForma(sin, "A").estilo.sombra as object)).toEqual(["color", "desenfoque", "dx", "dy"]);
  });

  it("una forma sin sombra sigue sin sombra", () => {
    expect(getForma(fijarSombraInterior(e, destino(["B"]), true), "B").estilo.sombra).toBeNull();
  });
});

describe("la mini barra con un patrón", () => {
  it("muestra el color de las líneas", () => {
    const e = escena(forma("A", 0, 0, 100, 60, { estilo: { relleno: { tipo: "patron", patron: "rayas", color: "#123456", fondo: "#FEF3C7", escala: 12 } } }));
    expect(controlesDeMiniBarra(e, ["A"])?.relleno).toEqual({ mixto: false, valor: "#123456" });
  });
});
