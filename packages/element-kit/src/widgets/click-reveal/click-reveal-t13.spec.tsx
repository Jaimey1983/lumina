/**
 * T13 — Click to Reveal: disparos en el sitio (voltear / foco / difuminado), contador
 * «X de Y revelados» y aviso hasta revelar todo con eventos al runtime. El modal de siempre
 * (disparo `modal`) no cambia.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ClickRevealWidget } from "@lumina/types/widget";
import { CLICK_REVEAL_PRESETS } from "../../elements/click-reveal/click-reveal-definition.js";
import { createDefaultClickRevealBlock } from "./click-reveal-defaults.js";
import { normalizeClickRevealWidget } from "./click-reveal-config.js";
import { leerOpcionesT13, textoProgreso } from "./click-reveal-t13.js";
import { ClickRevealViewer } from "./click-reveal-viewer.js";

afterEach(() => cleanup());

function bloque(cfg: Record<string, unknown> = {}): ClickRevealWidget {
  const base = createDefaultClickRevealBlock();
  return { ...base, configuracion: { ...base.configuracion, numeroElementos: 3, ...cfg } } as ClickRevealWidget;
}

const tarjetas = () =>
  screen.getAllByRole("button").filter((b) => /revealTriggerCard/.test(b.className));

describe("opciones de T13", () => {
  it("por defecto: modal, sin contador ni aviso; inválidos vuelven al defecto", () => {
    expect(leerOpcionesT13(undefined)).toEqual({
      disparo: "modal",
      mostrarContador: false,
      bloquearHastaRevelar: false,
    });
    expect(leerOpcionesT13({ disparo: "scratch", mostrarContador: "si" })).toEqual(leerOpcionesT13({}));
    expect(textoProgreso(2, 4)).toBe("2 de 4 revelados");
  });

  it("normalizar un bloque legado no agrega claves; con opciones, las conserva", () => {
    const n = normalizeClickRevealWidget(bloque()) as unknown as { configuracion: Record<string, unknown> };
    for (const k of ["disparo", "mostrarContador", "bloquearHastaRevelar"]) expect(k in n.configuracion).toBe(false);
    const c = normalizeClickRevealWidget(bloque({ disparo: "flip" })) as unknown as {
      configuracion: Record<string, unknown>;
    };
    expect(c.configuracion.disparo).toBe("flip");
  });
});

describe("modal (sin cambios)", () => {
  it("el clic abre el panel, no hay contador, no se emite nada sin runtime", () => {
    const { container } = render(<ClickRevealViewer block={bloque()} />);
    expect(tarjetas()).toHaveLength(3);
    expect(tarjetas()[0].getAttribute("aria-pressed")).toBeNull();
    fireEvent.click(tarjetas()[0]);
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    expect(container.textContent).not.toContain("revelados");
    expect(container.querySelector('[class*="revealProgreso"]')).toBeNull();
  });

  it("con contador, abrir cuenta como revelada (también el modal)", () => {
    const { container } = render(<ClickRevealViewer block={bloque({ mostrarContador: true })} />);
    expect(container.textContent).toContain("0 de 3 revelados");
    fireEvent.click(tarjetas()[1]);
    expect(container.textContent).toContain("1 de 3 revelados");
    fireEvent.click(tarjetas()[1]);
    expect(container.textContent).toContain("1 de 3 revelados");
  });
});

describe("disparos en el sitio", () => {
  it("flip: sin modal; el contenido aparece tras el giro y vuelve a ocultarse", () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<ClickRevealViewer block={bloque({ disparo: "flip" })} />);
      const t = tarjetas()[0];
      expect(t.getAttribute("aria-pressed")).toBe("false");
      fireEvent.click(t);
      expect(container.querySelector('[role="dialog"]')).toBeNull();
      expect(t.getAttribute("aria-pressed")).toBe("true");
      expect(container.querySelector('[class*="revealContenido"]')).toBeNull();
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(container.querySelector('[class*="revealContenido"]')).not.toBeNull();
      fireEvent.click(t);
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(container.querySelector('[class*="revealContenido"]')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("blur: el contenido está desde el inicio, difuminado, y se aclara al tocar", () => {
    const { container } = render(<ClickRevealViewer block={bloque({ disparo: "blur" })} />);
    const borroso = () => container.querySelectorAll('[class*="revealContenidoBorroso"]').length;
    expect(borroso()).toBe(3);
    fireEvent.click(tarjetas()[0]);
    expect(borroso()).toBe(2);
  });

  it("spotlight: una sola abierta a la vez y las demás atenuadas", () => {
    const { container } = render(<ClickRevealViewer block={bloque({ disparo: "spotlight" })} />);
    expect(container.querySelectorAll('[class*="revealAtenuada"]')).toHaveLength(0);
    fireEvent.click(tarjetas()[0]);
    expect(container.querySelectorAll('[class*="revealAtenuada"]')).toHaveLength(2);
    const capas = () =>
      container.querySelectorAll('[class*="revealContenido"]:not([class*="Titulo"]):not([class*="Cuerpo"])');
    expect(capas()).toHaveLength(1);
    fireEvent.click(tarjetas()[1]);
    expect(tarjetas()[0].getAttribute("aria-pressed")).toBe("false");
    expect(tarjetas()[1].getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(tarjetas()[1]);
    expect(container.querySelectorAll('[class*="revealAtenuada"]')).toHaveLength(0);
  });

  it("en miniatura no hay interacción ni contador", () => {
    const { container } = render(
      <ClickRevealViewer block={bloque({ disparo: "spotlight", mostrarContador: true })} isThumbnail />,
    );
    fireEvent.click(tarjetas()[0]);
    expect(container.querySelectorAll('[class*="revealContenido"]')).toHaveLength(0);
    expect(container.textContent).not.toContain("revelados");
  });
});

describe("progreso, aviso y eventos", () => {
  it("el aviso pasa de «Revela todo…» a «Todo revelado» y la región viva lo anuncia", () => {
    const { container } = render(
      <ClickRevealViewer block={bloque({ disparo: "blur", bloquearHastaRevelar: true })} />,
    );
    expect(container.textContent).toContain("Revela todo para continuar");
    for (const t of tarjetas()) fireEvent.click(t);
    expect(container.textContent).toContain("Todo revelado");
    expect(container.querySelector('[role="status"]')?.textContent).toBe("Todo revelado");
  });

  it("emite `seleccionado` por tarjeta nueva y `visitado` una sola vez al completar", () => {
    const emitir = vi.fn();
    render(<ClickRevealViewer block={bloque({ disparo: "flip" })} emitir={emitir} />);
    const t = tarjetas();
    fireEvent.click(t[0]);
    fireEvent.click(t[0]); // cerrar: no es una revelación nueva
    fireEvent.click(t[0]); // reabrir: tampoco
    fireEvent.click(t[1]);
    expect(emitir.mock.calls.map(([e]) => e)).toEqual(["seleccionado", "seleccionado"]);
    fireEvent.click(t[2]);
    expect(emitir.mock.calls.map(([e]) => e)).toEqual(["seleccionado", "seleccionado", "seleccionado", "visitado"]);
  });

  it("no emite `visitado` si el objeto ya lo era", () => {
    const emitir = vi.fn();
    render(<ClickRevealViewer block={bloque()} emitir={emitir} estadoObjeto="visitado" />);
    for (const t of tarjetas()) fireEvent.click(t);
    expect(emitir.mock.calls.map(([e]) => e)).not.toContain("visitado");
  });

  it("funciona también con el modal", () => {
    const emitir = vi.fn();
    render(<ClickRevealViewer block={bloque()} emitir={emitir} />);
    fireEvent.click(tarjetas()[0]);
    expect(emitir).toHaveBeenCalledWith("seleccionado");
  });
});

describe("presets de T13", () => {
  it("existen los nuevos con ids únicos", () => {
    const ids = CLICK_REVEAL_PRESETS.map((p) => p.id);
    for (const id of ["voltear", "foco", "difuminado", "progreso-completo"]) expect(ids).toContain(id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
