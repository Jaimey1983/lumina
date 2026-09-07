import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  RenderImage as LegacyRenderImage,
  createDefaultImageBlock,
} from "lumina-frontend/blocks/imagen";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { imagenDefinition } from "./imagen-definition.js";
import type { ImagenConfig, ImagenEstado } from "./imagen-types.js";

function domVisible(container: HTMLElement): string {
  return container.innerHTML;
}

describe("Imagen — paridad ElementDefinition vs legacy (E5.6)", () => {
  it("crearPorDefecto delega en createDefaultImageBlock", () => {
    const desdeDefinicion = imagenDefinition.crearPorDefecto();
    const desdeLegacy = createDefaultImageBlock();

    expect(desdeDefinicion).toEqual(desdeLegacy);
    expect(desdeDefinicion.tipo).toBe("imagen");
  });

  it("Editor nuevo y legacy producen el mismo DOM visible con placeholder", () => {
    const estado = createDefaultImageBlock();
    const NuevoEditor = imagenDefinition.Editor;

    const legacy = render(<LegacyRenderImage block={estado} />);
    const nuevo = render(
      <NuevoEditor estado={estado} config={{}} onChange={() => undefined} />,
    );

    expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
    expect(nuevo.container.textContent).toContain("Sin imagen");
  });

  it("Viewer nuevo y legacy producen el mismo DOM visible con imagen real", () => {
    const estado = createDefaultImageBlock({
      url: "https://example.com/foto.png",
      alt: "Foto descriptiva",
      caption: "Pie de foto",
    });
    const NuevoViewer = imagenDefinition.Viewer;

    const legacy = render(<LegacyRenderImage block={estado} />);
    const nuevo = render(<NuevoViewer estado={estado} config={{}} />);

    expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
    expect(nuevo.container.querySelector("img")?.getAttribute("src")).toBe(
      "https://example.com/foto.png",
    );
    expect(nuevo.container.textContent).toContain("Pie de foto");
  });

  it("está registrada sin puntuación", async () => {
    const { elementRegistry } = await import("../../index.js");
    const definicion = elementRegistry.obtener("imagen") as
      | ElementDefinition<ImagenEstado, ImagenConfig>
      | undefined;

    expect(definicion).toBe(imagenDefinition);
    expect(definicion?.puntuacion).toBeUndefined();
    expect(definicion?.apariencia).toEqual({
      color: false,
      tipografia: false,
      animacion: true,
    });
  });
});
