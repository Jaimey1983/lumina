/**
 * U6 — `ActivityDndRoot` operado SOLO con teclado, con `@testing-library` (etapa U / DU8).
 * jsdom no tiene layout: se simulan las posiciones de las zonas con `getBoundingClientRect`.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useDroppable } from "@dnd-kit/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ActivityDndRoot } from "./activity-dnd-root.js";
import { ActivityDragWord } from "./activity-drag-word.js";
import { INSTRUCCIONES_DND_ES } from "./activity-dnd-a11y.js";

const RECTS: Record<string, { left: number; top: number; width: number; height: number }> = {
  pieza: { left: 0, top: 200, width: 60, height: 40 },
  A: { left: 100, top: 0, width: 80, height: 80 },
  B: { left: 200, top: 0, width: 80, height: 80 },
  C: { left: 300, top: 0, width: 80, height: 80 },
};

let original: typeof Element.prototype.getBoundingClientRect;
beforeEach(() => {
  original = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const el = this as HTMLElement;
    // La pieza arrastrable no admite `data-*`: se reconoce por su rol y se le da una posición real.
    const clave = el.getAttribute("aria-roledescription") === "palabra arrastrable" ? "pieza" : el.dataset.rect ?? "";
    const r = RECTS[clave] ?? { left: 0, top: 0, width: 0, height: 0 };
    return { ...r, right: r.left + r.width, bottom: r.top + r.height, x: r.left, y: r.top, toJSON: () => r } as DOMRect;
  };
});
afterEach(() => {
  Element.prototype.getBoundingClientRect = original;
  cleanup();
});

function Zona({ id, etiqueta }: { id: string; etiqueta?: string }) {
  const { setNodeRef } = useDroppable({ id, data: etiqueta ? { etiqueta } : undefined });
  return (
    <div ref={setNodeRef} data-rect={id} data-testid={`zona-${id}`}>
      {id}
    </div>
  );
}

function Escena({ onDragEnd, etiquetas }: { onDragEnd?: (o: string | null) => void; etiquetas?: boolean }) {
  return (
    <ActivityDndRoot
      // Con `DragOverlay`, dnd-kit calcula las colisiones con el rect del OVERLAY.
      overlay={<div data-rect="pieza">Casa</div>}
      onDragEnd={(e) => onDragEnd?.(e.over ? String(e.over.id) : null)}
      etiquetas={etiquetas ? { zona: (id) => `casilla ${String(id)}` } : undefined}
    >
      <Zona id="A" etiqueta="Zona A" />
      <Zona id="B" etiqueta="Zona B" />
      <Zona id="C" />
      <div data-rect="pieza">
        <ActivityDragWord id="p1" texto="Casa" />
      </div>
    </ActivityDndRoot>
  );
}

const anuncios = () => document.querySelector('[role="status"][aria-live="assertive"], [aria-live="assertive"]')?.textContent ?? "";
const pieza = () => screen.getByRole("button", { name: /Casa/ });

async function tecla(code: string, destino?: Element) {
  await act(async () => {
    fireEvent.keyDown(destino ?? document, { code, key: code === "Space" ? " " : code });
    await new Promise((r) => setTimeout(r, 0));
  });
}

describe("ActivityDndRoot — teclado (U6)", () => {
  it("la pieza es un botón enfocable con rol y descripción en español", () => {
    render(<Escena />);
    const p = pieza();
    expect(p.getAttribute("tabindex")).toBe("0");
    expect(p.getAttribute("aria-roledescription")).toBe("palabra arrastrable");
    const descripcion = document.getElementById(p.getAttribute("aria-describedby")!);
    expect(descripcion?.textContent).toBe(INSTRUCCIONES_DND_ES.draggable);
  });

  it("Espacio levanta, las flechas saltan entre zonas, Espacio suelta: con anuncios en cada paso", async () => {
    const alSoltar = vi.fn();
    render(<Escena onDragEnd={alSoltar} />);
    const p = pieza();
    p.focus();

    await tecla("Space", p);
    expect(anuncios()).toBe("Levantaste Casa.");

    await tecla("ArrowRight");
    expect(anuncios()).toBe("Casa está sobre Zona A.");
    await tecla("ArrowRight");
    expect(anuncios()).toBe("Casa está sobre Zona B.");

    await tecla("Space");
    expect(alSoltar).toHaveBeenCalledTimes(1);
    expect(alSoltar).toHaveBeenCalledWith("B");
    expect(anuncios()).toBe("Soltaste Casa en Zona B.");
  });

  it("las flechas pueden volver atrás: A → B → A", async () => {
    const alSoltar = vi.fn();
    render(<Escena onDragEnd={alSoltar} />);
    const p = pieza();
    p.focus();
    await tecla("Space", p);
    await tecla("ArrowRight");
    await tecla("ArrowRight");
    await tecla("ArrowLeft");
    expect(anuncios()).toBe("Casa está sobre Zona A.");
    await tecla("Enter");
    expect(alSoltar).toHaveBeenCalledWith("A");
  });

  it("Escape cancela: nada se suelta y se anuncia", async () => {
    const alSoltar = vi.fn();
    render(<Escena onDragEnd={alSoltar} />);
    const p = pieza();
    p.focus();
    await tecla("Space", p);
    await tecla("ArrowRight");
    await tecla("Escape");
    expect(anuncios()).toBe("Cancelaste el movimiento. Casa volvió a su lugar.");
    expect(alSoltar).not.toHaveBeenCalled();
  });

  it("una zona sin etiqueta propia se nombra con el resolvedor `etiquetas.zona`", async () => {
    render(<Escena etiquetas />);
    const p = pieza();
    p.focus();
    await tecla("Space", p);
    await tecla("ArrowRight");
    await tecla("ArrowRight");
    await tecla("ArrowRight");
    expect(anuncios()).toBe("Casa está sobre casilla C.");
  });

  it("con `arrastreActivo = false` el teclado ya no levanta la pieza", async () => {
    const alSoltar = vi.fn();
    render(
      <ActivityDndRoot overlay={null} arrastreActivo={false} onDragEnd={() => alSoltar()}>
        <Zona id="A" />
        <ActivityDragWord id="p1" texto="Casa" />
      </ActivityDndRoot>,
    );
    const p = pieza();
    p.focus();
    await tecla("Space", p);
    await tecla("ArrowRight");
    await tecla("Space");
    expect(alSoltar).not.toHaveBeenCalled();
    expect(anuncios()).toBe("");
  });
});
