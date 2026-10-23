import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Escena, Forma, Linea } from "@lumina/drawing";
import { PALETAS_DIAGRAMA } from "../../diagrama-temas.js";
import { EditorLibre } from "./editor-libre.js";
import { ESTILOS_FORMA } from "./estilos-forma.js";
import { escena, forma, linea } from "./util-pruebas.js";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function montar(e: Escena) {
  const onCambio = vi.fn<(e: Escena) => void>();
  render(<EditorLibre escena={e} titulo="Prueba" onCambio={onCambio} onCerrar={vi.fn()} />);
  const lienzo = screen.getByRole("application", { name: "Lienzo de dibujo" }) as unknown as SVGSVGElement;
  vi.spyOn(lienzo, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, right: 1000, bottom: 600, width: 1000, height: 600, x: 0, y: 0, toJSON: () => ({}) });
  const aPantalla = (x: number, y: number): { clientX: number; clientY: number } => {
    const g = document.querySelector("[data-dibujo-pagina]")?.parentElement?.getAttribute("transform") ?? "";
    const v = /translate\(([-\d.e]+) ([-\d.e]+)\) scale\(([-\d.e]+)\)/.exec(g);
    return { clientX: Number(v?.[1]) + x * Number(v?.[3]), clientY: Number(v?.[2]) + y * Number(v?.[3]) };
  };
  const clic = (x: number, y: number): void => {
    for (const tipo of ["pointerdown", "pointerup"]) fireEvent(lienzo, new MouseEvent(tipo, { bubbles: true, cancelable: true, button: 0, ...aPantalla(x, y) }));
  };
  return { onCambio, lienzo, clic, ultima: () => onCambio.mock.calls.at(-1)?.[0] as Escena };
}
type M = ReturnType<typeof montar>;

const texto = (id: string, x: number, y: number): Record<string, unknown> => ({ id, tipo: "texto", texto: "Hola", transformacion: { x, y, ancho: 80, alto: 30, rotacion: 0 } });
const f = (e: Escena, id: string): Forma => e.elementos.find((x) => x.id === id) as Forma;
const l = (e: Escena, id: string): Linea => e.elementos.find((x) => x.id === id) as Linea;
const cmd = (id: string): HTMLElement => document.querySelector(`[data-comando="${id}"]`) as HTMLElement;
const pestanas = (): string[] => [...document.querySelectorAll('[role="tab"]')].map((t) => t.textContent ?? "");
const anuncio = (): string => document.querySelector("[data-dibujo-anuncio]")?.textContent ?? "";
const deshacer = (m: M): void => void fireEvent.keyDown(m.lienzo, { key: "z", ctrlKey: true });

const base = (): Escena =>
  escena(
    forma("A", 100, 100, 160, 100),
    forma("B", 400, 100, 160, 100),
    texto("T", 100, 400),
    linea("L", [[260, 150], [400, 150]], { origen: { elementoId: "A", puerto: 1 }, destino: { elementoId: "B", puerto: 3 }, estilo: { contorno: { color: "#111111", grosor: 5, patron: "guiones" } } }),
  );

describe("Y21 — la galería «Estilos»", () => {
  it("con una forma elegida, «Formato de forma» trae los 12 estilos", () => {
    const m = montar(base());
    m.clic(180, 150);
    expect(pestanas()).toContain("Formato de forma");
    const galeria = document.querySelector("[data-galeria-estilos]") as HTMLElement;
    expect(galeria).toBeTruthy();
    expect(within(galeria).getAllByRole("button").map((b) => b.getAttribute("aria-label"))).toEqual(ESTILOS_FORMA.map((e) => `Estilo: ${e.nombre}`));
  });

  it("elegir uno cambia lo elegido en UNA entrada, deja la selección y se marca; Deshacer lo quita", () => {
    const m = montar(base());
    m.clic(180, 150);
    fireEvent.click(cmd("estilo-principal"));
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    expect(f(m.ultima(), "A").estilo.relleno).toEqual({ tipo: "solido", color: "var(--primary)" });
    expect(f(m.ultima(), "B").estilo.relleno).toEqual(f(base(), "B").estilo.relleno); // lo no elegido, igual
    expect(anuncio()).toBe("Estilo Principal aplicado a 1 elemento.");
    expect(document.body.textContent).toContain("1 seleccionado");
    expect(cmd("estilo-principal").getAttribute("aria-pressed")).toBe("true");
    expect(cmd("estilo-neutro").getAttribute("aria-pressed")).toBe("false");
    deshacer(m);
    expect(f(m.ultima(), "A").estilo.relleno).toEqual(f(base(), "A").estilo.relleno);
  });

  it("elegir el que ya tienen no hace nada (ni historial ni anuncio)", () => {
    const m = montar(base());
    m.clic(180, 150);
    fireEvent.click(cmd("estilo-principal"));
    const antes = m.onCambio.mock.calls.length;
    fireEvent.click(cmd("estilo-principal"));
    expect(m.onCambio.mock.calls.length).toBe(antes);
  });

  it("con una mezcla (una forma con el estilo y otra sin él) ninguno aparece marcado", () => {
    const m = montar(base());
    m.clic(180, 150);
    fireEvent.click(cmd("estilo-neutro"));
    fireEvent.keyDown(m.lienzo, { key: "a", ctrlKey: true });
    expect([...document.querySelectorAll('[data-galeria-estilos] [aria-pressed="true"]')]).toHaveLength(0);
  });

  it("con una forma y un conector elegidos, el conector solo cambia de color (no el grosor ni el patrón)", () => {
    const m = montar(base());
    fireEvent.keyDown(m.lienzo, { key: "a", ctrlKey: true });
    fireEvent.click(cmd("estilo-alerta"));
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    expect(l(m.ultima(), "L").estilo.contorno).toEqual({ color: "var(--destructive)", grosor: 5, patron: "guiones" });
    expect(f(m.ultima(), "A").estilo.relleno).toEqual({ tipo: "solido", color: "var(--destructive)" });
  });

  it("las flechas recorren la galería", () => {
    const m = montar(base());
    m.clic(180, 150);
    const botones = [...document.querySelectorAll<HTMLButtonElement>("[data-galeria-estilos] button")];
    botones[0]?.focus();
    fireEvent.keyDown(botones[0] as Element, { key: "ArrowRight" });
    expect(document.activeElement === botones[1]).toBe(true);
    fireEvent.keyDown(botones[1] as Element, { key: "ArrowDown" });
    expect(document.activeElement === botones[7]).toBe(true);
    fireEvent.keyDown(botones[7] as Element, { key: "ArrowUp" });
    expect(document.activeElement === botones[1]).toBe(true);
    fireEvent.keyDown(botones[1] as Element, { key: "ArrowLeft" });
    expect(document.activeElement === botones[0]).toBe(true);
    expect(m.onCambio).not.toHaveBeenCalled(); // las flechas no movieron lo elegido
  });
});

describe("Y21 — la pestaña «Diseño» y los temas", () => {
  it("«Diseño» sale siempre, entre «Organizar» y «Vista», con las 10 paletas", () => {
    montar(base());
    expect(pestanas()).toEqual(["Inicio", "Insertar", "Organizar", "Diseño", "Vista"]);
    fireEvent.click(screen.getByRole("tab", { name: "Diseño" }));
    const galeria = document.querySelector("[data-galeria-temas]") as HTMLElement;
    expect(within(galeria).getAllByRole("button").map((b) => b.getAttribute("aria-label"))).toEqual(Object.values(PALETAS_DIAGRAMA).map((p) => `Tema: ${p.nombre}`));
    expect(galeria.querySelectorAll("rect")).toHaveLength(10 * 7); // acento + seis colores por paleta
  });

  it("sin nada elegido colorea todo el diagrama en UNA entrada; Deshacer la quita", () => {
    const m = montar(base());
    fireEvent.click(screen.getByRole("tab", { name: "Diseño" }));
    fireEvent.click(cmd("tema-oceano"));
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    const p = PALETAS_DIAGRAMA.oceano;
    expect(f(m.ultima(), "A").estilo.contorno.color).toBe(p.acentoPrincipal);
    expect(f(m.ultima(), "B").estilo.contorno.color).toBe(p.colores[0]); // hijo de A por el conector
    expect(l(m.ultima(), "L").estilo.contorno.color).toBe(p.colores[0]);
    expect(l(m.ultima(), "L").estilo.contorno.grosor).toBe(5); // el grosor no se toca
    expect(anuncio()).toBe(`Tema ${p.nombre} aplicado al diagrama.`);
    deshacer(m);
    expect(f(m.ultima(), "A").estilo.contorno.color).not.toBe(p.acentoPrincipal);
  });

  it("con formas elegidas colorea solo esas", () => {
    const m = montar(base());
    fireEvent.click(screen.getByRole("tab", { name: "Diseño" }));
    m.clic(480, 150); // B
    fireEvent.click(cmd("tema-menta"));
    expect(f(m.ultima(), "A").estilo.contorno.color).toBe(f(base(), "A").estilo.contorno.color); // A, igual
    expect(f(m.ultima(), "B").estilo.contorno.color).toBe(PALETAS_DIAGRAMA.menta.acentoPrincipal); // B es la raíz del alcance
    expect(anuncio()).toBe(`Tema ${PALETAS_DIAGRAMA.menta.nombre} aplicado a 1 forma.`);
  });

  it("aplicar el mismo tema dos veces no deja una segunda entrada", () => {
    const m = montar(base());
    fireEvent.click(screen.getByRole("tab", { name: "Diseño" }));
    fireEvent.click(cmd("tema-menta"));
    fireEvent.click(cmd("tema-menta"));
    expect(m.onCambio).toHaveBeenCalledTimes(1);
  });

  it("sin formas en el diagrama los temas están deshabilitados y dicen por qué", () => {
    const m = montar(escena(texto("T", 100, 100), linea("L", [[0, 300], [100, 300]])));
    fireEvent.click(screen.getByRole("tab", { name: "Diseño" }));
    expect(cmd("tema-menta").getAttribute("aria-disabled")).toBe("true");
    expect(cmd("tema-menta").title).toContain("No hay formas que colorear");
    fireEvent.click(cmd("tema-menta"));
    expect(m.onCambio).not.toHaveBeenCalled();
  });
});

describe("Y21 — por Ctrl+K", () => {
  const buscar = (m: M, consulta: string, opcion: RegExp): void => {
    fireEvent.keyDown(m.lienzo, { key: "k", ctrlKey: true });
    const dialogo = screen.getByRole("dialog", { name: /buscar comando/i });
    fireEvent.change(within(dialogo).getByRole("combobox"), { target: { value: consulta } });
    fireEvent.click(within(dialogo).getByRole("option", { name: opcion }));
  };
  it("«estilo principal» aplica el estilo a lo elegido", () => {
    const m = montar(base());
    m.clic(180, 150);
    buscar(m, "estilo principal", /Estilo: Principal/);
    expect(f(m.ultima(), "A").estilo.relleno).toEqual({ tipo: "solido", color: "var(--primary)" });
  });
  it("«tema océano» colorea el diagrama", () => {
    const m = montar(base());
    buscar(m, "tema oceano", /Tema: Océano Profundo/);
    expect(f(m.ultima(), "A").estilo.contorno.color).toBe(PALETAS_DIAGRAMA.oceano.acentoPrincipal);
  });
  it("«paleta» y «colorear» encuentran los temas por sinónimo", () => {
    const m = montar(base());
    fireEvent.keyDown(m.lienzo, { key: "k", ctrlKey: true });
    const dialogo = screen.getByRole("dialog", { name: /buscar comando/i });
    fireEvent.change(within(dialogo).getByRole("combobox"), { target: { value: "paleta" } });
    expect(within(dialogo).getAllByRole("option").some((o) => /Tema:/.test(o.textContent ?? ""))).toBe(true);
  });
});
