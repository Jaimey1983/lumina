import type { CarouselEstado } from "./carousel-types.js";
import { render, cleanup, fireEvent, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CarouselEditor as LegacyEditor,
  CarouselViewer as LegacyViewer,
  createDefaultCarouselBlock,
  normalizeCarouselWidget as legacyNormalize,
} from "lumina-frontend/widgets/carousel";
import { carouselDefinition, normalizeCarouselWidget } from "./index.js";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Carousel — paridad E3.3", () => {
  it("conserva los defaults y la normalización legacy", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      "00000000-0000-4000-8000-000000000001",
    );
    expect(carouselDefinition.crearPorDefecto()).toEqual(
      createDefaultCarouselBlock(),
    );
    const estado = createDefaultCarouselBlock();
    expect(normalizeCarouselWidget(estado)).toEqual(legacyNormalize(estado));
  });

  it("Editor conserva el DOM visible", () => {
    const estado = createDefaultCarouselBlock();
    estado.tituloWidget = "Contenido de prueba Carousel";
    const legacy = render(
      <LegacyEditor
        block={estado}
        onChange={() => undefined}
        innerSelection={null}
      />,
    );
    const Editor = carouselDefinition.Editor;
    const nuevo = render(
      <Editor estado={estado} config={{}} onChange={() => undefined} />,
    );
    expect(nuevo.container.innerHTML).toBe(legacy.container.innerHTML);
    expect(
      within(nuevo.container).getByDisplayValue(estado.tituloWidget),
    ).toBeTruthy();
  });

  it.each([false, true])(
    "Viewer conserva el DOM visible (miniatura=%s)",
    (isThumbnail) => {
      const estado = createDefaultCarouselBlock();
      estado.tituloWidget = "Contenido de prueba Carousel";
      const legacy = render(
        <LegacyViewer block={estado} isThumbnail={isThumbnail} />,
      );
      const Viewer = carouselDefinition.Viewer;
      const nuevo = render(<Viewer estado={estado} config={{ isThumbnail }} />);
      expect(nuevo.container.innerHTML).toBe(legacy.container.innerHTML);
      expect(nuevo.container.textContent).toContain(estado.tituloWidget);
    },
  );

  it("la edición inline entrega el mismo cambio que legacy", () => {
    const estado = createDefaultCarouselBlock();
    const legacyChange = vi.fn();
    const nuevoChange = vi.fn();
    const legacy = render(
      <LegacyEditor block={estado} onChange={legacyChange} />,
    );
    const Editor = carouselDefinition.Editor;
    const nuevo = render(
      <Editor estado={estado} config={{}} onChange={nuevoChange} />,
    );
    const legacyInput = legacy.container.querySelector("input");
    const nuevoInput = nuevo.container.querySelector("input");
    expect(legacyInput).toBeTruthy();
    expect(nuevoInput).toBeTruthy();
    if (!legacyInput || !nuevoInput) throw new Error("Falta el campo editable");
    for (const input of [legacyInput, nuevoInput]) {
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: "Título editado" } });
      fireEvent.blur(input);
    }
    expect(nuevoChange).toHaveBeenCalled();
    expect(nuevoChange.mock.lastCall).toEqual(legacyChange.mock.lastCall);
    expect(nuevoChange.mock.lastCall?.[0].tituloWidget).toBe("Título editado");
  });

  it("Propiedades entrega las actualizaciones al contrato", async () => {
    const estado = createDefaultCarouselBlock();
    const onChange = vi.fn();
    const panel = carouselDefinition.Propiedades({
      estado,
      config: {},
      onChange,
      onConfigChange: () => undefined,
    });
    await panel.props.applyNow((block: CarouselEstado) => ({
      ...block,
      tituloWidget: "Desde el panel",
    }));
    expect(onChange).toHaveBeenCalledWith({
      ...estado,
      tituloWidget: "Desde el panel",
    });
  });

  it("se registra sin puntuacion", async () => {
    const { elementRegistry } = await import("../../index.js");
    expect(elementRegistry.obtener("carousel")).toBe(carouselDefinition);
    expect(carouselDefinition).not.toHaveProperty("puntuacion");
  });
});
