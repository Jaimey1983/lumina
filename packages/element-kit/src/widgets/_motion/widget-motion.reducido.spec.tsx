/**
 * T5 — con «reducir movimiento» no hay animación: se renderiza un nodo plano,
 * el contenido queda visible y el conteo salta al valor final.
 */
import { cleanup, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

beforeAll(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("prefers-reduced-motion"),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
  }));
});

afterEach(() => cleanup());

describe("movimiento reducido", () => {
  it("WidgetMotion renderiza un div plano, sin estilos de animación", async () => {
    const { WidgetMotion } = await import("./index.js");
    const { container } = render(
      <WidgetMotion entrada="slide-up" press hover className="caja">
        contenido
      </WidgetMotion>,
    );
    expect(screen.getByText("contenido")).toBeTruthy();
    expect(container.querySelector("[data-widget-motion]")).toBeNull();
    const nodo = container.querySelector(".caja") as HTMLElement;
    expect(nodo.style.opacity).toBe("");
    expect(nodo.style.transform).toBe("");
  });

  it("useConteo salta directo al valor", async () => {
    const { useConteo } = await import("./index.js");
    const { result, rerender } = renderHook(({ v }) => useConteo(v), { initialProps: { v: 1 } });
    rerender({ v: 99 });
    expect(result.current).toBe(99);
  });

  it("prefiereMovimientoReducido y el hook coinciden", async () => {
    const { prefiereMovimientoReducido, useWidgetReducedMotion } = await import("./index.js");
    expect(prefiereMovimientoReducido()).toBe(true);
    const { result } = renderHook(() => useWidgetReducedMotion());
    expect(result.current).toBe(true);
  });
});
