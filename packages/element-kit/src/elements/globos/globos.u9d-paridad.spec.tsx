/**
 * U9d.1 — paridad de Globos contra su comportamiento ANTERIOR a migrar al `ActivityShell`
 * (Regla 7): los globos que suben, el marcador, el reloj, las vidas (fallar y dejar escapar un
 * globo cuestan una), el avance entre preguntas, cuándo termina el juego y la ÚNICA respuesta
 * `{ puntosObtenidos, puntosMaximos }` que sale al terminar, más lo que `@lumina/scoring` hace con ella.
 * (Que un globo escapado cueste una vida NO se caracteriza: en el viewer anterior depende de cuándo
 * React evalúa un actualizador de estado y no es reproducible en jsdom; se fija en la prueba de ajustes.)
 * El azar se fija en 0,5 y la altura del contenedor en 400 px (jsdom no tiene layout).
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateActivityResponse } from "@lumina/scoring";
import type { GlobosActivity } from "@lumina/types/slide";

import { globosDefinition as def } from "./globos-definition.js";

type Props = { estado: unknown; config: Record<string, unknown> };
const Viewer = def.Viewer as unknown as (p: Props) => React.ReactElement;

let alto: PropertyDescriptor | undefined;
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "requestAnimationFrame", "cancelAnimationFrame", "performance", "Date"] });
  vi.spyOn(Math, "random").mockReturnValue(0.5);
  alto = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientHeight");
  Object.defineProperty(HTMLElement.prototype, "clientHeight", { configurable: true, get: () => 400 });
});
afterEach(() => {
  if (alto) Object.defineProperty(HTMLElement.prototype, "clientHeight", alto);
  else delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientHeight;
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const globos = (cfg: Partial<GlobosActivity["configuracion"]> = {}): GlobosActivity => ({
  tipo: "globos",
  configuracion: { velocidad: "lenta", vidas: 3, tiempoLimite: 60, colorGlobos: ["#EF4444", "#3B82F6"], ...cfg },
  preguntas: [
    {
      id: "q1",
      enunciado: "¿Cuánto es 2 + 2?",
      opciones: [
        { texto: "4", correcta: true },
        { texto: "3", correcta: false },
        { texto: "5", correcta: false },
      ],
    },
    {
      id: "q2",
      enunciado: "¿Capital de Colombia?",
      opciones: [
        { texto: "Bogotá", correcta: true },
        { texto: "Cali", correcta: false },
        { texto: "Lima", correcta: false },
      ],
    },
  ],
});

const pasar = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const globo = (t: string) => screen.getByRole("button", { name: t });
const pinchar = (t: string) => fireEvent.click(globo(t));
/** Pincha la correcta de la pregunta en curso y deja pasar el avance (450 ms). */
const acertar = (t: string) => {
  pinchar(t);
  pasar(500);
};

describe("Globos — paridad con el comportamiento anterior (U9d.1)", () => {
  it("muestra la pregunta, un globo por opción, el marcador «0/2» y el reloj", () => {
    render(<Viewer estado={globos()} config={{}} />);
    expect(screen.getByText("¿Cuánto es 2 + 2?")).toBeTruthy();
    for (const t of ["4", "3", "5"]) expect(globo(t)).toBeTruthy();
    expect(screen.getByText("0/2")).toBeTruthy();
    expect(screen.getByText(/1:00/)).toBeTruthy();
  });

  it("acertar suma un punto y, tras el avance, trae los globos de la siguiente pregunta", () => {
    render(<Viewer estado={globos()} config={{}} />);
    acertar("4");
    expect(screen.getByText("1/2")).toBeTruthy();
    expect(screen.getByText("¿Capital de Colombia?")).toBeTruthy();
    expect(globo("Bogotá")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "3" })).toBeNull();
  });

  it("el reloj descuenta un segundo por segundo", () => {
    render(<Viewer estado={globos()} config={{}} />);
    pasar(5000);
    expect(screen.getByText(/^(0:55|55s)$/)).toBeTruthy(); // el shell formatea «0:55»; antes «55s»
  });

  it("NO emite nada mientras se juega; al contestar la última emite UNA respuesta con lo acertado", () => {
    const onComplete = vi.fn();
    render(<Viewer estado={globos()} config={{ onComplete }} />);
    acertar("4");
    expect(onComplete).not.toHaveBeenCalled();
    acertar("Bogotá");
    expect(onComplete.mock.calls).toEqual([[{ puntosObtenidos: 2, puntosMaximos: 2 }]]);
    pasar(5000);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("una opción equivocada cuesta una vida y NO suma; con 3 vidas, tres fallos terminan el juego", () => {
    const onComplete = vi.fn();
    render(<Viewer estado={globos({ vidas: 3 })} config={{ onComplete }} />);
    pinchar("3"); // pregunta 1 → falla (vida 2), pasa a la 2
    pasar(500);
    pinchar("Cali"); // vida 1, última pregunta → termina
    pasar(500);
    expect(onComplete.mock.calls).toEqual([[{ puntosObtenidos: 0, puntosMaximos: 2 }]]);
  });

  it("con 1 vida, un solo fallo termina el juego aunque queden preguntas", () => {
    const onComplete = vi.fn();
    render(<Viewer estado={globos({ vidas: 1 })} config={{ onComplete }} />);
    pinchar("3");
    pasar(1000);
    expect(onComplete.mock.calls).toEqual([[{ puntosObtenidos: 0, puntosMaximos: 2 }]]);
  });

  it("agotar el tiempo termina el juego con lo acertado hasta ahora", () => {
    const onComplete = vi.fn();
    render(<Viewer estado={globos({ tiempoLimite: 5 })} config={{ onComplete }} />);
    acertar("4");
    pasar(5000);
    expect(onComplete.mock.calls).toEqual([[{ puntosObtenidos: 1, puntosMaximos: 2 }]]);
  });

  it("los globos suben solos y, al salir por arriba, desaparecen", () => {
    render(<Viewer estado={globos({ velocidad: "rapida", tiempoLimite: 300 })} config={{}} />);
    expect(screen.getAllByRole("button")).toHaveLength(3);
    pasar(1000);
    expect(screen.getAllByRole("button")).toHaveLength(3);
    pasar(7000);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("al terminar abre el resultado y no se puede seguir pinchando", () => {
    const onComplete = vi.fn();
    render(<Viewer estado={globos({ vidas: 1 })} config={{ onComplete }} />);
    pinchar("3");
    pasar(1000);
    expect(screen.getByText("0 de 2 correctas (0%)")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /reintentar/i })).toBeNull();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

describe("Globos — scoring con la respuesta que sale (U9d.1)", () => {
  it("todos 5 · ninguno 1 · uno de dos, 2,5", () => {
    const e = globos();
    const nota = (puntosObtenidos: number) =>
      evaluateActivityResponse("globos", e, { puntosObtenidos, puntosMaximos: 2 }).score;
    expect(nota(2)).toBe(5);
    expect(nota(0)).toBe(1);
    expect(nota(1)).toBe(2.5);
  });
});
