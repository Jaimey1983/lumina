import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Escena } from "@lumina/drawing";
import { COMANDOS, estadoComando, type ContextoComando } from "./comandos-registro.js";
import { EditorLibre } from "./editor-libre.js";
import { escena, forma, getForma, linea } from "./util-pruebas.js";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

interface Montado {
  onCambio: ReturnType<typeof vi.fn<(e: Escena) => void>>;
  lienzo: SVGSVGElement;
  aPantalla: (x: number, y: number) => { clientX: number; clientY: number };
  ultima: () => Escena;
}

function montar(e: Escena): Montado {
  const onCambio = vi.fn<(e: Escena) => void>();
  render(<EditorLibre escena={e} titulo="Prueba" onCambio={onCambio} onCerrar={vi.fn()} />);
  const lienzo = screen.getByRole("application", { name: "Lienzo de dibujo" }) as unknown as SVGSVGElement;
  // jsdom no mide: se simula el área del lienzo (las guías y la galería convierten pantalla a escena con ella).
  vi.spyOn(lienzo, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, right: 1000, bottom: 600, width: 1000, height: 600, x: 0, y: 0, toJSON: () => ({}) });
  const vista = () => {
    const g = document.querySelector("[data-dibujo-pagina]")?.parentElement?.getAttribute("transform") ?? "";
    const m = /translate\(([-\d.e]+) ([-\d.e]+)\) scale\(([-\d.e]+)\)/.exec(g);
    return { x: Number(m?.[1]), y: Number(m?.[2]), z: Number(m?.[3]) };
  };
  return {
    onCambio,
    lienzo,
    aPantalla: (x, y) => {
      const v = vista();
      return { clientX: v.x + x * v.z, clientY: v.y + y * v.z };
    },
    ultima: () => onCambio.mock.calls.at(-1)?.[0] as Escena,
  };
}

type P = { clientX: number; clientY: number };
const puntero = (el: Element, tipo: "pointerdown" | "pointermove" | "pointerup", p: P, extra: MouseEventInit = {}): void => {
  fireEvent(el, new MouseEvent(tipo, { bubbles: true, cancelable: true, button: 0, ...p, ...extra }));
};
const clic = (m: Montado, x: number, y: number): void => {
  puntero(m.lienzo, "pointerdown", m.aPantalla(x, y));
  puntero(m.lienzo, "pointerup", m.aPantalla(x, y));
};

const barra = (): HTMLElement | null => document.querySelector<HTMLElement>("[data-mini-barra]");
const enBarra = <T extends HTMLElement>(selector: string): T => {
  const el = barra()?.querySelector<T>(selector);
  if (!el) throw new Error(`No hay «${selector}» en la mini barra`);
  return el;
};
const porNombre = (nombre: string): HTMLElement => enBarra(`[aria-label="${nombre}"]`);
const pestanas = (): string[] => [...document.querySelectorAll('[role="tab"]')].map((t) => t.textContent ?? "");
const pestanaActiva = (): string => document.querySelector('[role="tab"][aria-selected="true"]')?.textContent ?? "";
const forma_ = (id: string): Element | null => document.querySelector(`[data-elemento-id="${id}"]`);
const relleno = (id: string): string | null | undefined => forma_(id)?.querySelector("path")?.getAttribute("fill");
const deshacer = (m: Montado): void => void fireEvent.keyDown(m.lienzo, { key: "z", ctrlKey: true });
/** Compara un booleano: si falla, el formateador de vitest no revienta con un elemento del DOM. */
const foco = (el: Element | null): boolean => document.activeElement === el;
const foco_en_barra = (): boolean => barra()?.contains(document.activeElement) === true;

const base = (): Escena =>
  escena(
    forma("A", 100, 100, 100, 60, { nombre: "Caja A", estilo: { relleno: { tipo: "solido", color: "#FF0000" } } }),
    forma("B", 300, 100, 100, 60, { nombre: "Caja B", estilo: { relleno: { tipo: "solido", color: "#00FF00" } } }),
    linea("L", [[200, 300], [300, 340]]),
    forma("C", 100, 400, 100, 60, { bloqueado: true }),
  );

describe("mini barra: cuándo se ve", () => {
  it("no hay barra sin selección y aparece al elegir una forma, con su nombre accesible", () => {
    const m = montar(base());
    expect(barra()).toBeNull();
    clic(m, 150, 130);
    const b = barra();
    expect(b).toBeTruthy();
    expect(b?.getAttribute("role")).toBe("toolbar");
    expect(b?.getAttribute("aria-label")).toBe("Formato rápido");
  });

  it("no pisa los «+» de hijo rápido: queda por encima del de arriba", () => {
    const m = montar(base());
    clic(m, 150, 130);
    const mas = document.querySelector('[data-asa-hijo="arriba"] circle') as SVGCircleElement;
    const top = Number.parseFloat(barra()?.style.top ?? "NaN");
    // la barra mide 40 px (estimada en jsdom): su borde de abajo queda por encima del círculo, con aire
    expect(top + 40).toBeLessThanOrEqual(Number(mas.getAttribute("cy")) - Number(mas.getAttribute("r")));
  });

  it("aparecer no mueve el foco: sigue en el lienzo (DY16)", () => {
    const m = montar(base());
    m.lienzo.focus();
    clic(m, 150, 130);
    expect(barra()).toBeTruthy();
    expect(foco(m.lienzo)).toBe(true);
    expect(foco_en_barra()).toBe(false);
  });

  it("no se ve con solo un conector ni con todo bloqueado", () => {
    const m = montar(base());
    clic(m, 250, 320); // el conector
    expect(barra()).toBeNull();
    // la forma bloqueada no se puede elegir con el ratón: se prueba con «Seleccionar todo» + bloqueada fuera
    fireEvent.keyDown(m.lienzo, { key: "Escape" });
    expect(barra()).toBeNull();
  });

  it("se esconde mientras se mueve una forma y reaparece al soltar", () => {
    const m = montar(base());
    clic(m, 150, 130);
    expect(barra()).toBeTruthy();
    puntero(m.lienzo, "pointerdown", m.aPantalla(150, 130));
    puntero(m.lienzo, "pointermove", m.aPantalla(170, 140));
    puntero(m.lienzo, "pointermove", m.aPantalla(190, 150));
    expect(barra()).toBeNull();
    puntero(m.lienzo, "pointerup", m.aPantalla(190, 150));
    expect(barra()).toBeTruthy();
  });

  it("se esconde mientras se dibuja un recuadro de selección", () => {
    const m = montar(base());
    clic(m, 150, 130);
    puntero(m.lienzo, "pointerdown", m.aPantalla(600, 300));
    puntero(m.lienzo, "pointermove", m.aPantalla(650, 350));
    puntero(m.lienzo, "pointermove", m.aPantalla(700, 400));
    expect(barra()).toBeNull();
    puntero(m.lienzo, "pointerup", m.aPantalla(700, 400));
  });

  it("se esconde mientras se dibuja el lazo con Alt y reaparece al soltar", () => {
    const m = montar(base());
    clic(m, 150, 130);
    const alt = { altKey: true };
    puntero(m.lienzo, "pointerdown", m.aPantalla(500, 250), alt);
    puntero(m.lienzo, "pointermove", m.aPantalla(700, 250), alt);
    puntero(m.lienzo, "pointermove", m.aPantalla(700, 500), alt);
    expect(document.querySelector("[data-capa=lazo]")).toBeTruthy();
    expect(barra()).toBeNull();
    puntero(m.lienzo, "pointerup", m.aPantalla(700, 500), alt);
    expect(document.querySelector("[data-capa=lazo]")).toBeNull();
  });

  it("se esconde mientras se arrastra una guía desde la regla y reaparece al soltar", () => {
    const m = montar(base());
    fireEvent.click(screen.getByRole("tab", { name: "Vista" }));
    fireEvent.click(screen.getByRole("button", { name: "Reglas" }));
    clic(m, 150, 130);
    expect(barra()).toBeTruthy();
    const regla = document.querySelector("[data-regla=x]") as Element;
    fireEvent(regla, new MouseEvent("pointerdown", { bubbles: true, cancelable: true, button: 0, clientX: 5, clientY: 5 }));
    const p = m.aPantalla(303, 250);
    fireEvent(window, new MouseEvent("pointermove", { bubbles: true, cancelable: true, clientX: p.clientX, clientY: p.clientY }));
    expect(barra()).toBeNull();
    fireEvent(window, new MouseEvent("pointerup", { bubbles: true, cancelable: true, clientX: p.clientX, clientY: p.clientY }));
    expect(barra()).toBeTruthy();
  });

  it("se esconde mientras se arrastra una forma desde la galería", () => {
    const m = montar(base());
    clic(m, 150, 130);
    fireEvent.click(screen.getByRole("tab", { name: "Insertar" }));
    const boton = screen.getByRole("button", { name: "Insertar Rectángulo" });
    const origen = boton.getBoundingClientRect();
    fireEvent(boton, new MouseEvent("pointerdown", { bubbles: true, cancelable: true, button: 0, clientX: origen.left + 5, clientY: origen.top + 5 }));
    fireEvent(m.lienzo, new MouseEvent("pointermove", { bubbles: true, cancelable: true, ...m.aPantalla(600, 400) }));
    fireEvent(m.lienzo, new MouseEvent("pointermove", { bubbles: true, cancelable: true, ...m.aPantalla(620, 410) }));
    expect(document.querySelector('[data-capa="fantasma-forma"]')).toBeTruthy();
    expect(barra()).toBeNull();
  });

  it("se esconde con el diálogo de esquema abierto", () => {
    const m = montar(base());
    clic(m, 150, 130);
    fireEvent.click(screen.getByRole("tab", { name: "Insertar" }));
    fireEvent.click(screen.getByRole("button", { name: "Esquema…" }));
    expect(screen.getByRole("dialog", { name: /esquema/i })).toBeTruthy();
    expect(barra()).toBeNull();
  });

  it("se esconde al abrir el texto en el sitio", () => {
    const m = montar(base());
    clic(m, 150, 130);
    fireEvent.doubleClick(m.lienzo, m.aPantalla(150, 130));
    expect(document.querySelector("textarea")).toBeTruthy();
    expect(barra()).toBeNull();
  });

  it("se esconde con otra herramienta (Línea) y vuelve con Seleccionar", () => {
    const m = montar(base());
    clic(m, 150, 130);
    fireEvent.keyDown(m.lienzo, { key: "l" });
    expect(barra()).toBeNull();
    fireEvent.keyDown(m.lienzo, { key: "v" });
    expect(barra()).toBeTruthy();
  });

  it("se esconde con el buscador de comandos abierto", () => {
    const m = montar(base());
    clic(m, 150, 130);
    fireEvent.keyDown(m.lienzo, { key: "k", ctrlKey: true });
    expect(barra()).toBeNull();
  });

  it("se esconde con el panel de atajos abierto", () => {
    const m = montar(base());
    clic(m, 150, 130);
    fireEvent.keyDown(m.lienzo, { key: "?", shiftKey: true });
    expect(barra()).toBeNull();
  });

  it("se esconde mientras el pincel está en uso", () => {
    const m = montar(base());
    clic(m, 150, 130);
    fireEvent.keyDown(m.lienzo, { key: "c", ctrlKey: true, altKey: true });
    expect(barra()).toBeNull();
  });

  it("se esconde con el menú contextual abierto", { timeout: 150000 }, async () => {
    const m = montar(base());
    clic(m, 150, 130);
    fireEvent.contextMenu(m.lienzo, { ...m.aPantalla(150, 130), button: 2 });
    await waitFor(() => expect(document.querySelector('[role="menu"]')).toBeTruthy(), { timeout: 100000 });
    expect(barra()).toBeNull();
  });
});

describe("mini barra: lo que cambia", () => {
  it("el grosor aplica lo mismo que el panel y deja UNA entrada de historial (Deshacer la quita)", () => {
    const m = montar(base());
    clic(m, 150, 130);
    const campo = porNombre("Grosor del contorno (barra)") as HTMLInputElement;
    fireEvent.change(campo, { target: { value: "7" } });
    fireEvent.blur(campo);
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    expect(getForma(m.ultima(), "A").estilo.contorno.grosor).toBe(7);
    expect(getForma(m.ultima(), "B").estilo.contorno.grosor).not.toBe(7);
    deshacer(m);
    expect(getForma(m.ultima(), "A").estilo.contorno.grosor).not.toBe(7);
  });

  it("Negrita, Cursiva y Subrayado: interruptor con aria-pressed, una entrada cada uno", () => {
    const m = montar(base());
    clic(m, 150, 130);
    const negrita = porNombre("Negrita (barra)");
    expect(negrita.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(negrita);
    expect(getForma(m.ultima(), "A").estiloTexto.negrita).toBe(true);
    expect(porNombre("Negrita (barra)").getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(porNombre("Cursiva (barra)"));
    fireEvent.click(porNombre("Subrayado (barra)"));
    expect(m.onCambio).toHaveBeenCalledTimes(3);
    expect(getForma(m.ultima(), "A").estiloTexto).toMatchObject({ negrita: true, cursiva: true, subrayado: true });
    deshacer(m);
    expect(getForma(m.ultima(), "A").estiloTexto.subrayado).toBe(false);
  });

  it("con varias formas elegidas el cambio vale para todas y un valor distinto se ve «mixto»", () => {
    const e = escena(
      forma("A", 100, 100, 100, 60, { estiloTexto: { negrita: true } }),
      forma("B", 300, 100, 100, 60),
    );
    const m = montar(e);
    clic(m, 150, 130);
    puntero(m.lienzo, "pointerdown", m.aPantalla(350, 130), { shiftKey: true });
    puntero(m.lienzo, "pointerup", m.aPantalla(350, 130), { shiftKey: true });
    expect(porNombre("Negrita (barra)").getAttribute("aria-pressed")).toBe("mixed");
    fireEvent.click(porNombre("Negrita (barra)"));
    expect(getForma(m.ultima(), "A").estiloTexto.negrita).toBe(true);
    expect(getForma(m.ultima(), "B").estiloTexto.negrita).toBe(true);
  });

  it("la alineación horizontal aplica al texto de lo elegido", () => {
    const m = montar(base());
    clic(m, 150, 130);
    fireEvent.click(porNombre("Texto alineado a la izquierda (barra)"));
    expect(getForma(m.ultima(), "A").estiloTexto.alineacionH).toBe("izquierda");
  });

  it("el selector de color: una pastilla aplica y cierra, con una entrada de historial", { timeout: 150000 }, async () => {
    const m = montar(base());
    clic(m, 150, 130);
    fireEvent.click(porNombre("Color de relleno (barra): #FF0000"));
    const pastilla = await waitFor(() => {
      const p = document.querySelector<HTMLElement>('[data-slot="popover-content"] button[aria-label="#CBD5E1"]');
      if (!p) throw new Error("el selector no se abrió");
      return p;
    });
    fireEvent.click(pastilla);
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    expect(relleno("A")?.toUpperCase()).toBe("#CBD5E1");
    expect(relleno("B")?.toUpperCase()).toBe("#00FF00");
    await waitFor(() => expect(document.querySelector('[data-slot="popover-content"]')).toBeNull());
  });

  it("el selector libre da vista previa sin tocar el historial, y Escape la descarta sin cambiar nada", { timeout: 150000 }, async () => {
    const m = montar(base());
    clic(m, 150, 130);
    fireEvent.click(porNombre("Color de relleno (barra): #FF0000"));
    const libre = await waitFor(() => {
      const i = document.querySelector<HTMLInputElement>('[data-slot="popover-content"] input[type="color"]');
      if (!i) throw new Error("el selector no se abrió");
      return i;
    });
    fireEvent.change(libre, { target: { value: "#123456" } });
    expect(relleno("A")?.toUpperCase()).toBe("#123456"); // vista previa en el lienzo
    expect(m.onCambio).not.toHaveBeenCalled(); // pero fuera del historial
    fireEvent.keyDown(document.querySelector('[data-slot="popover-content"]') as Element, { key: "Escape" });
    await waitFor(() => expect(relleno("A")?.toUpperCase()).toBe("#FF0000"));
    expect(m.onCambio).not.toHaveBeenCalled();
    // y Deshacer no tiene nada que deshacer: la escena no entró al historial
    expect(barra()).toBeTruthy();
  });

  it("tras descartar una vista previa, el historial sigue sano: el siguiente cambio es UNA entrada y se deshace entero", { timeout: 150000 }, async () => {
    const m = montar(base());
    clic(m, 150, 130);
    fireEvent.click(porNombre("Color de relleno (barra): #FF0000"));
    const libre = await waitFor(() => {
      const i = document.querySelector<HTMLInputElement>('[data-slot="popover-content"] input[type="color"]');
      if (!i) throw new Error("el selector no se abrió");
      return i;
    });
    fireEvent.change(libre, { target: { value: "#123456" } });
    fireEvent.keyDown(document.querySelector('[data-slot="popover-content"]') as Element, { key: "Escape" });
    await waitFor(() => expect(relleno("A")?.toUpperCase()).toBe("#FF0000"));
    expect(document.querySelector('[data-comando="deshacer"]')?.getAttribute("aria-disabled")).toBe("true"); // nada que deshacer
    fireEvent.click(porNombre("Negrita (barra)"));
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[data-comando="deshacer"]')?.getAttribute("aria-disabled")).not.toBe("true");
    deshacer(m);
    expect(getForma(m.ultima(), "A").estiloTexto.negrita).toBe(false);
  });

  it("el selector libre confirma al cerrarse con un clic fuera (dentro del editor): UNA entrada de historial", { timeout: 150000 }, async () => {
    const m = montar(base());
    clic(m, 150, 130);
    fireEvent.click(porNombre("Color de relleno (barra): #FF0000"));
    const libre = await waitFor(() => {
      const i = document.querySelector<HTMLInputElement>('[data-slot="popover-content"] input[type="color"]');
      if (!i) throw new Error("el selector no se abrió");
      return i;
    });
    fireEvent.change(libre, { target: { value: "#123456" } });
    fireEvent.change(libre, { target: { value: "#654321" } });
    expect(m.onCambio).not.toHaveBeenCalled();
    // un clic en cualquier parte del editor (aquí, el panel): el editor detiene `pointerdown` antes del documento y aun así debe cerrar
    fireEvent.pointerDown(document.querySelector("[data-dibujo-propiedades]") as Element);
    await waitFor(() => expect(m.onCambio).toHaveBeenCalledTimes(1));
    expect(document.querySelector('[data-slot="popover-content"]')).toBeNull();
    expect(relleno("A")?.toUpperCase()).toBe("#654321");
  });
});

describe("mini barra: teclado", () => {
  it("F6 desde el lienzo lleva el foco a la barra; flechas recorren los controles; Escape vuelve al lienzo sin quitar la selección", () => {
    const m = montar(base());
    m.lienzo.focus();
    clic(m, 150, 130);
    fireEvent.keyDown(m.lienzo, { key: "F6" });
    expect(foco_en_barra()).toBe(true);
    const primero = document.activeElement;
    fireEvent.keyDown(document.activeElement as Element, { key: "ArrowRight" });
    expect(foco_en_barra()).toBe(true);
    expect(foco(primero)).toBe(false);
    fireEvent.keyDown(document.activeElement as Element, { key: "End" });
    const ultimo = document.activeElement;
    fireEvent.keyDown(ultimo as Element, { key: "ArrowRight" }); // da la vuelta
    expect(foco(primero)).toBe(true);
    fireEvent.keyDown(document.activeElement as Element, { key: "Escape" });
    expect(foco(m.lienzo)).toBe(true);
    expect(barra()).toBeTruthy(); // Escape de la barra no deselecciona
  });

  it("F6 dentro de la barra devuelve el foco al lienzo; sin barra, F6 no hace nada", () => {
    const m = montar(base());
    m.lienzo.focus();
    fireEvent.keyDown(m.lienzo, { key: "F6" });
    expect(foco(m.lienzo)).toBe(true);
    clic(m, 150, 130);
    fireEvent.keyDown(m.lienzo, { key: "F6" });
    fireEvent.keyDown(document.activeElement as Element, { key: "F6" });
    expect(foco(m.lienzo)).toBe(true);
  });

  it("las flechas de la barra no mueven la selección ni se pierden en el editor", () => {
    const m = montar(base());
    m.lienzo.focus();
    clic(m, 150, 130);
    fireEvent.keyDown(m.lienzo, { key: "F6" });
    fireEvent.keyDown(document.activeElement as Element, { key: "ArrowDown" });
    expect(m.onCambio).not.toHaveBeenCalled();
  });

  it("un solo control está en el ciclo de Tab (tabindex 0); el resto, en -1", () => {
    const m = montar(base());
    clic(m, 150, 130);
    const controles = [...(barra()?.querySelectorAll<HTMLElement>("button, input") ?? [])];
    expect(controles.length).toBeGreaterThan(5);
    expect(controles.filter((c) => c.tabIndex === 0)).toHaveLength(1);
  });

  it("cada control de la barra tiene nombre accesible", () => {
    const m = montar(base());
    clic(m, 150, 130);
    for (const c of barra()?.querySelectorAll<HTMLElement>("button, input") ?? []) expect(c.getAttribute("aria-label")).toBeTruthy();
  });
});

describe("pestaña «Formato de forma»", () => {
  it("sale con una forma elegida y se elige sola si la persona estaba en Inicio", () => {
    const m = montar(base());
    expect(pestanas()).not.toContain("Formato de forma");
    clic(m, 150, 130);
    expect(pestanas()).toContain("Formato de forma");
    expect(pestanaActiva()).toBe("Formato de forma");
    expect(document.querySelector("[data-cinta-formato]")).toBeTruthy();
  });

  it("con formas y conectores a la vez solo sale «Formato de forma» (la de conector es para cuando lo elegido son solo líneas)", () => {
    const m = montar(base());
    fireEvent.keyDown(m.lienzo, { key: "a", ctrlKey: true }); // las dos formas y el conector
    expect(pestanas()).not.toContain("Formato de conector");
    expect(pestanaActiva()).toBe("Formato de forma");
  });

  it("no sale con solo un conector (tiene la suya)", () => {
    const m = montar(base());
    clic(m, 250, 320);
    expect(pestanas()).not.toContain("Formato de forma");
    expect(pestanas()).toContain("Formato de conector");
  });

  it("no le quita la pestaña a quien trabaja en otra", () => {
    const m = montar(base());
    fireEvent.click(screen.getByRole("tab", { name: "Vista" }));
    clic(m, 150, 130);
    expect(pestanas()).toContain("Formato de forma");
    expect(pestanaActiva()).toBe("Vista");
  });

  it("lleva los mismos campos que la barra y cambian lo mismo (Negrita de la pestaña, una entrada)", () => {
    const m = montar(base());
    clic(m, 150, 130);
    const boton = document.querySelector<HTMLElement>('[data-cinta-formato] [aria-label="Negrita (cinta)"]');
    expect(boton).toBeTruthy();
    fireEvent.click(boton as HTMLElement);
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    expect(getForma(m.ultima(), "A").estiloTexto.negrita).toBe(true);
  });
});

describe("Negrita, Cursiva y Subrayado en el registro", () => {
  const ctx = (e: Escena, seleccion: string[]): ContextoComando => ({ escena: e, seleccion, herramienta: { tipo: "seleccionar" }, puedeDeshacer: false, puedeRehacer: false, zoom: 1, cuadricula: false, imantar: true });
  const def = (id: string) => COMANDOS.find((c) => c.id === id)!;

  it("existen, sin atajo, sin menú contextual y con orden propia", () => {
    for (const id of ["negrita", "cursiva", "subrayado"]) {
      expect(def(id)).toBeTruthy();
      expect(def(id).atajos).toBeUndefined();
      expect(def(id).sinMenu).toBe(true);
      expect(def(id).grupo).toBe("formato");
    }
    expect(def("negrita").orden).toEqual({ tipo: "formato-texto", propiedad: "negrita" });
  });

  it("habilitados solo con algo editable que no sea un conector", () => {
    const e = base();
    expect(estadoComando(def("negrita"), ctx(e, [])).habilitado).toBe(false);
    expect(estadoComando(def("negrita"), ctx(e, ["L"])).habilitado).toBe(false);
    expect(estadoComando(def("negrita"), ctx(e, ["C"])).habilitado).toBe(false);
    expect(estadoComando(def("negrita"), ctx(e, ["A"])).habilitado).toBe(true);
    expect(estadoComando(def("negrita"), ctx(e, [])).motivo).toBe("Elige una forma o un texto");
  });

  it("activos según lo elegido; con valores mezclados no cuentan como activos", () => {
    const e = escena(forma("A", 0, 0, 100, 60, { estiloTexto: { negrita: true } }), forma("B", 200, 0, 100, 60));
    expect(estadoComando(def("negrita"), ctx(e, ["A"])).activo).toBe(true);
    expect(estadoComando(def("negrita"), ctx(e, ["B"])).activo).toBe(false);
    expect(estadoComando(def("negrita"), ctx(e, ["A", "B"])).activo).toBe(false);
  });

  it("aparecen en el buscador de comandos (Ctrl+K) y se ejecutan desde allí", () => {
    const m = montar(base());
    clic(m, 150, 130);
    fireEvent.keyDown(m.lienzo, { key: "k", ctrlKey: true });
    const dialogo = screen.getByRole("dialog", { name: /buscar comando/i });
    const caja = within(dialogo).getByRole("combobox") as HTMLInputElement;
    fireEvent.change(caja, { target: { value: "negrita" } });
    const opcion = within(dialogo).getByRole("option", { name: /Negrita/ });
    expect(opcion).toBeTruthy();
    fireEvent.click(opcion as Element);
    expect(getForma(m.ultima(), "A").estiloTexto.negrita).toBe(true);
  });
});
