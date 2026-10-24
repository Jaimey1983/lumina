import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Escena, Forma, Texto } from "@lumina/drawing";
import { CLAVE_CRECER_AL_ESCRIBIR } from "./preferencias-texto.js";
import { EditorLibre } from "./editor-libre.js";
import { PanelPropiedades } from "./propiedades-panel.js";
import { escena, forma } from "./util-pruebas.js";

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

const CINCO = "Uno\nDos\nTres\nCuatro\nCinco";
const f = (e: Escena, id: string): Forma => e.elementos.find((x) => x.id === id) as Forma;
const alto = (e: Escena, id: string): number => f(e, id).transformacion.alto;

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
  return { onCambio, lienzo, clic, aPantalla, ultima: () => onCambio.mock.calls.at(-1)?.[0] as Escena };
}
type M = ReturnType<typeof montar>;

const botones = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>("button")];
const boton = (n: string): HTMLElement => {
  const l = botones().filter((b) => b.getAttribute("aria-label") === n || (b.textContent ?? "").trim() === n);
  if (l.length !== 1) throw new Error(`Se esperaba 1 botón «${n}» y hay ${l.length}`);
  return l[0] as HTMLElement;
};
const hayBoton = (n: string): boolean => botones().some((b) => b.getAttribute("aria-label") === n);
const anuncio = (): string => document.querySelector("[data-dibujo-anuncio]")?.textContent ?? "";
const deshacer = (m: M): void => void fireEvent.keyDown(m.lienzo, { key: "z", ctrlKey: true });
const abrir = (m: M, x: number, y: number): HTMLTextAreaElement => {
  fireEvent.doubleClick(m.lienzo, m.aPantalla(x, y));
  return screen.getByRole("textbox", { name: "Texto del elemento" }) as HTMLTextAreaElement;
};
const escribir = (caja: HTMLTextAreaElement, valor: string): void => {
  fireEvent.change(caja, { target: { value: valor } });
  fireEvent.keyDown(caja, { key: "Enter" });
};
const botonCinta = (id: string): HTMLElement => document.querySelector(`[data-comando="${id}"]`) as HTMLElement;
const deshabilitado = (el: HTMLElement): boolean => el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true";

const base = (): Escena =>
  escena(
    forma("A", 100, 100, 200, 60, { texto: CINCO }), // no cabe: el render reduce la letra
    forma("B", 100, 300, 200, 200, { texto: "Uno" }), // sobra
    forma("C", 500, 100, 200, 28, { texto: "Uno" }), // justa
    forma("S", 500, 300, 200, 60), // sin texto
  );

// ─── El comando ───────────────────────────────────────────────────────────────

describe("«Ajustar al texto» (comando y botón de la cinta)", () => {
  it("con una forma cuyo texto no cabe crece, en UNA entrada, con su anuncio; Deshacer la devuelve", () => {
    const m = montar(base());
    m.clic(200, 130);
    fireEvent.click(botonCinta("ajustar-al-texto"));
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    expect(alto(m.ultima(), "A")).toBe(108);
    expect(anuncio()).toBe("La forma creció 48 unidades.");
    deshacer(m);
    expect(alto(m.ultima(), "A")).toBe(60);
  });

  it("una forma que sobra se encoge hasta lo justo", () => {
    const m = montar(base());
    m.clic(200, 400);
    fireEvent.click(botonCinta("ajustar-al-texto"));
    expect(alto(m.ultima(), "B")).toBe(28);
    expect(anuncio()).toBe("La forma se encogió 172 unidades.");
  });

  it("con una forma justa, sin texto o nada elegido, el botón está deshabilitado con su motivo", () => {
    const m = montar(base());
    m.clic(600, 114);
    expect(deshabilitado(botonCinta("ajustar-al-texto"))).toBe(true);
    expect(botonCinta("ajustar-al-texto").getAttribute("title")).toContain("Ya cabe");
    fireEvent.click(botonCinta("ajustar-al-texto"));
    expect(m.onCambio).not.toHaveBeenCalled();
    m.clic(600, 330);
    expect(botonCinta("ajustar-al-texto").getAttribute("title")).toContain("Elige una forma o un texto con texto");
  });

  it("una vecina debajo frena la forma y el anuncio lo dice", () => {
    const m = montar(escena(forma("A", 100, 100, 200, 60, { texto: CINCO }), forma("V", 100, 200, 200, 40)));
    m.clic(200, 130);
    fireEvent.click(botonCinta("ajustar-al-texto"));
    expect(alto(m.ultima(), "A")).toBe(92); // la vecina empieza a 100 unidades: 92 con el margen de 8
    expect(anuncio()).toBe("La forma creció 32 unidades; el texto no cabe del todo: hay una forma debajo.");
  });

  it("con varias elegidas el anuncio dice cuántas", () => {
    const m = montar(base());
    m.clic(200, 130);
    for (const tipo of ["pointerdown", "pointerup"]) fireEvent(m.lienzo, new MouseEvent(tipo, { bubbles: true, cancelable: true, button: 0, shiftKey: true, ...m.aPantalla(200, 400) }));
    fireEvent.click(botonCinta("ajustar-al-texto"));
    expect(anuncio()).toBe("2 elementos ajustados al texto.");
    expect([alto(m.ultima(), "A"), alto(m.ultima(), "B")]).toEqual([108, 28]);
  });

  it("se encuentra con Ctrl+K («autoajuste») y se ejecuta", () => {
    const m = montar(base());
    m.clic(200, 130);
    fireEvent.keyDown(m.lienzo, { key: "k", ctrlKey: true });
    const dialogo = screen.getByRole("dialog", { name: /buscar comando/i });
    fireEvent.change(within(dialogo).getByRole("combobox"), { target: { value: "autoajuste" } });
    fireEvent.click(within(dialogo).getByRole("option", { name: /Ajustar al texto/ }));
    expect(alto(m.ultima(), "A")).toBe(108);
  });
});

// ─── El aviso del panel ───────────────────────────────────────────────────────

function montarPanel(e: Escena, seleccion: string[], extra: { onAjustar?: () => void } = {}) {
  const aplicar = vi.fn<(fn: (e: Escena) => Escena) => void>();
  render(<PanelPropiedades escena={e} seleccion={seleccion} onAplicar={aplicar} onVista={vi.fn()} onFinVista={vi.fn()} onSeleccionar={vi.fn()} onAjustarAlTexto={extra.onAjustar} />);
}
const aviso = (): HTMLElement | null => document.querySelector("[data-aviso-texto]");

describe("panel: el aviso del autoajuste", () => {
  it("una forma cuyo texto se reduce dice a cuánto y ofrece ajustar la forma", () => {
    const onAjustar = vi.fn();
    montarPanel(base(), ["A"], { onAjustar });
    expect(aviso()?.getAttribute("data-aviso-texto")).toBe("reduce");
    expect(aviso()?.textContent).toContain("El texto se reduce a 8 pt para caber.");
    fireEvent.click(boton("Ajustar la forma al texto"));
    expect(onAjustar).toHaveBeenCalledTimes(1);
  });

  it("un tamaño con decimales usa coma", () => {
    montarPanel(escena(forma("A", 0, 0, 120, 40, { texto: "uno dos tres cuatro cinco seis siete ocho nueve diez", estiloTexto: { tamano: 20 } })), ["A"]);
    expect(aviso()?.textContent).toContain("El texto se reduce a 10,5 pt para caber.");
  });

  it("un cuadro de texto libre cuyo texto se sale lo dice", () => {
    const e = escena({ id: "T", tipo: "texto", texto: CINCO, transformacion: { x: 0, y: 0, ancho: 200, alto: 40, rotacion: 0 } });
    montarPanel(e, ["T"]);
    expect(aviso()?.getAttribute("data-aviso-texto")).toBe("sale");
    expect(aviso()?.textContent).toContain("El texto no cabe en el cuadro.");
    expect((e.elementos[0] as Texto).transformacion.alto).toBe(40);
  });

  it("si el texto cabe, no hay aviso", () => {
    montarPanel(base(), ["B"]);
    expect(aviso()).toBeNull();
  });

  it("sin texto, con varias elegidas o con un conector, no hay aviso", () => {
    montarPanel(base(), ["S"]);
    expect(aviso()).toBeNull();
    cleanup();
    montarPanel(base(), ["A", "B"]);
    expect(aviso()).toBeNull();
  });

  it("sin el manejador no hay botón, pero el aviso sí", () => {
    montarPanel(base(), ["A"]);
    expect(aviso()).not.toBeNull();
    expect(hayBoton("Ajustar la forma al texto")).toBe(false);
  });

  it("dentro del editor: pulsar el botón del panel ajusta la forma y el aviso desaparece", () => {
    const m = montar(base());
    m.clic(200, 130);
    expect(aviso()).not.toBeNull();
    fireEvent.click(boton("Ajustar la forma al texto"));
    expect(alto(m.ultima(), "A")).toBe(108);
    expect(aviso()).toBeNull();
  });
});

// ─── Crecer al escribir ───────────────────────────────────────────────────────

describe("«Crecer al escribir»: la preferencia", () => {
  it("está apagada por defecto y no escribe nada hasta que se toca", () => {
    const m = montar(base());
    m.clic(200, 130);
    expect(boton("Crecer al escribir").getAttribute("aria-pressed")).toBe("false");
    expect(localStorage.getItem(CLAVE_CRECER_AL_ESCRIBIR)).toBeNull();
  });

  it("el interruptor del panel la enciende, la guarda y lo anuncia; apagarla también", () => {
    const m = montar(base());
    m.clic(200, 130);
    fireEvent.click(boton("Crecer al escribir"));
    expect(boton("Crecer al escribir").getAttribute("aria-pressed")).toBe("true");
    expect(localStorage.getItem(CLAVE_CRECER_AL_ESCRIBIR)).toBe("1");
    expect(anuncio()).toBe("Crecer al escribir activado: la forma crece al confirmar el texto.");
    fireEvent.click(boton("Crecer al escribir"));
    expect(boton("Crecer al escribir").getAttribute("aria-pressed")).toBe("false");
    expect(localStorage.getItem(CLAVE_CRECER_AL_ESCRIBIR)).toBe("0");
    expect(anuncio()).toBe("Crecer al escribir desactivado.");
    expect(m.onCambio).not.toHaveBeenCalled(); // una preferencia no toca el dibujo
  });

  it("persiste: con la clave puesta, el editor arranca con ella encendida", () => {
    localStorage.setItem(CLAVE_CRECER_AL_ESCRIBIR, "1");
    const m = montar(base());
    m.clic(200, 130);
    expect(boton("Crecer al escribir").getAttribute("aria-pressed")).toBe("true");
  });

  it("sin localStorage (que lanza) el editor abre y el interruptor funciona en la sesión", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    const m = montar(base());
    m.clic(200, 130);
    expect(boton("Crecer al escribir").getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(boton("Crecer al escribir"));
    expect(boton("Crecer al escribir").getAttribute("aria-pressed")).toBe("true");
  });

  it("se encuentra con Ctrl+K y se ejecuta (el comando se marca activo)", () => {
    const m = montar(base());
    fireEvent.keyDown(m.lienzo, { key: "k", ctrlKey: true });
    const dialogo = screen.getByRole("dialog", { name: /buscar comando/i });
    fireEvent.change(within(dialogo).getByRole("combobox"), { target: { value: "crecer al escribir" } });
    fireEvent.click(within(dialogo).getByRole("option", { name: /Crecer al escribir/ }));
    expect(localStorage.getItem(CLAVE_CRECER_AL_ESCRIBIR)).toBe("1");
  });
});

describe("«Crecer al escribir»: al confirmar el texto", () => {
  const corta = (): Escena => escena(forma("A", 100, 100, 200, 60, { texto: "Uno" }));

  it("encendida, la forma crece lo justo y texto y tamaño van en UNA entrada; Deshacer devuelve las dos cosas", () => {
    localStorage.setItem(CLAVE_CRECER_AL_ESCRIBIR, "1");
    const m = montar(corta());
    escribir(abrir(m, 200, 130), CINCO);
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    expect(f(m.ultima(), "A").texto).toBe(CINCO);
    expect(alto(m.ultima(), "A")).toBe(108);
    expect(anuncio()).toBe("La forma creció 48 unidades.");
    deshacer(m);
    expect(f(m.ultima(), "A").texto).toBe("Uno");
    expect(alto(m.ultima(), "A")).toBe(60);
  });

  it("apagada, solo cambia el texto (como siempre)", () => {
    const m = montar(corta());
    escribir(abrir(m, 200, 130), CINCO);
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    expect(f(m.ultima(), "A").texto).toBe(CINCO);
    expect(alto(m.ultima(), "A")).toBe(60);
  });

  it("encendida, un texto que ya cabe no cambia la forma", () => {
    localStorage.setItem(CLAVE_CRECER_AL_ESCRIBIR, "1");
    const m = montar(corta());
    escribir(abrir(m, 200, 130), "Dos");
    expect(f(m.ultima(), "A").texto).toBe("Dos");
    expect(alto(m.ultima(), "A")).toBe(60);
  });

  it("encendida, nunca encoge: un texto más corto en una forma grande la deja como está", () => {
    localStorage.setItem(CLAVE_CRECER_AL_ESCRIBIR, "1");
    const m = montar(escena(forma("A", 100, 100, 200, 200, { texto: CINCO })));
    escribir(abrir(m, 200, 200), "Uno");
    expect(alto(m.ultima(), "A")).toBe(200);
  });

  it("Escape no cambia nada, ni el texto ni la forma", () => {
    localStorage.setItem(CLAVE_CRECER_AL_ESCRIBIR, "1");
    const m = montar(corta());
    const caja = abrir(m, 200, 130);
    fireEvent.change(caja, { target: { value: CINCO } });
    fireEvent.keyDown(caja, { key: "Escape" });
    expect(m.onCambio).not.toHaveBeenCalled();
  });

  it("encendida, una vecina debajo la frena y lo dice", () => {
    localStorage.setItem(CLAVE_CRECER_AL_ESCRIBIR, "1");
    const m = montar(escena(forma("A", 100, 100, 200, 60, { texto: "Uno" }), forma("V", 100, 200, 200, 40)));
    escribir(abrir(m, 200, 130), CINCO);
    expect(alto(m.ultima(), "A")).toBe(92);
    expect(anuncio()).toBe("La forma creció 32 unidades; el texto no cabe del todo: hay una forma debajo.");
  });

  it("un cuadro de texto libre también crece al confirmar", () => {
    localStorage.setItem(CLAVE_CRECER_AL_ESCRIBIR, "1");
    const m = montar(escena({ id: "T", tipo: "texto", texto: "Uno", transformacion: { x: 100, y: 100, ancho: 200, alto: 30, rotacion: 0 } }));
    escribir(abrir(m, 150, 110), "Uno\nDos\nTres");
    expect((m.ultima().elementos[0] as Texto).transformacion.alto).toBe(68);
  });

  it("los conectores pegados siguen a la forma que crece", () => {
    localStorage.setItem(CLAVE_CRECER_AL_ESCRIBIR, "1");
    const e = escena(
      forma("A", 100, 100, 200, 60, { texto: "Uno" }),
      forma("B", 100, 400, 200, 60),
      { id: "L", tipo: "linea", puntos: [{ x: 200, y: 160 }, { x: 200, y: 400 }], origen: { elementoId: "A", puerto: 2 }, destino: { elementoId: "B", puerto: 0 } },
    );
    const m = montar(e);
    escribir(abrir(m, 200, 130), CINCO);
    const l = m.ultima().elementos.find((x) => x.id === "L") as unknown as { puntos: Array<{ x: number; y: number }> };
    expect(l.puntos[0]).toEqual({ x: 200, y: 208 }); // el puerto de abajo de A: 100 + 108
    expect(l.puntos[1]).toEqual({ x: 200, y: 400 });
  });
});
