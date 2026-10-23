import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Escena } from "@lumina/drawing";
import { EditorLibre } from "./editor-libre.js";
import { botonCinta, escena, forma } from "./util-pruebas.js";

afterEach(cleanup);

// «a» (0–100) y «b» (300–400) en la misma fila; el vacío está en (700, 400).
const base = (): Escena => escena(forma("a", 0, 100, 100, 100), forma("b", 300, 100, 100, 100));

function montar(e: Escena = base()) {
  const onCambio = vi.fn<(s: Escena) => void>();
  const onCerrar = vi.fn();
  render(<EditorLibre escena={e} onCambio={onCambio} onCerrar={onCerrar} />);
  const lienzo = screen.getByRole("application", { name: "Lienzo de dibujo" }) as unknown as SVGSVGElement;
  fireEvent.click(botonCinta("Imantar a otros elementos"));
  const vista = () => {
    const g = document.querySelector("[data-dibujo-pagina]")?.parentElement?.getAttribute("transform") ?? "";
    const m = /translate\(([-\d.e]+) ([-\d.e]+)\) scale\(([-\d.e]+)\)/.exec(g);
    return { x: Number(m?.[1]), y: Number(m?.[2]), z: Number(m?.[3]) };
  };
  const evento = (tipo: string, x: number, y: number, extra: Record<string, unknown> = {}): boolean => {
    const v = vista();
    return fireEvent(lienzo, new MouseEvent(tipo, { bubbles: true, cancelable: true, button: 0, clientX: v.x + x * v.z, clientY: v.y + y * v.z, ...extra }));
  };
  return {
    lienzo,
    onCambio,
    onCerrar,
    clic: (x: number, y: number) => {
      evento("pointerdown", x, y);
      evento("pointerup", x, y);
    },
    derecho: (x: number, y: number) => evento("contextmenu", x, y, { button: 2 }),
    barra: () => document.body.textContent?.match(/(\d+) seleccionados?/)?.[1] ?? "0",
    anuncio: () => document.querySelector("[data-dibujo-anuncio]")?.textContent ?? "",
    /** Los comandos del menú abierto, en orden (los de los submenús, abiertos o no, no entran). */
    menu: async () => {
      const m = await screen.findByRole("menu");
      return { raiz: m, ids: [...m.querySelectorAll("[data-comando]")].map((x) => x.getAttribute("data-comando")), submenus: [...m.querySelectorAll("[data-submenu]")].map((x) => x.getAttribute("data-submenu")) };
    },
  };
}

describe("Y17 — clic derecho", () => {
  it("sobre una forma sin elegir la elige primero, abre el menú de forma y los deshabilitados dicen el motivo; Escape cierra y devuelve el foco", async () => {
    const m = montar();
    expect(m.derecho(50, 150)).toBe(false); // el menú del navegador se anula dentro del lienzo
    const { raiz, ids, submenus } = await m.menu();
    expect(raiz.getAttribute("aria-label")).toBe("Menú contextual");
    expect(document.querySelector("[data-menu-contextual]")?.getAttribute("data-menu-contextual")).toBe("forma");
    expect(m.barra()).toBe("1");
    expect(ids).toEqual(["cortar", "copiar", "pegar", "duplicar", "eliminar", "crear-hijo", "crear-hermano", "agrupar", "desagrupar", "bloquear", "ocultar"]);
    expect(submenus).toEqual(["Orden"]); // sin «Alinear»: hay una sola forma
    const agrupar = raiz.querySelector("[data-comando=agrupar]") as HTMLElement;
    expect(agrupar.getAttribute("aria-disabled")).toBe("true");
    expect(agrupar.textContent).toContain("Elige 2 o más elementos");
    expect(raiz.querySelector("[data-comando=duplicar]")?.textContent).toContain("Ctrl+D");
    expect(m.onCambio).not.toHaveBeenCalled();
    fireEvent.keyDown(raiz, { key: "Escape" });
    await vi.waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    expect(m.barra()).toBe("1"); // el Escape que cierra el menú no quita también la selección
    // El foco vuelve al lienzo un instante después de cerrar (Radix lo devuelve en el turno siguiente).
    await vi.waitFor(() => expect(document.activeElement === m.lienzo).toBe(true));
    expect(m.onCambio).not.toHaveBeenCalled();
    expect(m.onCerrar).not.toHaveBeenCalled();
  }, 150000);

  it("sobre una selección múltiple la conserva, ofrece «Alinear» y un comando elegido se ejecuta como el de la cinta (una entrada de historial)", async () => {
    const m = montar();
    fireEvent.keyDown(m.lienzo, { key: "a", ctrlKey: true });
    expect(m.barra()).toBe("2");
    m.derecho(50, 150); // sobre «a», que ya estaba elegida
    const { raiz, submenus } = await m.menu();
    expect(m.barra()).toBe("2");
    expect(submenus).toEqual(["Orden", "Alinear"]);
    fireEvent.click(raiz.querySelector("[data-comando=duplicar]") as HTMLElement);
    await vi.waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    expect(m.onCambio.mock.calls[0]![0].elementos.filter((x) => x.tipo === "forma")).toHaveLength(4);
    fireEvent.click(botonCinta("Deshacer"));
    expect(m.onCambio.mock.calls[1]![0].elementos.filter((x) => x.tipo === "forma")).toHaveLength(2); // un solo paso lo deshace
  }, 150000);

  it("sobre un vacío no deja nada elegido y ofrece pegar, seleccionar todo y las ayudas; «Reglas» hace lo mismo que su botón", async () => {
    const m = montar();
    m.clic(50, 150);
    expect(m.barra()).toBe("1");
    m.derecho(700, 400);
    const { raiz, ids } = await m.menu();
    expect(document.querySelector("[data-menu-contextual]")?.getAttribute("data-menu-contextual")).toBe("vacio");
    expect(m.barra()).toBe("0");
    expect(ids).toEqual(["pegar", "seleccionar-todo", "cuadricula", "imantar", "reglas"]);
    fireEvent.click(raiz.querySelector("[data-comando=reglas]") as HTMLElement);
    await vi.waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    expect(document.querySelectorAll("[data-regla]")).toHaveLength(2);
    expect(m.anuncio()).toBe("Reglas activadas.");
    expect(m.onCambio).not.toHaveBeenCalled();
  }, 150000);
});

describe("Y17 — teclado", () => {
  it("la tecla Menú abre el menú de lo elegido; flechas y Enter eligen; Escape cierra y devuelve el foco", async () => {
    const m = montar();
    m.clic(50, 150);
    m.lienzo.focus();
    fireEvent.keyDown(m.lienzo, { key: "ContextMenu" });
    const { raiz } = await m.menu();
    const quien = (): string | null => (document.activeElement as HTMLElement | null)?.getAttribute?.("data-comando") ?? null;
    // Abierto con el teclado, el foco ya está en la primera entrada; Radix mueve el foco en el turno siguiente a cada flecha.
    await vi.waitFor(() => expect(quien()).toBe("cortar"));
    for (const siguiente of ["copiar", "pegar", "duplicar"]) {
      fireEvent.keyDown(document.activeElement ?? raiz, { key: "ArrowDown" });
      await vi.waitFor(() => expect(quien()).toBe(siguiente));
    }
    // Mientras el menú está abierto las flechas son suyas: no mueven la selección ni cambian la escena.
    expect(m.onCambio).not.toHaveBeenCalled();
    fireEvent.keyDown(document.activeElement ?? raiz, { key: "Enter" });
    await vi.waitFor(() => expect(m.onCambio).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    expect(m.onCambio.mock.calls[0]![0].elementos.filter((x) => x.tipo === "forma")).toHaveLength(3); // «Duplicar»
    await vi.waitFor(() => expect(document.activeElement === m.lienzo).toBe(true));
  }, 150000);

  it("Mayús+F10 también lo abre", async () => {
    const m = montar();
    m.lienzo.focus();
    fireEvent.keyDown(m.lienzo, { key: "F10", shiftKey: true });
    const { ids } = await m.menu();
    expect(ids).toContain("seleccionar-todo"); // sin nada elegido: el menú del vacío
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    await vi.waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  }, 150000);
});

describe("Y17 — cuándo no se abre", () => {
  it("con una edición de texto abierta no se abre nuestro menú", () => {
    const m = montar();
    fireEvent(m.lienzo, new MouseEvent("dblclick", { bubbles: true, cancelable: true, clientX: 50, clientY: 150 }));
    expect(document.querySelector("textarea, [contenteditable=true], input[type=text]")).not.toBeNull();
    m.derecho(50, 150);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("fuera del lienzo no se anula el menú del navegador", () => {
    montar();
    const pestana = screen.getByRole("tab", { name: "Inicio" });
    expect(fireEvent.contextMenu(pestana)).toBe(true); // no cancelado: sigue el del navegador
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
