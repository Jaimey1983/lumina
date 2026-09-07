import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  RenderDivider as LegacyRenderDivider,
  createDefaultSeparadorBlock,
} from "lumina-frontend/blocks/separador";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { separadorDefinition } from "./separador-definition.js";
import type { SeparadorConfig, SeparadorEstado } from "./separador-types.js";

function domVisible(container: HTMLElement): string {
  return container.innerHTML;
}

describe("Separador — paridad ElementDefinition vs legacy (E5.6)", () => {
  it("crearPorDefecto delega en createDefaultSeparadorBlock", () => {
    const desdeDefinicion = separadorDefinition.crearPorDefecto();
    const desdeLegacy = createDefaultSeparadorBlock();

    expect({ ...desdeDefinicion, id: "" }).toEqual({ ...desdeLegacy, id: "" });
    expect(desdeDefinicion.tipo).toBe("separador");
  });

  it("Editor nuevo y legacy producen el mismo DOM visible", () => {
    const estado = createDefaultSeparadorBlock();
    estado.color = "#ff0000";
    estado.grosor = 4;
    estado.estilo = "punteado";
    const NuevoEditor = separadorDefinition.Editor;

    const legacy = render(<LegacyRenderDivider block={estado} />);
    const nuevo = render(
      <NuevoEditor estado={estado} config={{}} onChange={() => undefined} />,
    );

    expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
  });

  it("Viewer nuevo y legacy producen el mismo DOM visible", () => {
    const estado = createDefaultSeparadorBlock();
    const NuevoViewer = separadorDefinition.Viewer;

    const legacy = render(<LegacyRenderDivider block={estado} />);
    const nuevo = render(<NuevoViewer estado={estado} config={{}} />);

    expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
  });

  it("está registrada sin puntuación", async () => {
    const { elementRegistry } = await import("../../index.js");
    const definicion = elementRegistry.obtener("separador") as
      | ElementDefinition<SeparadorEstado, SeparadorConfig>
      | undefined;

    expect(definicion).toBe(separadorDefinition);
    expect(definicion?.puntuacion).toBeUndefined();
    expect(definicion?.apariencia).toEqual({
      color: true,
      tipografia: false,
      animacion: true,
    });
  });
});
