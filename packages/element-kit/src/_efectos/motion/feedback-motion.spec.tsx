/**
 * U5 — `FeedbackMotion` y `GiroEntrada` con movimiento normal. El caso «reducir movimiento»
 * va en `feedback-motion.reducido.spec.tsx` (`motion` lee esa preferencia una vez por módulo).
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FEEDBACK_MOVIMIENTO, FeedbackMotion, GiroEntrada } from "./index.js";

afterEach(cleanup);

describe("FeedbackMotion", () => {
  it("renderiza su contenido dentro de un nodo de movimiento", () => {
    const { container } = render(
      <FeedbackMotion senal="acierto" n={0} className="caja">
        hola
      </FeedbackMotion>,
    );
    expect(screen.getByText("hola")).toBeTruthy();
    expect(container.querySelector("[data-feedback-motion].caja")).toBeTruthy();
  });

  it("no revienta con cualquier señal ni al subir el contador", () => {
    for (const senal of ["acierto", "error", "pista", "logro", null] as const) {
      const { rerender, unmount } = render(<FeedbackMotion senal={senal} n={0}>x</FeedbackMotion>);
      expect(() => rerender(<FeedbackMotion senal={senal} n={1}>x</FeedbackMotion>)).not.toThrow();
      unmount();
    }
  });

  it("hay un movimiento definido para cada señal", () => {
    expect(Object.keys(FEEDBACK_MOVIMIENTO).sort()).toEqual(["acierto", "error", "logro", "pista"]);
    for (const { keyframes, transicion } of Object.values(FEEDBACK_MOVIMIENTO)) {
      expect(Object.keys(keyframes).length).toBeGreaterThan(0);
      expect(transicion.duration).toBeGreaterThan(0);
    }
  });
});

describe("GiroEntrada", () => {
  it("la primera cara no gira; al cambiar `cara` entra la nueva y la vieja desaparece al instante", () => {
    const { container, rerender } = render(<GiroEntrada cara="dorso">?</GiroEntrada>);
    const primero = container.querySelector("[data-giro-entrada]") as HTMLElement;
    expect(primero.textContent).toBe("?");
    expect(primero.style.transform).not.toContain("rotateY(-90");

    rerender(<GiroEntrada cara="frente">Gato</GiroEntrada>);
    const nodos = container.querySelectorAll("[data-giro-entrada]");
    expect(nodos).toHaveLength(1); // nunca las dos caras a la vez
    expect(nodos[0].textContent).toBe("Gato");
    expect(container.textContent).not.toContain("?");
    expect((nodos[0] as HTMLElement).style.transform).toContain("rotateY(-90");
  });

  it("misma cara = mismo nodo (no se vuelve a animar)", () => {
    const { container, rerender } = render(<GiroEntrada cara="frente">A</GiroEntrada>);
    const antes = container.querySelector("[data-giro-entrada]");
    rerender(<GiroEntrada cara="frente">B</GiroEntrada>);
    expect(container.querySelector("[data-giro-entrada]")).toBe(antes);
  });
});
