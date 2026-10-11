/**
 * U4 — paridad de Memoria contra su comportamiento ANTERIOR a migrar al `ActivityShell`
 * (Regla 7). Los valores `GOLDEN` se midieron con el viewer viejo (`useState` +
 * `setTimeout` en cadena + `ActivityResultOverlay`) y se congelaron: el viewer nuevo debe
 * entregar a `@lumina/scoring` lo mismo. Se compara lo que sale por el canal de respuesta
 * (borradores y respuesta final, sin contar repeticiones), el orden del mazo con un azar
 * fijo (también tras «Reintentar») y la nota resultante.
 *
 * Diferencia deliberada: el viewer viejo re-emitía el mismo borrador en cada volteo
 * posterior al primer par; el nuevo emite solo cuando cambian los pares encontrados.
 * Por eso `emisiones` colapsa repeticiones consecutivas.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateActivityResponse, isActivityDraftResponse, unwrapActivityDraftResponse } from "@lumina/scoring";

import { createDefaultMemoria } from "../../activities/memoria/index.js";
import { memoriaDefinition } from "./memoria-definition.js";

type Props = { estado: unknown; config: Record<string, unknown> };
const Viewer = memoriaDefinition.Viewer as unknown as (p: Props) => React.ReactElement;

/** Azar fijo (mulberry32): el barajado es el mismo entre corridas. */
function azarFijo(semilla = 7) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(Math, "random").mockImplementation(azarFijo());
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const avanzar = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

/** Las cartas del tablero, en orden de pantalla (los demás botones son del resultado). */
function cartas(): HTMLElement[] {
  return screen
    .getAllByRole("button")
    .filter((b) => !/Reintentar|Cerrar|Comenzar|Ver resultado/.test(b.textContent ?? ""));
}

/** Voltea la carta `i` y devuelve su contenido visible. */
function voltear(i: number): string {
  const c = cartas()[i];
  fireEvent.click(c);
  return c.textContent?.trim() ?? "";
}

/** Lee el orden del mazo volteando de a pares (el que no coincide se esconde otra vez). */
function ordenDelMazo(total: number): string[] {
  const orden: string[] = [];
  for (let k = 0; k < total; k += 2) {
    orden.push(voltear(k));
    orden.push(voltear(k + 1));
    avanzar(1100);
  }
  return orden;
}

interface Emision {
  tipo: "borrador" | "final";
  pares: string[];
}

/** Emisiones distintas y consecutivas (se colapsan las repeticiones: ver encabezado). */
function emisiones(llamadas: unknown[][]): Emision[] {
  const out: Emision[] = [];
  for (const [r] of llamadas) {
    const payload = unwrapActivityDraftResponse(r) as { paresEncontrados: string[] };
    const e: Emision = { tipo: isActivityDraftResponse(r) ? "borrador" : "final", pares: [...payload.paresEncontrados] };
    const ult = out[out.length - 1];
    if (!ult || ult.tipo !== e.tipo || ult.pares.join() !== e.pares.join()) out.push(e);
  }
  return out;
}

/** Con el mazo ya conocido, voltea los pares que faltan hasta completar la partida. */
function completar(mazo: string[], actividad: ReturnType<typeof createDefaultMemoria>, yaEncontrados: Set<string>) {
  const idDe = new Map<string, string>();
  for (const p of actividad.pares) {
    idDe.set(p.lado1.texto ?? "", p.id);
    idDe.set(p.lado2.texto ?? "", p.id);
  }
  const posiciones = new Map<string, number[]>();
  mazo.forEach((txt, i) => posiciones.set(idDe.get(txt)!, [...(posiciones.get(idDe.get(txt)!) ?? []), i]));
  for (const [idPar, [i, j]] of posiciones) {
    if (yaEncontrados.has(idPar)) continue;
    voltear(i);
    voltear(j);
    avanzar(450);
  }
}

const ambosCanales = (fn: ReturnType<typeof vi.fn>) => ({ onComplete: fn, onResponse: fn });

/** Valores medidos con el viewer anterior (ver encabezado). */
const GOLDEN = {
  mazo: ["🐰", "Conejo", "🐱", "Pájaro", "🐦", "Perro", "🐶", "Gato", "🐟", "Pez", "🐸", "Rana"],
  perfecto: [
    { tipo: "borrador", pares: ["par-5"] },
    { tipo: "borrador", pares: ["par-5", "par-4"] },
    { tipo: "borrador", pares: ["par-5", "par-4", "par-6"] },
    { tipo: "borrador", pares: ["par-5", "par-1", "par-4", "par-6"] },
    { tipo: "borrador", pares: ["par-5", "par-1", "par-3", "par-4", "par-6"] },
    { tipo: "final", pares: ["par-5", "par-1", "par-3", "par-2", "par-4", "par-6"] },
  ] as Emision[],
};

describe("Memoria — paridad con el comportamiento anterior (U4)", () => {
  it("el orden del mazo con azar fijo es el de siempre", () => {
    render(<Viewer estado={createDefaultMemoria()} config={{}} />);
    expect(ordenDelMazo(12)).toEqual(GOLDEN.mazo);
  });

  it("partida perfecta: un borrador por cada par nuevo y una respuesta final con todos; nota 5", () => {
    const a = createDefaultMemoria();
    const salida = vi.fn();
    render(<Viewer estado={a} config={ambosCanales(salida)} />);
    const mazo = ordenDelMazo(12);
    completar(mazo, a, new Set(emisiones(salida.mock.calls).flatMap((e) => e.pares)));
    expect(emisiones(salida.mock.calls)).toEqual(GOLDEN.perfecto);
    const final = salida.mock.calls.at(-1)![0];
    expect(isActivityDraftResponse(final)).toBe(false);
    const ev = evaluateActivityResponse("memoria", a, final);
    expect({ correct: ev.correct, score: ev.score }).toEqual({ correct: true, score: 5 });
  });

  it("un par que no coincide sigue visible hasta `tiempoVolteo` y luego se esconde", () => {
    const a = createDefaultMemoria(); // tiempoVolteo = 1000
    render(<Viewer estado={a} config={{}} />);
    expect(voltear(0)).toBe(GOLDEN.mazo[0]);
    expect(voltear(2)).toBe(GOLDEN.mazo[2]);
    avanzar(999);
    expect(cartas()[0].textContent).toBe(GOLDEN.mazo[0]);
    avanzar(2);
    expect(cartas()[0].textContent?.trim()).toBe("?");
    expect(cartas()[2].textContent?.trim()).toBe("?");
  });

  it("mientras se resuelve un par no se puede voltear otra carta", () => {
    render(<Viewer estado={createDefaultMemoria()} config={{}} />);
    voltear(0);
    voltear(2);
    fireEvent.click(cartas()[4]);
    expect(cartas()[4].textContent?.trim()).toBe("?");
  });

  it("el cronómetro cuenta hacia arriba con `mostrarTimer` y no aparece sin él", () => {
    const a = createDefaultMemoria();
    const { unmount } = render(<Viewer estado={a} config={{}} />);
    avanzar(75_000);
    expect(screen.getByText("1:15")).toBeTruthy();
    unmount();
    render(<Viewer estado={{ ...a, configuracion: { ...a.configuracion, mostrarTimer: false } }} config={{}} />);
    avanzar(75_000);
    expect(screen.queryByText("1:15")).toBeNull();
  });

  it("«Reintentar» reinicia el tablero (otro barajado) y la nueva partida vuelve a emitir", () => {
    const a = createDefaultMemoria();
    const salida = vi.fn();
    render(<Viewer estado={a} config={ambosCanales(salida)} />);
    const mazo = ordenDelMazo(12);
    completar(mazo, a, new Set(emisiones(salida.mock.calls).flatMap((e) => e.pares)));
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeTruthy();
    salida.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    const mazo2 = ordenDelMazo(12);
    expect(mazo2).toEqual(GOLDEN_REINTENTO.mazo);
    completar(mazo2, a, new Set(emisiones(salida.mock.calls).flatMap((e) => e.pares)));
    const em = emisiones(salida.mock.calls);
    expect(em.at(-1)!.tipo).toBe("final");
    expect(em.at(-1)!.pares).toHaveLength(6);
  });
});

const GOLDEN_REINTENTO = {
  mazo: ["🐟", "🐰", "🐸", "Conejo", "Pez", "🐱", "Pájaro", "🐦", "Perro", "Rana", "🐶", "Gato"],
};
