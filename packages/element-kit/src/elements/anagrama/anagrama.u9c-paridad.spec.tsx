/**
 * U9c.2 — paridad de Anagrama contra su comportamiento ANTERIOR a migrar al `ActivityShell`
 * (Regla 7): letras mezcladas, cómo se colocan, la verificación automática al llenar la palabra,
 * «Reintentar» por palabra, qué respuesta sale (`{ slotsPorPalabra }` al finalizar, una vez, sin
 * borradores) y lo que `@lumina/scoring` hace con ella.
 *
 * El arrastre se simula entregando el evento de dnd-kit (`onDragEnd`) a través de un `DndContext`
 * falso. Los ids (`letra-<i>-<L>`, `slot-<i>`) son el contrato del evento.
 *
 * NO se fija (es un defecto del viejo, se corrige al migrar y se prueba aparte): el «Reintentar» del
 * resultado final dejaba la actividad sin letras disponibles.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateActivityResponse } from "@lumina/scoring";
import type { AnagramaActivity } from "@lumina/types/slide";

type Ev = { active: { id: string }; over: { id: string } | null };
const captura = vi.hoisted(() => ({ alSoltar: null as null | ((e: Ev) => void) }));
vi.mock("@dnd-kit/core", async (original) => {
  const real = await original<typeof import("@dnd-kit/core")>();
  return {
    ...real,
    DndContext: ({ children, onDragEnd }: { children: React.ReactNode; onDragEnd?: (e: Ev) => void }) => {
      captura.alSoltar = onDragEnd ?? null;
      return <>{children}</>;
    },
    DragOverlay: () => null,
  };
});

import { AnagramaViewer as ViewerComponente } from "../../activities/anagrama/index.js";
import { anagramaDefinition } from "./anagrama-definition.js";

type Props = { estado: unknown; config: Record<string, unknown> };
const Viewer = anagramaDefinition.Viewer as unknown as (p: Props) => React.ReactElement;

beforeEach(() => {
  let i = 0;
  const seq = [0.11, 0.87, 0.32, 0.64, 0.19, 0.73, 0.41, 0.58, 0.26, 0.91];
  vi.spyOn(Math, "random").mockImplementation(() => seq[i++ % seq.length]!);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  captura.alSoltar = null;
});

const anagrama = (config: Partial<AnagramaActivity["configuracion"]> = {}): AnagramaActivity => ({
  tipo: "anagrama",
  configuracion: { mostrarPista: true, intentos: 3, ...config },
  palabras: [
    { texto: "SOL", pista: "Brilla de día" },
    { texto: "LUNA" },
  ],
});

const soltar = (id: string, sobre: string | null) =>
  act(() => captura.alSoltar!({ active: { id }, over: sobre ? { id: sobre } : null }));
/** Letras sueltas, en orden (las piezas de «Letras disponibles»). */
const origen = () => {
  const zona = screen.getByText("Letras disponibles:").parentElement!;
  return [...zona.querySelectorAll<HTMLElement>("div")].filter((d) => d.children.length === 1 && d.textContent!.length === 1).map((d) => d.textContent!);
};
/** Ids de las letras sueltas (`letra-<i>-<L>` por su orden de reparto inicial). */
const idsIniciales = () => origen().map((l, i) => `letra-${i}-${l}`);
/** Coloca la palabra `texto` letra por letra usando los ids dados. */
function armar(texto: string, ids: string[]) {
  const libres = [...ids];
  [...texto].forEach((ch, slot) => {
    const k = libres.findIndex((id) => id.endsWith(`-${ch}`));
    soltar(libres[k]!, `slot-${slot}`);
    libres.splice(k, 1);
  });
}
const boton = (n: string) => screen.getByRole("button", { name: n });

describe("Anagrama — paridad con el comportamiento anterior (U9c.2)", () => {
  it("muestra «Palabra 1 de N», los intentos, la pista, las letras mezcladas (azar fijo) y los huecos", () => {
    render(<Viewer estado={anagrama()} config={{}} />);
    expect(screen.getByText("Palabra 1 de 2")).toBeTruthy();
    expect(screen.getByText("Intentos restantes: 3")).toBeTruthy();
    expect(screen.getByText(/Brilla de día/)).toBeTruthy();
    expect(origen()).toEqual(["L", "O", "S"]); // medido con el viewer viejo
    expect(screen.getByText("Coloca las letras aquí:")).toBeTruthy();
  });

  it("con `intentos = 0` no se muestran los intentos; sin `mostrarPista` no hay pista", () => {
    render(<Viewer estado={anagrama({ intentos: 0, mostrarPista: false })} config={{}} />);
    expect(screen.queryByText(/Intentos restantes/)).toBeNull();
    expect(screen.queryByText(/Brilla de día/)).toBeNull();
  });

  it("soltar una letra en un hueco libre la saca del origen; un hueco ocupado o un destino ajeno se ignoran", () => {
    render(<Viewer estado={anagrama()} config={{}} />);
    const ids = idsIniciales();
    soltar(ids[0]!, "slot-0");
    expect(origen()).toHaveLength(2);
    soltar(ids[1]!, "slot-0"); // ocupado
    expect(origen()).toHaveLength(2);
    soltar(ids[1]!, "otra-cosa");
    soltar(ids[1]!, null);
    expect(origen()).toHaveLength(2);
  });

  it("al llenar la palabra se verifica sola: «✓ ¡Correcto!» (sin «Reintentar»)", () => {
    render(<Viewer estado={anagrama()} config={{}} />);
    armar("SOL", idsIniciales());
    expect(screen.getByText("✓ ¡Correcto!")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Reintentar" })).toBeNull();
    expect(boton("Siguiente")).toBeTruthy();
  });

  it("si queda mal: «✗ Incorrecto» + «Respuesta: …» y «Reintentar» (los intentos NO se descuentan)", () => {
    render(<Viewer estado={anagrama()} config={{}} />);
    armar("LOS", idsIniciales());
    expect(screen.getByText("✗ Incorrecto")).toBeTruthy();
    expect(screen.getByText("Respuesta: SOL")).toBeTruthy();
    expect(boton("Reintentar")).toBeTruthy();
    expect(screen.getByText("Intentos restantes: 3")).toBeTruthy();
  });

  it("«Reintentar» devuelve las letras mezcladas y vacía los huecos, sin gastar intentos", () => {
    render(<Viewer estado={anagrama()} config={{}} />);
    armar("LOS", idsIniciales());
    fireEvent.click(boton("Reintentar"));
    expect([...origen()].sort()).toEqual(["L", "O", "S"]);
    expect(screen.queryByText("✗ Incorrecto")).toBeNull();
    expect(screen.getByText("Intentos restantes: 3")).toBeTruthy();
  });

  it("después de verificar ya no se colocan letras", () => {
    render(<Viewer estado={anagrama()} config={{}} />);
    const ids = idsIniciales();
    armar("SOL", ids);
    soltar("letra-0-L", "slot-0");
    expect(screen.getByText("✓ ¡Correcto!")).toBeTruthy();
  });

  it("«Siguiente» pasa a la palabra 2 (letras nuevas); la última dice «Finalizar»", () => {
    render(<Viewer estado={anagrama()} config={{}} />);
    armar("SOL", idsIniciales());
    fireEvent.click(boton("Siguiente"));
    expect(screen.getByText("Palabra 2 de 2")).toBeTruthy();
    expect([...origen()].sort()).toEqual(["A", "L", "N", "U"]);
    armar("LUNA", idsIniciales());
    expect(boton("Finalizar")).toBeTruthy();
  });

  it("«Finalizar» emite UNA vez `{ slotsPorPalabra }` por `onResponse` y muestra la nota; nunca hubo borradores", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={anagrama()} config={{ onResponse }} />);
    armar("SOL", idsIniciales());
    fireEvent.click(boton("Siguiente"));
    expect(onResponse).not.toHaveBeenCalled();
    armar("LUNA", idsIniciales());
    fireEvent.click(boton("Finalizar"));
    expect(onResponse.mock.calls).toEqual([[{ slotsPorPalabra: [["S", "O", "L"], ["L", "U", "N", "A"]] }]]);
    expect(screen.getByText("5.0")).toBeTruthy();
    expect(screen.getByText("¡Muy bien!")).toBeTruthy();
  });

  it("calificación con @lumina/scoring: todo bien 5, todo mal nota mínima, mitad (2,5)", () => {
    const a = anagrama();
    const nota = (s: string[][]) => {
      const ev = evaluateActivityResponse("anagrama", a, { slotsPorPalabra: s });
      return { correct: ev.correct, score: ev.score };
    };
    expect(nota([["S", "O", "L"], ["L", "U", "N", "A"]])).toEqual({ correct: true, score: 5 });
    expect(nota([["L", "O", "S"], ["A", "N", "U", "L"]])).toEqual({ correct: false, score: 1 });
    expect(nota([["S", "O", "L"], ["A", "N", "U", "L"]])).toEqual({ correct: false, score: 2.5 });
  });

  it("el componente (prop `actividad`) acepta `onResponse` directo", () => {
    const onResponse = vi.fn();
    render(<ViewerComponente actividad={{ ...anagrama(), palabras: [{ texto: "SOL" }] }} onResponse={onResponse} />);
    armar("SOL", idsIniciales());
    fireEvent.click(boton("Finalizar"));
    expect(onResponse).toHaveBeenCalledTimes(1);
  });
});
