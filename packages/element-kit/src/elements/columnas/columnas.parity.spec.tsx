import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  RenderColumns as LegacyRenderColumns,
  createDefaultColumnsBlock,
} from "lumina-frontend/blocks/columnas";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { columnasDefinition } from "./columnas-definition.js";
import type { ColumnasConfig, ColumnasEstado } from "./columnas-types.js";

function domVisible(container: HTMLElement): string {
  return container.innerHTML;
}

describe("Columnas — paridad ElementDefinition vs legacy (E5.6)", () => {
  it("crearPorDefecto delega en createDefaultColumnsBlock", () => {
    const desdeDefinicion = columnasDefinition.crearPorDefecto();
    const desdeLegacy = createDefaultColumnsBlock();

    expect(desdeDefinicion).toEqual(desdeLegacy);
    expect(desdeDefinicion.tipo).toBe("columnas");
  });

  it("Editor nuevo y legacy producen el mismo DOM visible", () => {
    const estado = createDefaultColumnsBlock();
    const NuevoEditor = columnasDefinition.Editor;

    const legacy = render(<LegacyRenderColumns block={estado} />);
    const nuevo = render(
      <NuevoEditor estado={estado} config={{}} onChange={() => undefined} />,
    );

    expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
  });

  it("Viewer nuevo y legacy producen el mismo DOM visible", () => {
    const estado = createDefaultColumnsBlock();
    const NuevoViewer = columnasDefinition.Viewer;

    const legacy = render(<LegacyRenderColumns block={estado} />);
    const nuevo = render(<NuevoViewer estado={estado} config={{}} />);

    expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
  });

  it("está registrada sin puntuación", async () => {
    const { elementRegistry } = await import("../../index.js");
    const definicion = elementRegistry.obtener("columnas") as
      | ElementDefinition<ColumnasEstado, ColumnasConfig>
      | undefined;

    expect(definicion).toBe(columnasDefinition);
    expect(definicion?.puntuacion).toBeUndefined();
    expect(definicion?.apariencia).toEqual({
      color: false,
      tipografia: false,
      animacion: true,
    });
  });
});
