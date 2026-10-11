/**
 * U5 — con «reducir movimiento» el feedback no anima: nodos planos, contenido visible,
 * y la carta cambia de cara sin giro.
 */
import { cleanup, render, screen } from "@testing-library/react";
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

afterEach(cleanup);

describe("feedback con movimiento reducido", () => {
  it("FeedbackMotion es un div plano y sigue mostrando el contenido", async () => {
    const { FeedbackMotion } = await import("./index.js");
    const { container, rerender } = render(<FeedbackMotion senal="error" n={0} className="caja">contenido</FeedbackMotion>);
    rerender(<FeedbackMotion senal="error" n={1} className="caja">contenido</FeedbackMotion>);
    expect(screen.getByText("contenido")).toBeTruthy();
    expect(container.querySelector("[data-feedback-motion]")).toBeNull();
    expect((container.querySelector(".caja") as HTMLElement).style.transform).toBe("");
  });

  it("GiroEntrada cambia de cara sin giro", async () => {
    const { GiroEntrada } = await import("./index.js");
    const { container, rerender } = render(<GiroEntrada cara="dorso">?</GiroEntrada>);
    rerender(<GiroEntrada cara="frente">Gato</GiroEntrada>);
    expect(container.querySelector("[data-giro-entrada]")).toBeNull();
    expect(container.textContent).toBe("Gato");
  });
});
