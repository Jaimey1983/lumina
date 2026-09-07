import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  RenderText as LegacyRenderText,
  createDefaultTextBlock,
} from "lumina-frontend/blocks/texto";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { textoDefinition } from "./texto-definition.js";
import type { TextoConfig, TextoEstado } from "./texto-types.js";

function domVisible(container: HTMLElement): string {
  return container.innerHTML;
}

describe("Texto — paridad ElementDefinition vs legacy (E5.6)", () => {
  it("crearPorDefecto delega en createDefaultTextBlock", () => {
    const desdeDefinicion = textoDefinition.crearPorDefecto();
    const desdeLegacy = createDefaultTextBlock();

    expect(desdeDefinicion).toEqual(desdeLegacy);
    expect(desdeDefinicion.tipo).toBe("texto");
  });

  it("Editor nuevo y legacy producen el mismo DOM visible", () => {
    const estado = createDefaultTextBlock({ contenido: "Párrafo de prueba" });
    const NuevoEditor = textoDefinition.Editor;

    const legacy = render(<LegacyRenderText block={estado} modo="editor" />);
    const nuevo = render(
      <NuevoEditor estado={estado} config={{}} onChange={() => undefined} />,
    );

    expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
    expect(nuevo.container.textContent).toContain("Párrafo de prueba");
  });

  it("Viewer nuevo y legacy producen el mismo DOM visible", () => {
    const estado = createDefaultTextBlock({ contenido: "Texto en viewer" });
    const NuevoViewer = textoDefinition.Viewer;

    const legacy = render(<LegacyRenderText block={estado} modo="viewer" />);
    const nuevo = render(<NuevoViewer estado={estado} config={{}} />);

    expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
    expect(nuevo.container.textContent).toContain("Texto en viewer");
  });

  it("está registrada sin puntuación", async () => {
    const { elementRegistry } = await import("../../index.js");
    const definicion = elementRegistry.obtener("texto") as
      | ElementDefinition<TextoEstado, TextoConfig>
      | undefined;

    expect(definicion).toBe(textoDefinition);
    expect(definicion?.puntuacion).toBeUndefined();
    expect(definicion?.apariencia).toEqual({
      color: true,
      tipografia: true,
      animacion: true,
    });
  });
});
