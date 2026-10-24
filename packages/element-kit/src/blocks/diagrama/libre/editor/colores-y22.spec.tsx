import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Escena, Forma } from "@lumina/drawing";
import { CLAVE_RECIENTES } from "./colores-recientes.js";
import { EditorLibre } from "./editor-libre.js";
import { PanelPropiedades } from "./propiedades-panel.js";
import { escena, forma, getForma } from "./util-pruebas.js";

const g = globalThis as { EyeDropper?: unknown };

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  localStorage.clear();
  delete g.EyeDropper;
  vi.restoreAllMocks();
});

const solido = (color: string) => ({ relleno: { tipo: "solido", color } });
const base = (): Escena => escena(forma("A", 100, 100, 100, 60, { estilo: solido("#FF0000") }), forma("B", 300, 100, 100, 60, { estilo: solido("#00FF00") }));
const f = (e: Escena, id: string): Forma => getForma(e, id);

function montarPanel(seleccion: string[] = ["A"]) {
  const aplicar = vi.fn<(fn: (e: Escena) => Escena) => void>();
  const vista = vi.fn<(fn: (e: Escena) => Escena) => void>();
  const fin = vi.fn<() => void>();
  const e = base();
  render(<PanelPropiedades escena={e} seleccion={seleccion} onAplicar={aplicar} onVista={vista} onFinVista={fin} onSeleccionar={vi.fn()} />);
  return { aplicar, vista, fin, resultado: (): Escena => (aplicar.mock.calls.at(-1)?.[0] as (x: Escena) => Escena)(e) };
}

const botones = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>("button")];
const porNombre = (n: string | RegExp): HTMLElement => {
  const l = botones().filter((b) => (typeof n === "string" ? b.getAttribute("aria-label") === n : n.test(b.getAttribute("aria-label") ?? "")));
  if (l.length !== 1) throw new Error(`Se esperaba 1 botón «${String(n)}» y hay ${l.length}`);
  return l[0] as HTMLElement;
};
const hay = (n: string | RegExp): boolean => botones().some((b) => (typeof n === "string" ? b.getAttribute("aria-label") === n : n.test(b.getAttribute("aria-label") ?? "")));
const abrirRelleno = (): void => {
  const seccion = botones().find((b) => /^Relleno/.test(b.textContent ?? "") && b.hasAttribute("aria-expanded"));
  if (seccion && seccion.getAttribute("aria-expanded") !== "true") fireEvent.click(seccion);
  fireEvent.click(porNombre(/^Color de relleno: /));
};
const libre = (): HTMLInputElement => {
  const l = [...document.querySelectorAll<HTMLInputElement>('input[type="color"]')];
  if (l.length !== 1) throw new Error(`Se esperaba 1 color libre y hay ${l.length}`);
  return l[0] as HTMLInputElement;
};
const grupoRecientes = (): HTMLElement | null => [...document.querySelectorAll<HTMLElement>('[role="group"]')].find((x) => x.getAttribute("aria-label") === "Recientes") ?? null;
const recientes = (): string[] => [...(grupoRecientes()?.querySelectorAll("button") ?? [])].map((b) => b.getAttribute("aria-label") ?? "");
const guardados = (): unknown => JSON.parse(localStorage.getItem(CLAVE_RECIENTES) ?? "null");
const elegirLibre = (hex: string): void => {
  fireEvent.change(libre(), { target: { value: hex } });
  fireEvent.blur(libre());
};

describe("colores recientes (panel)", () => {
  it("sin recientes el selector es el de siempre: ni grupo ni título «Recientes»", () => {
    montarPanel();
    abrirRelleno();
    expect(grupoRecientes()).toBeNull();
    expect(document.body.textContent).not.toContain("Recientes");
    expect(hay("#2563EB")).toBe(true); // las pastillas de siempre siguen
  });

  it("un color libre confirmado aparece en «Recientes» y se guarda", () => {
    montarPanel();
    abrirRelleno();
    elegirLibre("#123456");
    expect(recientes()).toEqual(["#123456 (reciente)"]);
    expect(guardados()).toEqual(["#123456"]);
  });

  it("arrastrar el selector (varias vistas previas) y confirmar registra UN solo color: el final", () => {
    montarPanel();
    abrirRelleno();
    for (const c of ["#111111", "#222222", "#333333"]) fireEvent.change(libre(), { target: { value: c } });
    expect(grupoRecientes()).toBeNull(); // la vista previa en curso no se recuerda
    fireEvent.blur(libre());
    expect(guardados()).toEqual(["#333333"]);
  });

  it("el color escrito a mano (Enter) se registra, y uno inválido no", () => {
    montarPanel();
    abrirRelleno();
    const txt = [...document.querySelectorAll<HTMLInputElement>('input[type="text"]')].find((i) => i.getAttribute("aria-label") === "Color de relleno: escribir color") as HTMLInputElement;
    fireEvent.change(txt, { target: { value: "rojo" } });
    fireEvent.keyDown(txt, { key: "Enter" });
    expect(guardados()).toBeNull();
    fireEvent.change(txt, { target: { value: "#abcdef" } });
    fireEvent.keyDown(txt, { key: "Enter" });
    expect(guardados()).toEqual(["#ABCDEF"]);
  });

  it("una pastilla de la paleta, un neutro o un token del tema no se registran (DY27)", () => {
    montarPanel();
    abrirRelleno();
    fireEvent.click(porNombre("#2563EB"));
    fireEvent.click(porNombre("#CBD5E1"));
    fireEvent.click(porNombre("Principal (tema)"));
    expect(guardados()).toBeNull();
    expect(grupoRecientes()).toBeNull();
  });

  it("el orden es el último primero y el tope son 8", () => {
    montarPanel();
    abrirRelleno();
    for (let i = 1; i <= 10; i++) elegirLibre(`#0000${i.toString(16).padStart(2, "0")}`);
    const r = recientes();
    expect(r).toHaveLength(8);
    expect(r[0]).toBe("#00000A (reciente)");
    expect(r[7]).toBe("#000003 (reciente)");
  });

  it("elegir uno reciente aplica el color en UNA llamada y lo sube al principio", () => {
    localStorage.setItem(CLAVE_RECIENTES, JSON.stringify(["#111111", "#222222"]));
    const m = montarPanel();
    abrirRelleno();
    expect(recientes()).toEqual(["#111111 (reciente)", "#222222 (reciente)"]);
    fireEvent.click(porNombre("#222222 (reciente)"));
    expect(m.aplicar).toHaveBeenCalledTimes(1);
    expect(f(m.resultado(), "A").estilo.relleno).toEqual({ tipo: "solido", color: "#222222" });
    expect(guardados()).toEqual(["#222222", "#111111"]);
  });

  it("el reciente que coincide con el color actual va marcado (aria-pressed)", () => {
    localStorage.setItem(CLAVE_RECIENTES, JSON.stringify(["#FF0000", "#222222"]));
    montarPanel();
    abrirRelleno();
    expect(porNombre("#FF0000 (reciente)").getAttribute("aria-pressed")).toBe("true");
    expect(porNombre("#222222 (reciente)").getAttribute("aria-pressed")).toBe("false");
  });

  it("persiste: al desmontar y volver a abrir el selector, siguen ahí; la lista es la misma para todos los cuadros de color", () => {
    montarPanel();
    abrirRelleno();
    elegirLibre("#123456");
    cleanup();
    montarPanel();
    abrirRelleno();
    expect(recientes()).toEqual(["#123456 (reciente)"]);
  });

  it("al cerrarse el selector con la vista previa a medias, ese color se confirma y se recuerda", () => {
    montarPanel();
    abrirRelleno();
    fireEvent.change(libre(), { target: { value: "#445566" } });
    cleanup(); // se desmonta el selector sin haber salido del campo
    expect(guardados()).toEqual(["#445566"]);
  });

  it("lo guardado se valida: lo roto o ajeno se descarta y el selector abre", () => {
    localStorage.setItem(CLAVE_RECIENTES, JSON.stringify(["#111111", "javascript:1", 7, "var(--primary)"]));
    montarPanel();
    abrirRelleno();
    expect(recientes()).toEqual(["#111111 (reciente)"]);
  });

  it("sin localStorage (que lanza) el selector abre y funciona igual", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    const m = montarPanel();
    abrirRelleno();
    elegirLibre("#123456");
    expect(m.fin).toHaveBeenCalled();
    fireEvent.click(porNombre("#CBD5E1"));
    expect(f(m.resultado(), "A").estilo.relleno).toEqual({ tipo: "solido", color: "#CBD5E1" });
  });
});

describe("cuentagotas (panel)", () => {
  const conCuentagotas = (open: () => Promise<{ sRGBHex: string }>): void => {
    g.EyeDropper = class {
      open = open;
    };
  };

  it("sin la API no hay botón", () => {
    montarPanel();
    abrirRelleno();
    expect(hay(/cuentagotas/)).toBe(false);
  });

  it("con la API hay botón, con nombre; al elegir aplica el color en UNA llamada, lo recuerda y lo anuncia", async () => {
    conCuentagotas(() => Promise.resolve({ sRGBHex: "#3a7bd5" }));
    const m = montarPanel();
    abrirRelleno();
    await act(async () => {
      fireEvent.click(porNombre("Color de relleno: cuentagotas"));
    });
    expect(m.aplicar).toHaveBeenCalledTimes(1);
    expect(f(m.resultado(), "A").estilo.relleno).toEqual({ tipo: "solido", color: "#3A7BD5" });
    expect(guardados()).toEqual(["#3A7BD5"]);
    expect(document.querySelector('[role="status"]')?.textContent).toBe("Color tomado: #3A7BD5.");
    expect(document.activeElement).toBe(porNombre("Color de relleno: cuentagotas"));
  });

  it("cancelar no cambia nada: ni escena, ni recientes", async () => {
    conCuentagotas(() => Promise.reject(new DOMException("cancelado", "AbortError")));
    const m = montarPanel();
    abrirRelleno();
    await act(async () => {
      fireEvent.click(porNombre("Color de relleno: cuentagotas"));
    });
    expect(m.aplicar).not.toHaveBeenCalled();
    expect(guardados()).toBeNull();
    expect(document.querySelector('[role="status"]')?.textContent).toBe("");
  });

  it("un error del navegador no rompe el selector", async () => {
    conCuentagotas(() => Promise.reject(new Error("fallo")));
    const m = montarPanel();
    abrirRelleno();
    await act(async () => {
      fireEvent.click(porNombre("Color de relleno: cuentagotas"));
    });
    expect(m.aplicar).not.toHaveBeenCalled();
    expect(hay("Color de relleno: cuentagotas")).toBe(true);
  });
});

// ─── La mini barra (selector emergente) ───────────────────────────────────────

function montarEditor() {
  const onCambio = vi.fn<(e: Escena) => void>();
  render(<EditorLibre escena={base()} titulo="Prueba" onCambio={onCambio} onCerrar={vi.fn()} />);
  const lienzo = screen.getByRole("application", { name: "Lienzo de dibujo" }) as unknown as SVGSVGElement;
  vi.spyOn(lienzo, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, right: 1000, bottom: 600, width: 1000, height: 600, x: 0, y: 0, toJSON: () => ({}) });
  const g0 = document.querySelector("[data-dibujo-pagina]")?.parentElement?.getAttribute("transform") ?? "";
  const m = /translate\(([-\d.e]+) ([-\d.e]+)\) scale\(([-\d.e]+)\)/.exec(g0);
  const [x, y, z] = [Number(m?.[1]), Number(m?.[2]), Number(m?.[3])];
  const p = { clientX: x + 150 * z, clientY: y + 130 * z };
  fireEvent(lienzo, new MouseEvent("pointerdown", { bubbles: true, cancelable: true, button: 0, ...p }));
  fireEvent(lienzo, new MouseEvent("pointerup", { bubbles: true, cancelable: true, button: 0, ...p }));
  return { onCambio };
}
const enBarra = (n: string): HTMLElement => {
  const el = document.querySelector<HTMLElement>(`[data-mini-barra] [aria-label="${n}"]`);
  if (!el) throw new Error(`No hay «${n}» en la barra`);
  return el;
};
const emergente = async (): Promise<HTMLElement> =>
  waitFor(() => {
    const el = document.querySelector<HTMLElement>('[data-slot="popover-content"]');
    if (!el) throw new Error("el selector no se abrió");
    return el;
  });

describe("colores recientes y cuentagotas (mini barra)", () => {
  it("un color libre confirmado se ve en «Recientes» al volver a abrir; Escape con otra vista previa NO registra", { timeout: 150000 }, async () => {
    montarEditor();
    fireEvent.click(enBarra("Color de relleno (barra): #FF0000"));
    let pop = await emergente();
    const l = pop.querySelector<HTMLInputElement>('input[type="color"]') as HTMLInputElement;
    fireEvent.change(l, { target: { value: "#123456" } });
    fireEvent.blur(l);
    fireEvent.keyDown(pop, { key: "Escape" });
    await waitFor(() => expect(document.querySelector('[data-slot="popover-content"]')).toBeNull());
    expect(guardados()).toEqual(["#123456"]);

    fireEvent.click(enBarra("Color de relleno (barra): #123456"));
    pop = await emergente();
    expect(pop.querySelector('button[aria-label="#123456 (reciente)"]')).toBeTruthy();
    const l2 = pop.querySelector<HTMLInputElement>('input[type="color"]') as HTMLInputElement;
    fireEvent.change(l2, { target: { value: "#ABCDEF" } });
    fireEvent.keyDown(pop, { key: "Escape" });
    await waitFor(() => expect(document.querySelector('[data-slot="popover-content"]')).toBeNull());
    expect(guardados()).toEqual(["#123456"]); // el cancelado no se recuerda
  });

  it("el cuentagotas pendiente no deja que un clic fuera cierre el selector; al elegir aplica y cierra", { timeout: 150000 }, async () => {
    let resolver!: (v: { sRGBHex: string }) => void;
    g.EyeDropper = class {
      open = () => new Promise<{ sRGBHex: string }>((r) => (resolver = r));
    };
    const m = montarEditor();
    fireEvent.click(enBarra("Color de relleno (barra): #FF0000"));
    const pop = await emergente();
    fireEvent.click(pop.querySelector('button[aria-label="Color de relleno: cuentagotas"]') as HTMLElement);
    // mientras el cuentagotas está abierto, la pérdida de foco o un clic fuera no cierran el selector
    fireEvent.pointerDown(document.body);
    fireEvent.keyDown(pop, { key: "Escape" });
    expect(document.querySelector('[data-slot="popover-content"]')).toBeTruthy();
    await act(async () => resolver({ sRGBHex: "#3a7bd5" }));
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    expect(getForma(m.onCambio.mock.calls[0]?.[0] as Escena, "A").estilo.relleno).toEqual({ tipo: "solido", color: "#3A7BD5" });
    expect(guardados()).toEqual(["#3A7BD5"]);
    await waitFor(() => expect(document.querySelector('[data-slot="popover-content"]')).toBeNull());
  });
});
