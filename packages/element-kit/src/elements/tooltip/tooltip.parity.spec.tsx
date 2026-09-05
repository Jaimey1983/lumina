import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  TooltipEditor as LegacyTooltipEditor,
  TooltipViewer as LegacyTooltipViewer,
  createDefaultTooltipBlock,
} from "lumina-frontend/widgets/tooltip";
import type { ElementDefinition } from "../../contract.js";
import { tooltipDefinition } from "./tooltip-definition.js";
import type { TooltipConfig, TooltipEstado } from "./tooltip-types.js";

/** Normaliza IDs de `useId` para comparar el DOM visible, no el handle React. */
function domVisible(container: HTMLElement): string {
  return container.innerHTML
    .replace(/id=":[^"]+"/g, 'id="__id__"')
    .replace(/id="_r_[^"]+"/g, 'id="__id__"')
    .replace(/aria-describedby=":[^"]+"/g, 'aria-describedby="__id__"')
    .replace(/aria-describedby="_r_[^"]+"/g, 'aria-describedby="__id__"');
}

describe("Tooltip — paridad ElementDefinition vs legacy (E3.2)", () => {
  it("crearPorDefecto delega en createDefaultTooltipBlock", () => {
    const desdeDefinicion = tooltipDefinition.crearPorDefecto();
    const desdeLegacy = createDefaultTooltipBlock();

    expect(desdeDefinicion).toEqual(desdeLegacy);
    expect(desdeDefinicion.tipo).toBe("tooltip");
  });

  it("Editor nuevo y legacy producen el mismo DOM visible", () => {
    const estado = createDefaultTooltipBlock();
    estado.textoTooltip = "Dato extra del tema";
    const NuevoEditor = tooltipDefinition.Editor;

    const legacy = render(
      <LegacyTooltipEditor
        block={estado}
        onEnsureBlockSelected={() => undefined}
      />,
    );
    const nuevo = render(
      <NuevoEditor estado={estado} config={{}} onChange={() => undefined} />,
    );

    expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
    expect(nuevo.container.textContent).toContain("Dato extra del tema");
  });

  it("Viewer nuevo y legacy producen el mismo DOM visible", () => {
    const estado = createDefaultTooltipBlock();
    estado.textoTooltip = "Dato extra del tema";
    const NuevoViewer = tooltipDefinition.Viewer;

    const legacy = render(<LegacyTooltipViewer block={estado} />);
    const nuevo = render(<NuevoViewer estado={estado} config={{}} />);

    expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
    expect(within(nuevo.container).getByRole("tooltip")).toBeTruthy();
    expect(nuevo.container.textContent).toContain("Dato extra del tema");
  });

  it("está registrada sin puntuación", async () => {
    const { elementRegistry } = await import("../../index.js");
    const definicion = elementRegistry.obtener("tooltip") as
      | ElementDefinition<TooltipEstado, TooltipConfig>
      | undefined;

    expect(definicion).toBe(tooltipDefinition);
    expect(definicion?.puntuacion).toBeUndefined();
    expect(definicion?.apariencia).toEqual({
      color: true,
      tipografia: true,
      animacion: false,
    });
  });
});
