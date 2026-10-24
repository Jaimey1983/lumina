import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Escena, Forma } from "@lumina/drawing";
import { EditorLibre } from "./editor-libre.js";
import { PanelPropiedades } from "./propiedades-panel.js";
import { escena, forma, linea } from "./util-pruebas.js";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const base = (): Escena =>
  escena(
    forma("A", 100, 100, 160, 100, { texto: "Uno\nDos" }),
    forma("B", 400, 100, 160, 100, { texto: "Uno\nDos", estiloTexto: { vinetas: "puntos" } }),
    forma("N", 100, 300, 160, 100, { texto: "Uno\nDos", estiloTexto: { vinetas: "numeros" } }),
    forma("X", 400, 300, 160, 100, { texto: "Uno", bloqueado: true }),
    linea("L", [[260, 150], [400, 150]], { texto: "rótulo" }),
  );
const f = (e: Escena, id: string): Forma => e.elementos.find((x) => x.id === id) as Forma;

// ─── El panel ─────────────────────────────────────────────────────────────────

function montarPanel(seleccion: string[]) {
  const aplicar = vi.fn<(fn: (e: Escena) => Escena) => void>();
  const e = base();
  render(<PanelPropiedades escena={e} seleccion={seleccion} onAplicar={aplicar} onVista={vi.fn()} onFinVista={vi.fn()} onSeleccionar={vi.fn()} />);
  return { aplicar, resultado: (): Escena => (aplicar.mock.calls.at(-1)?.[0] as (x: Escena) => Escena)(e) };
}
const grupo = (n: string): HTMLElement | null => [...document.querySelectorAll<HTMLElement>('[role="group"]')].find((g) => g.getAttribute("aria-label") === n) ?? null;
const opcion = (n: string): HTMLElement => {
  const l = [...(grupo("Lista del texto")?.querySelectorAll<HTMLElement>("button") ?? [])].filter((b) => b.getAttribute("aria-label") === n);
  if (l.length !== 1) throw new Error(`Se esperaba 1 «${n}» y hay ${l.length}`);
  return l[0] as HTMLElement;
};
const marcada = (n: string): boolean => opcion(n).getAttribute("aria-pressed") === "true";

describe("panel: fila «Lista» de «Tipografía»", () => {
  it("ofrece tres opciones y marca la de lo elegido", () => {
    montarPanel(["A"]);
    expect(["Sin lista", "Viñetas", "Numerada"].map((n) => marcada(n))).toEqual([true, false, false]);
    cleanup();
    montarPanel(["B"]);
    expect(["Sin lista", "Viñetas", "Numerada"].map((n) => marcada(n))).toEqual([false, true, false]);
    cleanup();
    montarPanel(["N"]);
    expect(["Sin lista", "Viñetas", "Numerada"].map((n) => marcada(n))).toEqual([false, false, true]);
  });

  it("con listas distintas ninguna queda marcada («mixto»)", () => {
    montarPanel(["B", "N"]);
    expect(["Sin lista", "Viñetas", "Numerada"].some((n) => marcada(n))).toBe(false);
  });

  it("elegir una la pone en lo elegido, en UNA llamada", () => {
    const m = montarPanel(["A", "B"]);
    fireEvent.click(opcion("Numerada"));
    expect(m.aplicar).toHaveBeenCalledTimes(1);
    const e = m.resultado();
    expect(f(e, "A").estiloTexto.vinetas).toBe("numeros");
    expect(f(e, "B").estiloTexto.vinetas).toBe("numeros");
  });

  it("«Sin lista» la quita sin dejar la clave", () => {
    const m = montarPanel(["B", "N"]);
    fireEvent.click(opcion("Sin lista"));
    const e = m.resultado();
    expect(Object.keys(f(e, "B").estiloTexto)).not.toContain("vinetas");
    expect(Object.keys(f(e, "N").estiloTexto)).not.toContain("vinetas");
  });

  it("un conector solo o lo bloqueado no ofrecen lista", () => {
    montarPanel(["L"]);
    expect(grupo("Lista del texto")).toBeNull();
    cleanup();
    montarPanel(["X"]);
    expect(grupo("Lista del texto")).toBeNull();
  });

  it("con una forma y un conector elegidos, la fila sale y el conector no cambia", () => {
    const m = montarPanel(["A", "L"]);
    fireEvent.click(opcion("Viñetas"));
    const e = m.resultado();
    expect(f(e, "A").estiloTexto.vinetas).toBe("puntos");
    expect(Object.keys((e.elementos.find((x) => x.id === "L") as Forma).estiloTexto)).not.toContain("vinetas");
  });
});

// ─── El editor entero ─────────────────────────────────────────────────────────

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
const boton = (n: string): HTMLElement => {
  const l = [...document.querySelectorAll<HTMLElement>("button")].filter((b) => b.getAttribute("aria-label") === n);
  if (l.length !== 1) throw new Error(`Se esperaba 1 botón «${n}» y hay ${l.length}`);
  return l[0] as HTMLElement;
};
const hayBoton = (n: string): boolean => [...document.querySelectorAll("button")].some((b) => b.getAttribute("aria-label") === n);
const anuncio = (): string => document.querySelector("[data-dibujo-anuncio]")?.textContent ?? "";
const deshacer = (m: M): void => void fireEvent.keyDown(m.lienzo, { key: "z", ctrlKey: true });

describe("la cinta («Formato de forma» › Texto)", () => {
  it("trae los dos botones de lista con una forma elegida, y ninguno con un conector solo", () => {
    const m = montar(base());
    m.clic(180, 150);
    expect(hayBoton("Lista con viñetas (cinta)")).toBe(true);
    expect(hayBoton("Lista numerada (cinta)")).toBe(true);
    m.clic(330, 150); // el conector
    expect(hayBoton("Lista con viñetas (cinta)")).toBe(false);
  });

  it("pulsar el botón pone la lista en UNA entrada, el botón se marca y Deshacer la quita", () => {
    const m = montar(base());
    m.clic(180, 150);
    expect(boton("Lista con viñetas (cinta)").getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(boton("Lista con viñetas (cinta)"));
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    expect(f(m.ultima(), "A").estiloTexto.vinetas).toBe("puntos");
    expect(boton("Lista con viñetas (cinta)").getAttribute("aria-pressed")).toBe("true");
    expect(anuncio()).toBe("Lista con viñetas aplicada a 1 elemento.");
    deshacer(m);
    expect(Object.keys(f(m.ultima(), "A").estiloTexto)).not.toContain("vinetas");
  });

  it("pulsar el botón activo la quita, con su anuncio", () => {
    const m = montar(base());
    m.clic(480, 150); // B ya tiene viñetas
    expect(boton("Lista con viñetas (cinta)").getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(boton("Lista con viñetas (cinta)"));
    expect(Object.keys(f(m.ultima(), "B").estiloTexto)).not.toContain("vinetas");
    expect(anuncio()).toBe("Lista quitada.");
  });

  it("la numerada sobre una con viñetas la cambia", () => {
    const m = montar(base());
    m.clic(480, 150);
    fireEvent.click(boton("Lista numerada (cinta)"));
    expect(f(m.ultima(), "B").estiloTexto.vinetas).toBe("numeros");
    expect(anuncio()).toBe("Lista numerada aplicada a 1 elemento.");
  });

  it("con dos elegidos el anuncio dice cuántos", () => {
    const m = montar(base());
    m.clic(180, 150);
    fireEvent.click(m.lienzo, { ...m.aPantalla(480, 150), shiftKey: true });
    for (const tipo of ["pointerdown", "pointerup"]) fireEvent(m.lienzo, new MouseEvent(tipo, { bubbles: true, cancelable: true, button: 0, shiftKey: true, ...m.aPantalla(480, 150) }));
    fireEvent.click(boton("Lista con viñetas (cinta)"));
    expect(anuncio()).toBe("Lista con viñetas aplicada a 2 elementos.");
    expect(f(m.ultima(), "A").estiloTexto.vinetas).toBe("puntos");
    expect(f(m.ultima(), "B").estiloTexto.vinetas).toBe("puntos");
  });
});

describe("por Ctrl+K", () => {
  const buscar = (m: M, consulta: string, opcionNombre: RegExp): void => {
    fireEvent.keyDown(m.lienzo, { key: "k", ctrlKey: true });
    const dialogo = screen.getByRole("dialog", { name: /buscar comando/i });
    fireEvent.change(within(dialogo).getByRole("combobox"), { target: { value: consulta } });
    fireEvent.click(within(dialogo).getByRole("option", { name: opcionNombre }));
  };

  it("«viñetas» y «numerada» encuentran su comando y lo ejecutan", () => {
    const m = montar(base());
    m.clic(180, 150);
    buscar(m, "viñetas", /Lista con viñetas/);
    expect(f(m.ultima(), "A").estiloTexto.vinetas).toBe("puntos");
    buscar(m, "numerada", /Lista numerada/);
    expect(f(m.ultima(), "A").estiloTexto.vinetas).toBe("numeros");
  });

  it("«lista» también los encuentra por sinónimo", () => {
    const m = montar(base());
    fireEvent.keyDown(m.lienzo, { key: "k", ctrlKey: true });
    const dialogo = screen.getByRole("dialog", { name: /buscar comando/i });
    fireEvent.change(within(dialogo).getByRole("combobox"), { target: { value: "lista" } });
    const nombres = within(dialogo).getAllByRole("option").map((o) => o.textContent ?? "");
    expect(nombres.some((n) => /Lista con viñetas/.test(n))).toBe(true);
    expect(nombres.some((n) => /Lista numerada/.test(n))).toBe(true);
  });
});

describe("el cuadro de edición en sitio con lista", () => {
  const abrir = (m: M, x: number, y: number): HTMLTextAreaElement => {
    fireEvent.doubleClick(m.lienzo, m.aPantalla(x, y));
    return screen.getByRole("textbox", { name: "Texto del elemento" }) as HTMLTextAreaElement;
  };

  it("se alinea a la izquierda y deja la sangría estimada (con el zoom) a la izquierda del texto", () => {
    const m = montar(base());
    const caja = abrir(m, 480, 150); // B: viñetas, letra 16 → sangría (1 + 1) × 16 × 0,5 = 16
    expect(caja.style.textAlign).toBe("left");
    const zoom = Number(/scale\(([-\d.e]+)\)/.exec(document.querySelector("[data-dibujo-pagina]")?.parentElement?.getAttribute("transform") ?? "")?.[1]);
    expect(parseFloat(caja.style.paddingLeft)).toBeCloseTo(16 * zoom, 5);
  });

  it("con numeración la sangría es la de la marca «1.»", () => {
    const m = montar(base());
    const caja = abrir(m, 180, 350); // N: numeros → (2 + 1) × 16 × 0,5 = 24
    const zoom = Number(/scale\(([-\d.e]+)\)/.exec(document.querySelector("[data-dibujo-pagina]")?.parentElement?.getAttribute("transform") ?? "")?.[1]);
    expect(parseFloat(caja.style.paddingLeft)).toBeCloseTo(24 * zoom, 5);
  });

  it("sin lista, el cuadro es el de siempre: centrado y sin sangría", () => {
    const m = montar(base());
    const caja = abrir(m, 180, 150); // A
    expect(caja.style.textAlign).toBe("center");
    expect(caja.style.paddingLeft).toBe("");
  });

  it("el texto que se guarda no lleva marcas", () => {
    const m = montar(base());
    const caja = abrir(m, 480, 150);
    fireEvent.change(caja, { target: { value: "Primero\nSegundo" } });
    fireEvent.keyDown(caja, { key: "Enter" });
    expect(f(m.ultima(), "B").texto).toBe("Primero\nSegundo");
    expect(f(m.ultima(), "B").estiloTexto.vinetas).toBe("puntos");
  });
});

describe("lo de siempre sigue igual", () => {
  it("el render del lienzo con lista dibuja las marcas como texto aparte", () => {
    montar(base());
    const marcas = [...document.querySelectorAll('[data-elemento-id="B"] text[aria-hidden="true"]')].map((t) => t.textContent);
    expect(marcas).toEqual(["•", "•"]);
    const numeradas = [...document.querySelectorAll('[data-elemento-id="N"] text[aria-hidden="true"]')].map((t) => t.textContent);
    expect(numeradas).toEqual(["1.", "2."]);
    expect(document.querySelectorAll('[data-elemento-id="A"] text[aria-hidden="true"]')).toHaveLength(0);
  });
});
