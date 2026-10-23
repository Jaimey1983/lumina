import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Escena } from "@lumina/drawing";
import { EditorLibre } from "./editor-libre.js";
import { CAMBIAR_FORMA, COMANDOS, textoDeAtajo, ORGANIZAR, ELEGIR } from "./comandos-registro.js";
import { botonCinta, deshabilitado, escena, forma, ids, irAPestana, linea } from "./util-pruebas.js";

afterEach(cleanup);

const base = () => escena(forma("a", 100, 100, 200, 100), forma("b", 500, 100, 200, 100), forma("c", 100, 350, 200, 100));

function montar(e: Escena = base()) {
  const onCambio = vi.fn<(e: Escena) => void>();
  const onCerrar = vi.fn<(e: Escena) => void>();
  render(<EditorLibre escena={e} onCambio={onCambio} onCerrar={onCerrar} />);
  const lienzo = screen.getByRole("application", { name: "Lienzo de dibujo" });
  return { onCambio, onCerrar, lienzo, ultima: () => onCambio.mock.calls.at(-1)?.[0] as Escena };
}

describe("cinta del editor", () => {
  it("tiene las pestañas Inicio, Insertar, Organizar y Vista, y ninguna contextual sin selección", () => {
    montar();
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["Inicio", "Insertar", "Organizar", "Vista"]);
    expect(screen.getByRole("tab", { name: "Inicio" }).getAttribute("aria-selected")).toBe("true");
  });

  it("todos los comandos que antes tenían botón siguen teniéndolo, cada uno en su pestaña (ningún botón desaparece)", () => {
    montar();
    // Negrita, cursiva y subrayado (Y18) viven en la pestaña contextual «Formato de forma» y en la mini barra: sin selección no hay botón.
    // «Cambiar a …» (Y19) salen en la galería «Cambiar forma» de esa pestaña contextual, en el menú contextual y en Ctrl+K.
    // Las variantes de «Organizar automáticamente» (Y13) viven en el menú de su flecha, no como botones sueltos.
    const sinBoton = new Set(["seleccionar-todo", ...ELEGIR.map((c) => c.id), ...COMANDOS.filter((c) => c.soloMenu).map((c) => c.id), "listo", "buscar-comando", "pegar-al-mas-cercano", "negrita", "cursiva", "subrayado", ...CAMBIAR_FORMA.map((c) => c.id), ...ORGANIZAR.filter((c) => c.id !== "organizar-auto").map((c) => c.id)]);
    const faltan: string[] = [];
    for (const nombre of ["Inicio", "Insertar", "Organizar", "Vista"]) {
      irAPestana(nombre);
      const presentes = new Set([...document.querySelectorAll("[data-comando]")].map((b) => b.getAttribute("data-comando")));
      for (const c of COMANDOS) if (presentes.has(c.id)) sinBoton.add(c.id);
    }
    for (const c of COMANDOS) if (!sinBoton.has(c.id)) faltan.push(c.id);
    expect(faltan).toEqual([]);
    // Deshacer y Rehacer están siempre a la vista (barra de acceso rápido) y «Listo» a la derecha de las pestañas.
    expect(within(screen.getByRole("toolbar", { name: "Acceso rápido" })).getAllByRole("button").map((b) => b.getAttribute("data-comando"))).toEqual(["buscar-comando", "deshacer", "rehacer"]);
    expect(document.querySelector("[data-dibujo-listo]")).toBeTruthy();
  });

  it("el tooltip de cada botón trae el atajo que sale del registro", () => {
    const m = montar();
    fireEvent.keyDown(m.lienzo, { key: "a", ctrlKey: true });
    fireEvent.keyDown(m.lienzo, { key: "g", ctrlKey: true }); // queda un grupo elegido: todo está habilitado
    expect(botonCinta("Duplicar").title).toBe("Duplicar (Ctrl+D)");
    expect(botonCinta("Línea").title).toBe("Línea (L)");
    expect(botonCinta("Desagrupar").title).toBe("Desagrupar (Ctrl+Mayús+G)");
    expect(botonCinta("Traer al frente").title).toBe("Traer al frente (Ctrl+Mayús+])");
    for (const c of COMANDOS.filter((x) => x.atajos)) expect(textoDeAtajo(c)).toBeTruthy();
  });

  it("deshabilitado explica el porqué en el tooltip, sigue enfocable y no ejecuta", () => {
    const m = montar();
    const distribuir = botonCinta("Distribuir horizontalmente");
    expect(deshabilitado(distribuir)).toBe(true);
    expect(distribuir.title).toBe("Distribuir horizontalmente — Elige 3 o más elementos");
    distribuir.focus();
    expect(document.activeElement).toBe(distribuir);
    fireEvent.click(distribuir);
    expect(m.onCambio).not.toHaveBeenCalled();
  });

  it("el botón y el atajo hacen lo mismo: Agrupar y Ctrl+G dan la misma escena", () => {
    const porBoton = montar();
    fireEvent.keyDown(porBoton.lienzo, { key: "a", ctrlKey: true });
    fireEvent.click(botonCinta("Agrupar"));
    const conBoton = porBoton.ultima();
    cleanup();
    const porTeclado = montar();
    fireEvent.keyDown(porTeclado.lienzo, { key: "a", ctrlKey: true });
    fireEvent.keyDown(porTeclado.lienzo, { key: "g", ctrlKey: true });
    expect(porTeclado.ultima()).toEqual(conBoton);
    expect(ids(conBoton)).toHaveLength(4);
  });

  it("el estado habilitado sigue a la selección", () => {
    const m = montar();
    irAPestana("Organizar");
    expect(deshabilitado(botonCinta("Agrupar"))).toBe(true);
    fireEvent.keyDown(m.lienzo, { key: "a", ctrlKey: true });
    expect(deshabilitado(botonCinta("Agrupar"))).toBe(false);
    expect(deshabilitado(botonCinta("Distribuir verticalmente"))).toBe(false);
  });

  it("elegir una herramienta desde la cinta la marca y devuelve el foco al lienzo; la tecla hace lo mismo", () => {
    const m = montar();
    fireEvent.click(botonCinta("Línea"));
    expect(botonCinta("Línea").getAttribute("aria-pressed")).toBe("true");
    expect(document.activeElement).toBe(m.lienzo);
    fireEvent.keyDown(m.lienzo, { key: "t" });
    expect(botonCinta("Texto").getAttribute("aria-pressed")).toBe("true");
    expect(botonCinta("Línea").getAttribute("aria-pressed")).toBe("false");
  });

  it("«Listo» cierra y devuelve la escena", () => {
    const m = montar();
    fireEvent.click(document.querySelector("[data-dibujo-listo]") as HTMLElement);
    expect(m.onCerrar).toHaveBeenCalledTimes(1);
  });

  it("la cinta se contrae con doble clic y, contraída, abre un panel flotante sin cerrar el editor con Escape", () => {
    const m = montar();
    fireEvent.doubleClick(screen.getByRole("tab", { name: "Inicio" }));
    expect(screen.queryByRole("tabpanel")).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "Organizar" }));
    expect(screen.getByRole("tabpanel")).toBeTruthy();
    fireEvent.keyDown(screen.getByRole("tab", { name: "Organizar" }), { key: "Escape" });
    expect(screen.queryByRole("tabpanel")).toBeNull();
    expect(m.onCerrar).not.toHaveBeenCalled();
  });

  it("las flechas sobre una lista de la cinta no mueven la selección", () => {
    const m = montar(escena(linea("L", [[300, 300], [500, 400]])));
    fireEvent.keyDown(m.lienzo, { key: "a", ctrlKey: true });
    const lista = screen.getByRole("combobox", { name: "Extremo final" });
    fireEvent.keyDown(lista, { key: "ArrowDown" });
    fireEvent.keyDown(lista, { key: "Delete" });
    expect(m.onCambio).not.toHaveBeenCalled();
    expect(document.querySelector("[data-dibujo-estado]")?.textContent).toContain("1 seleccionado");
  });

  it("nada de lo que se teclea en la cinta llega al editor de diapositivas", () => {
    montar();
    const alWindow = vi.fn();
    window.addEventListener("keydown", alWindow);
    fireEvent.keyDown(botonCinta("Duplicar"), { key: "Delete" });
    fireEvent.keyDown(botonCinta("Duplicar"), { key: "z", ctrlKey: true });
    window.removeEventListener("keydown", alWindow);
    expect(alWindow).not.toHaveBeenCalled();
  });
});
