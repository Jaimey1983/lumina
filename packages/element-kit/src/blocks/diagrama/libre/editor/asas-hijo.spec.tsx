import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Escena, Forma } from "@lumina/drawing";
import { EditorLibre } from "./editor-libre.js";
import { posicionesAsasHijo, separacionAsaHijoYRotar } from "./hijo-rapido.js";
import { botonCinta, escena, forma, linea } from "./util-pruebas.js";

afterEach(() => cleanup());

const P = (): Escena => escena(forma("P", 100, 100, 100, 60, { texto: "Título" }), forma("B", 400, 100));

function montar(e: Escena) {
  const onCambio = vi.fn<(e: Escena) => void>();
  render(<EditorLibre escena={e} titulo="Prueba" onCambio={onCambio} onCerrar={() => undefined} />);
  const lienzo = screen.getByRole("application", { name: "Lienzo de dibujo" }) as unknown as SVGSVGElement;
  fireEvent.click(botonCinta("Imantar a otros elementos"));
  const vista = () => {
    const g = document.querySelector("[data-dibujo-pagina]")?.parentElement?.getAttribute("transform") ?? "";
    const m = /translate\(([-\d.e]+) ([-\d.e]+)\) scale\(([-\d.e]+)\)/.exec(g);
    return { x: Number(m?.[1]), y: Number(m?.[2]), z: Number(m?.[3]) };
  };
  const evento = (tipo: string, x: number, y: number, extra: Record<string, unknown> = {}): void => {
    const v = vista();
    const { pointerType, ...init } = extra;
    const ev = new MouseEvent(tipo, { bubbles: true, cancelable: true, button: 0, clientX: v.x + x * v.z, clientY: v.y + y * v.z, ...init });
    if (pointerType) Object.defineProperty(ev, "pointerType", { value: pointerType });
    fireEvent(lienzo, ev);
  };
  return {
    onCambio,
    lienzo,
    apretar: (x: number, y: number, extra?: Record<string, unknown>) => evento("pointerdown", x, y, extra ?? {}),
    mover: (x: number, y: number, extra?: Record<string, unknown>) => evento("pointermove", x, y, extra ?? {}),
    soltar: (x: number, y: number, extra?: Record<string, unknown>) => evento("pointerup", x, y, extra ?? {}),
    elegir: (id: string, esc: Escena) => {
      const f = esc.elementos.find((x) => x.id === id && x.tipo === "forma") as Forma;
      const cx = f.transformacion.x + f.transformacion.ancho / 2;
      const cy = f.transformacion.y + f.transformacion.alto / 2;
      evento("pointerdown", cx, cy);
      evento("pointerup", cx, cy);
    },
    mas: (id: string, esc: Escena, lado: "arriba" | "derecha" | "abajo" | "izquierda") => {
      const p = posicionesAsasHijo(esc, id, vista().z)?.find((a) => a.lado === lado)?.centro;
      if (!p) throw new Error(`sin asa ${lado}`);
      return p;
    },
    ultima: () => onCambio.mock.calls.at(-1)?.[0] as Escena,
    cuenta: () => onCambio.mock.calls.length,
  };
}

const cuentaMas = (): number => document.querySelectorAll("[data-asa-hijo]").length;
const anuncio = (): string => document.querySelector("[data-dibujo-anuncio]")?.textContent ?? "";

describe("asas «+» de hijo rápido", () => {
  it("muestra 4 «+» con una forma elegida y ninguno sin selección o con varias", () => {
    const e = P();
    const m = montar(e);
    expect(cuentaMas()).toBe(0);
    m.elegir("P", e);
    expect(cuentaMas()).toBe(4);
    m.elegir("B", e);
    expect(cuentaMas()).toBe(4);
    m.apretar(10, 10);
    m.soltar(10, 10);
    expect(cuentaMas()).toBe(0);
  });

  it("no muestra «+» con una línea elegida", () => {
    const eLinea = escena(linea("L", [[50, 50], [150, 150]]));
    const m = montar(eLinea);
    m.apretar(100, 100);
    m.soltar(100, 100);
    expect(cuentaMas()).toBe(0);
  });

  it("no muestra «+» en forma bloqueada", () => {
    const eBloq = escena(forma("P", 100, 100, 100, 60, { bloqueado: true }));
    const m = montar(eBloq);
    m.elegir("P", eBloq);
    expect(cuentaMas()).toBe(0);
  });

  it("el «+» de arriba no tapa el asa de rotar", () => {
    const e = escena(forma("P", 100, 100));
    expect(separacionAsaHijoYRotar(e, "P", 1)).toBeGreaterThanOrEqual(2);
  });

  it("clic en «+» de abajo: hija conectada, una confirmación y texto en edición", () => {
    const e = P();
    const m = montar(e);
    m.elegir("P", e);
    const p = m.mas("P", e, "abajo");
    const antes = m.cuenta();
    m.apretar(p.x, p.y);
    m.soltar(p.x, p.y);
    expect(m.cuenta() - antes).toBe(1);
    const final = m.ultima();
    const hijas = final.elementos.filter((x) => x.id !== "P" && x.id !== "B" && x.tipo === "forma");
    expect(hijas).toHaveLength(1);
    const h = hijas[0] as Forma;
    expect(final.elementos.some((x) => x.tipo === "linea")).toBe(true);
    const caja = screen.getByLabelText("Texto del elemento");
    fireEvent.change(caja, { target: { value: "Nuevo" } });
    fireEvent.keyDown(caja, { key: "Enter" });
    const guardada = m.ultima().elementos.find((x) => x.id === h.id && x.tipo === "forma") as Forma | undefined;
    expect(guardada?.texto).toBe("Nuevo");
  });

  it("Ctrl+Z deshace hija y conector juntos", () => {
    const e = P();
    const m = montar(e);
    m.elegir("P", e);
    const p = m.mas("P", e, "derecha");
    m.apretar(p.x, p.y);
    m.soltar(p.x, p.y);
    const conHija = m.ultima();
    fireEvent.keyDown(m.lienzo, { key: "z", ctrlKey: true });
    expect(m.ultima().elementos.length).toBeLessThan(conHija.elementos.length);
  });

  it("anuncia en aria-live y cada «+» tiene role=button y aria-label", () => {
    const e = P();
    const m = montar(e);
    m.elegir("P", e);
    expect(screen.getByRole("button", { name: "Agregar forma abajo" })).toBeTruthy();
    const p = m.mas("P", e, "abajo");
    m.apretar(p.x, p.y);
    m.soltar(p.x, p.y);
    expect(anuncio()).toMatch(/agregado y conectado/i);
    expect(screen.queryAllByRole("button", { name: /Agregar forma/ }).every((b) => b.getAttribute("tabindex") === "-1")).toBe(true);
  });
});
