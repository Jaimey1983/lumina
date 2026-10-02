import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// El setup global sustituye esta vista por un stub; aquí se prueba la real.
vi.unmock("./equation-view.js");

import EquationView from "./equation-view.js";
import { createDefaultEcuacionBlock } from "./ecuacion-defaults.js";

afterEach(cleanup);

describe("EquationView — accesibilidad", () => {
  it("lee la fórmula en español, no el LaTeX crudo", () => {
    const r = render(
      <EquationView block={createDefaultEcuacionBlock({ latex: "\\frac{a}{b}" })} />,
    );
    const el = r.getByRole("img");
    expect(el.getAttribute("aria-label")).toBe("a sobre b");
    expect(r.container.querySelector(".katex")).not.toBeNull();
  });

  it("la descripción del docente manda sobre la lectura automática", () => {
    const r = render(
      <EquationView
        block={createDefaultEcuacionBlock({
          latex: "x^2",
          descripcionAccesible: "x al cuadrado, ejemplo",
        })}
      />,
    );
    expect(r.getByRole("img").getAttribute("aria-label")).toBe("x al cuadrado, ejemplo");
  });

  it("LaTeX inválido no revienta: KaTeX lo marca como error", () => {
    const r = render(
      <EquationView block={createDefaultEcuacionBlock({ latex: "\\frac{1" })} />,
    );
    expect(r.container.querySelector(".katex-error")).not.toBeNull();
  });
});
