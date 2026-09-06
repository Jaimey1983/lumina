import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  HotspotEditor as LegacyHotspotEditor,
  HotspotViewer as LegacyHotspotViewer,
  createDefaultHotspotBlock,
} from "lumina-frontend/widgets/hotspot";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { hotspotDefinition } from "./hotspot-definition.js";
import type { HotspotConfig, HotspotEstado } from "./hotspot-types.js";

function domVisible(container: HTMLElement): string {
  return container.innerHTML;
}

/** `createDefaultHotspotBlock` reminta `overlay.id` con crypto.randomUUID. */
function sinIdOverlay(estado: HotspotEstado): HotspotEstado {
  return { ...estado, overlay: { ...estado.overlay, id: "__id__" } };
}

describe("Hotspot — paridad ElementDefinition vs legacy (E3.2)", () => {
  it("crearPorDefecto delega en createDefaultHotspotBlock", () => {
    const desdeDefinicion = hotspotDefinition.crearPorDefecto();
    const desdeLegacy = createDefaultHotspotBlock();

    expect(sinIdOverlay(desdeDefinicion)).toEqual(sinIdOverlay(desdeLegacy));
    expect(desdeDefinicion.tipo).toBe("hotspot");
    expect(desdeDefinicion.overlay.encabezado).toBe("Título del hotspot");
  });

  it("Editor nuevo y legacy producen el mismo DOM visible", () => {
    const estado = createDefaultHotspotBlock();
    estado.overlay.encabezado = "Punto de interés";
    const NuevoEditor = hotspotDefinition.Editor;

    const legacy = render(
      <LegacyHotspotEditor
        block={estado}
        onChange={() => undefined}
        onEnsureBlockSelected={() => undefined}
        innerSelection={null}
      />,
    );
    const nuevo = render(
      <NuevoEditor estado={estado} config={{}} onChange={() => undefined} />,
    );

    expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
  });

  it("Viewer nuevo y legacy producen el mismo DOM visible", () => {
    const estado = createDefaultHotspotBlock();
    estado.overlay.encabezado = "Punto de interés";
    const NuevoViewer = hotspotDefinition.Viewer;

    const legacy = render(<LegacyHotspotViewer block={estado} />);
    const nuevo = render(<NuevoViewer estado={estado} config={{}} />);

    expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
    expect(within(nuevo.container).getByText("Punto de interés")).toBeTruthy();
  });

  it("está registrada sin puntuación", async () => {
    const { elementRegistry } = await import("../../index.js");
    const definicion = elementRegistry.obtener("hotspot") as
      | ElementDefinition<HotspotEstado, HotspotConfig>
      | undefined;

    expect(definicion).toBe(hotspotDefinition);
    expect(definicion?.puntuacion).toBeUndefined();
    expect(definicion?.apariencia).toEqual({
      color: true,
      tipografia: true,
      animacion: true,
    });
  });
});
