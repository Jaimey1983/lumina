import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  RenderQuote as LegacyRenderQuote,
  createDefaultQuoteBlock,
} from "lumina-frontend/blocks/cita";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { citaDefinition } from "./cita-definition.js";
import type { CitaConfig, CitaEstado } from "./cita-types.js";

function domVisible(container: HTMLElement): string {
  return container.innerHTML;
}

describe("Cita — paridad ElementDefinition vs legacy (E5.6)", () => {
  it("crearPorDefecto delega en createDefaultQuoteBlock", () => {
    const desdeDefinicion = citaDefinition.crearPorDefecto();
    const desdeLegacy = createDefaultQuoteBlock();

    expect(desdeDefinicion).toEqual(desdeLegacy);
    expect(desdeDefinicion.tipo).toBe("cita");
  });

  it("Editor nuevo y legacy producen el mismo DOM visible", () => {
    const estado = createDefaultQuoteBlock({
      texto: "Solo sé que nada sé",
      autor: "Sócrates",
    });
    const NuevoEditor = citaDefinition.Editor;

    const legacy = render(<LegacyRenderQuote block={estado} />);
    const nuevo = render(
      <NuevoEditor estado={estado} config={{}} onChange={() => undefined} />,
    );

    expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
    expect(nuevo.container.textContent).toContain("Solo sé que nada sé");
    expect(nuevo.container.textContent).toContain("Sócrates");
  });

  it("Viewer nuevo y legacy producen el mismo DOM visible", () => {
    const estado = createDefaultQuoteBlock({
      texto: "Pienso, luego existo",
      autor: "Descartes",
      fuente: "Discurso del método",
    });
    const NuevoViewer = citaDefinition.Viewer;

    const legacy = render(<LegacyRenderQuote block={estado} />);
    const nuevo = render(<NuevoViewer estado={estado} config={{}} />);

    expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
    expect(nuevo.container.textContent).toContain("Pienso, luego existo");
    expect(nuevo.container.textContent).toContain("Descartes");
    expect(nuevo.container.textContent).toContain("Discurso del método");
  });

  it("está registrada sin puntuación", async () => {
    const { elementRegistry } = await import("../../index.js");
    const definicion = elementRegistry.obtener("cita") as
      | ElementDefinition<CitaEstado, CitaConfig>
      | undefined;

    expect(definicion).toBe(citaDefinition);
    expect(definicion?.puntuacion).toBeUndefined();
    expect(definicion?.apariencia).toEqual({
      color: true,
      tipografia: true,
      animacion: true,
    });
  });
});
