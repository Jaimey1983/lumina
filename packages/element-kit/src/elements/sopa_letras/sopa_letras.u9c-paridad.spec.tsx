/**
 * U9c.4 — paridad de Sopa de letras contra su comportamiento ANTERIOR a migrar al `ActivityShell`
 * (Regla 7): la rejilla (una celda por letra), la lista de palabras, el contador, cómo se arrastra
 * una selección en línea (también al revés), qué cuenta como palabra hallada, qué respuesta sale
 * (`{ encontradas }` UNA vez, al hallar la última, sin borradores), que no se ofrece «Reintentar»
 * y lo que `@lumina/scoring` hace con ella.
 * jsdom no tiene layout: se le da un tamaño fijo a todo elemento. El azar de `generarGrid` se
 * reemplaza por una rejilla fija (el contrato de la función no cambia).
 *
 *        c0 c1 c2 c3
 *   f0:  S  O  L  A      SOL: horizontal (0,0)→(0,2)
 *   f1:  M  X  U  X      LUZ: vertical   (0,2)→(2,2)
 *   f2:  X  X  Z  X
 *   f3:  X  X  X  X
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateActivityResponse } from "@lumina/scoring";
import type { SopaLetrasActivity } from "@lumina/types/slide";

const GRID = [
  ["S", "O", "L", "A"],
  ["M", "X", "U", "X"],
  ["X", "X", "Z", "X"],
  ["X", "X", "X", "X"],
];
const celdasDe = (pts: [number, number][]) => pts.map(([fila, columna]) => ({ fila, columna }));
const COLOCADAS = [
  { texto: "SOL", fila: 0, columna: 0, direccion: "horizontal", celdas: celdasDe([[0, 0], [0, 1], [0, 2]]) },
  { texto: "LUZ", fila: 0, columna: 2, direccion: "vertical", celdas: celdasDe([[0, 2], [1, 2], [2, 2]]) },
];

vi.mock("../../activities/sopa-letras/sopa-letras-config.js", async (original) => ({
  ...(await original<typeof import("../../activities/sopa-letras/sopa-letras-config.js")>()),
  generarGrid: () => ({ grid: GRID.map((f) => [...f]), colocadas: COLOCADAS.map((c) => ({ ...c })) }),
}));

import { sopaLetrasDefinition as def } from "./sopa_letras-definition.js";

type Props = { estado: unknown; config: Record<string, unknown> };
const Viewer = def.Viewer as unknown as (p: Props) => React.ReactElement;

let original: typeof Element.prototype.getBoundingClientRect;
beforeEach(() => {
  original = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = () =>
    ({ left: 0, top: 0, right: 300, bottom: 300, width: 300, height: 300, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
});
afterEach(() => {
  Element.prototype.getBoundingClientRect = original;
  cleanup();
});

const sopa = (mostrarLista = true): SopaLetrasActivity => ({
  tipo: "sopa_letras",
  configuracion: { filas: 4, columnas: 4, direcciones: ["horizontal", "vertical"], tema: "general", mostrarLista },
  palabras: [{ texto: "SOL" }, { texto: "LUZ" }] as SopaLetrasActivity["palabras"],
});

/** Celdas de la rejilla en orden de lectura: los elementos hoja con UNA letra. */
const celdas = () =>
  [...document.querySelectorAll("*")].filter(
    (el) => el.children.length === 0 && /^[A-Z]$/.test(el.textContent ?? ""),
  ) as HTMLElement[];
const celda = (f: number, c: number) => celdas()[f * 4 + c]!;
/** Arrastra de la primera a la última celda pasando por las intermedias de la línea. */
function arrastrar(ruta: [number, number][]) {
  fireEvent.mouseDown(celda(...ruta[0]!));
  ruta.slice(1).forEach(([f, c]) => fireEvent.mouseEnter(celda(f, c)));
  fireEvent.mouseUp(celda(...ruta[ruta.length - 1]!));
}
const SOL: [number, number][] = [[0, 0], [0, 1], [0, 2]];
const LUZ: [number, number][] = [[0, 2], [1, 2], [2, 2]];
const hallado = (n: number, total = 2) => screen.getByText(`${n} de ${total} palabras encontradas`);

describe("Sopa de letras — paridad con el comportamiento anterior (U9c.4)", () => {
  it("dibuja una celda por letra de la rejilla, con su letra", () => {
    render(<Viewer estado={sopa()} config={{}} />);
    expect(celdas().map((c) => c.textContent).join("")).toBe(GRID.flat().join(""));
  });

  it("muestra la lista de palabras en mayúsculas y el contador en «0 de 2»", () => {
    render(<Viewer estado={sopa()} config={{}} />);
    expect(screen.getByText("SOL")).toBeTruthy();
    expect(screen.getByText("LUZ")).toBeTruthy();
    expect(hallado(0)).toBeTruthy();
  });

  it("sin `mostrarLista` no hay lista de palabras", () => {
    render(<Viewer estado={sopa(false)} config={{}} />);
    expect(screen.queryByText("LUZ")).toBeNull();
    expect(hallado(0)).toBeTruthy();
  });

  it("arrastrar sobre una palabra en línea la da por hallada", () => {
    render(<Viewer estado={sopa()} config={{}} />);
    arrastrar(SOL);
    expect(hallado(1)).toBeTruthy();
  });

  it("también cuenta al revés (de la última letra a la primera) y en vertical", () => {
    render(<Viewer estado={sopa()} config={{}} />);
    arrastrar([...SOL].reverse());
    expect(hallado(1)).toBeTruthy();
    arrastrar(LUZ);
    expect(hallado(2)).toBeTruthy();
  });

  it("una línea que no es una palabra, un tramo corto o una selección torcida no cuentan", () => {
    render(<Viewer estado={sopa()} config={{}} />);
    arrastrar([[0, 0], [0, 1]]); // SO: tramo corto
    arrastrar([[1, 0], [1, 1], [1, 2]]); // M X U: línea sin palabra
    // Sin línea recta, el fin del arrastre cae a la celda inicial sola: tampoco es palabra.
    fireEvent.mouseDown(celda(0, 0));
    fireEvent.mouseEnter(celda(1, 2));
    fireEvent.mouseUp(celda(1, 2));
    expect(hallado(0)).toBeTruthy();
  });

  it("volver a hallar la misma palabra no suma otra vez", () => {
    render(<Viewer estado={sopa()} config={{}} />);
    arrastrar(SOL);
    arrastrar(SOL);
    expect(hallado(1)).toBeTruthy();
  });

  it("soltar el mouse FUERA de la rejilla cierra el arrastre con lo seleccionado", () => {
    render(<Viewer estado={sopa()} config={{}} />);
    fireEvent.mouseDown(celda(0, 0));
    fireEvent.mouseEnter(celda(0, 1));
    fireEvent.mouseEnter(celda(0, 2));
    fireEvent.mouseLeave(celda(0, 2).parentElement!.parentElement!);
    expect(hallado(1)).toBeTruthy();
  });

  it("NO emite nada mientras falten palabras; al hallar la última, UNA respuesta `{ encontradas }` en el orden hallado", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={sopa()} config={{ onResponse }} />);
    arrastrar(LUZ);
    expect(onResponse).not.toHaveBeenCalled();
    arrastrar(SOL);
    expect(onResponse.mock.calls).toEqual([[{ encontradas: ["LUZ", "SOL"] }]]);
    arrastrar(SOL);
    expect(onResponse).toHaveBeenCalledTimes(1);
  });

  it("al terminar abre el resultado y NO ofrece «Reintentar»", () => {
    render(<Viewer estado={sopa()} config={{}} />);
    arrastrar(SOL);
    arrastrar(LUZ);
    expect(screen.getByText("2 de 2 correctas (100%)")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /reintentar/i })).toBeNull();
  });
});

describe("Sopa de letras — scoring con la respuesta que sale (U9c.4)", () => {
  it("todas halladas puntúan 5; ninguna, 1; solo SOL, 2,5", () => {
    const e = sopa();
    expect(evaluateActivityResponse("sopa_letras", e, { encontradas: ["SOL", "LUZ"] }).score).toBe(5);
    expect(evaluateActivityResponse("sopa_letras", e, { encontradas: [] }).score).toBe(1);
    expect(evaluateActivityResponse("sopa_letras", e, { encontradas: ["SOL"] }).score).toBe(2.5);
  });
});
