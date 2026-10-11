/**
 * U5 — `useActivityFeedback` y `ActivityFeedbackLayer` (etapa U / DU5, DU8).
 */
import { act, cleanup, render, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { ActivityFeedbackLayer, SONIDO_POR_SENAL, useActivityFeedback } from "./activity-feedback.js";

beforeEach(() => play.mockClear());
afterEach(cleanup);

describe("useActivityFeedback", () => {
  it("cada señal suena con su sonido y sube el contador", () => {
    const { result } = renderHook(() => useActivityFeedback());
    expect(result.current).toMatchObject({ senal: null, n: 0, confeti: 0 });
    for (const [i, senal] of (["acierto", "error", "pista", "logro"] as const).entries()) {
      act(() => result.current.emitir(senal));
      expect(play).toHaveBeenLastCalledWith(SONIDO_POR_SENAL[senal]);
      expect(result.current).toMatchObject({ senal, n: i + 1 });
    }
    expect(SONIDO_POR_SENAL).toEqual({ acierto: "correct", error: "wrong", pista: "reveal", logro: "correct" });
  });

  it("solo el `logro` sube el contador del confeti", () => {
    const { result } = renderHook(() => useActivityFeedback());
    act(() => result.current.emitir("acierto"));
    act(() => result.current.emitir("error"));
    expect(result.current.confeti).toBe(0);
    act(() => result.current.emitir("logro"));
    act(() => result.current.emitir("logro"));
    expect(result.current.confeti).toBe(2);
  });

  it("`sonido: false` lo silencia pero conserva el movimiento", () => {
    const { result } = renderHook(() => useActivityFeedback({ sonido: false }));
    act(() => result.current.emitir("acierto"));
    expect(play).not.toHaveBeenCalled();
    expect(result.current.n).toBe(1);
  });

  it("una emisión puede cambiar el sonido, silenciarlo o dejarlo sin movimiento", () => {
    const { result } = renderHook(() => useActivityFeedback());
    act(() => result.current.emitir("acierto", { sonido: "submit", movimiento: false }));
    expect(play).toHaveBeenCalledWith("submit");
    expect(result.current.n).toBe(0);
    play.mockClear();
    act(() => result.current.emitir("error", { sonido: null }));
    expect(play).not.toHaveBeenCalled();
    expect(result.current.n).toBe(1);
  });

  it("`emitir` es estable entre renders (se puede usar en dependencias de efectos)", () => {
    const { result, rerender } = renderHook(() => useActivityFeedback());
    const antes = result.current.emitir;
    act(() => result.current.emitir("pista"));
    rerender();
    expect(result.current.emitir).toBe(antes);
  });
});

describe("ActivityFeedbackLayer", () => {
  it("monta la capa del confeti, oculta a lectores de pantalla", () => {
    const { result } = renderHook(() => useActivityFeedback());
    const { container } = render(<ActivityFeedbackLayer feedback={result.current} />);
    const capa = container.querySelector("[data-confeti]");
    expect(capa).toBeTruthy();
    expect(capa?.getAttribute("aria-hidden")).toBe("true");
  });
});
