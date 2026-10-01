import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ElementDefinition } from "@lumina/element-kit-core";
import {
  createDefaultEcuacionBlock,
  ecuacionTamano,
} from "../../blocks/ecuacion/index.js";
import { ecuacionDefinition } from "./ecuacion-definition.js";
import type { EcuacionConfig, EcuacionEstado } from "./ecuacion-types.js";

describe("Ecuación — bloque propio", () => {
  it("crearPorDefecto devuelve un bloque posicionado y con fórmula de ejemplo", () => {
    const b = ecuacionDefinition.crearPorDefecto();
    expect(b.tipo).toBe("ecuacion");
    expect(b.latex.length).toBeGreaterThan(0);
    expect(typeof b.x).toBe("number");
    expect(typeof b.ancho).toBe("number");
    expect(b.ajustar).toBe(true);
  });

  it("acota el tamaño al rango permitido", () => {
    expect(ecuacionTamano(createDefaultEcuacionBlock({ tamano: 2 }))).toBe(12);
    expect(ecuacionTamano(createDefaultEcuacionBlock({ tamano: 999 }))).toBe(160);
    expect(ecuacionTamano(createDefaultEcuacionBlock({ tamano: Number.NaN }))).toBe(36);
  });

  it("Editor vacío muestra el aviso; Viewer vacío no pinta nada", () => {
    const estado = createDefaultEcuacionBlock({ latex: "  " });
    const Editor = ecuacionDefinition.Editor;
    const Viewer = ecuacionDefinition.Viewer;
    const ed = render(
      <Editor estado={estado} config={{}} onChange={() => undefined} />,
    );
    expect(ed.container.textContent).toContain("Ecuación vacía");
    const vw = render(<Viewer estado={estado} config={{}} />);
    expect(vw.container.innerHTML).toBe("");
  });

  it("Viewer con fórmula la dibuja (vista KaTeX perezosa)", async () => {
    const estado = createDefaultEcuacionBlock({ latex: "x^2 + 1" });
    const Viewer = ecuacionDefinition.Viewer;
    const vw = render(<Viewer estado={estado} config={{}} />);
    expect(await vw.findByText("x^2 + 1")).toBeTruthy();
  });

  it("Propiedades carga la fórmula actual en el compositor", () => {
    const estado = createDefaultEcuacionBlock({ latex: "a+b" });
    const Props = ecuacionDefinition.Propiedades;
    const r = render(
      <Props
        estado={estado}
        config={{}}
        onConfigChange={() => undefined}
        onChange={() => undefined}
      />,
    );
    const area = r.container.querySelector<HTMLTextAreaElement>(
      "[data-equation-source]",
    );
    expect(area?.value).toBe("a+b");
  });

  it("está registrada sin puntuación", async () => {
    const { elementRegistry } = await import("../../index.js");
    const def = elementRegistry.obtener("ecuacion") as
      | ElementDefinition<EcuacionEstado, EcuacionConfig>
      | undefined;
    expect(def).toBe(ecuacionDefinition);
    expect(def?.puntuacion).toBeUndefined();
  });
});
