/**
 * U9d.2 — paridad de Topo contra su comportamiento ANTERIOR a migrar al `ActivityShell`
 * (Regla 7): los huecos de la rejilla, qué topos asoman y cuánto, el marcador, el reloj, las vidas
 * (fallar un golpe y dejar escapar los topos cuestan una), el avance entre preguntas, cuándo
 * termina el juego y la ÚNICA respuesta `{ puntosObtenidos, puntosMaximos }` al terminar, más lo
 * que `@lumina/scoring` hace con ella. Relojes falsos y azar fijo en 0,5.
 * (Que dejar escapar los topos cueste una vida NO se caracteriza: en el viewer anterior depende de
 * cuándo React evalúa un actualizador de estado y en jsdom nunca ocurre; se fija en la prueba de ajustes.)
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateActivityResponse } from "@lumina/scoring";
import type { TopoActivity } from "@lumina/types/slide";

import { topoDefinition as def } from "./topo-definition.js";

type Props = { estado: unknown; config: Record<string, unknown> };
const Viewer = def.Viewer as unknown as (p: Props) => React.ReactElement;

let original: typeof Element.prototype.getBoundingClientRect;
beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(Math, "random").mockReturnValue(0.5);
  original = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = () =>
    ({ left: 0, top: 0, right: 300, bottom: 300, width: 300, height: 300, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
});
afterEach(() => {
  Element.prototype.getBoundingClientRect = original;
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const topo = (cfg: Partial<TopoActivity["configuracion"]> = {}): TopoActivity => ({
  tipo: "topo",
  configuracion: { velocidad: "lenta", vidas: 3, tiempoLimite: 60, filas: 2, columnas: 3, ...cfg },
  preguntas: [
    { id: "q1", enunciado: "¿Cuánto es 2 + 2?", opciones: [{ texto: "4", correcta: true }, { texto: "3", correcta: false }, { texto: "5", correcta: false }] },
    { id: "q2", enunciado: "¿Capital de Colombia?", opciones: [{ texto: "Bogotá", correcta: true }, { texto: "Cali", correcta: false }, { texto: "Lima", correcta: false }] },
  ],
});

const pasar = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const huecos = () => screen.getAllByRole("button") as HTMLButtonElement[];
const golpear = (t: string) => fireEvent.click(screen.getByRole("button", { name: t }));
/** Cuántos topos asoman ahora (huecos habilitados). */
const asoman = () => huecos().filter((h) => !h.disabled).length;
const TIEMPO_VISIBLE = 2500; // velocidad «lenta»

describe("Topo — paridad con el comportamiento anterior (U9d.2)", () => {
  it("dibuja filas × columnas huecos, asoma un topo por opción y muestra pregunta, «0/2» y reloj", () => {
    render(<Viewer estado={topo()} config={{}} />);
    expect(huecos()).toHaveLength(6);
    expect(asoman()).toBe(3);
    expect(screen.getByText("¿Cuánto es 2 + 2?")).toBeTruthy();
    expect(screen.getByText("0/2")).toBeTruthy();
    expect(screen.getByText(/1:00/)).toBeTruthy();
  });

  it("golpear al topo correcto suma, retira los topos y, a los 400 ms, trae la siguiente pregunta", () => {
    render(<Viewer estado={topo()} config={{}} />);
    golpear("4");
    expect(screen.getByText("1/2")).toBeTruthy();
    pasar(400);
    expect(screen.getByText("¿Capital de Colombia?")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Bogotá" })).toBeTruthy();
  });

  it("un golpe equivocado retira ese topo, cuesta una vida y los demás siguen asomando", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={topo({ vidas: 1 })} config={{ onResponse }} />);
    golpear("3");
    pasar(1000);
    // Con una sola vida, fallar termina el juego.
    expect(onResponse.mock.calls).toEqual([[{ puntosObtenidos: 0, puntosMaximos: 2 }]]);
  });

  it("con varias vidas un fallo no corta la pregunta: el topo sale, los otros siguen y se puede acertar", () => {
    render(<Viewer estado={topo()} config={{}} />);
    golpear("3");
    expect(asoman()).toBe(2);
    expect(screen.getByText("¿Cuánto es 2 + 2?")).toBeTruthy();
    golpear("4");
    expect(screen.getByText("1/2")).toBeTruthy();
  });

  it("si nadie golpea, los topos se esconden tras su tiempo visible y la pregunta pasa sola", () => {
    render(<Viewer estado={topo()} config={{}} />);
    pasar(TIEMPO_VISIBLE);
    expect(asoman()).toBe(0);
    pasar(400);
    expect(screen.getByText("¿Capital de Colombia?")).toBeTruthy();
  });

  it("el reloj descuenta un segundo por segundo", () => {
    render(<Viewer estado={topo()} config={{}} />);
    pasar(1000);
    expect(screen.getByText(/^(0:59|59s)$/)).toBeTruthy(); // el shell formatea «0:59»; antes «59s»
  });

  it("NO emite nada mientras se juega; acertar la última emite UNA respuesta con lo acertado", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={topo()} config={{ onResponse }} />);
    golpear("4");
    pasar(400);
    expect(onResponse).not.toHaveBeenCalled();
    golpear("Bogotá");
    pasar(1000);
    expect(onResponse.mock.calls).toEqual([[{ puntosObtenidos: 2, puntosMaximos: 2 }]]);
    pasar(5000);
    expect(onResponse).toHaveBeenCalledTimes(1);
  });

  it("dejar pasar todas las preguntas sin golpear termina con 0 puntos", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={topo({ vidas: 5 })} config={{ onResponse }} />);
    pasar(TIEMPO_VISIBLE + 400 + TIEMPO_VISIBLE + 1000);
    expect(onResponse.mock.calls).toEqual([[{ puntosObtenidos: 0, puntosMaximos: 2 }]]);
  });

  it("agotar el tiempo termina el juego con lo acertado hasta ahora", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={topo({ tiempoLimite: 5 })} config={{ onResponse }} />);
    golpear("4");
    pasar(5000);
    expect(onResponse.mock.calls).toEqual([[{ puntosObtenidos: 1, puntosMaximos: 2 }]]);
  });

  it("al terminar abre el resultado sin «Reintentar»", () => {
    render(<Viewer estado={topo({ vidas: 1 })} config={{}} />);
    golpear("3");
    pasar(1000);
    expect(screen.getByText("0 de 2 correctas (0%)")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /reintentar/i })).toBeNull();
  });
});

describe("Topo — scoring con la respuesta que sale (U9d.2)", () => {
  it("todos 5 · ninguno 1 · uno de dos 2,5", () => {
    const e = topo();
    const nota = (puntosObtenidos: number) =>
      evaluateActivityResponse("topo", e, { puntosObtenidos, puntosMaximos: 2 }).score;
    expect(nota(2)).toBe(5);
    expect(nota(0)).toBe(1);
    expect(nota(1)).toBe(2.5);
  });
});
