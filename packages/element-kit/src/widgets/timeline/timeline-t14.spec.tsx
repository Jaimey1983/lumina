/**
 * T14 — Timeline: orientación vertical, densidad y animación de entrada.
 * Por defecto el widget es el de siempre (sin atributos ni envoltorios nuevos).
 */
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TimelineWidget } from "@lumina/types/widget";
import { TIMELINE_PRESETS } from "../../elements/timeline/timeline-definition.js";
import { createDefaultTimelineBlock } from "./timeline-defaults.js";
import { normalizeTimelineWidget } from "./timeline-config.js";
import { TIMELINE_VARIANTES } from "./timeline-variant-meta.js";
import {
  TIMELINE_ESTILOS_T14_IDS,
  entradaDeAnimacion,
  leerOpcionesT14,
} from "./timeline-t14.js";
import { TimelineViewer } from "./timeline-viewer.js";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function bloque(cfg: Record<string, unknown> = {}): TimelineWidget {
  const base = createDefaultTimelineBlock();
  return { ...base, configuracion: { ...base.configuracion, ...cfg } } as TimelineWidget;
}

const escenario = (c: HTMLElement) => c.querySelector('[data-halo]') as HTMLElement;
const nodos = (c: HTMLElement) => c.querySelectorAll('[class*="tlNodeItem"]');

describe("opciones de T14", () => {
  it("por defecto: horizontal, normal, sin animación; inválidos vuelven al defecto", () => {
    expect(leerOpcionesT14(undefined)).toEqual({
      orientacion: "horizontal",
      densidad: "normal",
      animacion: "ninguna",
    });
    expect(leerOpcionesT14({ orientacion: "diagonal", densidad: "x", animacion: "rebote" })).toEqual(
      leerOpcionesT14({}),
    );
    expect(entradaDeAnimacion("ninguna")).toBeNull();
    expect(entradaDeAnimacion("fundido")).toBe("fade");
    expect(entradaDeAnimacion("subir")).toBe("slide-up");
    expect(entradaDeAnimacion("escala")).toBe("scale");
  });

  it("normalizar un bloque legado no agrega claves; con opciones, las conserva", () => {
    const n = normalizeTimelineWidget(bloque()) as unknown as { configuracion: Record<string, unknown> };
    for (const k of ["orientacion", "densidad", "animacion"]) expect(k in n.configuracion).toBe(false);
    const c = normalizeTimelineWidget(bloque({ orientacion: "vertical" })) as unknown as {
      configuracion: Record<string, unknown>;
    };
    expect(c.configuracion.orientacion).toBe("vertical");
  });
});

describe("visor por defecto (sin cambios)", () => {
  it("sin data-orientacion ni data-densidad, sin envoltorio de movimiento, 4 nodos", () => {
    const { container } = render(<TimelineViewer widget={bloque()} />);
    expect(escenario(container).hasAttribute("data-orientacion")).toBe(false);
    expect(escenario(container).hasAttribute("data-densidad")).toBe(false);
    expect(container.querySelector("[data-widget-motion]")).toBeNull();
    expect(nodos(container)).toHaveLength(4);
  });

  it("las 8 variantes siguen rindiendo sus nodos", () => {
    for (const v of TIMELINE_VARIANTES) {
      const { container, unmount } = render(<TimelineViewer widget={bloque({ variante: v.id })} />);
      expect(nodos(container)).toHaveLength(4);
      unmount();
    }
  });
});

describe("orientación y densidad", () => {
  it("vertical y densidades marcan el escenario (también con otras variantes)", () => {
    const { container } = render(
      <TimelineViewer widget={bloque({ orientacion: "vertical", densidad: "compacta", variante: "segmentada" })} />,
    );
    expect(escenario(container).getAttribute("data-orientacion")).toBe("vertical");
    expect(escenario(container).getAttribute("data-densidad")).toBe("compacta");
    expect(nodos(container)).toHaveLength(4);
  });

  it("amplia", () => {
    const { container } = render(<TimelineViewer widget={bloque({ densidad: "amplia" })} />);
    expect(escenario(container).getAttribute("data-densidad")).toBe("amplia");
  });
});

describe("animación de entrada", () => {
  it("sin IntersectionObserver los nodos aparecen de inmediato dentro del movimiento", () => {
    const { container } = render(<TimelineViewer widget={bloque({ animacion: "subir" })} />);
    expect(container.querySelector("[data-widget-motion]")).not.toBeNull();
    expect(nodos(container)).toHaveLength(4);
  });

  it("con IntersectionObserver espera a entrar en vista y recién entonces monta los nodos", () => {
    let aviso: ((e: { isIntersecting: boolean }[]) => void) | null = null;
    class FakeIO {
      constructor(cb: (e: { isIntersecting: boolean }[]) => void) {
        aviso = cb;
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    }
    vi.stubGlobal("IntersectionObserver", FakeIO);
    const { container } = render(<TimelineViewer widget={bloque({ animacion: "fundido" })} />);
    expect(nodos(container)).toHaveLength(0);
    act(() => aviso?.([{ isIntersecting: true }]));
    expect(nodos(container)).toHaveLength(4);
  });

  it("en miniatura no hay animación ni espera", () => {
    const { container } = render(<TimelineViewer widget={bloque({ animacion: "subir" })} isThumbnail />);
    expect(container.querySelector("[data-widget-motion]")).toBeNull();
    expect(nodos(container)).toHaveLength(4);
  });
});

describe("presets de T14", () => {
  it("existen, con ids únicos, y las 8 variantes siguen siendo presets", () => {
    const ids = TIMELINE_PRESETS.map((p) => p.id);
    for (const id of TIMELINE_ESTILOS_T14_IDS) expect(ids).toContain(id);
    for (const v of TIMELINE_VARIANTES) expect(ids).toContain(v.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(TIMELINE_VARIANTES.length + TIMELINE_ESTILOS_T14_IDS.size);
  });
});
