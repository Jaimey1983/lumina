import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ContadorEditor as LegacyContadorEditor,
  ContadorViewer as LegacyContadorViewer,
  createDefaultContadorBlock,
} from "lumina-frontend/widgets/contador";
import type { ElementDefinition } from "../../contract.js";
import { contadorDefinition } from "./contador-definition.js";
import type { ContadorConfig, ContadorEstado } from "./contador-types.js";

function domVisible(container: HTMLElement): string {
  return container.innerHTML;
}

describe("Contador — paridad ElementDefinition vs legacy (E3.2)", () => {
  it("crearPorDefecto delega en createDefaultContadorBlock", () => {
    const desdeDefinicion = contadorDefinition.crearPorDefecto();
    const desdeLegacy = createDefaultContadorBlock();

    expect(desdeDefinicion).toEqual(desdeLegacy);
    expect(desdeDefinicion.tipo).toBe("contador");
  });

  it("Editor nuevo y legacy producen el mismo DOM visible", () => {
    const estado = createDefaultContadorBlock();
    estado.etiqueta = "Tiempo de la prueba";
    const NuevoEditor = contadorDefinition.Editor;

    const legacy = render(
      <LegacyContadorEditor
        block={estado}
        onEnsureBlockSelected={() => undefined}
      />,
    );
    const nuevo = render(
      <NuevoEditor estado={estado} config={{}} onChange={() => undefined} />,
    );

    expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
    expect(nuevo.container.textContent).toContain("Tiempo de la prueba");
    expect(nuevo.container.textContent).toContain("01:00");
  });

  it("Viewer nuevo y legacy producen el mismo DOM visible", () => {
    const estado = createDefaultContadorBlock();
    estado.autoIniciar = false;
    estado.etiqueta = "Tiempo de la prueba";
    const NuevoViewer = contadorDefinition.Viewer;

    const legacy = render(<LegacyContadorViewer block={estado} />);
    const nuevo = render(<NuevoViewer estado={estado} config={{}} />);

    expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
    expect(within(nuevo.container).getByLabelText("Iniciar")).toBeTruthy();
    expect(nuevo.container.textContent).toContain("01:00");
  });

  it("está registrada sin puntuación", async () => {
    const { elementRegistry } = await import("../../index.js");
    const definicion = elementRegistry.obtener("contador") as
      | ElementDefinition<ContadorEstado, ContadorConfig>
      | undefined;

    expect(definicion).toBe(contadorDefinition);
    expect(definicion?.puntuacion).toBeUndefined();
    expect(definicion?.apariencia).toEqual({
      color: true,
      tipografia: true,
      animacion: false,
    });
  });
});
