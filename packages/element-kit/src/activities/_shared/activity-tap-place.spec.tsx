/**
 * U6 — modo «tocar para elegir, tocar para colocar»: hook, anuncios, modo de entrada y el
 * flujo completo operado solo con teclado (etapa U / DU8).
 */
import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ActivityDndRoot } from "./activity-dnd-root.js";
import { ActivityDragWord } from "./activity-drag-word.js";
import {
  AnuncioTocarColocar,
  ModoEntradaToggle,
  anuncioTocarColocar,
  prefiereTocar,
  useModoEntrada,
  useTocarColocar,
} from "./activity-tap-place.js";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const etiquetas = {
  etiquetaItem: (id: string) => ({ p1: "Casa", p2: "Árbol" })[id],
  etiquetaZona: (id: string) => ({ z1: "Cosas", z2: "Plantas" })[id],
};

describe("anuncioTocarColocar", () => {
  it("narra elegir, cambiar, cancelar y colocar", () => {
    expect(anuncioTocarColocar({ tipo: "elegir", item: "Casa" })).toBe("Elegiste Casa. Ahora elige la zona donde colocarlo.");
    expect(anuncioTocarColocar({ tipo: "cambiar", item: "Árbol" })).toBe("Cambiaste a Árbol. Elige la zona donde colocarlo.");
    expect(anuncioTocarColocar({ tipo: "cancelar", item: "Casa" })).toBe("Cancelaste la elección de Casa.");
    expect(anuncioTocarColocar({ tipo: "colocar", item: "Casa", zona: "Cosas" })).toBe("Colocaste Casa en Cosas.");
  });
});

describe("useTocarColocar", () => {
  it("elegir y colocar: llama a `onColocar` una vez y deja todo limpio", () => {
    const onColocar = vi.fn();
    const { result } = renderHook(() => useTocarColocar({ onColocar, ...etiquetas }));
    act(() => result.current.propsItem("p1").onClick!({} as never));
    expect(result.current.seleccionado).toBe("p1");
    expect(result.current.anuncio).toBe("Elegiste Casa. Ahora elige la zona donde colocarlo.");
    act(() => result.current.propsZona("z1").onClick!({} as never));
    expect(onColocar.mock.calls).toEqual([["p1", "z1"]]);
    expect(result.current.seleccionado).toBeNull();
    expect(result.current.anuncio).toBe("Colocaste Casa en Cosas.");
  });

  it("tocar de nuevo la misma pieza cancela; otra pieza cambia la elección", () => {
    const { result } = renderHook(() => useTocarColocar({ onColocar: vi.fn(), ...etiquetas }));
    act(() => result.current.propsItem("p1").onClick!({} as never));
    act(() => result.current.propsItem("p2").onClick!({} as never));
    expect(result.current).toMatchObject({ seleccionado: "p2", anuncio: "Cambiaste a Árbol. Elige la zona donde colocarlo." });
    act(() => result.current.propsItem("p2").onClick!({} as never));
    expect(result.current).toMatchObject({ seleccionado: null, anuncio: "Cancelaste la elección de Árbol." });
  });

  it("tocar una zona sin pieza elegida no hace nada", () => {
    const onColocar = vi.fn();
    const { result } = renderHook(() => useTocarColocar({ onColocar }));
    act(() => result.current.propsZona("z1").onClick!({} as never));
    expect(onColocar).not.toHaveBeenCalled();
    expect(result.current.anuncio).toBe("");
  });

  it("los atributos reflejan el estado: aria-pressed en la pieza; las zonas entran al tabulador solo con algo elegido", () => {
    const { result } = renderHook(() => useTocarColocar({ onColocar: vi.fn() }));
    expect(result.current.propsItem("p1")).toMatchObject({ role: "button", tabIndex: 0, "aria-pressed": false });
    expect(result.current.propsZona("z1")).toMatchObject({ role: "button", tabIndex: -1, "aria-disabled": true });
    act(() => result.current.propsItem("p1").onClick!({} as never));
    expect(result.current.propsItem("p1")["aria-pressed"]).toBe(true);
    expect(result.current.propsZona("z1")).toMatchObject({ tabIndex: 0 });
    expect(result.current.propsZona("z1")["aria-disabled"]).toBeUndefined();
  });

  it("`deshabilitado` apaga el modo y suelta lo elegido", () => {
    const onColocar = vi.fn();
    const { result, rerender } = renderHook(({ d }) => useTocarColocar({ onColocar, deshabilitado: d }), { initialProps: { d: false } });
    act(() => result.current.propsItem("p1").onClick!({} as never));
    rerender({ d: true });
    expect(result.current.seleccionado).toBeNull();
    act(() => result.current.propsItem("p1").onClick!({} as never));
    expect(result.current.seleccionado).toBeNull();
    expect(result.current.propsItem("p1")).toMatchObject({ tabIndex: -1, "aria-disabled": true });
  });
});

describe("modo de entrada", () => {
  const coarse = (matches: boolean) =>
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: matches && q.includes("pointer: coarse"), media: q, addEventListener: () => undefined, removeEventListener: () => undefined }));

  it("`prefiereTocar` mira el puntero grueso y, sin matchMedia, devuelve false", () => {
    expect(prefiereTocar()).toBe(false);
    coarse(true);
    expect(prefiereTocar()).toBe(true);
  });

  it("parte en `arrastrar`, en `tocar` si el dispositivo es táctil, y `inicial` lo fuerza", () => {
    expect(renderHook(() => useModoEntrada()).result.current.modo).toBe("arrastrar");
    coarse(true);
    expect(renderHook(() => useModoEntrada()).result.current.modo).toBe("tocar");
    expect(renderHook(() => useModoEntrada("arrastrar")).result.current.modo).toBe("arrastrar");
  });

  it("`alternar` cambia de modo y el botón lo refleja con aria-pressed", () => {
    const { result } = renderHook(() => useModoEntrada("arrastrar"));
    act(() => result.current.alternar());
    expect(result.current.modo).toBe("tocar");
    const onAlternar = vi.fn();
    const { rerender } = render(<ModoEntradaToggle modo="tocar" onAlternar={onAlternar} />);
    const b = screen.getByRole("button", { name: "Modo: tocar y colocar" });
    expect(b.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(b);
    expect(onAlternar).toHaveBeenCalled();
    rerender(<ModoEntradaToggle modo="arrastrar" onAlternar={onAlternar} />);
    expect(screen.getByRole("button", { name: "Modo: arrastrar" }).getAttribute("aria-pressed")).toBe("false");
  });
});

/** Escena completa: piezas y zonas con tocar-colocar, y el arrastre apagado. */
function Escena({ alColocar }: { alColocar: (i: string, z: string) => void }) {
  const tc = useTocarColocar({ onColocar: alColocar, ...etiquetas });
  return (
    <ActivityDndRoot overlay={null} arrastreActivo={false}>
      <ActivityDragWord id="p1" texto="Casa" propsTocar={tc.propsItem("p1")} />
      <ActivityDragWord id="p2" texto="Árbol" propsTocar={tc.propsItem("p2")} />
      <div data-testid="z1" aria-label="Cosas" {...tc.propsZona("z1")}>Cosas</div>
      <div data-testid="z2" aria-label="Plantas" {...tc.propsZona("z2")}>Plantas</div>
      <AnuncioTocarColocar anuncio={tc.anuncio} />
    </ActivityDndRoot>
  );
}

describe("tocar y colocar operado solo con teclado", () => {
  it("Enter elige, Tab llega a la zona, Enter coloca; Escape cancela", () => {
    const alColocar = vi.fn();
    render(<Escena alColocar={alColocar} />);
    const p1 = screen.getByRole("button", { name: /Casa/ });
    expect(p1.getAttribute("aria-pressed")).toBe("false");

    fireEvent.keyDown(p1, { key: "Enter" });
    expect(p1.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("anuncio-tocar-colocar").textContent).toBe("Elegiste Casa. Ahora elige la zona donde colocarlo.");

    const z2 = screen.getByTestId("z2");
    expect(z2.getAttribute("tabindex")).toBe("0");
    fireEvent.keyDown(z2, { key: " " });
    expect(alColocar.mock.calls).toEqual([["p1", "z2"]]);
    expect(screen.getByTestId("anuncio-tocar-colocar").textContent).toBe("Colocaste Casa en Plantas.");
    expect(p1.getAttribute("aria-pressed")).toBe("false");

    fireEvent.keyDown(screen.getByRole("button", { name: /Árbol/ }), { key: "Enter" });
    fireEvent.keyDown(screen.getByRole("button", { name: /Árbol/ }), { key: "Escape" });
    expect(screen.getByTestId("anuncio-tocar-colocar").textContent).toBe("Cancelaste la elección de Árbol.");
    expect(alColocar).toHaveBeenCalledTimes(1);
  });

  it("con el mouse o el toque el flujo es el mismo (clic en pieza, clic en zona)", () => {
    const alColocar = vi.fn();
    render(<Escena alColocar={alColocar} />);
    fireEvent.click(screen.getByRole("button", { name: /Árbol/ }));
    fireEvent.click(screen.getByTestId("z1"));
    expect(alColocar.mock.calls).toEqual([["p2", "z1"]]);
  });

  it("el anuncio vive en una región `status` para lectores de pantalla", () => {
    render(<AnuncioTocarColocar anuncio="Hola" />);
    expect(screen.getByRole("status").textContent).toBe("Hola");
    expect(screen.getByRole("status").getAttribute("aria-live")).toBe("polite");
  });
});
