import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  DiagramaEditor as LegacyEditor,
  DiagramaViewer as LegacyViewer,
  DiagramaProperties as LegacyProperties,
  createDefaultMapaMentalBlock,
  createDefaultVennBlock,
} from "lumina-frontend/blocks/diagrama";
import { diagramaDefinition } from "./diagrama-definition.js";

describe("Diagrama — paridad legacy / ElementDefinition (E4.2)", () => {
  it("crea el mapa mental canónico sin puntuación y se registra una sola vez", async () => {
    expect({ ...diagramaDefinition.crearPorDefecto(), id: "" })
      .toEqual({ ...createDefaultMapaMentalBlock(), id: "" });
    const { elementRegistry } = await import("../../index.js");
    expect(elementRegistry.obtener("diagrama")).toBe(diagramaDefinition);
    expect(elementRegistry.listar().filter((def) => def.tipo === "diagrama")).toHaveLength(1);
    expect(diagramaDefinition).not.toHaveProperty("puntuacion");
  });

  // GraphCanvas se carga con next/dynamic: el setup existente lo sustituye por
  // null. El grafo verifica su contenedor accesible; Venn renderiza el SVG real.
  for (const [nombre, crear] of [
    ["grafo", createDefaultMapaMentalBlock],
    ["Venn", createDefaultVennBlock],
  ] as const) {
    it.each([false, true])(`Editor ${nombre}: DOM idéntico, seleccionado=%s`, (isSelected) => {
      const estado = crear();
      const legacy = render(<LegacyEditor block={estado} isSelected={isSelected} />);
      const nuevo = render(
        <diagramaDefinition.Editor estado={estado} config={{ isSelected }} onChange={() => undefined} />,
      );
      expect(nuevo.container.innerHTML).toBe(legacy.container.innerHTML);
      expect(nuevo.container.textContent).toContain(estado.titulo);
      if (nombre === "Venn") {
        expect(nuevo.container.querySelector("svg")).not.toBeNull();
        expect(nuevo.container.textContent).toContain("Murciélago");
      }
    });

    it.each([false, true])(`Viewer ${nombre}: DOM idéntico, miniatura=%s`, (isThumbnail) => {
      const estado = crear();
      const legacy = render(<LegacyViewer block={estado} isThumbnail={isThumbnail} />);
      const nuevo = render(<diagramaDefinition.Viewer estado={estado} config={{ isThumbnail }} />);
      expect(nuevo.container.innerHTML).toBe(legacy.container.innerHTML);
      expect(nuevo.container.querySelector('[role="region"]')?.getAttribute("aria-label")).toBe(estado.titulo);
      expect(Boolean(nuevo.container.querySelector("figcaption"))).toBe(!isThumbnail);
    });

    it(`Propiedades ${nombre}: DOM y cambio de título idénticos`, async () => {
      const estado = crear();
      const legacyChange = vi.fn();
      const nuevoChange = vi.fn();
      const legacy = render(<LegacyProperties block={estado} applyNow={async (fn) => { legacyChange(fn(estado)); }} />);
      const nuevo = render(
        <diagramaDefinition.Propiedades estado={estado} config={{}} onChange={nuevoChange} onConfigChange={() => undefined} />,
      );
      expect(nuevo.container.innerHTML).toBe(legacy.container.innerHTML);
      vi.useFakeTimers();
      try {
        const inputLegacy = legacy.container.querySelector("input");
        const inputNuevo = nuevo.container.querySelector("input");
        expect(inputLegacy).not.toBeNull();
        expect(inputNuevo).not.toBeNull();
        fireEvent.change(inputLegacy!, { target: { value: "Título editado" } });
        fireEvent.change(inputNuevo!, { target: { value: "Título editado" } });
        await vi.runAllTimersAsync();
        expect(nuevoChange).toHaveBeenCalledTimes(1);
        expect(nuevoChange.mock.calls).toEqual(legacyChange.mock.calls);
        expect(nuevoChange.mock.calls[0][0].titulo).toBe("Título editado");
      } finally {
        vi.useRealTimers();
      }
    });
  }
});
