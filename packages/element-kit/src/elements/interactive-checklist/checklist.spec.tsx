import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { elementRegistry } from "@lumina/element-kit-core";
import {
  CHECKLIST_PRESETS,
  CHECKLIST_TIPO,
  checklistDefinition,
  ChecklistEditor,
  ChecklistPropiedades,
  ChecklistViewer,
  createDefaultChecklistBlock,
  registrarChecklist,
} from "./index.js";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("InteractiveChecklist — ElementDefinition", () => {
  it("crearPorDefecto produce un bloque válido con tipo canónico", () => {
    const estado = createDefaultChecklistBlock();
    expect(estado.tipo).toBe(CHECKLIST_TIPO);
    expect(estado.x).toBe(10);
    expect(estado.y).toBe(10);
    expect(estado.ancho).toBe(80);
    expect(estado.alto).toBe(80);
    expect(estado.configuracion.items.length).toBe(4);
    expect(estado.configuracion.mostrarBarraProgreso).toBe(true);
    expect(estado.configuracion.mostrarContador).toBe(true);
  });

  it("se registra en elementRegistry", () => {
    registrarChecklist();
    expect(elementRegistry.obtener(CHECKLIST_TIPO)).toBe(checklistDefinition);
    expect(checklistDefinition.catalogo).toBeDefined();
    expect(checklistDefinition.catalogo.nombre).toBe("Lista de verificación");
    expect(checklistDefinition.catalogo.familia).toBe("widget");
  });

  it("expone presets canónicos configurados", () => {
    expect(checklistDefinition.presets).toBe(CHECKLIST_PRESETS);
    expect(checklistDefinition.presets?.length).toBe(4);
    const numerado = checklistDefinition.presets?.find(
      (p) => p.id === "lista-numerada",
    );
    expect(numerado).toBeDefined();
    expect(numerado?.patch?.configuracion?.estiloVisual).toBe("numerado");
  });

  it("Viewer renderiza títulos, progreso y lista de casillas", () => {
    const estado = createDefaultChecklistBlock();
    estado.tituloWidget = "Checklist de Laboratorio";

    render(<ChecklistViewer estado={estado} config={{}} />);

    expect(screen.getByText("Checklist de Laboratorio")).toBeTruthy();
    expect(screen.getByText("0 de 4 completados")).toBeTruthy();
    expect(screen.getByText("0%")).toBeTruthy();

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBe(4);
    expect(checkboxes[0]?.getAttribute("aria-checked")).toBe("false");
  });

  it("Viewer alterna ítems y actualiza progreso dinámicamente", () => {
    const estado = createDefaultChecklistBlock();
    render(<ChecklistViewer estado={estado} config={{}} />);

    const checkboxes = screen.getAllByRole("checkbox");

    // Marcar primer ítem
    fireEvent.click(checkboxes[0]!);
    expect(checkboxes[0]?.getAttribute("aria-checked")).toBe("true");
    expect(screen.getByText("1 de 4 completados")).toBeTruthy();
    expect(screen.getByText("25%")).toBeTruthy();

    // Desmarcar primer ítem
    fireEvent.click(checkboxes[0]!);
    expect(checkboxes[0]?.getAttribute("aria-checked")).toBe("false");
    expect(screen.getByText("0 de 4 completados")).toBeTruthy();
  });

  it("Viewer muestra felicitación al completar el 100% y permite reiniciar", () => {
    const estado = createDefaultChecklistBlock();
    render(<ChecklistViewer estado={estado} config={{}} />);

    const checkboxes = screen.getAllByRole("checkbox");
    for (const cb of checkboxes) {
      fireEvent.click(cb);
    }

    expect(screen.getByText("4 de 4 completados")).toBeTruthy();
    expect(screen.getByText("100%")).toBeTruthy();
    expect(
      screen.getByText("¡Excelente trabajo! Has completado todos los pasos."),
    ).toBeTruthy();

    // Botón de reinicio
    const resetBtn = screen.getByRole("button", { name: /reiniciar/i });
    fireEvent.click(resetBtn);

    expect(screen.getByText("0 de 4 completados")).toBeTruthy();
    expect(screen.getByText("0%")).toBeTruthy();
  });

  it("Viewer responde a teclado en casilla con barra espaciadora", () => {
    const estado = createDefaultChecklistBlock();
    render(<ChecklistViewer estado={estado} config={{}} />);

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.keyDown(checkboxes[0]!, { key: " " });

    expect(checkboxes[0]?.getAttribute("aria-checked")).toBe("true");
  });

  it("Editor notifica selección de bloque", () => {
    const estado = createDefaultChecklistBlock();
    const onEnsureBlockSelected = vi.fn();

    render(
      <ChecklistEditor
        estado={estado}
        config={{ onEnsureBlockSelected }}
        onChange={() => undefined}
      />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]!);
    expect(onEnsureBlockSelected).toHaveBeenCalled();
  });

  it("Propiedades permite agregar, modificar ítems y aplicar presets", () => {
    const estado = createDefaultChecklistBlock();
    const onChange = vi.fn();

    render(
      <ChecklistPropiedades
        estado={estado}
        config={{}}
        onChange={onChange}
        onConfigChange={() => undefined}
      />,
    );

    // Agregar ítem
    const addBtn = screen.getByRole("button", { name: /\+ Agregar/i });
    fireEvent.click(addBtn);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        configuracion: expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({ texto: "Paso 5" }),
          ]),
        }),
      }),
    );

    // Aplicar preset
    const presetBtn = screen.getByRole("button", { name: "Pasos Numerados" });
    fireEvent.click(presetBtn);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        configuracion: expect.objectContaining({
          estiloVisual: "numerado",
        }),
      }),
    );
  });
});
