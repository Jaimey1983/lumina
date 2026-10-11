/**
 * T18 — con «reducir movimiento» el Stepper no anima: el paso se muestra en un nodo plano (sin
 * `WidgetMotion`) aunque tenga transición configurada, y el contenido queda visible al instante.
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createDefaultStepperBlock } from "../../widgets/stepper/index.js";
import { stepperDefinition } from "./stepper-definition.js";
import type { StepperEstado } from "./stepper-types.js";

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

function con(transicion: string): StepperEstado {
  const base = createDefaultStepperBlock();
  return { ...base, configuracion: { ...base.configuracion, transicion } } as StepperEstado;
}

describe("movimiento reducido", () => {
  for (const transicion of ["fundido", "subir"]) {
    it(`transición «${transicion}»: sin nodos animados y con el contenido visible`, () => {
      const Viewer = stepperDefinition.Viewer;
      const { container } = render(<Viewer estado={con(transicion)} config={{}} />);
      expect(container.querySelector("[data-widget-motion]")).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: /Siguiente/ }));
      expect(container.querySelector("[data-widget-motion]")).toBeNull();
      expect(container.textContent).toContain("Buscamos una estrategia");
    });
  }
});
