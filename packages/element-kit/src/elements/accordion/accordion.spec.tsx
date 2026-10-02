import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { elementRegistry } from "@lumina/element-kit-core";
import {
  ACCORDION_PRESETS,
  ACCORDION_TIPO,
  accordionDefinition,
  AccordionEditor,
  AccordionPropiedades,
  AccordionViewer,
  createDefaultAccordionBlock,
  registrarAccordion,
} from "./index.js";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Accordion — ElementDefinition", () => {
  it("crearPorDefecto produce un bloque válido con tipo canónico y flags de componentes", () => {
    const estado = createDefaultAccordionBlock();
    expect(estado.tipo).toBe(ACCORDION_TIPO);
    expect(estado.x).toBe(10);
    expect(estado.y).toBe(10);
    expect(estado.ancho).toBe(80);
    expect(estado.alto).toBe(80);
    expect(estado.configuracion.secciones.length).toBe(3);
    expect(estado.configuracion.modo).toBe("exclusivo");
    expect(estado.configuracion.permitirColapsarTodo).toBe(true);
    expect(estado.configuracion.estiloVisual).toBe("tarjetas");
    expect(estado.configuracion.posicionIcono).toBe("derecha");
    expect(estado.configuracion.tamanoIcono).toBe("md");
    // Flags de componentes consistentes con los demás widgets
    expect(estado.configuracion.mostrarTituloWidget).toBe(true);
    expect(estado.configuracion.mostrarSubtitulo).toBe(true);
    expect(estado.configuracion.mostrarInstruccion).toBe(true);
    expect(estado.configuracion.mostrarImagenes).toBe(true);
  });

  it("se registra en elementRegistry con catálogo correcto", () => {
    registrarAccordion();
    expect(elementRegistry.obtener(ACCORDION_TIPO)).toBe(accordionDefinition);
    expect(accordionDefinition.catalogo).toBeDefined();
    expect(accordionDefinition.catalogo.nombre).toBe("Acordeón");
    expect(accordionDefinition.catalogo.familia).toBe("widget");
  });

  it("expone presets canónicos configurados con flags de componentes", () => {
    expect(accordionDefinition.presets).toBe(ACCORDION_PRESETS);
    expect(accordionDefinition.presets?.length).toBe(4);

    const faq = accordionDefinition.presets?.find((p) => p.id === "preguntas-frecuentes");
    expect(faq).toBeDefined();
    expect(faq?.patch?.configuracion?.modo).toBe("exclusivo");
    expect(faq?.patch?.configuracion?.mostrarTituloWidget).toBe(true);

    const glosario = accordionDefinition.presets?.find((p) => p.id === "glosario-conceptos");
    expect(glosario).toBeDefined();
    expect(glosario?.patch?.configuracion?.modo).toBe("multiple");
    expect(glosario?.patch?.configuracion?.estiloVisual).toBe("separadores");
  });

  it("Viewer renderiza títulos, instrucciones y secciones con atributos ARIA accesibles", () => {
    const estado = createDefaultAccordionBlock();
    estado.tituloWidget = "Módulo de Lógica";
    estado.subtituloWidget = "Conceptos esenciales";
    estado.instruccion = "Abre cada sección para estudiar.";

    render(<AccordionViewer estado={estado} config={{}} />);

    expect(screen.getByText("Módulo de Lógica")).toBeTruthy();
    expect(screen.getByText("Conceptos esenciales")).toBeTruthy();
    expect(screen.getByText("Abre cada sección para estudiar.")).toBeTruthy();

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(3);

    // La primera sección tiene abiertoPorDefecto: true
    expect(buttons[0]?.getAttribute("aria-expanded")).toBe("true");
    expect(buttons[1]?.getAttribute("aria-expanded")).toBe("false");
    expect(buttons[2]?.getAttribute("aria-expanded")).toBe("false");

    const regions = screen.getAllByRole("region");
    expect(regions.length).toBe(3);
    expect(regions[0]?.getAttribute("aria-labelledby")).toBe(buttons[0]?.id);
  });

  it("Viewer oculta títulos e instrucciones cuando los flags de componentes están apagados", () => {
    const estado = createDefaultAccordionBlock();
    estado.tituloWidget = "Título Ocultable";
    estado.subtituloWidget = "Subtítulo Ocultable";
    estado.instruccion = "Instrucción Ocultable";
    estado.configuracion.mostrarTituloWidget = false;
    estado.configuracion.mostrarSubtitulo = false;
    estado.configuracion.mostrarInstruccion = false;

    render(<AccordionViewer estado={estado} config={{}} />);

    expect(screen.queryByText("Título Ocultable")).toBeNull();
    expect(screen.queryByText("Subtítulo Ocultable")).toBeNull();
    expect(screen.queryByText("Instrucción Ocultable")).toBeNull();
  });

  it("Viewer oculta imágenes cuando mostrarImagenes es false", () => {
    const estado = createDefaultAccordionBlock();
    estado.configuracion.secciones[0]!.imagenUrl = "https://example.com/test.jpg";
    estado.configuracion.secciones[0]!.imagenAlt = "Foto ilustrativa";
    estado.configuracion.mostrarImagenes = false;

    render(<AccordionViewer estado={estado} config={{}} />);

    expect(screen.queryByAltText("Foto ilustrativa")).toBeNull();
  });

  it("Viewer en modo exclusivo cierra el panel anterior al abrir uno nuevo", () => {
    const estado = createDefaultAccordionBlock();
    estado.configuracion.modo = "exclusivo";
    render(<AccordionViewer estado={estado} config={{}} />);

    const buttons = screen.getAllByRole("button");

    // Inicialmente panel 1 está abierto
    expect(buttons[0]?.getAttribute("aria-expanded")).toBe("true");
    expect(buttons[1]?.getAttribute("aria-expanded")).toBe("false");

    // Clic en el panel 2
    fireEvent.click(buttons[1]!);

    expect(buttons[0]?.getAttribute("aria-expanded")).toBe("false");
    expect(buttons[1]?.getAttribute("aria-expanded")).toBe("true");

    // Clic nuevamente en el panel 2 (con permitirColapsarTodo: true)
    fireEvent.click(buttons[1]!);
    expect(buttons[1]?.getAttribute("aria-expanded")).toBe("false");
  });

  it("Viewer respeta permitirColapsarTodo: false en modo exclusivo", () => {
    const estado = createDefaultAccordionBlock();
    estado.configuracion.modo = "exclusivo";
    estado.configuracion.permitirColapsarTodo = false;
    render(<AccordionViewer estado={estado} config={{}} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons[0]?.getAttribute("aria-expanded")).toBe("true");

    // Intenta colapsar el único abierto
    fireEvent.click(buttons[0]!);
    // Permanece abierto porque permitirColapsarTodo es false
    expect(buttons[0]?.getAttribute("aria-expanded")).toBe("true");
  });

  it("Viewer en modo múltiple permite expandir varios paneles simultáneamente", () => {
    const estado = createDefaultAccordionBlock();
    estado.configuracion.modo = "multiple";
    estado.configuracion.secciones[0]!.abiertoPorDefecto = true;
    estado.configuracion.secciones[1]!.abiertoPorDefecto = true;

    render(<AccordionViewer estado={estado} config={{}} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons[0]?.getAttribute("aria-expanded")).toBe("true");
    expect(buttons[1]?.getAttribute("aria-expanded")).toBe("true");
    expect(buttons[2]?.getAttribute("aria-expanded")).toBe("false");

    // Abrir el tercero
    fireEvent.click(buttons[2]!);
    expect(buttons[0]?.getAttribute("aria-expanded")).toBe("true");
    expect(buttons[1]?.getAttribute("aria-expanded")).toBe("true");
    expect(buttons[2]?.getAttribute("aria-expanded")).toBe("true");

    // Cerrar el primero
    fireEvent.click(buttons[0]!);
    expect(buttons[0]?.getAttribute("aria-expanded")).toBe("false");
    expect(buttons[1]?.getAttribute("aria-expanded")).toBe("true");
    expect(buttons[2]?.getAttribute("aria-expanded")).toBe("true");
  });

  it("Editor permite editar inline las secciones desde el slide", () => {
    const estado = createDefaultAccordionBlock();
    const onChange = vi.fn();
    const onEnsureBlockSelected = vi.fn();

    render(
      <AccordionEditor
        estado={estado}
        onChange={onChange}
        config={{ onEnsureBlockSelected }}
      />,
    );

    // Cabecera editable en slide
    expect(screen.getByDisplayValue("Acordeón Interactivo")).toBeTruthy();

    // Título de sección editable inline en el slide
    const inputs = screen.getAllByDisplayValue("¿Qué es el pensamiento crítico?");
    expect(inputs.length).toBeGreaterThanOrEqual(1);

    // Modificar título de sección desde el slide
    fireEvent.change(inputs[0]!, { target: { value: "Nuevo Título desde Slide" } });

    // Alternar sección desde el chevron en el slide
    const toggleButtons = screen.getAllByRole("button", { name: /Alternar sección/i });
    expect(toggleButtons.length).toBe(3);
    fireEvent.click(toggleButtons[1]!);
    expect(onEnsureBlockSelected).toHaveBeenCalled();
  });

  it("Editor oculta cabeceras cuando los flags de componentes están apagados", () => {
    const estado = createDefaultAccordionBlock();
    estado.configuracion.mostrarTituloWidget = false;
    estado.configuracion.mostrarSubtitulo = false;
    estado.configuracion.mostrarInstruccion = false;

    render(
      <AccordionEditor
        estado={estado}
        onChange={vi.fn()}
        config={{}}
      />,
    );

    expect(screen.queryByPlaceholderText("Título del acordeón")).toBeNull();
    expect(screen.queryByPlaceholderText("Subtítulo explicativo")).toBeNull();
    expect(screen.queryByPlaceholderText("Instrucción de interacción")).toBeNull();
  });

  it("Propiedades incluye sección Componentes y permite alternar visibilidad", () => {
    const estado = createDefaultAccordionBlock();
    const onChange = vi.fn();

    render(
      <AccordionPropiedades
        estado={estado}
        onChange={onChange}
        config={{}}
        onConfigChange={vi.fn()}
      />,
    );

    // Sección Componentes presente
    expect(screen.getByText("Componentes")).toBeTruthy();
    expect(screen.getByText("Título")).toBeTruthy();
    expect(screen.getByText("Subtítulo")).toBeTruthy();
    expect(screen.getByText("Instrucción")).toBeTruthy();
    expect(screen.getByText("Imágenes de sección")).toBeTruthy();

    // Alternar visibilidad de Título
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]!);
    expect(onChange).toHaveBeenCalled();

    // Presets presentes
    const faqBtn = screen.getByRole("button", { name: /Preguntas Frecuentes/i });
    expect(faqBtn).toBeTruthy();
    fireEvent.click(faqBtn);
    expect(onChange).toHaveBeenCalled();

    // Botón agregar sección
    const addBtn = screen.getByRole("button", { name: /Agregar/i });
    fireEvent.click(addBtn);
    expect(onChange).toHaveBeenCalled();
  });
});
