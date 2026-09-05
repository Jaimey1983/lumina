import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ProgresoEditor as LegacyProgresoEditor,
  ProgresoViewer as LegacyProgresoViewer,
  createDefaultProgresoBlock,
} from "lumina-frontend/widgets/progreso";
import type { ElementDefinition } from "../../contract.js";
import { progresoDefinition } from "./progreso-definition.js";
import type { ProgresoConfig, ProgresoEstado } from "./progreso-types.js";

function domVisible(container: HTMLElement): string {
  return container.innerHTML;
}

describe("Progreso — paridad ElementDefinition vs legacy (E3.2)", () => {
  it("crearPorDefecto delega en createDefaultProgresoBlock", () => {
    const desdeDefinicion = progresoDefinition.crearPorDefecto();
    const desdeLegacy = createDefaultProgresoBlock();

    expect(desdeDefinicion).toEqual(desdeLegacy);
    expect(desdeDefinicion.tipo).toBe("progreso");
  });

  it("Editor nuevo y legacy producen el mismo DOM visible", () => {
    const estado = createDefaultProgresoBlock();
    estado.modo = "manual";
    estado.porcentaje = 45;
    estado.etiqueta = "Avance";
    const NuevoEditor = progresoDefinition.Editor;

    const legacy = render(
      <LegacyProgresoEditor
        block={estado}
        onEnsureBlockSelected={() => undefined}
      />,
    );
    const nuevo = render(
      <NuevoEditor estado={estado} config={{}} onChange={() => undefined} />,
    );

    expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
    expect(nuevo.container.textContent).toContain("Avance");
  });

  it("Viewer nuevo y legacy producen el mismo DOM visible", () => {
    const estado = createDefaultProgresoBlock();
    estado.modo = "manual";
    estado.porcentaje = 45;
    estado.etiqueta = "Avance";
    const NuevoViewer = progresoDefinition.Viewer;

    const legacy = render(<LegacyProgresoViewer block={estado} />);
    const nuevo = render(<NuevoViewer estado={estado} config={{}} />);

    expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
    expect(
      within(nuevo.container).getByRole("progressbar").getAttribute("aria-valuenow"),
    ).toBe("45");
  });

  it("está registrada sin puntuación", async () => {
    const { elementRegistry } = await import("../../index.js");
    const definicion = elementRegistry.obtener("progreso") as
      | ElementDefinition<ProgresoEstado, ProgresoConfig>
      | undefined;

    expect(definicion).toBe(progresoDefinition);
    expect(definicion?.puntuacion).toBeUndefined();
    expect(definicion?.apariencia).toEqual({
      color: true,
      tipografia: true,
      animacion: true,
    });
  });
});
