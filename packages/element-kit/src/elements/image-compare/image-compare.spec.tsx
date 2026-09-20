import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { elementRegistry } from "@lumina/element-kit-core";
import {
  createDefaultImageCompareBlock,
  IMAGE_COMPARE_PRESETS,
  IMAGE_COMPARE_TIPO,
  imageCompareDefinition,
  ImageCompareEditor,
  ImageComparePropiedades,
  ImageCompareViewer,
  registrarImageCompare,
} from "./index.js";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ImageCompare — ElementDefinition", () => {
  it("crearPorDefecto produce un bloque válido con tipo canónico", () => {
    const estado = createDefaultImageCompareBlock();
    expect(estado.tipo).toBe(IMAGE_COMPARE_TIPO);
    expect(estado.x).toBe(10);
    expect(estado.y).toBe(10);
    expect(estado.ancho).toBe(80);
    expect(estado.alto).toBe(75);
    expect(estado.configuracion.posicionInicial).toBe(50);
    expect(estado.configuracion.orientacion).toBe("horizontal");
    expect(estado.configuracion.mostrarEtiquetas).toBe(true);
    expect(estado.configuracion.imagenAntesUrl).toBeTruthy();
    expect(estado.configuracion.imagenDespuesUrl).toBeTruthy();
  });

  it("se registra en elementRegistry", () => {
    registrarImageCompare();
    expect(elementRegistry.obtener(IMAGE_COMPARE_TIPO)).toBe(
      imageCompareDefinition,
    );
    expect(imageCompareDefinition.catalogo).toBeDefined();
    expect(imageCompareDefinition.catalogo.nombre).toBe("Comparador de imágenes");
    expect(imageCompareDefinition.catalogo.familia).toBe("widget");
  });

  it("expone presets canónicos configurados", () => {
    expect(imageCompareDefinition.presets).toBe(IMAGE_COMPARE_PRESETS);
    expect(imageCompareDefinition.presets?.length).toBe(4);
    const vertical = imageCompareDefinition.presets?.find(
      (p) => p.id === "vertical-split",
    );
    expect(vertical).toBeDefined();
    expect(vertical?.patch?.configuracion?.orientacion).toBe("vertical");
  });

  it("Viewer renderiza títulos, ambas imágenes y etiquetas", () => {
    const estado = createDefaultImageCompareBlock();
    estado.tituloWidget = "Comparación Glaciar";
    estado.subtituloWidget = "1920 vs 2020";
    estado.instruccion = "Desliza para ver el retroceso";

    render(<ImageCompareViewer estado={estado} config={{}} />);

    expect(screen.getByText("Comparación Glaciar")).toBeTruthy();
    expect(screen.getByText("1920 vs 2020")).toBeTruthy();
    expect(screen.getByText("Desliza para ver el retroceso")).toBeTruthy();

    const imgs = screen.getAllByRole("img");
    expect(imgs.length).toBe(2);
    expect(imgs[0]?.getAttribute("src")).toBe(estado.configuracion.imagenDespuesUrl);
    expect(imgs[1]?.getAttribute("src")).toBe(estado.configuracion.imagenAntesUrl);

    expect(screen.getByText("Antes")).toBeTruthy();
    expect(screen.getByText("Después")).toBeTruthy();

    const slider = screen.getByRole("slider");
    expect(slider.getAttribute("aria-valuenow")).toBe("50");
    expect(slider.getAttribute("aria-orientation")).toBe("horizontal");
  });

  it("Viewer responde a navegación por teclado con ARIA", () => {
    const estado = createDefaultImageCompareBlock();
    render(<ImageCompareViewer estado={estado} config={{}} />);

    const slider = screen.getByRole("slider");

    // Flecha izquierda -> -2%
    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    expect(slider.getAttribute("aria-valuenow")).toBe("48");

    // Flecha derecha -> +2%
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(slider.getAttribute("aria-valuenow")).toBe("50");

    // Home -> 0%
    fireEvent.keyDown(slider, { key: "Home" });
    expect(slider.getAttribute("aria-valuenow")).toBe("0");

    // End -> 100%
    fireEvent.keyDown(slider, { key: "End" });
    expect(slider.getAttribute("aria-valuenow")).toBe("100");

    // Enter -> restablece a 50%
    fireEvent.keyDown(slider, { key: "Enter" });
    expect(slider.getAttribute("aria-valuenow")).toBe("50");
  });

  it("Viewer en modo vertical ajusta orientación de aria", () => {
    const estado = createDefaultImageCompareBlock();
    estado.configuracion.orientacion = "vertical";
    render(<ImageCompareViewer estado={estado} config={{}} />);

    const slider = screen.getByRole("slider");
    expect(slider.getAttribute("aria-orientation")).toBe("vertical");

    fireEvent.keyDown(slider, { key: "ArrowDown" });
    expect(slider.getAttribute("aria-valuenow")).toBe("52");
  });

  it("Viewer en miniatura desactiva interacción", () => {
    const estado = createDefaultImageCompareBlock();
    render(<ImageCompareViewer estado={estado} config={{ isThumbnail: true }} />);

    expect(screen.queryByRole("slider")).toBeNull();
  });

  it("Editor notifica selección del bloque al hacer clic", () => {
    const estado = createDefaultImageCompareBlock();
    const onEnsureBlockSelected = vi.fn();

    render(
      <ImageCompareEditor
        estado={estado}
        config={{ onEnsureBlockSelected }}
        onChange={() => undefined}
      />,
    );

    const slider = screen.getByRole("slider");
    fireEvent.click(slider);
    expect(onEnsureBlockSelected).toHaveBeenCalled();
  });

  it("Propiedades permite editar URLs y aplicar presets", () => {
    const estado = createDefaultImageCompareBlock();
    const onChange = vi.fn();

    render(
      <ImageComparePropiedades
        estado={estado}
        config={{}}
        onChange={onChange}
        onConfigChange={() => undefined}
      />,
    );

    // Cambiar input de etiqueta Antes
    const inputAntes = screen.getByDisplayValue("Antes");
    fireEvent.change(inputAntes, { target: { value: "Histórico" } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        configuracion: expect.objectContaining({
          etiquetaAntes: "Histórico",
        }),
      }),
    );

    // Aplicar preset Vertical
    const btnVertical = screen.getByRole("button", { name: "División Vertical" });
    fireEvent.click(btnVertical);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        configuracion: expect.objectContaining({
          orientacion: "vertical",
        }),
      }),
    );
  });
});
