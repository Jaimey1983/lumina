/**
 * U9c.3 — paridad de Crucigrama contra su comportamiento ANTERIOR a migrar al `ActivityShell`
 * (Regla 7): la rejilla y sus celdas, la pista de la palabra activa (y cómo alterna H/V), cómo se
 * escribe y se avanza, qué respuesta sale (`{ celdas }` al verificar, una vez, sin borradores), el
 * bloqueo y lo que `@lumina/scoring` hace con ella.
 * jsdom no tiene layout: se le da un tamaño fijo a todo elemento para que la rejilla calcule las celdas.
 *
 * Fixture: SOL (horizontal) y SAL (vertical) se cruzan en la S de (0,0). Celdas, en orden de
 * lectura: (0,0) S · (0,1) O · (0,2) L · (1,0) A · (2,0) L.
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateActivityResponse } from "@lumina/scoring";
import type { CrucigramaActivity } from "@lumina/types/slide";

import { CrucigramaViewer as ViewerComponente } from "../../activities/crucigrama/index.js";
import { crucigramaDefinition } from "./crucigrama-definition.js";

type Props = { estado: unknown; config: Record<string, unknown> };
const Viewer = crucigramaDefinition.Viewer as unknown as (p: Props) => React.ReactElement;

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

const crucigrama = (): CrucigramaActivity => ({
  tipo: "crucigrama",
  configuracion: { tamanoCelda: 40, colorCelda: "#ffffff", colorTexto: "#111111" },
  palabras: [
    { id: "p1", texto: "SOL", pista: "Brilla de día", direccion: "horizontal", fila: 0, columna: 0 },
    { id: "p2", texto: "SAL", pista: "Condimento blanco", direccion: "vertical", fila: 0, columna: 0 },
  ],
});

const celdas = () => [...document.querySelectorAll("input")] as HTMLInputElement[];
const [C00, C01, C02, C10, C20] = [0, 1, 2, 3, 4];
const escribir = (i: number, v: string) => fireEvent.change(celdas()[i]!, { target: { value: v } });
const verificar = () => screen.getByRole("button", { name: "Verificar" });
const rellenar = (letras: string[]) => letras.forEach((l, i) => escribir(i, l));

describe("Crucigrama — paridad con el comportamiento anterior (U9c.3)", () => {
  it("dibuja una celda por casilla de palabra (5), con el número de cada palabra en su inicio", () => {
    render(<Viewer estado={crucigrama()} config={{}} />);
    expect(celdas()).toHaveLength(5);
    expect(screen.getByText("Haz clic en una celda para ver la pista")).toBeTruthy();
    // La casilla (0,0) lleva el número de la primera palabra que empieza ahí.
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);
  });

  it("lista las pistas en «Horizontales» y «Verticales» con su número", () => {
    render(<Viewer estado={crucigrama()} config={{}} />);
    expect(screen.getByText("Horizontales")).toBeTruthy();
    expect(screen.getByText("Verticales")).toBeTruthy();
    expect(screen.getByText("Brilla de día")).toBeTruthy();
    expect(screen.getByText("Condimento blanco")).toBeTruthy();
  });

  it("tocar una celda solo horizontal muestra «1H.» con su pista; solo vertical, «2V.»", () => {
    render(<Viewer estado={crucigrama()} config={{}} />);
    fireEvent.click(celdas()[C01]!);
    expect(screen.getByText("1H.")).toBeTruthy();
    fireEvent.click(celdas()[C10]!);
    expect(screen.getByText("2V.")).toBeTruthy();
  });

  it("en el cruce (0,0): empieza por la horizontal y cada toque alterna H ↔ V", () => {
    render(<Viewer estado={crucigrama()} config={{}} />);
    fireEvent.click(celdas()[C00]!);
    expect(screen.getByText("1H.")).toBeTruthy();
    fireEvent.click(celdas()[C00]!);
    expect(screen.getByText("2V.")).toBeTruthy();
    fireEvent.click(celdas()[C00]!);
    expect(screen.getByText("1H.")).toBeTruthy();
  });

  it("escribir deja UNA letra en mayúscula (la última tecleada) y avanza el foco por la palabra activa", () => {
    render(<Viewer estado={crucigrama()} config={{}} />);
    fireEvent.click(celdas()[C00]!); // activa SOL (horizontal)
    escribir(C00, "s");
    expect(celdas()[C00]!.value).toBe("S");
    expect(document.activeElement).toBe(celdas()[C01]!);
    escribir(C01, "xo");
    expect(celdas()[C01]!.value).toBe("O");
    expect(document.activeElement).toBe(celdas()[C02]!);
  });

  it("con la vertical activa el foco baja; al borrar una letra no avanza", () => {
    render(<Viewer estado={crucigrama()} config={{}} />);
    fireEvent.click(celdas()[C10]!); // activa SAL (vertical)
    escribir(C10, "a");
    expect(document.activeElement).toBe(celdas()[C20]!);
    celdas()[C10]!.focus();
    escribir(C10, "");
    expect(celdas()[C10]!.value).toBe("");
    expect(document.activeElement).toBe(celdas()[C10]!);
  });

  it("«Verificar» siempre está disponible y emite UNA vez `{ celdas }` con lo escrito (sin borradores)", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={crucigrama()} config={{ onResponse }} />);
    escribir(C00, "s");
    escribir(C01, "o");
    expect(onResponse).not.toHaveBeenCalled();
    fireEvent.click(verificar());
    expect(onResponse.mock.calls).toEqual([[{ celdas: { "0-0": "S", "0-1": "O" } }]]);
    expect(screen.queryByRole("button", { name: "Verificar" })).toBeNull();
  });

  it("tras verificar muestra la nota (sin «Reintentar») y las celdas quedan de solo lectura", () => {
    render(<Viewer estado={crucigrama()} config={{}} />);
    rellenar(["S", "O", "L", "A", "L"]);
    fireEvent.click(verificar());
    expect(screen.getByText("5.0")).toBeTruthy();
    expect(screen.getByText("¡Muy bien!")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Reintentar" })).toBeNull();
    expect(celdas().every((c) => c.readOnly)).toBe(true);
    escribir(C00, "x");
    expect(celdas()[C00]!.value).toBe("S");
  });

  it("calificación con @lumina/scoring: todo bien 5, todo mal nota mínima, una de dos (2,5)", () => {
    const a = crucigrama();
    const nota = (c: Record<string, string>) => {
      const ev = evaluateActivityResponse("crucigrama", a, { celdas: c });
      return { correct: ev.correct, score: ev.score };
    };
    expect(nota({ "0-0": "S", "0-1": "O", "0-2": "L", "1-0": "A", "2-0": "L" })).toEqual({ correct: true, score: 5 });
    expect(nota({})).toEqual({ correct: false, score: 1 });
    expect(nota({ "0-0": "S", "0-1": "O", "0-2": "L" })).toEqual({ correct: false, score: 2.5 });
  });

  it("el componente (prop `actividad`) acepta `onResponse` directo", () => {
    const onResponse = vi.fn();
    render(<ViewerComponente actividad={crucigrama()} onResponse={onResponse} />);
    fireEvent.click(verificar());
    expect(onResponse).toHaveBeenCalledTimes(1);
  });
});
