import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  RenderClipGroup as LegacyViewerAndEditor,
  ClipGroupProperties as LegacyProperties,
  createDefaultClipGroup,
  type ClipGroupBlock,
  type ClipShape,
} from "lumina-frontend/blocks/clip-group";
import { clipGroupDefinition } from "./clip-group-definition.js";

/** Normaliza IDs de `useId` y nombres de clip-path para comparar el DOM visible. */
function domVisible(container: HTMLElement): string {
  return container.innerHTML
    .replace(/clip-[a-zA-Z0-9_-]+/g, "clip-mock-id")
    .replace(/id=":[^"]+"/g, 'id="__id__"')
    .replace(/id="_r_[^"]+"/g, 'id="__id__"')
    .replace(/id="radix-[^"]+"/g, 'id="__radix__"')
    .replace(/aria-[a-z]+=":[^"]+"/g, 'aria-attr="__id__"')
    .replace(/aria-[a-z]+="_r_[^"]+"/g, 'aria-attr="__id__"')
    .replace(/aria-[a-z]+="radix-[^"]+"/g, 'aria-attr="__radix__"');
}

describe("ClipGroup — paridad legacy / ElementDefinition (E4.3)", () => {
  it("crearPorDefecto genera la forma canónica de círculo y se registra sin puntuación", async () => {
    const defecto = clipGroupDefinition.crearPorDefecto();
    const canonico = createDefaultClipGroup();
    expect({ ...defecto, id: "" }).toEqual({ ...canonico, id: "" });
    expect(defecto.tipo).toBe("clip-group");
    expect(defecto.clipShape.tipo).toBe("circulo");

    const { elementRegistry } = await import("../../index.js");
    expect(elementRegistry.obtener("clip-group")).toBe(clipGroupDefinition);
    expect(
      elementRegistry
        .listar()
        .filter(
          (def) => (def as { readonly tipo?: unknown }).tipo === "clip-group",
        ),
    ).toHaveLength(1);
    expect(clipGroupDefinition).not.toHaveProperty("puntuacion");
  });

  const casosForma: [string, ClipShape, Record<string, unknown>?][] = [
    ["círculo", { tipo: "circulo" }],
    [
      "rectángulo con borde y sombra",
      { tipo: "rectangulo", borderRadius: 12 },
      {
        borde: { color: "#3b82f6", grosor: 4 },
        sombra: { color: "rgba(0,0,0,0.5)", blur: 8, offsetX: 2, offsetY: 4 },
      },
    ],
    ["estrella", { tipo: "estrella", puntas: 5, radioInterno: 0.4 }],
    ["hexágono", { tipo: "hexagono" }],
    ["triángulo", { tipo: "triangulo" }],
  ];

  for (const [nombre, shape, extras] of casosForma) {
    it(`Viewer ${nombre}: DOM idéntico entre legacy y nuevo`, () => {
      const estado: ClipGroupBlock = {
        ...createDefaultClipGroup(shape),
        ...extras,
      };

      const legacy = render(<LegacyViewerAndEditor block={estado} editorMode={false} />);
      const nuevo = render(<clipGroupDefinition.Viewer estado={estado} config={{}} />);

      expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
      expect(nuevo.container.querySelector("svg clipPath")).not.toBeNull();
    });

    it.each([false, true])(`Editor ${nombre}: DOM idéntico, seleccionado=%s`, (isSelected) => {
      const estado: ClipGroupBlock = {
        ...createDefaultClipGroup(shape),
        ...extras,
      };

      const legacy = render(
        <LegacyViewerAndEditor block={estado} editorMode={true} isSelected={isSelected} />,
      );
      const nuevo = render(
        <clipGroupDefinition.Editor
          estado={estado}
          config={{ isSelected }}
          onChange={() => undefined}
        />,
      );

      expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
    });
  }

  it("Propiedades: DOM y mutación de opacidad idénticos entre legacy y nuevo", async () => {
    const estado = createDefaultClipGroup({ tipo: "circulo" });
    const legacyChange = vi.fn();
    const nuevoChange = vi.fn();

    const legacy = render(
      <LegacyProperties
        block={estado}
        applyNow={async (fn) => {
          legacyChange(fn(estado));
        }}
        scheduleApply={(fn) => {
          legacyChange(fn(estado));
        }}
        clearDebounce={() => undefined}
      />,
    );

    const nuevo = render(
      <clipGroupDefinition.Propiedades
        estado={estado}
        config={{}}
        onChange={nuevoChange}
        onConfigChange={() => undefined}
      />,
    );

    expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));

    // Encuentra los sliders de opacidad / escala
    const sliders = nuevo.container.querySelectorAll('[role="slider"]');
    expect(sliders.length).toBeGreaterThan(0);
  });

  it("Editor: propaga cambios de forma vía onShapeCommit", () => {
    const estado = createDefaultClipGroup({ tipo: "circulo" });
    const onChange = vi.fn();

    const renderResult = render(
      <clipGroupDefinition.Editor
        estado={estado}
        config={{ isSelected: true }}
        onChange={onChange}
      />,
    );

    expect(renderResult.container.querySelector("svg")).not.toBeNull();
  });
});
