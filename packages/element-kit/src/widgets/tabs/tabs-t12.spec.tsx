/**
 * T12 — Tabs: variantes de barra, transición de panel, icono e insignia por pestaña y presets.
 * Por defecto (sin opciones) el visor es el de siempre.
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { TabsWidget } from "@lumina/types/widget";
import { TABS_PRESETS } from "../../elements/tabs/tabs-definition.js";
import { createDefaultTabsBlock } from "./tabs-defaults.js";
import { normalizeTabsWidget } from "./tabs-config.js";
import { TabsViewer } from "./tabs-viewer.js";
import {
  entradaDeTransicion,
  leerFichaT12,
  leerOpcionesT12,
  TABS_INSIGNIA_MAX,
} from "./tabs-t12.js";

afterEach(() => cleanup());

function bloque(cfg: Record<string, unknown> = {}, fichas?: Record<string, unknown>[]): TabsWidget {
  const base = createDefaultTabsBlock();
  return {
    ...base,
    configuracion: { ...base.configuracion, ...cfg },
    fichas: fichas ? base.fichas.map((f, i) => ({ ...f, ...(fichas[i] ?? {}) })) : base.fichas,
  } as TabsWidget;
}

const barra = (c: HTMLElement) => c.querySelector('[role="tablist"]') as HTMLElement;
const claseDe = (el: HTMLElement) => el.className;

describe("opciones de T12", () => {
  it("por defecto: subrayado, sin transición; inválidos vuelven al defecto", () => {
    expect(leerOpcionesT12(undefined)).toEqual({ variante: "underline", transicion: "ninguna" });
    expect(leerOpcionesT12({ variante: "tabla", transicion: "salto" })).toEqual(leerOpcionesT12({}));
    expect(entradaDeTransicion("ninguna")).toBeNull();
    expect(entradaDeTransicion("fundido")).toBe("fade");
    expect(entradaDeTransicion("deslizar")).toBe("slide-left");
  });

  it("normalizar un bloque legado no agrega claves; uno con opciones las conserva (y las de ficha)", () => {
    const n = normalizeTabsWidget(bloque()) as unknown as { configuracion: Record<string, unknown> };
    expect("variante" in n.configuracion).toBe(false);
    expect("transicion" in n.configuracion).toBe(false);
    const c = normalizeTabsWidget(
      bloque({ variante: "pills" }, [{ icono: "idea", insignia: "Nuevo" }]),
    ) as unknown as { configuracion: Record<string, unknown>; fichas: Record<string, unknown>[] };
    expect(c.configuracion.variante).toBe("pills");
    expect(c.fichas[0].icono).toBe("idea");
  });

  it("insignia recortada y vacía sin icono", () => {
    expect(leerFichaT12({ insignia: "  " + "x".repeat(40) })).toEqual({
      icono: null,
      insignia: "x".repeat(TABS_INSIGNIA_MAX),
    });
  });
});

describe("visor por defecto (sin cambios)", () => {
  it("3 pestañas, la primera activa, sin icono ni insignia; el clic cambia", () => {
    const { container } = render(<TabsViewer block={bloque()} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(tabs[0].querySelector("svg")).toBeNull();
    expect(tabs[0].textContent).toBe("FICHA 01");
    expect(claseDe(barra(container))).not.toMatch(/var(Pills|Enclosed|Segmented|Vertical)/);
    expect(container.querySelector('[class*="tabsVerticalBody"]')).toBeNull();
    fireEvent.click(tabs[2]);
    expect(tabs[2].getAttribute("aria-selected")).toBe("true");
    expect(container.textContent).toContain("ENCABEZADO 03");
  });
});

describe("variantes", () => {
  const casos: [string, RegExp][] = [
    ["pills", /varPills/],
    ["enclosed", /varEnclosed/],
    ["segmented", /varSegmented/],
    ["vertical", /varVertical/],
  ];
  for (const [variante, re] of casos) {
    it(`${variante}: la barra lleva su clase y las pestañas siguen funcionando`, () => {
      const { container } = render(<TabsViewer block={bloque({ variante })} />);
      expect(claseDe(barra(container))).toMatch(re);
      fireEvent.click(screen.getAllByRole("tab")[1]);
      expect(container.textContent).toContain("ENCABEZADO 02");
    });
  }

  it("vertical: cuerpo en fila y aria-orientation", () => {
    const { container } = render(<TabsViewer block={bloque({ variante: "vertical" })} />);
    expect(container.querySelector('[class*="tabsVerticalBody"]')).not.toBeNull();
    expect(barra(container).getAttribute("aria-orientation")).toBe("vertical");
  });
});

describe("icono e insignia", () => {
  it("se dibujan junto a la etiqueta", () => {
    render(<TabsViewer block={bloque({}, [{ icono: "idea", insignia: "Nuevo" }])} />);
    const t = screen.getAllByRole("tab")[0];
    expect(t.querySelector("svg")).not.toBeNull();
    expect(t.textContent).toBe("FICHA 01Nuevo");
    expect(screen.getAllByRole("tab")[1].querySelector("svg")).toBeNull();
  });

  it("un icono desconocido se ignora", () => {
    render(<TabsViewer block={bloque({}, [{ icono: "dragon" }])} />);
    expect(screen.getAllByRole("tab")[0].querySelector("svg")).toBeNull();
  });
});

describe("transición de panel", () => {
  it("con fundido/deslizar el panel sigue mostrando la ficha activa", () => {
    for (const transicion of ["fundido", "deslizar"]) {
      const { container, unmount } = render(<TabsViewer block={bloque({ transicion })} />);
      fireEvent.click(screen.getAllByRole("tab")[1]);
      expect(container.textContent).toContain("ENCABEZADO 02");
      unmount();
    }
  });

  it("en miniatura no hay movimiento", () => {
    const { container } = render(<TabsViewer block={bloque({ transicion: "fundido" })} isThumbnail />);
    expect(container.textContent).toContain("ENCABEZADO 01");
  });
});

describe("teclado", () => {
  it("flechas, Inicio y Fin cambian de pestaña; roving tabindex", () => {
    render(<TabsViewer block={bloque()} />);
    const lista = screen.getByRole("tablist");
    const tabs = () => screen.getAllByRole("tab");
    expect(tabs().map((t) => t.getAttribute("tabindex"))).toEqual(["0", "-1", "-1"]);
    fireEvent.keyDown(lista, { key: "ArrowRight" });
    expect(tabs()[1].getAttribute("aria-selected")).toBe("true");
    fireEvent.keyDown(lista, { key: "End" });
    expect(tabs()[2].getAttribute("aria-selected")).toBe("true");
    fireEvent.keyDown(lista, { key: "ArrowRight" });
    expect(tabs()[2].getAttribute("aria-selected")).toBe("true");
    fireEvent.keyDown(lista, { key: "Home" });
    expect(tabs()[0].getAttribute("aria-selected")).toBe("true");
  });

  it("en la variante lateral usan arriba/abajo", () => {
    render(<TabsViewer block={bloque({ variante: "vertical" })} />);
    fireEvent.keyDown(screen.getByRole("tablist"), { key: "ArrowDown" });
    expect(screen.getAllByRole("tab")[1].getAttribute("aria-selected")).toBe("true");
  });
});

describe("presets de Tabs", () => {
  it("hay 5, con ids únicos, y cada uno fija variante y transición", () => {
    expect(TABS_PRESETS).toHaveLength(5);
    expect(new Set(TABS_PRESETS.map((p) => p.id)).size).toBe(5);
    const variantes = TABS_PRESETS.map((p) => leerOpcionesT12(p.estadoPatch.configuracion).variante);
    expect(new Set(variantes).size).toBe(5);
  });
});
