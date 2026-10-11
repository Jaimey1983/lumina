/**
 * T7 — paridad del visor de la Ruleta (Regla 7). Con la configuración por defecto
 * (sin pesos, sin «eliminar ganador», sin sonido ni confeti) el giro y el ganador son
 * los de antes de T7. Se escribió ANTES de reescribir el visor y debe pasar con ambos.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RULETA_EASING } from "./ruleta-config.js";
import { createDefaultRuletaWidget } from "./ruleta-defaults.js";
import { RuletaViewer } from "./ruleta-viewer.js";

interface Giro {
  keyframes: { transform: string }[];
  opciones: { duration: number; easing: string; fill: string };
}

let giros: Giro[] = [];
let terminar: (() => void)[] = [];

beforeEach(() => {
  giros = [];
  terminar = [];
  Object.defineProperty(HTMLElement.prototype, "animate", {
    configurable: true,
    value: (keyframes: Giro["keyframes"], opciones: Giro["opciones"]) => {
      giros.push({ keyframes, opciones });
      let fin: () => void = () => undefined;
      const finished = new Promise<void>((ok) => {
        fin = ok;
      });
      terminar.push(fin);
      return { finished, cancel: vi.fn() };
    },
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function girar() {
  fireEvent.click(screen.getByRole("button", { name: "Girar" }));
  await act(async () => {
    terminar[terminar.length - 1]?.();
    await Promise.resolve();
  });
}

describe("RuletaViewer — paridad por defecto", () => {
  it("con azar 0.5 gira a 3030° y el ganador es el 4.º ítem", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    render(<RuletaViewer block={createDefaultRuletaWidget()} />);
    await girar();
    expect(giros).toHaveLength(1);
    expect(giros[0].keyframes).toEqual([
      { transform: "rotate(0deg)" },
      { transform: "rotate(3030deg)" },
    ]);
    expect(giros[0].opciones).toMatchObject({ duration: 3000, easing: RULETA_EASING, fill: "forwards" });
    expect(screen.getByRole("status").textContent).toBe("Ganador: Equipo 4");
  });

  it("mientras gira el botón dice «Girando…» y está desactivado", () => {
    render(<RuletaViewer block={createDefaultRuletaWidget()} />);
    fireEvent.click(screen.getByRole("button", { name: "Girar" }));
    const boton = screen.getByRole("button", { name: "Girando..." }) as HTMLButtonElement;
    expect(boton.disabled).toBe(true);
  });

  it("cada ítem puede salir: el índice sale de floor(azar × n)", async () => {
    const esperados: [number, string][] = [
      [0, "Equipo 1"],
      [0.17, "Equipo 2"],
      [0.34, "Equipo 3"],
      [0.99, "Equipo 6"],
    ];
    for (const [azar, ganador] of esperados) {
      cleanup();
      vi.spyOn(Math, "random").mockReturnValue(azar);
      render(<RuletaViewer block={createDefaultRuletaWidget()} />);
      await girar();
      expect(screen.getByRole("status").textContent, String(azar)).toBe(`Ganador: ${ganador}`);
      vi.restoreAllMocks();
    }
  });

  it("la segunda tirada parte de donde terminó la primera", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    render(<RuletaViewer block={createDefaultRuletaWidget()} />);
    await girar();
    await girar();
    expect(giros).toHaveLength(2);
    expect(giros[1].keyframes[0]).toEqual({ transform: "rotate(3030deg)" });
  });

  it("sin «mostrarGanador» no se anuncia a nadie", async () => {
    const base = createDefaultRuletaWidget();
    render(<RuletaViewer block={{ ...base, configuracion: { ...base.configuracion, mostrarGanador: false } }} />);
    await girar();
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("con «reducir movimiento» el giro dura 1 ms", async () => {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduce"), media: q }));
    render(<RuletaViewer block={createDefaultRuletaWidget()} />);
    await girar();
    expect(giros[0].opciones.duration).toBe(1);
  });
});
