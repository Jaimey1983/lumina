/** T18 — con movimiento normal, la transición configurada envuelve el paso en `WidgetMotion`. */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createDefaultStepperBlock } from "../../widgets/stepper/index.js";
import { stepperDefinition } from "./stepper-definition.js";
import type { StepperEstado } from "./stepper-types.js";

afterEach(() => cleanup());

function con(transicion: string): StepperEstado {
  const base = createDefaultStepperBlock();
  return { ...base, configuracion: { ...base.configuracion, transicion } } as StepperEstado;
}

describe("transición de paso", () => {
  it("«ninguna» no usa movimiento; «fundido» y «subir» sí, y el paso nuevo se muestra", () => {
    const Viewer = stepperDefinition.Viewer;
    const sin = render(<Viewer estado={con("ninguna")} config={{}} />);
    expect(sin.container.querySelector("[data-widget-motion]")).toBeNull();
    sin.unmount();
    for (const t of ["fundido", "subir"]) {
      const { container, unmount } = render(<Viewer estado={con(t)} config={{}} />);
      expect(container.querySelector("[data-widget-motion]")).not.toBeNull();
      fireEvent.click(screen.getByRole("button", { name: /Siguiente/ }));
      expect(container.textContent).toContain("Buscamos una estrategia");
      unmount();
    }
  });

  it("en el editor y en miniatura no se anima", () => {
    const Viewer = stepperDefinition.Viewer;
    const { container } = render(<Viewer estado={con("subir")} config={{ isThumbnail: true }} />);
    expect(container.querySelector("[data-widget-motion]")).toBeNull();
  });
});
