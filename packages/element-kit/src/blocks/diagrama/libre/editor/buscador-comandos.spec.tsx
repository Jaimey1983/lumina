import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Escena } from "@lumina/drawing";
import { EditorLibre } from "./editor-libre.js";
import { COMANDOS, textoDeAtajo } from "./comandos-registro.js";
import { botonCinta, escena, forma, ids } from "./util-pruebas.js";

afterEach(cleanup);

const base = () => escena(forma("a", 100, 100, 200, 100), forma("b", 500, 100, 200, 100), forma("c", 100, 350, 200, 100));

function montar(e: Escena = base()) {
  const onCambio = vi.fn<(e: Escena) => void>();
  const onCerrar = vi.fn<(e: Escena) => void>();
  render(<EditorLibre escena={e} onCambio={onCambio} onCerrar={onCerrar} />);
  const lienzo = screen.getByRole("application", { name: "Lienzo de dibujo" });
  const dialogo = () => screen.queryByRole("dialog", { name: "Buscar comando" });
  const entrada = () => within(dialogo() as HTMLElement).getByRole("combobox");
  return { onCambio, onCerrar, lienzo, dialogo, entrada, ultima: () => onCambio.mock.calls.at(-1)?.[0] as Escena };
}

describe("buscador de comandos", () => {
  it("Ctrl+K y ⌘+K abren desde el lienzo y desde la cinta", () => {
    const m = montar();
    fireEvent.keyDown(m.lienzo, { key: "k", ctrlKey: true });
    expect(m.dialogo()).toBeTruthy();
    fireEvent.keyDown(m.entrada(), { key: "Escape" });
    fireEvent.click(botonCinta("Buscar comando"));
    expect(m.dialogo()).toBeTruthy();
    cleanup();
    const m2 = montar();
    fireEvent.keyDown(m2.lienzo, { key: "k", metaKey: true });
    expect(m2.dialogo()).toBeTruthy();
  });

  it("Ctrl+K abre con el foco en un campo del panel de propiedades", () => {
    const escenaProp = escena(forma("A", 100, 100, 100, 60));
    const m = montar(escenaProp);
    const vista = () => {
      const g = document.querySelector("[data-dibujo-pagina]")?.parentElement?.getAttribute("transform") ?? "";
      const t = /translate\(([-\d.e]+) ([-\d.e]+)\) scale\(([-\d.e]+)\)/.exec(g);
      return { x: Number(t?.[1]), y: Number(t?.[2]), z: Number(t?.[3]) };
    };
    const p = { clientX: vista().x + 150 * vista().z, clientY: vista().y + 130 * vista().z };
    fireEvent(m.lienzo, new MouseEvent("pointerdown", { bubbles: true, cancelable: true, button: 0, ...p }));
    fireEvent(m.lienzo, new MouseEvent("pointerup", { bubbles: true, cancelable: true, button: 0, ...p }));
    const campo = document.querySelector<HTMLInputElement>('input[aria-label="X"]');
    expect(campo).toBeTruthy();
    campo!.focus();
    fireEvent.keyDown(campo!, { key: "k", ctrlKey: true });
    expect(m.dialogo()).toBeTruthy();
  });

  it("filtra y aria-activedescendant sigue al resaltado (ratón y teclado)", async () => {
    const m = montar();
    fireEvent.keyDown(m.lienzo, { key: "k", ctrlKey: true });
    fireEvent.change(m.entrada(), { target: { value: "alinear" } });
    const combobox = m.entrada();
    const opciones = within(m.dialogo() as HTMLElement).getAllByRole("option");
    expect(opciones.length).toBeGreaterThan(1);
    fireEvent.mouseEnter(opciones[2]!);
    expect(combobox.getAttribute("aria-activedescendant")).toBe(opciones[2]?.id);
    combobox.focus();
    fireEvent.keyDown(combobox, { key: "ArrowDown", code: "ArrowDown" });
    await waitFor(() => expect(combobox.getAttribute("aria-activedescendant")).toBe(opciones[3]?.id));
  });

  it("Enter ejecuta el resaltado igual que el botón de la cinta (agrupar)", () => {
    const porBoton = montar();
    fireEvent.keyDown(porBoton.lienzo, { key: "a", ctrlKey: true });
    expect(document.querySelector("[data-dibujo-estado]")?.textContent).toContain("3 seleccionados");
    fireEvent.click(botonCinta("Agrupar"));
    const conBoton = porBoton.ultima();
    cleanup();
    const porBuscador = montar();
    fireEvent.keyDown(porBuscador.lienzo, { key: "a", ctrlKey: true });
    fireEvent.keyDown(porBuscador.lienzo, { key: "k", ctrlKey: true });
    fireEvent.change(porBuscador.entrada(), { target: { value: "juntar" } });
    fireEvent.submit((porBuscador.entrada() as HTMLInputElement).form!);
    expect(porBuscador.ultima()).toEqual(conBoton);
    expect(ids(conBoton)).toHaveLength(4);
  });

  it("comando deshabilitado muestra motivo, aria-disabled y no ejecuta", () => {
    const m = montar();
    fireEvent.keyDown(m.lienzo, { key: "k", ctrlKey: true });
    fireEvent.change(m.entrada(), { target: { value: "distribuir horizontal" } });
    const opcion = within(m.dialogo() as HTMLElement).getByRole("option", { name: /Distribuir horizontalmente/i });
    expect(opcion.getAttribute("aria-disabled")).toBe("true");
    expect(opcion.textContent).toContain("Elige 3 o más elementos");
    fireEvent.click(opcion);
    fireEvent.keyDown(m.entrada(), { key: "Enter" });
    expect(m.onCambio).not.toHaveBeenCalled();
  });

  it("tras ejecutar cierra y devuelve el foco al lienzo", () => {
    const m = montar();
    fireEvent.keyDown(m.lienzo, { key: "a", ctrlKey: true });
    fireEvent.keyDown(m.lienzo, { key: "k", ctrlKey: true });
    fireEvent.change(m.entrada(), { target: { value: "juntar" } });
    fireEvent.submit((m.entrada() as HTMLInputElement).form!);
    expect(m.dialogo()).toBeNull();
    expect(document.activeElement).toBe(m.lienzo);
  });

  it("Escape cierra sin cerrar el editor y devuelve el foco", () => {
    const m = montar();
    const antes = document.activeElement;
    fireEvent.keyDown(m.lienzo, { key: "k", ctrlKey: true });
    const editorRaiz = document.querySelector("[data-dibujo-editor]") as HTMLElement;
    let escapeEnEditor = false;
    const alEscape = (e: KeyboardEvent): void => {
      if (e.key === "Escape") escapeEnEditor = true;
    };
    editorRaiz.addEventListener("keydown", alEscape);
    const entrada = m.entrada();
    act(() => {
      entrada.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    });
    editorRaiz.removeEventListener("keydown", alEscape);
    expect(m.dialogo()).toBeNull();
    expect(m.onCerrar).not.toHaveBeenCalled();
    expect(escapeEnEditor).toBe(false);
    expect(document.activeElement).toBe(antes ?? m.lienzo);
  });

  it("Tab no escapa del diálogo", () => {
    const m = montar();
    fireEvent.keyDown(m.lienzo, { key: "k", ctrlKey: true });
    const dialogo = m.dialogo() as HTMLElement;
    const dentro = [...dialogo.querySelectorAll<HTMLElement>('button:not([aria-disabled="true"]), input')];
    expect(dentro.length).toBeGreaterThan(1);
    const primero = dentro[0]!;
    const ultimo = dentro[dentro.length - 1]!;
    ultimo.focus();
    act(() => {
      ultimo.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
    });
    expect(document.activeElement).toBe(primero);
  });

  it("anuncia resultados y sin resultados", () => {
    const m = montar();
    fireEvent.keyDown(m.lienzo, { key: "k", ctrlKey: true });
    expect(within(m.dialogo() as HTMLElement).getByText(/resultados/i)).toBeTruthy();
    fireEvent.change(m.entrada(), { target: { value: "zzz-nada" } });
    expect(screen.getByText(/Sin resultados/i)).toBeTruthy();
    expect(screen.getByText(/Ningún comando coincide/i)).toBeTruthy();
  });

  it("aislamiento: teclas en el campo no llegan a window ni mueven la escena", () => {
    const m = montar();
    fireEvent.keyDown(m.lienzo, { key: "a", ctrlKey: true });
    const alWindow = vi.fn();
    window.addEventListener("keydown", alWindow);
    const editorRaiz = document.querySelector("[data-dibujo-editor]") as HTMLElement;
    const alEditor = vi.fn();
    editorRaiz.addEventListener("keydown", alEditor);
    fireEvent.keyDown(m.lienzo, { key: "k", ctrlKey: true });
    const n = m.onCambio.mock.calls.length;
    const entrada = m.entrada();
    const teclas = ["Delete", "Backspace", "ArrowDown"] as const;
    for (const key of teclas) {
      act(() => {
        entrada.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
      });
    }
    act(() => {
      entrada.dispatchEvent(new KeyboardEvent("keydown", { key: "z", bubbles: true, cancelable: true, ctrlKey: true }));
    });
    window.removeEventListener("keydown", alWindow);
    editorRaiz.removeEventListener("keydown", alEditor);
    expect(alWindow).not.toHaveBeenCalled();
    expect(alEditor).not.toHaveBeenCalled();
    expect(m.onCambio).toHaveBeenCalledTimes(n);
  });

  it("cada fila muestra exactamente textoDeAtajo del registro", () => {
    const m = montar();
    fireEvent.keyDown(m.lienzo, { key: "k", ctrlKey: true });
    const opciones = within(m.dialogo() as HTMLElement).getAllByRole("option");
    for (const opcion of opciones) {
      const id = opcion.getAttribute("data-comando");
      if (!id) continue;
      const def = COMANDOS.find((c) => c.id === id);
      const atajo = def ? textoDeAtajo(def) : undefined;
      if (atajo) expect(opcion.textContent).toContain(atajo);
    }
  });
});
