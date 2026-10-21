import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Escena } from "@lumina/drawing";
import { EditorLibre } from "./editor-libre.js";
import { COMANDOS, textosDeAtajos } from "./comandos-registro.js";
import { ATAJOS_DE_NAVEGACION } from "./comandos.js";
import { PESTANA_POR_COMANDO } from "./cinta-editor.js";
import { botonCinta, escena, forma, irAPestana } from "./util-pruebas.js";

afterEach(cleanup);

function montar(e: Escena = escena(forma("a", 0, 0))) {
  const onCambio = vi.fn<(e: Escena) => void>();
  const onCerrar = vi.fn<(e: Escena) => void>();
  render(<EditorLibre escena={e} onCambio={onCambio} onCerrar={onCerrar} />);
  const lienzo = screen.getByRole("application", { name: "Lienzo de dibujo" });
  const panel = () => screen.queryByRole("dialog", { name: "Atajos de teclado" });
  return { onCambio, onCerrar, lienzo, panel };
}

describe("panel de atajos", () => {
  it("? abre y ? cierra", () => {
    const m = montar();
    fireEvent.keyDown(m.lienzo, { key: "?", shiftKey: true });
    expect(m.panel()).toBeTruthy();
    fireEvent.keyDown(screen.getByRole("button", { name: "Cerrar panel" }), { key: "?", shiftKey: true });
    expect(m.panel()).toBeNull();
  });

  it("Escape, el botón Cerrar y un clic en el fondo cierran, sin cerrar el editor", () => {
    const m = montar();
    fireEvent.keyDown(m.lienzo, { key: "?", shiftKey: true });
    fireEvent.keyDown(m.panel()!, { key: "Escape" });
    expect(m.panel()).toBeNull();
    fireEvent.keyDown(m.lienzo, { key: "?", shiftKey: true });
    fireEvent.click(screen.getByRole("button", { name: "Cerrar panel" }));
    expect(m.panel()).toBeNull();
    fireEvent.keyDown(m.lienzo, { key: "?", shiftKey: true });
    fireEvent.click(document.querySelector("[data-atajos-fondo]") as HTMLElement);
    expect(m.panel()).toBeNull();
    expect(m.onCerrar).not.toHaveBeenCalled();
  });

  it("un clic dentro del panel no lo cierra", () => {
    const m = montar();
    fireEvent.keyDown(m.lienzo, { key: "?", shiftKey: true });
    fireEvent.click(within(m.panel()!).getByRole("heading", { name: "Atajos de teclado" }));
    expect(m.panel()).toBeTruthy();
  });

  it("? en un campo de texto no lo abre", () => {
    const m = montar(escena(forma("A", 100, 100, 100, 60)));
    const g = document.querySelector("[data-dibujo-pagina]")?.parentElement?.getAttribute("transform") ?? "";
    const t = /translate\(([-\d.e]+) ([-\d.e]+)\) scale\(([-\d.e]+)\)/.exec(g);
    const px = { clientX: Number(t?.[1]) + 150 * Number(t?.[3]), clientY: Number(t?.[2]) + 130 * Number(t?.[3]) };
    fireEvent(m.lienzo, new MouseEvent("pointerdown", { bubbles: true, button: 0, ...px }));
    fireEvent(m.lienzo, new MouseEvent("pointerup", { bubbles: true, button: 0, ...px }));
    const campo = document.querySelector<HTMLInputElement>('input[aria-label="X"]');
    expect(campo).toBeTruthy();
    campo!.focus();
    fireEvent.keyDown(campo!, { key: "?", shiftKey: true });
    expect(m.panel()).toBeNull();
  });

  it("el foco entra al panel y, al cerrar, vuelve a donde estaba: el lienzo o el botón de la cinta", () => {
    const m = montar();
    m.lienzo.focus();
    fireEvent.keyDown(m.lienzo, { key: "?", shiftKey: true });
    expect(m.panel()!.contains(document.activeElement)).toBe(true);
    fireEvent.keyDown(m.panel()!, { key: "Escape" });
    expect(document.activeElement).toBe(m.lienzo);

    const boton = botonCinta("Atajos de teclado");
    boton.focus();
    fireEvent.click(boton);
    expect(m.panel()).toBeTruthy();
    expect(m.panel()!.contains(document.activeElement)).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Cerrar panel" }));
    expect(m.panel()).toBeNull();
    expect(document.activeElement).toBe(boton);
  });

  it("coincide con el registro: etiquetas, todas las combinaciones, sin extras", () => {
    const m = montar();
    fireEvent.keyDown(m.lienzo, { key: "?", shiftKey: true });
    const texto = m.panel()!.textContent ?? "";
    for (const c of COMANDOS) {
      const combos = textosDeAtajos(c);
      if (combos.length === 0) {
        expect(texto).not.toContain(c.etiqueta);
        continue;
      }
      expect(texto).toContain(c.etiqueta);
      for (const combo of combos) {
        for (const parte of combo.split("+")) expect(texto).toContain(parte);
      }
    }
  });

  it("rehacer lista las dos combinaciones", () => {
    const m = montar();
    fireEvent.keyDown(m.lienzo, { key: "?", shiftKey: true });
    const seccion = within(m.panel()!).getByRole("group", { name: "Historial" });
    expect(seccion.textContent).toMatch(/Ctrl\+Y/);
    expect(seccion.textContent).toMatch(/Ctrl\+Mayús\+Z/);
  });

  it("agrupa por pestaña como la cinta: cada comando con atajo aparece bajo la pestaña donde está su botón de verdad", () => {
    const m = montar();
    // Dónde pone cada botón la cinta (la fuente real): se recorren sus pestañas y se anota qué comandos hay en cada una.
    const pestanaDelBoton = new Map<string, string>();
    for (const nombre of ["Inicio", "Insertar", "Organizar", "Vista"]) {
      irAPestana(nombre);
      for (const el of document.querySelectorAll("[role=tabpanel] [data-comando]")) pestanaDelBoton.set(el.getAttribute("data-comando")!, nombre);
    }
    // Deshacer y Rehacer viven en la barra de acceso rápido: el panel los agrupa en «Historial».
    pestanaDelBoton.set("deshacer", "Historial");
    pestanaDelBoton.set("rehacer", "Historial");
    fireEvent.keyDown(m.lienzo, { key: "?", shiftKey: true });
    const conAtajo = COMANDOS.filter((c) => c.atajos?.length && pestanaDelBoton.has(c.id));
    expect(conAtajo.length).toBeGreaterThan(10);
    for (const c of conAtajo) {
      const pestana = pestanaDelBoton.get(c.id)!;
      expect(PESTANA_POR_COMANDO[c.id], `la tabla dice otra pestaña para ${c.id}`).toBe(pestana);
      const grupo = within(m.panel()!).getByRole("group", { name: pestana });
      expect(grupo.textContent, `${c.id} debe estar en «${pestana}»`).toContain(c.etiqueta);
    }
  });

  it("navegación coincide con ATAJOS_DE_NAVEGACION", () => {
    const m = montar();
    fireEvent.keyDown(m.lienzo, { key: "?", shiftKey: true });
    const nav = within(m.panel()!).getByRole("group", { name: "Navegación y ratón" });
    for (const fila of ATAJOS_DE_NAVEGACION) {
      expect(nav.textContent).toContain(fila.descripcion);
      expect(nav.textContent).toContain(fila.etiquetaTeclas);
    }
  });

  it("foco atrapado y aislamiento de teclado", () => {
    const m = montar();
    m.lienzo.focus();
    fireEvent.keyDown(m.lienzo, { key: "?", shiftKey: true });
    const panel = m.panel() as HTMLElement;
    const cerrar = screen.getByRole("button", { name: "Cerrar panel" });
    expect(document.activeElement).toBe(cerrar);
    fireEvent.keyDown(cerrar, { key: "Tab" });
    expect(panel.contains(document.activeElement)).toBe(true);
    fireEvent.keyDown(cerrar, { key: "Tab", shiftKey: true });
    expect(panel.contains(document.activeElement)).toBe(true);
    // Nada de lo que se teclea en el panel llega a `window` (ni mueve ni borra lo que haya elegido el editor).
    fireEvent.keyDown(m.lienzo, { key: "Escape" });
    fireEvent.keyDown(m.lienzo, { key: "?", shiftKey: true });
    const alWindow = vi.fn();
    window.addEventListener("keydown", alWindow);
    const otra = screen.getByRole("button", { name: "Cerrar panel" });
    for (const key of ["Delete", "Backspace", "ArrowLeft", "Tab"]) fireEvent.keyDown(otra, { key });
    fireEvent.keyDown(otra, { key: "z", ctrlKey: true });
    window.removeEventListener("keydown", alWindow);
    expect(alWindow).not.toHaveBeenCalled();
    expect(m.onCambio).not.toHaveBeenCalled();
  });
});
