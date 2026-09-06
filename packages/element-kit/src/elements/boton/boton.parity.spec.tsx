import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import {
  BotonViewer as LegacyBotonViewer,
  createDefaultBotonBlock,
  SlideNavContext,
  type BotonWidget,
  type SlideNavAction,
} from "lumina-frontend/widgets/boton";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { botonDefinition } from "./boton-definition.js";
import type { BotonConfig, BotonEstado } from "./boton-types.js";

function NavHarness({
  children,
  navigate,
  slideCount = 5,
}: {
  children: ReactNode;
  navigate: (action: SlideNavAction) => void;
  slideCount?: number;
}) {
  return createElement(
    SlideNavContext.Provider,
    {
      value: { navigate, slideCount, slideIndex: 1 },
    },
    children,
  );
}

function snapshotVisible(container: HTMLElement) {
  const el = container.querySelector("button, a");
  if (!el) return null;
  return {
    tag: el.tagName,
    text: el.textContent,
    disabled: el.hasAttribute("disabled") || el.getAttribute("aria-disabled"),
    href: el.getAttribute("href"),
    target: el.getAttribute("target"),
    rel: el.getAttribute("rel"),
    type: el.getAttribute("type"),
    className: el.className,
  };
}

describe("Botón — paridad ElementDefinition vs legacy (E1.4)", () => {
  it("crearPorDefecto envuelve createDefaultBotonBlock", () => {
    const fromDef = botonDefinition.crearPorDefecto();
    const fromLegacy = createDefaultBotonBlock();
    expect(fromDef).toEqual(fromLegacy);
    expect(fromDef.tipo).toBe("boton");
  });

  it("Viewer nuevo y viejo producen el mismo DOM visible (acción siguiente)", () => {
    const block = createDefaultBotonBlock();
    block.texto = "Siguiente";
    block.accion = "siguiente";

    const navigate = vi.fn();
    const NewViewer = botonDefinition.Viewer;

    const legacy = render(
      <NavHarness navigate={navigate}>
        <LegacyBotonViewer block={block} />
      </NavHarness>,
    );
    const next = render(
      <NavHarness navigate={navigate}>
        <NewViewer estado={block} config={{}} />
      </NavHarness>,
    );

    expect(snapshotVisible(next.container)).toEqual(
      snapshotVisible(legacy.container),
    );
  });

  it("acciones de navegación: siguiente / anterior / ir_a", () => {
    const navigate = vi.fn();
    const NewViewer = botonDefinition.Viewer;

    const cases: Array<{ block: BotonWidget; expected: SlideNavAction }> = [
      {
        block: {
          ...createDefaultBotonBlock(),
          texto: "Next",
          accion: "siguiente",
        },
        expected: { kind: "siguiente" },
      },
      {
        block: {
          ...createDefaultBotonBlock(),
          texto: "Prev",
          accion: "anterior",
        },
        expected: { kind: "anterior" },
      },
      {
        block: {
          ...createDefaultBotonBlock(),
          texto: "Go",
          accion: "ir_a",
          slideIndex: 3,
        },
        expected: { kind: "ir_a", index: 3 },
      },
    ];

    for (const { block, expected } of cases) {
      navigate.mockClear();
      const { unmount } = render(
        <NavHarness navigate={navigate}>
          <NewViewer estado={block} config={{}} />
        </NavHarness>,
      );
      fireEvent.click(screen.getByRole("button", { name: block.texto }));
      expect(navigate).toHaveBeenCalledWith(expected);
      unmount();
    }
  });

  it("acción URL: mismo <a> con href/target/rel que el viewer legacy", () => {
    const block = createDefaultBotonBlock();
    block.texto = "Docs";
    block.accion = "url";
    block.url = "https://example.com/docs";

    const navigate = vi.fn();
    const NewViewer = botonDefinition.Viewer;

    const legacy = render(
      <NavHarness navigate={navigate}>
        <LegacyBotonViewer block={block} />
      </NavHarness>,
    );
    const next = render(
      <NavHarness navigate={navigate}>
        <NewViewer estado={block} config={{}} />
      </NavHarness>,
    );

    expect(snapshotVisible(next.container)).toEqual(
      snapshotVisible(legacy.container),
    );
    expect(next.container.querySelector("a")?.getAttribute("href")).toBe(
      "https://example.com/docs",
    );
  });

  it("está registrado en el registry del paquete sin puntuacion", async () => {
    const { elementRegistry } = await import("../../index.js");
    const def = elementRegistry.obtener("boton") as
      | ElementDefinition<BotonEstado, BotonConfig>
      | undefined;
    expect(def).toBe(botonDefinition);
    expect(def?.puntuacion).toBeUndefined();
    expect(def?.apariencia).toEqual({
      color: true,
      tipografia: true,
      animacion: false,
    });
  });
});
