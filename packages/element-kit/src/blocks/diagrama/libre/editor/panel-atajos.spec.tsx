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
  it("? abre; ? Escape Cerrar y clic fuera cierran; ? en campo de texto no abre", () => {
    const m = montar();
    fireEvent.keyDown(m.lienzo, { key: "?", shiftKey: true });
    expect(m.panel()).toBeTruthy();
    fireEvent.keyDown(screen.getByRole("button", { name: "Cerrar panel" }), { key: "?", shiftKey: true });
    expect(m.panel()).toBeNull();
    fireEvent.keyDown(m.lienzo, { key: "?", shiftKey: true });
    fireEvent.keyDown(m.panel()!, { key: "Escape" });
    expect(m.panel()).toBeNull();
    fireEvent.keyDown(m.lienzo, { key: "?", shiftKey: true });
    fireEvent.click(screen.getByRole("button", { name: "Cerrar panel" }));
    expect(m.panel()).toBeNull();
    fireEvent.keyDown(m.lienzo, { key: "?", shiftKey: true });
    fireEvent.mouseDown(document.body);
    expect(m.panel()).toBeNull();

    cleanup();
    const m2 = montar();
    fireEvent.pointerDown(m2.lienzo, { clientX: 150, clientY: 130, button: 0, pointerId: 1 });
    fireEvent.pointerUp(m2.lienzo, { clientX: 150, clientY: 130, button: 0, pointerId: 1 });
    const escenaProp = escena(forma("A", 100, 100, 100, 60));
    cleanup();
    const m3 = montar(escenaProp);
    const g = document.querySelector("[data-dibujo-pagina]")?.parentElement?.getAttribute("transform") ?? "";
    const t = /translate\(([-\d.e]+) ([-\d.e]+)\) scale\(([-\d.e]+)\)/.exec(g);
    const px = { clientX: Number(t?.[1]) + 150 * Number(t?.[3]), clientY: Number(t?.[2]) + 130 * Number(t?.[3]) };
    fireEvent(m3.lienzo, new MouseEvent("pointerdown", { bubbles: true, button: 0, ...px }));
    fireEvent(m3.lienzo, new MouseEvent("pointerup", { bubbles: true, button: 0, ...px }));
    const campo = document.querySelector<HTMLInputElement>('input[aria-label="X"]');
    expect(campo).toBeTruthy();
    campo!.focus();
    fireEvent.keyDown(campo!, { key: "?", shiftKey: true });
    expect(m3.panel()).toBeNull();
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

  it("agrupa por pestaña como la cinta", () => {
    const m = montar();
    fireEvent.keyDown(m.lienzo, { key: "?", shiftKey: true });
    for (const c of COMANDOS.filter((x) => x.atajos?.length && PESTANA_POR_COMANDO[x.id])) {
      const pestana = PESTANA_POR_COMANDO[c.id]!;
      if (pestana === "Navegación y ratón") continue;
      const grupo = within(m.panel()!).getByRole("group", { name: pestana });
      expect(grupo.textContent).toContain(c.etiqueta);
    }
    irAPestana("Organizar");
    fireEvent.click(botonCinta("Agrupar"));
    // el botón existe en Organizar
    expect(PESTANA_POR_COMANDO.agrupar).toBe("Organizar");
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
    fireEvent.keyDown(m.lienzo, { key: "?", shiftKey: true });
    const panel = m.panel() as HTMLElement;
    const alWindow = vi.fn();
    window.addEventListener("keydown", alWindow);
    const cerrar = screen.getByRole("button", { name: "Cerrar panel" });
    cerrar.focus();
    fireEvent.keyDown(cerrar, { key: "Tab" });
    expect(panel.contains(document.activeElement)).toBe(true);
    fireEvent.keyDown(cerrar, { key: "Delete" });
    window.removeEventListener("keydown", alWindow);
    expect(alWindow).not.toHaveBeenCalled();
    fireEvent.keyDown(panel, { key: "Escape" });
    expect(document.activeElement).toBe(m.lienzo);
  });
});
