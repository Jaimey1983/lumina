import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { elementRegistry } from "@lumina/element-kit-core";
import {
  createDefaultScratchCardBlock,
  SCRATCH_CARD_PRESETS,
  SCRATCH_CARD_TIPO,
  scratchCardDefinition,
  ScratchCardEditor,
  ScratchCardPropiedades,
  ScratchCardViewer,
  registrarScratchCard,
} from "./index.js";

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray(100) }),
    putImageData: vi.fn(),
    createImageData: vi.fn(),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    fillText: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
  } as unknown as CanvasRenderingContext2D);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ScratchCard — ElementDefinition", () => {
  it("crearPorDefecto produce un bloque válido con tipo canónico", () => {
    const estado = createDefaultScratchCardBlock();
    expect(estado.tipo).toBe(SCRATCH_CARD_TIPO);
    expect(estado.x).toBe(15);
    expect(estado.y).toBe(10);
    expect(estado.ancho).toBe(70);
    expect(estado.alto).toBe(75);
    expect(estado.configuracion.colorCobertura).toBe("#94a3b8");
    expect(estado.configuracion.grosorPincel).toBe(32);
    expect(estado.configuracion.umbralAutoRevelado).toBe(45);
    expect(estado.configuracion.permitirBotonRevelar).toBe(true);
  });

  it("se registra en elementRegistry", () => {
    registrarScratchCard();
    expect(elementRegistry.obtener(SCRATCH_CARD_TIPO)).toBe(scratchCardDefinition);
    expect(scratchCardDefinition.catalogo).toBeDefined();
    expect(scratchCardDefinition.catalogo.nombre).toBe("Tarjeta rasca y revela");
    expect(scratchCardDefinition.catalogo.familia).toBe("widget");
  });

  it("expone presets canónicos configurados", () => {
    expect(scratchCardDefinition.presets).toBe(SCRATCH_CARD_PRESETS);
    expect(scratchCardDefinition.presets?.length).toBe(4);
    const dorado = scratchCardDefinition.presets?.find(
      (p) => p.id === "dorado-premio",
    );
    expect(dorado).toBeDefined();
    expect(dorado?.patch?.configuracion?.contenidoTipo).toBe("premio");
    expect(dorado?.patch?.configuracion?.colorCobertura).toBe("#eab308");
  });

  it("Viewer renderiza títulos, contenido secreto y canvas", () => {
    const estado = createDefaultScratchCardBlock();
    estado.tituloWidget = "Misterio Histórico";

    const { container } = render(<ScratchCardViewer estado={estado} config={{}} />);

    expect(screen.getByText("Misterio Histórico")).toBeTruthy();
    expect(
      screen.getByText("¡Correcto! El proceso biológico es la Fotosíntesis."),
    ).toBeTruthy();

    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();

    const revealBtn = screen.getByRole("button", { name: /revelar todo/i });
    expect(revealBtn).toBeTruthy();
  });

  it("Viewer revela contenido con el botón de acción y permite reiniciar", () => {
    const estado = createDefaultScratchCardBlock();
    render(<ScratchCardViewer estado={estado} config={{}} />);

    expect(screen.getByText("0% rascado")).toBeTruthy();

    const revealBtn = screen.getByRole("button", { name: /revelar todo/i });
    fireEvent.click(revealBtn);

    expect(screen.getByText("100% revelado")).toBeTruthy();

    // Botón de rascar de nuevo
    const resetBtn = screen.getByRole("button", { name: /rascar de nuevo/i });
    expect(resetBtn).toBeTruthy();
    fireEvent.click(resetBtn);

    expect(screen.getByText("0% rascado")).toBeTruthy();
  });

  it("Viewer soporta tipos de contenido imagen y premio", () => {
    const estadoPremio = createDefaultScratchCardBlock();
    estadoPremio.configuracion.contenidoTipo = "premio";
    estadoPremio.configuracion.premioTitulo = "¡Trofeo de Oro!";
    estadoPremio.configuracion.premioSubtitulo = "+100 Puntos";

    render(<ScratchCardViewer estado={estadoPremio} config={{}} />);
    expect(screen.getByText("¡Trofeo de Oro!")).toBeTruthy();
    expect(screen.getByText("+100 Puntos")).toBeTruthy();
  });

  it("Viewer en miniatura omite botones de interacción", () => {
    const estado = createDefaultScratchCardBlock();
    render(<ScratchCardViewer estado={estado} config={{ isThumbnail: true }} />);

    expect(screen.queryByRole("button", { name: /revelar todo/i })).toBeNull();
  });

  it("Editor notifica selección del bloque al hacer clic", () => {
    const estado = createDefaultScratchCardBlock();
    const onEnsureBlockSelected = vi.fn();

    render(
      <ScratchCardEditor
        estado={estado}
        config={{ onEnsureBlockSelected }}
        onChange={() => undefined}
      />,
    );

    const revealBtn = screen.getByRole("button", { name: /revelar todo/i });
    fireEvent.click(revealBtn);
    expect(onEnsureBlockSelected).toHaveBeenCalled();
  });

  it("Propiedades permite cambiar contenido, opciones y aplicar presets", () => {
    const estado = createDefaultScratchCardBlock();
    const onChange = vi.fn();

    render(
      <ScratchCardPropiedades
        estado={estado}
        config={{}}
        onChange={onChange}
        onConfigChange={() => undefined}
      />,
    );

    // Cambiar tipo de contenido a premio
    const selectTipo = screen.getByDisplayValue(/Texto \/ Respuesta Oculta/i);
    fireEvent.change(selectTipo, { target: { value: "premio" } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        configuracion: expect.objectContaining({
          contenidoTipo: "premio",
        }),
      }),
    );

    // Aplicar preset Dorado
    const presetBtn = screen.getByRole("button", { name: "Dorado / Recompensa" });
    fireEvent.click(presetBtn);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        configuracion: expect.objectContaining({
          contenidoTipo: "premio",
          colorCobertura: "#eab308",
        }),
      }),
    );
  });
});
