/**
 * U9d.4 — paridad de Historia ramificada contra su comportamiento ANTERIOR a migrar al
 * `ActivityShell` (Regla 7): el nodo actual (título, imagen, texto), las opciones (y las que no
 * tienen conexión), el progreso propio del tipo, «Volver atrás», el feedback de una opción (se ve
 * 1200 ms antes de avanzar), el final (🏆/😔 y respuestas correctas), la ÚNICA respuesta
 * `{ historial }` al llegar a un final, el resultado y lo que `@lumina/scoring` hace con ella.
 * Relojes falsos.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateActivityResponse } from "@lumina/scoring";
import type { HistoriaRamificadaActivity } from "@lumina/types/slide";

import { createDefaultHistoriaRamificada } from "../../activities/historia-ramificada/index.js";
import { historiaRamificadaDefinition as def } from "./historia_ramificada-definition.js";

type Props = { estado: unknown; config: Record<string, unknown> };
const Viewer = def.Viewer as unknown as (p: Props) => React.ReactElement;

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const pasar = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const elegir = (texto: string, espera = 0) => {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(texto) }));
  pasar(espera);
};

const historia = (cfg: Partial<HistoriaRamificadaActivity["configuracion"]> = {}): HistoriaRamificadaActivity => {
  const a = createDefaultHistoriaRamificada();
  return { ...a, configuracion: { ...a.configuracion, ...cfg } };
};

/** Historia con una pregunta evaluable y feedback. */
const conPregunta = (): HistoriaRamificadaActivity => ({
  tipo: "historia_ramificada",
  configuracion: { mostrarProgreso: true, permitirRetroceder: false, tema: "neutro" },
  nodoInicial: "n1",
  nodos: [
    {
      id: "n1",
      tipo: "pregunta",
      titulo: "Pregunta 1",
      contenido: { texto: "¿Cuánto es 2 + 2?" },
      opciones: [
        { id: "a", texto: "Cuatro", esCorrecta: true, feedback: "¡Exacto!" },
        { id: "b", texto: "Cinco", esCorrecta: false },
      ],
    },
    { id: "fin", tipo: "final_bueno", titulo: "Fin", contenido: { texto: "Terminaste" } },
  ] as HistoriaRamificadaActivity["nodos"],
  conexiones: [
    { id: "c1", desdeNodoId: "n1", opcionId: "a", haciaNodoId: "fin" },
    { id: "c2", desdeNodoId: "n1", opcionId: "b", haciaNodoId: "fin" },
  ],
});

describe("Historia ramificada — paridad con el comportamiento anterior (U9d.4)", () => {
  it("muestra el nodo inicial: título, texto y una opción por salida", () => {
    render(<Viewer estado={historia()} config={{}} />);
    expect(screen.getByText("Inicio")).toBeTruthy();
    expect(screen.getByText("Era una noche oscura y tormentosa. ¿Qué harás?")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Entrar al castillo/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Regresar al pueblo/ })).toBeTruthy();
  });

  it("el progreso propio del tipo cuenta pasos y se oculta con `mostrarProgreso = false`", () => {
    const { unmount } = render(<Viewer estado={historia()} config={{}} />);
    expect(screen.getByText("Progreso")).toBeTruthy();
    expect(screen.getByText("0 pasos")).toBeTruthy();
    unmount();
    render(<Viewer estado={historia({ mostrarProgreso: false })} config={{}} />);
    expect(screen.queryByText("Progreso")).toBeNull();
  });

  it("elegir una opción con conexión lleva al nodo siguiente y suma un paso", () => {
    render(<Viewer estado={historia()} config={{}} />);
    elegir("Entrar al castillo");
    expect(screen.getByText("El castillo")).toBeTruthy();
    expect(screen.getByText("1 pasos")).toBeTruthy();
  });

  it("una opción sin conexión queda deshabilitada y lo dice", () => {
    render(<Viewer estado={historia()} config={{}} />);
    elegir("Entrar al castillo");
    const sin = screen.getByRole("button", { name: /Puerta azul/ }) as HTMLButtonElement;
    expect(sin.disabled).toBe(true);
    expect(screen.getByText("(sin conexión)")).toBeTruthy();
  });

  it("«Volver atrás» solo existe con `permitirRetroceder` y devuelve al nodo anterior", () => {
    const { unmount } = render(<Viewer estado={historia()} config={{}} />);
    elegir("Entrar al castillo");
    expect(screen.queryByText("← Volver atrás")).toBeNull();
    unmount();
    render(<Viewer estado={historia({ permitirRetroceder: true })} config={{}} />);
    expect(screen.queryByText("← Volver atrás")).toBeNull(); // en el primer nodo no hay a dónde volver
    elegir("Entrar al castillo");
    fireEvent.click(screen.getByText("← Volver atrás"));
    expect(screen.getByText("Inicio")).toBeTruthy();
  });

  it("el feedback de una opción se muestra, oculta las opciones y avanza a los 1200 ms", () => {
    render(<Viewer estado={conPregunta()} config={{}} />);
    elegir("Cuatro");
    expect(screen.getByText("¡Exacto!")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Cinco/ })).toBeNull();
    pasar(1100);
    expect(screen.getByText("¡Exacto!")).toBeTruthy(); // todavía no
    pasar(200);
    expect(screen.queryByText("¡Exacto!")).toBeNull();
    expect(screen.getByText("Terminaste")).toBeTruthy();
  });

  it("NO emite nada mientras se avanza; al llegar a un final emite UNA respuesta `{ historial }`", () => {
    const onComplete = vi.fn();
    render(<Viewer estado={historia()} config={{ onComplete }} />);
    elegir("Entrar al castillo");
    expect(onComplete).not.toHaveBeenCalled();
    elegir("Puerta roja");
    expect(onComplete.mock.calls).toEqual([
      [
        {
          historial: [
            { nodoId: "nodo-inicio" },
            { nodoId: "nodo-castillo", opcionElegida: "op-1a" },
            { nodoId: "nodo-final-bueno", opcionElegida: "op-2a" },
          ],
        },
      ],
    ]);
    pasar(5000);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("el final muestra 🏆 (bueno) o 😔 (malo) y se pueden elegir finales distintos", () => {
    const { unmount } = render(<Viewer estado={historia()} config={{}} />);
    elegir("Entrar al castillo");
    elegir("Puerta roja");
    expect(screen.getByText("🏆")).toBeTruthy();
    unmount();
    render(<Viewer estado={historia()} config={{}} />);
    elegir("Regresar al pueblo");
    expect(screen.getByText("😔")).toBeTruthy();
    expect(screen.getByText("Regresaste al pueblo. La aventura termina aquí.")).toBeTruthy();
  });

  it("con preguntas evaluables, el final cuenta las respuestas correctas del recorrido", () => {
    render(<Viewer estado={conPregunta()} config={{}} />);
    elegir("Cuatro", 1300);
    expect(screen.getByText("Respuestas correctas: 1")).toBeTruthy();
  });

  it("al llegar al final abre el resultado (a los 800 ms) y NO ofrece «Reintentar»", () => {
    render(<Viewer estado={conPregunta()} config={{}} />);
    elegir("Cuatro", 1300);
    expect(screen.queryByText(/correctas \(/)).toBeNull();
    pasar(1000);
    expect(screen.getByText("1 de 1 correctas (100%)")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /reintentar/i })).toBeNull();
  });
});

describe("Historia ramificada — scoring con la respuesta que sale (U9d.4)", () => {
  it("final bueno 5 · final malo 1; con preguntas, según lo acertado", () => {
    const d = historia();
    const nota = (ids: [string, string?][]) =>
      evaluateActivityResponse("historia_ramificada", d, {
        historial: ids.map(([nodoId, opcionElegida]) => ({ nodoId, ...(opcionElegida ? { opcionElegida } : {}) })),
      }).score;
    expect(nota([["nodo-inicio"], ["nodo-castillo", "op-1a"], ["nodo-final-bueno", "op-2a"]])).toBe(5);
    expect(nota([["nodo-inicio"], ["nodo-pueblo", "op-1b"]])).toBe(1);
    const q = conPregunta();
    const nq = (op: string) =>
      evaluateActivityResponse("historia_ramificada", q, { historial: [{ nodoId: "n1" }, { nodoId: "fin", opcionElegida: op }] }).score;
    expect(nq("a")).toBe(5);
    expect(nq("b")).toBe(1);
  });
});
