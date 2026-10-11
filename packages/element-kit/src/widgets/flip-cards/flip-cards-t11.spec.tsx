/**
 * T11 — Flip Cards: tipos de giro, profundidad, entrada escalonada y modo mazo.
 * Por defecto el widget es el de siempre (sin atributos ni envoltorios nuevos).
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { FlipCardsWidget } from "@lumina/types/slide";
import { FLIP_CARDS_PRESETS } from "../../elements/flip-cards/flip-cards-definition.js";
import { createDefaultFlipCardsBlock } from "./flip-cards-defaults.js";
import { normalizeFlipCardsWidget } from "./flip-cards-config.js";
import { applyFlipCardsPlantilla, FLIP_CARDS_PLANTILLAS } from "./flip-cards-templates.js";
import { FLIP_CARDS_ESTILOS_T11_IDS, leerOpcionesT11 } from "./flip-cards-t11.js";
import { FlipCardsViewer } from "./flip-cards-viewer.js";

afterEach(() => cleanup());

// jsdom no trae PointerEvent: sin esto `clientX` se pierde en los eventos de puntero.
if (typeof window.PointerEvent === "undefined") {
  (window as unknown as { PointerEvent: typeof MouseEvent }).PointerEvent = class extends MouseEvent {} as typeof MouseEvent;
}

function bloque(cfg: Record<string, unknown> = {}): FlipCardsWidget {
  const base = createDefaultFlipCardsBlock();
  return { ...base, configuracion: { ...base.configuracion, ...cfg } } as FlipCardsWidget;
}

describe("opciones de T11", () => {
  it("por defecto: giro y, sin profundidad, sin entrada, cuadrícula", () => {
    expect(leerOpcionesT11(undefined)).toEqual({
      giro: "y",
      profundidad: false,
      entradaEscalonada: false,
      modo: "cuadricula",
    });
    expect(leerOpcionesT11({ giro: "cubo", modo: "otro", profundidad: "si" })).toEqual(
      leerOpcionesT11({}),
    );
  });

  it("normalizar un bloque legado no agrega claves nuevas; uno con opciones las conserva", () => {
    const n = normalizeFlipCardsWidget(bloque()).configuracion as Record<string, unknown>;
    for (const k of ["giro", "profundidad", "entradaEscalonada", "modo"]) expect(k in n).toBe(false);
    const c = normalizeFlipCardsWidget(bloque({ giro: "x", modo: "mazo" })).configuracion as Record<string, unknown>;
    expect(c.giro).toBe("x");
    expect(c.modo).toBe("mazo");
  });

  it("aplicar una plantilla de color no pisa el giro ni el modo", () => {
    const aplicado = applyFlipCardsPlantilla(bloque({ giro: "fundido", modo: "mazo" }), FLIP_CARDS_PLANTILLAS[1].id);
    expect(leerOpcionesT11(aplicado.configuracion)).toMatchObject({ giro: "fundido", modo: "mazo" });
  });
});

describe("cuadrícula (sin cambios)", () => {
  it("3 tarjetas, sin data-giro y el clic voltea", () => {
    const { container } = render(<FlipCardsViewer block={bloque()} />);
    expect(container.querySelectorAll("[data-giro]").length).toBe(0);
    const botones = screen.getAllByRole("button", { name: /Mostrar reverso/ });
    expect(botones).toHaveLength(3);
    fireEvent.click(botones[0]);
    expect(botones[0].getAttribute("aria-pressed")).toBe("true");
    fireEvent.keyDown(botones[0], { key: "Enter" });
    expect(botones[0].getAttribute("aria-pressed")).toBe("false");
  });
});

describe("tipos de giro y profundidad", () => {
  for (const giro of ["x", "deslizar", "fundido"]) {
    it(`giro ${giro}: marca cada tarjeta`, () => {
      const { container } = render(<FlipCardsViewer block={bloque({ giro })} />);
      expect(container.querySelectorAll(`[data-giro="${giro}"]`)).toHaveLength(3);
    });
  }

  it("profundidad agrega su clase", () => {
    const { container } = render(<FlipCardsViewer block={bloque({ profundidad: true })} />);
    expect(container.querySelectorAll('[class*="profundidad"]')).toHaveLength(3);
  });

  it("el giro sigue volteando con cualquier tipo", () => {
    render(<FlipCardsViewer block={bloque({ giro: "fundido" })} />);
    const b = screen.getAllByRole("button")[0];
    fireEvent.click(b);
    expect(b.getAttribute("aria-pressed")).toBe("true");
  });
});

describe("entrada escalonada", () => {
  it("muestra todas las tarjetas (con movimiento y también sin él)", () => {
    const { container } = render(<FlipCardsViewer block={bloque({ entradaEscalonada: true })} />);
    expect(container.textContent).toContain("Tarjeta 1");
    expect(container.textContent).toContain("Tarjeta 3");
  });

  it("en miniatura no se envuelve en movimiento", () => {
    const { container } = render(<FlipCardsViewer block={bloque({ entradaEscalonada: true })} isThumbnail />);
    expect(container.textContent).toContain("Tarjeta 2");
  });
});

describe("modo mazo", () => {
  const mazo = () => render(<FlipCardsViewer block={bloque({ modo: "mazo" })} />);
  const grupo = (c: HTMLElement) => c.querySelector('[role="group"]') as HTMLElement;

  it("muestra una sola tarjeta y el contador", () => {
    const { container } = mazo();
    expect(container.textContent).toContain("Tarjeta 1");
    expect(container.textContent).not.toContain("Tarjeta 2");
    expect(grupo(container).getAttribute("aria-label")).toBe("Tarjeta 1 de 3");
    expect(container.textContent).toContain("1 / 3");
    expect((screen.getByLabelText("Tarjetas anteriores") as HTMLButtonElement).disabled).toBe(true);
  });

  it("los botones y las flechas del teclado avanzan y retroceden, con tope en los extremos", () => {
    const { container } = mazo();
    fireEvent.click(screen.getByLabelText("Tarjetas siguientes"));
    expect(container.textContent).toContain("Tarjeta 2");
    fireEvent.keyDown(grupo(container), { key: "ArrowRight" });
    expect(container.textContent).toContain("Tarjeta 3");
    fireEvent.keyDown(grupo(container), { key: "ArrowRight" });
    expect(container.textContent).toContain("Tarjeta 3");
    expect((screen.getByLabelText("Tarjetas siguientes") as HTMLButtonElement).disabled).toBe(true);
    fireEvent.keyDown(grupo(container), { key: "ArrowLeft" });
    expect(container.textContent).toContain("Tarjeta 2");
  });

  it("deslizar hacia la izquierda pasa a la siguiente y hacia la derecha vuelve", () => {
    const { container } = mazo();
    const g = grupo(container);
    fireEvent.pointerDown(g, { clientX: 200 });
    fireEvent.pointerUp(g, { clientX: 120 });
    expect(container.textContent).toContain("Tarjeta 2");
    fireEvent.pointerDown(g, { clientX: 100 });
    fireEvent.pointerUp(g, { clientX: 190 });
    expect(container.textContent).toContain("Tarjeta 1");
  });

  it("un deslizamiento no voltea la tarjeta; un clic sí", () => {
    const { container } = mazo();
    const g = grupo(container);
    const carta = () => screen.getAllByRole("button").find((b) => b.hasAttribute("aria-pressed"))!;
    fireEvent.pointerDown(g, { clientX: 200 });
    fireEvent.pointerMove(g, { clientX: 150 });
    fireEvent.pointerUp(g, { clientX: 150 });
    fireEvent.click(carta()); // el clic que sigue al arrastre
    expect(carta().getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(carta());
    expect(carta().getAttribute("aria-pressed")).toBe("true");
  });

  it("una sola tarjeta: sin navegación", () => {
    const b = bloque({ modo: "mazo" });
    b.tarjetas = b.tarjetas.slice(0, 1);
    render(<FlipCardsViewer block={b} />);
    expect(screen.queryByLabelText("Tarjetas siguientes")).toBeNull();
  });
});

describe("presets de T11", () => {
  it("existen, no pisan los de plantilla y cambian algo", () => {
    const ids = FLIP_CARDS_PRESETS.map((p) => p.id);
    for (const id of FLIP_CARDS_ESTILOS_T11_IDS) expect(ids).toContain(id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(FLIP_CARDS_PLANTILLAS.length + FLIP_CARDS_ESTILOS_T11_IDS.size);
  });
});
