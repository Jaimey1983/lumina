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
  it("crearPorDefecto produce un bloque válido con tipo canónico", () => {
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
  });

  it("se registra en elementRegistry con catálogo correcto", () => {
    registrarAccordion();
    expect(elementRegistry.obtener(ACCORDION_TIPO)).toBe(accordionDefinition);
    expect(accordionDefinition.catalogo).toBeDefined();
    expect(accordionDefinition.catalogo.nombre).toBe("Acordeón");
    expect(accordionDefinition.catalogo.familia).toBe("widget");
  });

  it("expone presets canónicos configurados", () => {
    expect(accordionDefinition.presets).toBe(ACCORDION_PRESETS);
    expect(accordionDefinition.presets?.length).toBe(4);

    const faq = accordionDefinition.presets?.find((p) => p.id === "preguntas-frecuentes");
    expect(faq).toBeDefined();
    expect(faq?.patch?.configuracion?.modo).toBe("exclusivo");

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

  it("Editor renderiza cabeceras editables y paneles interactivos", () => {
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

    expect(screen.getByDisplayValue("Acordeón Interactivo")).toBeTruthy();
    const triggers = screen.getAllByRole("button");
    expect(triggers.length).toBe(3);

    fireEvent.click(triggers[1]!);
    expect(onEnsureBlockSelected).toHaveBeenCalled();
  });

  it("Propiedades permite aplicar presets y manipular secciones", () => {
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

    // Comprobar que existe el botón del preset FAQ
    const faqBtn = screen.getByRole("button", { name: /Preguntas Frecuentes/i });
    expect(faqBtn).toBeTruthy();

    fireEvent.click(faqBtn);
    expect(onChange).toHaveBeenCalled();

    // Comprobar botón agregar sección
    const addBtn = screen.getByRole("button", { name: /Agregar/i });
    fireEvent.click(addBtn);
    expect(onChange).toHaveBeenCalled();
  });
});
