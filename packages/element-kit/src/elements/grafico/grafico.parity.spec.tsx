import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  GraficoEditor as LegacyGraficoEditor,
  GraficoViewer as LegacyGraficoViewer,
  createDefaultGraficoBlock,
} from "lumina-frontend/blocks/grafico";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { graficoDefinition } from "./grafico-definition.js";
import type { GraficoConfig, GraficoEstado } from "./grafico-types.js";

function domVisible(container: HTMLElement): string {
  return container.innerHTML;
}

/** `createDefaultGraficoBlock` reminta `id` con Date.now + Math.random. */
function sinId(estado: GraficoEstado): GraficoEstado {
  return { ...estado, id: "__id__" };
}

describe("Gráfico — paridad ElementDefinition vs legacy (E4.1)", () => {
  it("crearPorDefecto delega en createDefaultGraficoBlock", () => {
    const desdeDefinicion = graficoDefinition.crearPorDefecto();
    const desdeLegacy = createDefaultGraficoBlock();

    expect(sinId(desdeDefinicion)).toEqual(sinId(desdeLegacy));
    expect(desdeDefinicion.tipo).toBe("grafico");
    expect(desdeDefinicion.titulo).toBe("Gráfico de datos");
    expect(desdeDefinicion.chartType).toBe("column");
  });

  it("Editor nuevo y legacy producen el mismo DOM visible", () => {
    const estado = createDefaultGraficoBlock({ titulo: "Notas del período" });
    const NuevoEditor = graficoDefinition.Editor;

    const legacy = render(
      <LegacyGraficoEditor
        block={estado}
        onEnsureBlockSelected={() => undefined}
      />,
    );
    const nuevo = render(
      <NuevoEditor estado={estado} config={{}} onChange={() => undefined} />,
    );

    expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
    expect(nuevo.container.textContent).toContain("Notas del período");
  });

  it("Viewer nuevo y legacy producen el mismo DOM visible", () => {
    const estado = createDefaultGraficoBlock({ titulo: "Notas del período" });
    const NuevoViewer = graficoDefinition.Viewer;

    const legacy = render(<LegacyGraficoViewer block={estado} />);
    const nuevo = render(<NuevoViewer estado={estado} config={{}} />);

    expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
    expect(
      within(nuevo.container).getByRole("region", { name: "Notas del período" }),
    ).toBeTruthy();
  });

  it("está registrada sin puntuación", async () => {
    const { elementRegistry } = await import("../../index.js");
    const definicion = elementRegistry.obtener("grafico") as
      | ElementDefinition<GraficoEstado, GraficoConfig>
      | undefined;

    expect(definicion).toBe(graficoDefinition);
    expect(definicion?.puntuacion).toBeUndefined();
    expect(definicion?.apariencia).toEqual({
      color: true,
      tipografia: true,
      animacion: false,
    });
  });
});
