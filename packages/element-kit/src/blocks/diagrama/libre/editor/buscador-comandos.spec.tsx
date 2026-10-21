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
    fireEvent.keyDown(porBuscador.entrada(), { key: "Enter" });
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
    // Que un deshabilitado no ejecuta se ve en que el buscador sigue abierto: ejecutar siempre lo cierra.
    expect(m.dialogo()).toBeTruthy();
  });

  it("tras ejecutar cierra y devuelve el foco al lienzo", () => {
    const m = montar();
    fireEvent.keyDown(m.lienzo, { key: "a", ctrlKey: true });
    fireEvent.keyDown(m.lienzo, { key: "k", ctrlKey: true });
    fireEvent.change(m.entrada(), { target: { value: "juntar" } });
    fireEvent.keyDown(m.entrada(), { key: "Enter" });
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

  it("Tab no escapa del diálogo: el foco se queda en el campo y las opciones no son paradas de tabulador", () => {
    const m = montar();
    fireEvent.keyDown(m.lienzo, { key: "k", ctrlKey: true });
    const entrada = m.entrada();
    const opciones = within(m.dialogo() as HTMLElement).getAllByRole("option");
    expect(opciones.length).toBe(COMANDOS.length);
    for (const o of opciones) expect(o.getAttribute("tabindex")).toBe("-1");
    expect(document.activeElement).toBe(entrada);
    fireEvent.keyDown(entrada, { key: "Tab" });
    expect(document.activeElement).toBe(entrada);
    fireEvent.keyDown(entrada, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(entrada);
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

describe("buscador de comandos — foco, desplazamiento y teclado real (revisión de Y5)", () => {
  /** Lo que hace un clic de verdad: el botón recibe el foco y luego el clic. */
  const clicConFoco = (el: HTMLElement): void => {
    el.focus();
    fireEvent.click(el);
  };

  it("abierto desde un botón de la cinta, Escape devuelve el foco a ese botón (también tras escribir)", () => {
    const m = montar();
    const boton = botonCinta("Buscar comando");
    clicConFoco(boton);
    expect(m.dialogo()).toBeTruthy();
    fireEvent.keyDown(m.entrada(), { key: "Escape" });
    expect(m.dialogo()).toBeNull();
    expect(document.activeElement).toBe(boton);

    clicConFoco(boton);
    fireEvent.change(m.entrada(), { target: { value: "a" } });
    fireEvent.change(m.entrada(), { target: { value: "al" } });
    fireEvent.keyDown(m.entrada(), { key: "Escape" });
    expect(document.activeElement).toBe(boton);
  });

  it("abierto desde un botón de la cinta, ejecutar lleva el foco al LIENZO (no de vuelta al botón)", () => {
    const m = montar();
    const boton = botonCinta("Buscar comando");
    clicConFoco(boton);
    fireEvent.change(m.entrada(), { target: { value: "cuadricula" } });
    fireEvent.keyDown(m.entrada(), { key: "Enter" });
    expect(m.dialogo()).toBeNull();
    expect(document.querySelector("[data-capa=cuadricula]")).toBeTruthy();
    expect(document.activeElement).toBe(m.lienzo);
    expect(document.activeElement).not.toBe(boton);
  });

  it("ejecutar con un clic en la fila también lleva el foco al lienzo", () => {
    const m = montar();
    clicConFoco(botonCinta("Buscar comando"));
    fireEvent.change(m.entrada(), { target: { value: "rejilla" } });
    fireEvent.click(within(m.dialogo() as HTMLElement).getByRole("option", { name: /Cuadrícula/ }));
    expect(m.dialogo()).toBeNull();
    expect(document.activeElement).toBe(m.lienzo);
  });

  it("el retorno de foco no depende de que el padre se vuelva a pintar (callbacks nuevos en cada render)", () => {
    const m = montar();
    const boton = botonCinta("Buscar comando");
    clicConFoco(boton);
    // Cambiar el estado del EDITOR con el buscador abierto (aquí, el zoom) lo vuelve a pintar y le pasa callbacks nuevos.
    fireEvent.change(screen.getByRole("slider", { name: "Zoom" }), { target: { value: "0.3" } });
    fireEvent.change(screen.getByRole("slider", { name: "Zoom" }), { target: { value: "0.6" } });
    expect(m.dialogo()).toBeTruthy();
    expect(document.activeElement).toBe(m.entrada());
    fireEvent.keyDown(m.entrada(), { key: "Escape" });
    expect(document.activeElement).toBe(boton);
  });

  it("Enter con un método de entrada (composición) no ejecuta", () => {
    const m = montar();
    fireEvent.keyDown(m.lienzo, { key: "a", ctrlKey: true });
    fireEvent.keyDown(m.lienzo, { key: "k", ctrlKey: true });
    fireEvent.change(m.entrada(), { target: { value: "juntar" } });
    fireEvent.keyDown(m.entrada(), { key: "Enter", isComposing: true });
    expect(m.dialogo()).toBeTruthy();
    expect(m.onCambio).not.toHaveBeenCalled();
  });

  it("la fila resaltada con el teclado se desplaza a la vista; con el ratón, no", () => {
    const original = Element.prototype.scrollIntoView;
    const alVista = vi.fn();
    Element.prototype.scrollIntoView = alVista;
    try {
      const m = montar();
      fireEvent.keyDown(m.lienzo, { key: "k", ctrlKey: true });
      expect(alVista).not.toHaveBeenCalled();
      for (let i = 0; i < 20; i++) fireEvent.keyDown(m.entrada(), { key: "ArrowDown" });
      const activa = within(m.dialogo() as HTMLElement)
        .getAllByRole("option")
        .find((o) => o.getAttribute("aria-selected") === "true");
      expect(activa).toBeTruthy();
      expect(alVista).toHaveBeenCalled();
      expect(alVista.mock.contexts.at(-1)).toBe(activa);
      expect(alVista.mock.calls.at(-1)?.[0]).toEqual({ block: "nearest" });
      alVista.mockClear();
      const otra = within(m.dialogo() as HTMLElement).getAllByRole("option")[3]!;
      fireEvent.mouseEnter(otra);
      expect(otra.getAttribute("aria-selected")).toBe("true");
      expect(alVista).not.toHaveBeenCalled();
      fireEvent.keyDown(m.entrada(), { key: "End" });
      expect(alVista.mock.contexts.at(-1)).toBe(within(m.dialogo() as HTMLElement).getAllByRole("option").at(-1));
    } finally {
      Element.prototype.scrollIntoView = original;
    }
  });

  it("un clic en el fondo cierra el buscador sin ejecutar nada", () => {
    const m = montar();
    fireEvent.keyDown(m.lienzo, { key: "k", ctrlKey: true });
    const fondo = document.querySelector("[data-buscador-fondo]") as HTMLElement;
    expect(fondo).toBeTruthy();
    fireEvent.click(fondo);
    expect(m.dialogo()).toBeNull();
    expect(m.onCambio).not.toHaveBeenCalled();
  });

  it("un clic dentro del diálogo (en el campo) no lo cierra", () => {
    const m = montar();
    fireEvent.keyDown(m.lienzo, { key: "k", ctrlKey: true });
    fireEvent.click(m.entrada());
    expect(m.dialogo()).toBeTruthy();
  });

  it("estructura ARIA: la lista solo contiene opciones y aria-expanded sigue a la lista", () => {
    const m = montar();
    fireEvent.keyDown(m.lienzo, { key: "k", ctrlKey: true });
    const lista = within(m.dialogo() as HTMLElement).getByRole("listbox");
    expect(lista.querySelectorAll("li").length).toBe(0);
    for (const hijo of Array.from(lista.children)) expect(hijo.getAttribute("role")).toBe("option");
    expect(m.entrada().getAttribute("aria-expanded")).toBe("true");
    fireEvent.change(m.entrada(), { target: { value: "zzz-nada" } });
    expect(m.entrada().getAttribute("aria-expanded")).toBe("false");
    expect(within(m.dialogo() as HTMLElement).queryByRole("listbox")).toBeNull();
  });

  it("al reabrir empieza de cero (sin la búsqueda anterior)", () => {
    const m = montar();
    fireEvent.keyDown(m.lienzo, { key: "k", ctrlKey: true });
    fireEvent.change(m.entrada(), { target: { value: "alinear" } });
    fireEvent.keyDown(m.entrada(), { key: "Escape" });
    fireEvent.keyDown(m.lienzo, { key: "k", ctrlKey: true });
    expect((m.entrada() as HTMLInputElement).value).toBe("");
    expect(within(m.dialogo() as HTMLElement).getAllByRole("option").length).toBe(COMANDOS.length);
  });
});
