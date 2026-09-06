import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  RuletaEditor as LegacyRuletaEditor,
  RuletaViewer as LegacyRuletaViewer,
  createDefaultRuletaWidget,
} from "lumina-frontend/widgets/ruleta";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { ruletaDefinition } from "./ruleta-definition.js";
import type { RuletaConfig, RuletaEstado } from "./ruleta-types.js";

function domVisible(container: HTMLElement): string {
  return container.innerHTML;
}

describe("Ruleta — paridad ElementDefinition vs legacy (E3.1)", () => {
  it("crearPorDefecto delega en createDefaultRuletaWidget", () => {
    const desdeDefinicion = ruletaDefinition.crearPorDefecto();
    const desdeLegacy = createDefaultRuletaWidget();

    expect(desdeDefinicion).toEqual(desdeLegacy);
    expect(desdeDefinicion.tipo).toBe("ruleta");
  });

  it("Editor nuevo y legacy producen el mismo DOM visible", () => {
    const estado = createDefaultRuletaWidget();
    estado.items[0] = { id: "equipo-a", texto: "Equipo A" };
    const NuevoEditor = ruletaDefinition.Editor;

    const legacy = render(<LegacyRuletaEditor block={estado} />);
    const nuevo = render(
      <NuevoEditor estado={estado} config={{}} onChange={() => undefined} />,
    );

    expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
    expect(nuevo.container.textContent).toContain("Equipo A");
  });

  it("Viewer nuevo y legacy producen el mismo DOM visible", () => {
    const estado = createDefaultRuletaWidget();
    estado.items[1] = { id: "equipo-b", texto: "Equipo B" };
    const NuevoViewer = ruletaDefinition.Viewer;

    const legacy = render(<LegacyRuletaViewer block={estado} />);
    const nuevo = render(<NuevoViewer estado={estado} config={{}} />);

    expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
    expect(within(nuevo.container).getByRole("button", { name: "Girar" })).toBeTruthy();
    expect(nuevo.container.textContent).toContain("Equipo B");
  });

  it("está registrada sin puntuación", async () => {
    const { elementRegistry } = await import("../../index.js");
    const definicion = elementRegistry.obtener("ruleta") as
      | ElementDefinition<RuletaEstado, RuletaConfig>
      | undefined;

    expect(definicion).toBe(ruletaDefinition);
    expect(definicion?.puntuacion).toBeUndefined();
    expect(definicion?.apariencia).toEqual({
      color: true,
      tipografia: false,
      animacion: true,
    });
  });
});
