/**
 * T15 — overlays: colocación con Floating UI (colisión con los bordes del slide, zoom del
 * canvas), canal «abrir popup / hotspot por id» y teclado/foco del Hotspot.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HotspotWidget, PopupWidget } from "@lumina/types/widget";
import { SlideCanvasRootContext } from "@lumina/editor-shared/slide-canvas-root-context";
import { calcularOverlay } from "@lumina/editor-shared/use-overlay-auto-position";
import { createDefaultHotspotBlock } from "./hotspot/hotspot-defaults.js";
import { HotspotViewer } from "./hotspot/hotspot-viewer.js";
import { createDefaultPopupBlock } from "./popup/popup-defaults.js";
import { PopupViewer } from "./popup/popup-viewer.js";
import { ABRIR_OVERLAY_EVENTO, pedirOverlay } from "./abrir-overlay.js";

// jsdom tarda segundos en resolver `matches(':popover-open')` (lo consulta Floating UI en cada
// medición); en un navegador real es instantáneo. Se responde «no» sin pasar por el selector.
beforeEach(() => {
  const matches = Element.prototype.matches;
  vi.spyOn(Element.prototype, "matches").mockImplementation(function (this: Element, selector: string) {
    if (/popover-open|:modal/.test(selector)) return false;
    return matches.call(this, selector);
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ── Geometría simulada ─────────────────────────────────────────────────────
// jsdom no hace layout: se fijan las medidas. Todo se declara en px del SLIDE y `escala` es el
// zoom del canvas: los rectángulos en pantalla se escalan, las medidas de layout (offset/client)
// no, igual que en un navegador con `transform: scale()`.

interface Caja {
  x: number;
  y: number;
  w: number;
  h: number;
}

function medir(el: HTMLElement, caja: Caja, escala: number) {
  const rect = {
    left: caja.x * escala,
    top: caja.y * escala,
    width: caja.w * escala,
    height: caja.h * escala,
    right: (caja.x + caja.w) * escala,
    bottom: (caja.y + caja.h) * escala,
    x: caja.x * escala,
    y: caja.y * escala,
    toJSON: () => ({}),
  };
  el.getBoundingClientRect = () => rect as DOMRect;
  for (const [prop, valor] of [
    ["offsetWidth", caja.w],
    ["offsetHeight", caja.h],
    ["clientWidth", caja.w],
    ["clientHeight", caja.h],
  ] as const) {
    Object.defineProperty(el, prop, { configurable: true, value: valor });
  }
}

const SLIDE = { w: 640, h: 360 };

async function colocar(opts: {
  trigger: { x: number; y: number };
  bubble: { w: number; h: number };
  side: "auto" | "arriba" | "abajo" | "izquierda" | "derecha";
  escala?: number;
  gap?: number;
}) {
  const escala = opts.escala ?? 1;
  const slide = document.createElement("div");
  slide.className = "canvas-slide";
  const trigger = document.createElement("div");
  const bubble = document.createElement("div");
  slide.append(trigger, bubble);
  document.body.append(slide);
  medir(slide, { x: 0, y: 0, w: SLIDE.w, h: SLIDE.h }, escala);
  // Como en el editor: el slide es el contenedor de posición de disparador y burbuja.
  for (const el of [trigger, bubble]) Object.defineProperty(el, "offsetParent", { configurable: true, value: slide });
  medir(trigger, { x: opts.trigger.x, y: opts.trigger.y, w: 24, h: 24 }, escala);
  medir(bubble, { x: 0, y: 0, w: opts.bubble.w, h: opts.bubble.h }, escala);
  try {
    return await calcularOverlay({
      reference: trigger,
      floating: bubble,
      boundary: slide,
      side: opts.side,
      gap: opts.gap ?? 12,
    });
  } finally {
    slide.remove();
  }
}

describe("colocación con Floating UI", () => {
  const burbuja = { w: 200, h: 100 };

  it("con espacio de sobra: abajo, sin desplazar", async () => {
    const r = await colocar({ trigger: { x: 300, y: 100 }, bubble: burbuja, side: "auto" });
    expect(r).toMatchObject({ side: "abajo", shiftX: 0, shiftY: 0, arrowShift: 0 });
  });

  it("pegado al borde inferior: pasa arriba", async () => {
    const r = await colocar({ trigger: { x: 300, y: 330 }, bubble: burbuja, side: "auto" });
    expect(r.side).toBe("arriba");
    expect(r.shiftX).toBe(0);
  });

  it("pegado al borde izquierdo: se desplaza a la derecha y la flecha en sentido contrario", async () => {
    const r = await colocar({ trigger: { x: 4, y: 100 }, bubble: burbuja, side: "auto" });
    expect(r.side).toBe("abajo");
    expect(r.shiftX).toBeGreaterThan(0);
    expect(r.arrowShift).toBeLessThan(0);
    // La burbuja queda dentro del slide (con su margen de 4 px).
    const izquierda = 4 + 12 - 100 + r.shiftX; // centro del disparador − media burbuja + desplazamiento
    expect(izquierda).toBeGreaterThanOrEqual(4 - 1);
  });

  it("pegado al borde derecho: se desplaza a la izquierda", async () => {
    const r = await colocar({ trigger: { x: 612, y: 100 }, bubble: burbuja, side: "auto" });
    expect(r.shiftX).toBeLessThan(0);
    expect(r.arrowShift).toBeGreaterThan(0);
  });

  it("pegado al borde superior: abajo (no hay sitio arriba)", async () => {
    const r = await colocar({ trigger: { x: 300, y: 0 }, bubble: burbuja, side: "auto" });
    expect(r.side).toBe("abajo");
  });

  it("esquina inferior derecha: arriba y desplazada a la izquierda", async () => {
    const r = await colocar({ trigger: { x: 612, y: 334 }, bubble: burbuja, side: "auto" });
    expect(r.side).toBe("arriba");
    expect(r.shiftX).toBeLessThan(0);
  });

  it("burbuja alta que no cabe arriba ni abajo: se va a un lado", async () => {
    const r = await colocar({ trigger: { x: 100, y: 170 }, bubble: { w: 150, h: 340 }, side: "auto" });
    expect(["derecha", "izquierda"]).toContain(r.side);
  });

  it("lado explícito: nunca cambia de lado, solo se desplaza (paridad)", async () => {
    const abajo = await colocar({ trigger: { x: 300, y: 334 }, bubble: burbuja, side: "abajo" });
    expect(abajo.side).toBe("abajo");
    const arriba = await colocar({ trigger: { x: 300, y: 2 }, bubble: burbuja, side: "arriba" });
    expect(arriba.side).toBe("arriba");
    const derecha = await colocar({ trigger: { x: 612, y: 100 }, bubble: burbuja, side: "derecha" });
    expect(derecha.side).toBe("derecha");
    const izquierda = await colocar({ trigger: { x: 100, y: 4 }, bubble: { w: 150, h: 120 }, side: "izquierda" });
    expect(izquierda.side).toBe("izquierda");
    expect(izquierda.shiftY).toBeGreaterThan(0);
    expect(izquierda.shiftX).toBe(0);
  });

  it("explícito sin colisión: sin desplazamiento", async () => {
    for (const side of ["arriba", "abajo", "izquierda", "derecha"] as const) {
      const r = await colocar({ trigger: { x: 300, y: 170 }, bubble: { w: 120, h: 60 }, side });
      expect(r).toMatchObject({ side, shiftX: 0, shiftY: 0 });
    }
  });

  it("con el canvas ampliado o reducido da lo mismo (px del slide, no de pantalla)", async () => {
    const casos = [
      { trigger: { x: 4, y: 100 }, side: "auto" as const },
      { trigger: { x: 612, y: 334 }, side: "auto" as const },
      { trigger: { x: 300, y: 330 }, side: "arriba" as const },
    ];
    for (const caso of casos) {
      const base = await colocar({ ...caso, bubble: burbuja, escala: 1 });
      for (const escala of [0.5, 0.75, 1.5, 2]) {
        const r = await colocar({ ...caso, bubble: burbuja, escala });
        expect(r.side).toBe(base.side);
        expect(Math.abs(r.shiftX - base.shiftX)).toBeLessThanOrEqual(1);
        expect(Math.abs(r.shiftY - base.shiftY)).toBeLessThanOrEqual(1);
      }
    }
  });
});

// ── Canal «abrir por id» ───────────────────────────────────────────────────

const hotspot = () => createDefaultHotspotBlock() as HotspotWidget;
const popup = () => createDefaultPopupBlock() as PopupWidget;
const hotspotAbierto = (c: HTMLElement) => c.querySelector('[class*="bubbleVisible"]') !== null;

describe("abrir por id", () => {
  it("el evento de documento se llama como se espera", () => {
    expect(ABRIR_OVERLAY_EVENTO).toBe("lumina:abrir-overlay");
  });

  it("abre solo el hotspot con ese id; cerrar y alternar funcionan", () => {
    const a = render(<HotspotViewer block={hotspot()} bloqueId="h1" />);
    const b = render(<HotspotViewer block={hotspot()} bloqueId="h2" />);
    expect(hotspotAbierto(a.container)).toBe(false);
    act(() => pedirOverlay("h1"));
    expect(hotspotAbierto(a.container)).toBe(true);
    expect(hotspotAbierto(b.container)).toBe(false);
    act(() => pedirOverlay("h1", "cerrar"));
    expect(hotspotAbierto(a.container)).toBe(false);
    act(() => pedirOverlay("h1", "alternar"));
    expect(hotspotAbierto(a.container)).toBe(true);
    act(() => pedirOverlay("h1", "alternar"));
    expect(hotspotAbierto(a.container)).toBe(false);
  });

  it("abrir desde fuera emite `visitado` una vez y nunca `clic`", () => {
    const emitir = vi.fn();
    render(<HotspotViewer block={hotspot()} bloqueId="h1" emitir={emitir} />);
    act(() => pedirOverlay("h1"));
    act(() => pedirOverlay("h1", "cerrar"));
    act(() => pedirOverlay("h1"));
    expect(emitir.mock.calls.map(([e]) => e)).toEqual(["visitado"]);
  });

  it("sin bloqueId o en miniatura no escucha", () => {
    const sin = render(<HotspotViewer block={hotspot()} />);
    const mini = render(<HotspotViewer block={hotspot()} bloqueId="h1" isThumbnail />);
    act(() => pedirOverlay("h1"));
    expect(hotspotAbierto(sin.container)).toBe(false);
    expect(hotspotAbierto(mini.container)).toBe(false);
  });

  it("abre y cierra el popup por id (modal con role=dialog)", () => {
    // El popup se monta en el `.canvas-slide` del editor / presentación.
    const slide = document.createElement("div");
    slide.className = "canvas-slide";
    document.body.append(slide);
    render(
      <SlideCanvasRootContext.Provider value={slide}>
        <PopupViewer block={popup()} bloqueId="p1" />
      </SlideCanvasRootContext.Provider>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    act(() => pedirOverlay("p1"));
    expect(screen.getByRole("dialog")).toBeTruthy();
    act(() => pedirOverlay("p1", "cerrar"));
    expect(screen.queryByRole("dialog")).toBeNull();
    act(() => pedirOverlay("otro"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("al desmontar deja de escuchar", () => {
    const { container, unmount } = render(<HotspotViewer block={hotspot()} bloqueId="h1" />);
    unmount();
    expect(() => act(() => pedirOverlay("h1"))).not.toThrow();
    expect(container.innerHTML).toBe("");
  });
});

// ── Teclado y foco del Hotspot ─────────────────────────────────────────────

describe("Hotspot con teclado", () => {
  const conClic = () => {
    const b = hotspot();
    return { ...b, configuracion: { ...b.configuracion, triggerEvento: "click" } } as HotspotWidget;
  };

  it("el marcador es un botón: Enter abre, el foco pasa a la burbuja y Escape cierra devolviéndolo", () => {
    const { container } = render(<HotspotViewer block={conClic()} />);
    const marcador = screen.getByRole("button", { name: "Mostrar información" });
    expect(marcador.getAttribute("aria-expanded")).toBe("false");
    marcador.focus();
    fireEvent.keyDown(marcador, { key: "Enter" });
    expect(marcador.getAttribute("aria-expanded")).toBe("true");
    const dialogo = container.querySelector('[role="dialog"]') as HTMLElement;
    expect(document.activeElement).toBe(dialogo);
    fireEvent.keyDown(dialogo, { key: "Escape" });
    expect(marcador.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(marcador);
  });

  it("Espacio también abre", () => {
    render(<HotspotViewer block={conClic()} />);
    const marcador = screen.getByRole("button", { name: "Mostrar información" });
    fireEvent.keyDown(marcador, { key: " " });
    expect(marcador.getAttribute("aria-expanded")).toBe("true");
  });
});
