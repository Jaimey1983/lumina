import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  PopupEditor as LegacyPopupEditor,
  PopupViewer as LegacyPopupViewer,
  createDefaultPopupBlock,
} from "lumina-frontend/widgets/popup";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { popupDefinition } from "./popup-definition.js";
import type { PopupConfig, PopupEstado } from "./popup-types.js";

function domVisible(container: HTMLElement): string {
  return container.innerHTML;
}

/** `createDefaultPopupOverlay` reminta `overlay.id` con crypto.randomUUID. */
function sinIdOverlay(estado: PopupEstado): PopupEstado {
  return { ...estado, overlay: { ...estado.overlay, id: "__id__" } };
}

describe("Popup — paridad ElementDefinition vs legacy (E3.4)", () => {
  it("crearPorDefecto delega en createDefaultPopupBlock", () => {
    const desdeDefinicion = popupDefinition.crearPorDefecto();
    const desdeLegacy = createDefaultPopupBlock();

    expect(sinIdOverlay(desdeDefinicion)).toEqual(sinIdOverlay(desdeLegacy));
    expect(desdeDefinicion.tipo).toBe("popup");
    expect(desdeDefinicion.configuracion.triggerEvento).toBe("click");
    expect(desdeDefinicion.overlay.encabezado).toBe("Título del popup");
  });

  it("Editor nuevo y legacy producen el mismo DOM visible", () => {
    const estado = createDefaultPopupBlock();
    estado.configuracion.triggerTexto = "Abrir ficha";
    const NuevoEditor = popupDefinition.Editor;

    const legacy = render(
      <LegacyPopupEditor
        block={estado}
        onChange={() => undefined}
        innerSelection={null}
        onInnerSelectionChange={() => undefined}
        onEnsureBlockSelected={() => undefined}
      />,
    );
    const nuevo = render(
      <NuevoEditor estado={estado} config={{}} onChange={() => undefined} />,
    );

    expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
    expect(nuevo.container.textContent).toContain("Abrir ficha");
  });

  it("Viewer nuevo y legacy producen el mismo DOM visible (trigger cerrado)", () => {
    const estado = createDefaultPopupBlock();
    estado.configuracion.triggerTexto = "Ver detalle";
    const NuevoViewer = popupDefinition.Viewer;

    const legacy = render(<LegacyPopupViewer block={estado} />);
    const nuevo = render(<NuevoViewer estado={estado} config={{}} />);

    expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
    expect(
      within(nuevo.container).getByRole("button", { name: "Ver detalle" }),
    ).toBeTruthy();
  });

  it("Viewer thumbnail nuevo y legacy producen el mismo DOM visible", () => {
    const estado = createDefaultPopupBlock();
    const NuevoViewer = popupDefinition.Viewer;

    const legacy = render(<LegacyPopupViewer block={estado} isThumbnail />);
    const nuevo = render(
      <NuevoViewer estado={estado} config={{ isThumbnail: true }} />,
    );

    expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
  });

  it("está registrada sin puntuación", async () => {
    const { elementRegistry } = await import("../../index.js");
    const definicion = elementRegistry.obtener("popup") as
      | ElementDefinition<PopupEstado, PopupConfig>
      | undefined;

    expect(definicion).toBe(popupDefinition);
    expect(definicion?.puntuacion).toBeUndefined();
    expect(definicion?.apariencia).toEqual({
      color: true,
      tipografia: true,
      animacion: true,
    });
  });
});
