import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Escena } from "@lumina/drawing";
import { EditorLibre } from "./editor-libre.js";
import { escena, forma, getForma } from "./util-pruebas.js";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const PATRON = { tipo: "patron", patron: "rayas", color: "#123456", fondo: "#FEF3C7", escala: 20 };

describe("la mini barra con un relleno de patrón (Y23)", () => {
  it("muestra el color de las líneas y elegir un color ahí lo hace sólido, en una entrada", { timeout: 150000 }, async () => {
    const onCambio = vi.fn<(e: Escena) => void>();
    render(<EditorLibre escena={escena(forma("A", 100, 100, 100, 60, { estilo: { relleno: PATRON } }))} titulo="Prueba" onCambio={onCambio} onCerrar={vi.fn()} />);
    const lienzo = screen.getByRole("application", { name: "Lienzo de dibujo" }) as unknown as SVGSVGElement;
    vi.spyOn(lienzo, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, right: 1000, bottom: 600, width: 1000, height: 600, x: 0, y: 0, toJSON: () => ({}) });
    const g = document.querySelector("[data-dibujo-pagina]")?.parentElement?.getAttribute("transform") ?? "";
    const m = /translate\(([-\d.e]+) ([-\d.e]+)\) scale\(([-\d.e]+)\)/.exec(g);
    const p = { clientX: Number(m?.[1]) + 150 * Number(m?.[3]), clientY: Number(m?.[2]) + 130 * Number(m?.[3]) };
    fireEvent(lienzo, new MouseEvent("pointerdown", { bubbles: true, cancelable: true, button: 0, ...p }));
    fireEvent(lienzo, new MouseEvent("pointerup", { bubbles: true, cancelable: true, button: 0, ...p }));

    const boton = document.querySelector<HTMLElement>('[data-mini-barra] [aria-label="Color de relleno (barra): #123456"]');
    expect(boton).toBeTruthy();
    fireEvent.click(boton as HTMLElement);
    const pastilla = await waitFor(() => {
      const el = document.querySelector<HTMLElement>('[data-slot="popover-content"] button[aria-label="#CBD5E1"]');
      if (!el) throw new Error("el selector no se abrió");
      return el;
    });
    fireEvent.click(pastilla);
    expect(onCambio).toHaveBeenCalledTimes(1);
    expect(getForma(onCambio.mock.calls[0]?.[0] as Escena, "A").estilo.relleno).toEqual({ tipo: "solido", color: "#CBD5E1" });
  });
});
