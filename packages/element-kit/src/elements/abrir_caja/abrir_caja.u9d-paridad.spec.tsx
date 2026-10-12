/**
 * U9d.3 — paridad de Abrir la caja contra su comportamiento ANTERIOR a migrar al `ActivityShell`
 * (Regla 7): la rejilla de cajas, la animación de apertura (flip: cierra 180 ms y revela; zoom/fade:
 * revela de una), qué se ve al abrir (texto, ✅/❌ solo si es evaluable), el contador, el bloqueo de
 * una caja ya abierta, la ÚNICA respuesta `{ cajasAbiertas }` al abrir la última, el resultado solo
 * si es evaluable y lo que `@lumina/scoring` hace con ella. Relojes falsos.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateActivityResponse } from "@lumina/scoring";
import type { AbrirCajaActivity } from "@lumina/types/slide";

import { abrirCajaDefinition as def } from "./abrir_caja-definition.js";

type Props = { estado: unknown; config: Record<string, unknown> };
const Viewer = def.Viewer as unknown as (p: Props) => React.ReactElement;

let original: typeof Element.prototype.getBoundingClientRect;
beforeEach(() => {
  vi.useFakeTimers();
  original = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = () =>
    ({ left: 0, top: 0, right: 300, bottom: 300, width: 300, height: 300, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
});
afterEach(() => {
  Element.prototype.getBoundingClientRect = original;
  cleanup();
  vi.useRealTimers();
});

const cajas = (evaluable = true, animacion: "flip" | "zoom" | "fade" = "flip"): AbrirCajaActivity => {
  const c = (id: string, etiqueta: string, texto: string, esCorrecta: boolean) => ({
    id,
    etiqueta,
    contenido: evaluable ? { texto, esCorrecta } : { texto },
  });
  return {
    tipo: "abrir_caja",
    configuracion: { filas: 2, columnas: 2, colorCaja: "#2563EB", animacionApertura: animacion },
    cajas: [c("c1", "Caja 1", "Premio", true), c("c2", "Caja 2", "Nada", false), c("c3", "Caja 3", "Oro", true), c("c4", "Caja 4", "Humo", false)],
  };
};

const pasar = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const caja = (nombre: string) => screen.getByRole("button", { name: nombre }) as HTMLButtonElement;
const abrir = (etiqueta: string, ms = 600) => {
  fireEvent.click(caja(etiqueta));
  pasar(ms);
};

describe("Abrir la caja — paridad con el comportamiento anterior (U9d.3)", () => {
  it("muestra la consigna, una caja por elemento con su etiqueta y el contador «0 de 4»", () => {
    render(<Viewer estado={cajas()} config={{}} />);
    expect(screen.getByText("Toca cada caja para abrirla y descubrir su contenido")).toBeTruthy();
    for (const e of ["Caja 1", "Caja 2", "Caja 3", "Caja 4"]) expect(caja(e)).toBeTruthy();
    expect(screen.getByText(/0 de 4 cajas abiertas/)).toBeTruthy();
  });

  it("flip: tras la apertura (180 + 400 ms) la caja muestra su contenido y queda bloqueada", () => {
    render(<Viewer estado={cajas()} config={{}} />);
    fireEvent.click(caja("Caja 1"));
    pasar(100);
    expect(screen.queryByText("Premio")).toBeNull(); // todavía cerrándose
    pasar(600);
    const abierta = screen.getByRole("button", { name: /Premio/ }) as HTMLButtonElement;
    expect(abierta.disabled).toBe(true);
  });

  it("zoom y fade revelan de inmediato", () => {
    for (const a of ["zoom", "fade"] as const) {
      const { unmount } = render(<Viewer estado={cajas(true, a)} config={{}} />);
      fireEvent.click(caja("Caja 1"));
      expect(screen.getByText("Premio")).toBeTruthy();
      unmount();
    }
  });

  it("evaluable: la caja abierta muestra ✅ o ❌ y el contador suma «· n correctas»", () => {
    render(<Viewer estado={cajas()} config={{}} />);
    abrir("Caja 1");
    expect(screen.getByText("✅")).toBeTruthy();
    abrir("Caja 2");
    expect(screen.getByText("❌")).toBeTruthy();
    expect(screen.getByText(/2 de 4 cajas abiertas · 1 correctas/)).toBeTruthy();
  });

  it("no evaluable: sin ✅/❌ y sin «correctas» en el contador", () => {
    render(<Viewer estado={cajas(false)} config={{}} />);
    abrir("Caja 1");
    expect(screen.getByText("Premio")).toBeTruthy();
    expect(screen.queryByText("✅")).toBeNull();
    expect(screen.getByText(/1 de 4 cajas abiertas$/)).toBeTruthy();
  });

  it("NO emite nada hasta abrir la última; entonces UNA respuesta `{ cajasAbiertas }` en el orden de las cajas", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={cajas()} config={{ onResponse }} />);
    abrir("Caja 3");
    abrir("Caja 1");
    abrir("Caja 4");
    expect(onResponse).not.toHaveBeenCalled();
    abrir("Caja 2");
    expect(onResponse.mock.calls).toEqual([[{ cajasAbiertas: ["c1", "c2", "c3", "c4"] }]]);
    pasar(5000);
    expect(onResponse).toHaveBeenCalledTimes(1);
  });

  it("evaluable: al abrir todas aparece el resultado, sin «Reintentar»", () => {
    render(<Viewer estado={cajas()} config={{}} />);
    for (const e of ["Caja 1", "Caja 2", "Caja 3", "Caja 4"]) abrir(e);
    expect(screen.getByText("2 de 2 correctas (100%)")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /reintentar/i })).toBeNull();
  });

  it("no evaluable: al abrir todas igual emite la respuesta pero NO muestra resultado", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={cajas(false)} config={{ onResponse }} />);
    for (const e of ["Caja 1", "Caja 2", "Caja 3", "Caja 4"]) abrir(e);
    expect(onResponse).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByText(/correctas \(/)).toBeNull();
  });
});

describe("Abrir la caja — scoring con la respuesta que sale (U9d.3)", () => {
  it("todas 5 · ninguna 1 · una correcta 2,5 · solo incorrectas 1", () => {
    const e = cajas();
    const nota = (cajasAbiertas: string[]) => evaluateActivityResponse("abrir_caja", e, { cajasAbiertas }).score;
    expect(nota(["c1", "c2", "c3", "c4"])).toBe(5);
    expect(nota([])).toBe(1);
    expect(nota(["c1"])).toBe(2.5); // una de las dos correctas
    expect(nota(["c2", "c4"])).toBe(1); // solo las incorrectas
  });
});
