import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  RenderCode as LegacyRenderCode,
  createDefaultCodeBlock,
} from "lumina-frontend/blocks/codigo";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { codigoDefinition } from "./codigo-definition.js";
import type { CodigoConfig, CodigoEstado } from "./codigo-types.js";

function domVisible(container: HTMLElement): string {
  return container.innerHTML;
}

describe("Codigo — paridad ElementDefinition vs legacy (E5.6)", () => {
  it("crearPorDefecto delega en createDefaultCodeBlock", () => {
    const desdeDefinicion = codigoDefinition.crearPorDefecto();
    const desdeLegacy = createDefaultCodeBlock();

    expect(desdeDefinicion).toEqual(desdeLegacy);
    expect(desdeDefinicion.tipo).toBe("codigo");
  });

  it("Editor nuevo y legacy producen el mismo DOM visible", () => {
    const estado = createDefaultCodeBlock({
      codigo: "console.log('hola mundo');",
      titulo: "script.js",
    });
    const NuevoEditor = codigoDefinition.Editor;

    const legacy = render(<LegacyRenderCode block={estado} />);
    const nuevo = render(
      <NuevoEditor estado={estado} config={{}} onChange={() => undefined} />,
    );

    expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
    expect(nuevo.container.textContent).toContain("console.log('hola mundo');");
    expect(nuevo.container.textContent).toContain("script.js");
  });

  it("Viewer nuevo y legacy producen el mismo DOM visible", () => {
    const estado = createDefaultCodeBlock({
      codigo: "const x = 42;",
    });
    const NuevoViewer = codigoDefinition.Viewer;

    const legacy = render(<LegacyRenderCode block={estado} />);
    const nuevo = render(<NuevoViewer estado={estado} config={{}} />);

    expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
    expect(nuevo.container.textContent).toContain("const x = 42;");
  });

  it("está registrada sin puntuación", async () => {
    const { elementRegistry } = await import("../../index.js");
    const definicion = elementRegistry.obtener("codigo") as
      | ElementDefinition<CodigoEstado, CodigoConfig>
      | undefined;

    expect(definicion).toBe(codigoDefinition);
    expect(definicion?.puntuacion).toBeUndefined();
    expect(definicion?.apariencia).toEqual({
      color: false,
      tipografia: true,
      animacion: true,
    });
  });
});
