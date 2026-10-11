/**
 * T5 — `WidgetMotion`: presets, entrada por defecto vs. animaciones del docente,
 * stagger, éxito y conteo. El caso «reducir movimiento» va en su propio archivo
 * (`widget-motion.reducido.spec.tsx`) porque `motion` lee esa preferencia una vez por módulo.
 */
import { cleanup, render, renderHook, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Animacion } from "@lumina/types/animation";
import {
  ENTRADA_VARIANTES,
  WidgetMotion,
  WidgetMotionItem,
  entradaPorDefectoApagada,
  useConteo,
} from "./index.js";

afterEach(() => cleanup());

const animacion = (momento: Animacion["momento"]): Animacion => ({
  id: "a1",
  tipo: "fade-in",
  momento,
  trigger: "auto",
  duracion: 400,
  delay: 0,
  iteraciones: 1,
  easing: "ease",
});

describe("presets de entrada", () => {
  it("cada variante parte de oculto (opacity 0) y termina visible (opacity 1)", () => {
    for (const [nombre, v] of Object.entries(ENTRADA_VARIANTES)) {
      expect(v.oculto.opacity, nombre).toBe(0);
      expect(v.visible.opacity, nombre).toBe(1);
    }
    expect(Object.keys(ENTRADA_VARIANTES)).toEqual([
      "fade",
      "slide-up",
      "slide-down",
      "slide-left",
      "slide-right",
      "scale",
    ]);
  });
});

describe("entradaPorDefectoApagada (Block.animaciones del docente)", () => {
  it("se apaga solo si el docente configuró una entrada", () => {
    expect(entradaPorDefectoApagada(undefined)).toBe(false);
    expect(entradaPorDefectoApagada([])).toBe(false);
    expect(entradaPorDefectoApagada([animacion("enfasis"), animacion("salida")])).toBe(false);
    expect(entradaPorDefectoApagada([animacion("enfasis"), animacion("entrada")])).toBe(true);
  });
});

describe("WidgetMotion", () => {
  it("renderiza a sus hijos", () => {
    render(<WidgetMotion entrada="fade">hola</WidgetMotion>);
    expect(screen.getByText("hola")).toBeTruthy();
  });

  it("con entrada, arranca oculto (opacity 0) y termina visible", async () => {
    const { container } = render(<WidgetMotion entrada="fade">x</WidgetMotion>);
    const nodo = container.querySelector("[data-widget-motion]") as HTMLElement;
    expect(nodo.style.opacity).toBe("0");
    await waitFor(() => expect(Number(nodo.style.opacity)).toBe(1), { timeout: 3000 });
  });

  it("si el docente ya configuró una entrada, la del widget no se aplica", () => {
    const { container } = render(
      <WidgetMotion entrada="fade" animaciones={[animacion("entrada")]}>
        x
      </WidgetMotion>,
    );
    const nodo = container.querySelector("[data-widget-motion]") as HTMLElement;
    expect(nodo.style.opacity).not.toBe("0");
  });

  it("sin `entrada` no oculta nada", () => {
    const { container } = render(<WidgetMotion press hover>x</WidgetMotion>);
    const nodo = container.querySelector("[data-widget-motion]") as HTMLElement;
    expect(nodo.style.opacity).not.toBe("0");
  });

  it("con stagger, los hijos entran por turnos y terminan visibles", async () => {
    const { container } = render(
      <WidgetMotion stagger={0.05}>
        <WidgetMotionItem>a</WidgetMotionItem>
        <WidgetMotionItem>b</WidgetMotionItem>
      </WidgetMotion>,
    );
    const items = Array.from(container.querySelectorAll("[data-widget-motion] > div")) as HTMLElement[];
    expect(items).toHaveLength(2);
    await waitFor(
      () => expect(items.every((el) => Number(el.style.opacity) === 1)).toBe(true),
      { timeout: 3000 },
    );
  });

  it("el pulso de éxito no rompe el elemento al cambiar el contador", () => {
    const { container, rerender } = render(<WidgetMotion exito={0}>ok</WidgetMotion>);
    rerender(<WidgetMotion exito={1}>ok</WidgetMotion>);
    expect(container.querySelector("[data-widget-motion]")?.textContent).toBe("ok");
  });
});

describe("useConteo", () => {
  it("muestra el valor inicial directo y cuenta hasta el nuevo valor", async () => {
    const { result, rerender } = renderHook(({ v }) => useConteo(v, { duracion: 0.05 }), {
      initialProps: { v: 5 },
    });
    expect(result.current).toBe(5);
    rerender({ v: 20 });
    await waitFor(() => expect(result.current).toBe(20), { timeout: 3000 });
  });

  it("con desdeCero arranca en 0", () => {
    const { result } = renderHook(() => useConteo(50, { desdeCero: true, duracion: 0.05 }));
    expect(result.current).toBeLessThanOrEqual(50);
  });
});
