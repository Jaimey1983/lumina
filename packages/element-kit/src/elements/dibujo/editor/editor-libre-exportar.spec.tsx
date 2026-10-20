import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Escena } from "@lumina/drawing";
import { EditorLibre } from "./editor-libre.js";
import { escena, forma, linea } from "./util-pruebas.js";

const originalCrear = URL.createObjectURL;
const originalRevocar = URL.revokeObjectURL;

/** Lo que el navegador simulado recibió. */
interface Descargas {
  blobs: Blob[];
  nombres: string[];
  lienzo: { width: number; height: number };
  /** Si es `false`, la imagen no carga hasta que se llame a `soltar()` (para ver el estado «preparando»). */
  soltar: () => void;
}

let descargas: Descargas;
let imagenFalla = false;
let imagenRetenida = false;
let pendientes: Array<() => void> = [];

beforeEach(() => {
  imagenFalla = false;
  imagenRetenida = false;
  pendientes = [];
  const blobs: Blob[] = [];
  const nombres: string[] = [];
  const lienzo = { width: 0, height: 0, getContext: vi.fn(() => ({ drawImage: vi.fn() })), toBlob: vi.fn((cb: (b: Blob | null) => void) => cb(new Blob(["png"], { type: "image/png" }))) };
  URL.createObjectURL = vi.fn((b: Blob | MediaSource) => {
    blobs.push(b as Blob);
    return `blob:fake-${blobs.length}`;
  });
  URL.revokeObjectURL = vi.fn();
  class ImagenFalsa {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_v: string) {
      const disparar = (): void => (imagenFalla ? this.onerror?.() : this.onload?.());
      if (imagenRetenida) pendientes.push(disparar);
      else queueMicrotask(disparar);
    }
  }
  vi.stubGlobal("Image", ImagenFalsa);
  const crear = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation(((tag: string) => (tag === "canvas" ? (lienzo as unknown as HTMLCanvasElement) : crear(tag))) as typeof document.createElement);
  const anexar = document.body.appendChild.bind(document.body);
  vi.spyOn(document.body, "appendChild").mockImplementation(((nodo: Node) => {
    if (nodo instanceof HTMLAnchorElement) nombres.push(nodo.download);
    return anexar(nodo);
  }) as typeof document.body.appendChild);
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  descargas = {
    blobs,
    nombres,
    lienzo,
    soltar: () => {
      const hay = pendientes;
      pendientes = [];
      hay.forEach((f) => f());
    },
  };
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  URL.createObjectURL = originalCrear;
  URL.revokeObjectURL = originalRevocar;
});

const leer = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(String(lector.result));
    lector.onerror = () => reject(lector.error);
    lector.readAsText(blob);
  });

function montar(e: Escena, titulo = "Prueba") {
  const onCambio = vi.fn<(e: Escena) => void>();
  const onCerrar = vi.fn<(e: Escena) => void>();
  render(<EditorLibre escena={e} titulo={titulo} onCambio={onCambio} onCerrar={onCerrar} />);
  const lienzo = screen.getByRole("application", { name: "Lienzo de dibujo" }) as unknown as SVGSVGElement;
  return { onCambio, onCerrar, lienzo };
}

// Consultas por DOM directo (`getByRole` tarda segundos con tantos botones).
const un = <T extends Element>(l: T[], q: string): T => {
  if (l.length !== 1) throw new Error(`Se esperaba 1 «${q}» y hay ${l.length}`);
  return l[0] as T;
};
const botonExportar = (): HTMLElement => un([...document.querySelectorAll<HTMLElement>("[data-dibujo-exportar]")], "Exportar");
const panel = (): HTMLElement | null => document.querySelector<HTMLElement>("[data-dibujo-exportar-panel]");
const abrir = (): void => void fireEvent.click(botonExportar());
const radio = (nombre: string, valor: string): HTMLInputElement => un([...document.querySelectorAll<HTMLInputElement>(`[data-dibujo-exportar-panel] input[type="radio"]`)].filter((r) => r.name.endsWith(`-${nombre}`) && r.value === valor), `${nombre}=${valor}`);
const fondo = (): HTMLInputElement => un([...document.querySelectorAll<HTMLInputElement>('[data-dibujo-exportar-panel] input[type="checkbox"]')], "fondo");
const descargar = (): HTMLButtonElement => un([...document.querySelectorAll<HTMLButtonElement>("[data-dibujo-exportar-panel] button")].filter((b) => /Descargar|Preparando/.test(b.textContent ?? "")), "Descargar");
const estado = (): string => document.querySelector("[data-dibujo-exportar-estado]")?.textContent ?? "";
const resolucion = (): HTMLSelectElement | null => document.querySelector<HTMLSelectElement>('[data-dibujo-exportar-panel] select[aria-label="Resolución del PNG"]');
const analizar = (svg: string): Document => new DOMParser().parseFromString(svg, "image/svg+xml");
const ids = (doc: Document): string[] => [...doc.querySelectorAll("[data-elemento-id]")].map((n) => n.getAttribute("data-elemento-id") ?? "");

const base = (): Escena =>
  escena(
    forma("A", 100, 100, 100, 60, { texto: "Uno", descripcion: "Primera caja" }),
    forma("B", 300, 100, 100, 60, { texto: "Dos", estilo: { relleno: { tipo: "solido", color: "var(--primary)" } } }),
    forma("O", 100, 300, 100, 60, { oculto: true }),
    linea("L", [[200, 130], [300, 130]], { origen: { elementoId: "A", puerto: 1 }, destino: { elementoId: "B", puerto: 3 } }),
  );

describe("el botón y el panel", () => {
  it("«Exportar» está en la barra y el panel empieza cerrado", () => {
    montar(base());
    expect(botonExportar().getAttribute("aria-expanded")).toBe("false");
    expect(panel()).toBeNull();
  });

  it("al abrirlo ofrece formato, tema y fondo, con SVG, claro y fondo marcados", () => {
    montar(base());
    abrir();
    expect(panel()).not.toBeNull();
    expect(botonExportar().getAttribute("aria-expanded")).toBe("true");
    expect(radio("formato", "svg").checked).toBe(true);
    expect(radio("formato", "png").checked).toBe(false);
    expect(radio("tema", "claro").checked).toBe(true);
    expect(fondo().checked).toBe(true);
    expect(resolucion()).toBeNull(); // la resolución solo existe para PNG
  });

  it("la resolución aparece solo con PNG y recomienda 2×", () => {
    montar(base());
    abrir();
    fireEvent.click(radio("formato", "png"));
    const r = resolucion();
    expect(r).not.toBeNull();
    expect([...(r?.options ?? [])].map((o) => o.value)).toEqual(["1", "2", "3"]);
    expect(r?.value).toBe("2");
    fireEvent.click(radio("formato", "svg"));
    expect(resolucion()).toBeNull();
  });

  it("Escape cierra el panel pero NO el editor; un clic fuera también lo cierra", () => {
    const m = montar(base());
    abrir();
    // desde un botón (no un campo) el Escape llegaría al editor y lo cerraría si el panel no lo retuviera
    fireEvent.keyDown(descargar(), { key: "Escape" });
    expect(panel()).toBeNull();
    expect(m.onCerrar).not.toHaveBeenCalled();
    abrir();
    fireEvent.keyDown(radio("tema", "claro"), { key: "Escape" });
    expect(panel()).toBeNull();
    expect(m.onCerrar).not.toHaveBeenCalled();
    abrir();
    fireEvent.pointerDown(document.body);
    expect(panel()).toBeNull();
    abrir();
    fireEvent.pointerDown(radio("tema", "claro"));
    expect(panel()).not.toBeNull(); // dentro del panel no cierra
  });

  it("lo que se teclea en el panel no llega al editor ni a la ventana", () => {
    const enVentana = vi.fn();
    window.addEventListener("keydown", enVentana);
    const m = montar(base());
    abrir();
    const n = m.onCambio.mock.calls.length;
    fireEvent.keyDown(fondo(), { key: "Delete" });
    fireEvent.keyDown(fondo(), { key: "z", ctrlKey: true });
    window.removeEventListener("keydown", enVentana);
    expect(enVentana).not.toHaveBeenCalled();
    expect(m.onCambio).toHaveBeenCalledTimes(n);
  });
});

describe("descargar SVG", () => {
  it("baja la escena COMPLETA (aunque haya algo elegido) sin lo oculto, con el nombre del título", async () => {
    const m = montar(base(), "Mi flujo");
    fireEvent.pointerDown(m.lienzo, { clientX: 0, clientY: 0, button: 0 }); // el foco está en el lienzo
    abrir();
    await act(async () => void fireEvent.click(descargar()));
    expect(descargas.nombres).toEqual(["mi-flujo.svg"]);
    const svg = await leer(descargas.blobs[0] as Blob);
    expect(ids(analizar(svg))).toEqual(["A", "B", "L"]);
    expect(descargas.blobs[0]?.type).toContain("image/svg+xml");
    expect(estado()).toBe("Descargado: mi-flujo.svg");
  });

  it("claro: sin variables CSS y fondo blanco; oscuro: colores del tema oscuro y fondo oscuro", async () => {
    montar(base());
    abrir();
    await act(async () => void fireEvent.click(descargar()));
    const claro = await leer(descargas.blobs[0] as Blob);
    expect(claro).not.toContain("var(");
    expect(claro).toContain("#2563EB");
    expect(analizar(claro).documentElement.querySelector(":scope > rect")?.getAttribute("fill")).toBe("#FFFFFF");
    fireEvent.click(radio("tema", "oscuro"));
    await act(async () => void fireEvent.click(descargar()));
    const oscuro = await leer(descargas.blobs[1] as Blob);
    expect(oscuro).not.toContain("var(");
    expect(oscuro).toContain("#60A5FA");
    expect(analizar(oscuro).documentElement.querySelector(":scope > rect")?.getAttribute("fill")).toBe("#0F172A");
  });

  it("sin fondo: sin rectángulo de fondo", async () => {
    montar(base());
    abrir();
    fireEvent.click(fondo());
    expect(fondo().checked).toBe(false);
    await act(async () => void fireEvent.click(descargar()));
    const doc = analizar(await leer(descargas.blobs[0] as Blob));
    expect([...doc.documentElement.children].filter((n) => n.tagName === "rect")).toHaveLength(0);
  });

  it("la descripción de cada elemento viaja como <title>, y el SVG es XML válido", async () => {
    montar(base());
    abrir();
    await act(async () => void fireEvent.click(descargar()));
    const doc = analizar(await leer(descargas.blobs[0] as Blob));
    expect(doc.getElementsByTagName("parsererror")).toHaveLength(0);
    expect(doc.querySelector('[data-elemento-id="A"] > title')?.textContent).toBe("Primera caja");
  });

  it("exporta lo último que hay: lo que se oculta o agrega después de abrir el panel", async () => {
    const m = montar(base());
    abrir();
    fireEvent.click(un([...document.querySelectorAll<HTMLElement>("button")].filter((b) => b.getAttribute("aria-label") === "Ocultar Rectángulo «Uno»"), "ocultar"));
    expect(m.onCambio).toHaveBeenCalled();
    abrir();
    if (!panel()) abrir();
    await act(async () => void fireEvent.click(descargar()));
    // el conector sigue (se dibuja hasta donde estaba su forma); la forma oculta, no
    expect(ids(analizar(await leer(descargas.blobs[0] as Blob)))).toEqual(["B", "L"]);
  });

  it("exportar no cambia el dibujo ni el historial", async () => {
    const m = montar(base());
    abrir();
    await act(async () => void fireEvent.click(descargar()));
    expect(m.onCambio).not.toHaveBeenCalled();
  });
});

describe("descargar PNG", () => {
  it("baja un PNG con el tamaño de la escena por la resolución elegida", async () => {
    montar(base(), "Mi flujo");
    abrir();
    fireEvent.click(radio("formato", "png"));
    await act(async () => void fireEvent.click(descargar()));
    expect(descargas.nombres).toEqual(["mi-flujo.png"]);
    expect([descargas.lienzo.width, descargas.lienzo.height]).toEqual([1000 * 2, 600 * 2]); // 2× por defecto
    fireEvent.change(resolucion() as HTMLSelectElement, { target: { value: "3" } });
    await act(async () => void fireEvent.click(descargar()));
    expect([descargas.lienzo.width, descargas.lienzo.height]).toEqual([1000 * 3, 600 * 3]);
    expect(estado()).toBe("Descargado: mi-flujo.png");
  });

  it("el PNG del tema oscuro y sin fondo parte del mismo SVG (sin variables CSS)", async () => {
    montar(base());
    abrir();
    fireEvent.click(radio("formato", "png"));
    fireEvent.click(radio("tema", "oscuro"));
    fireEvent.click(fondo());
    await act(async () => void fireEvent.click(descargar()));
    const svg = descargas.blobs.find((b) => b.type.includes("svg"));
    const texto = await leer(svg as Blob);
    expect(texto).not.toContain("var(");
    expect(texto).toContain("#60A5FA");
    expect([...analizar(texto).documentElement.children].filter((n) => n.tagName === "rect")).toHaveLength(0);
  });

  it("mientras se prepara, el botón dice «Preparando…», no se puede pulsar otra vez y no baja dos veces", async () => {
    montar(base());
    abrir();
    fireEvent.click(radio("formato", "png"));
    imagenRetenida = true;
    await act(async () => void fireEvent.click(descargar()));
    expect(descargar().textContent).toContain("Preparando");
    expect(descargar().disabled).toBe(true);
    fireEvent.click(descargar());
    await act(async () => descargas.soltar());
    expect(descargas.nombres).toHaveLength(1);
    expect(descargar().disabled).toBe(false);
    expect(estado()).toMatch(/^Descargado:/);
  });

  it("si el navegador no puede generar la imagen avisa con el motivo, no baja nada y se puede reintentar", async () => {
    montar(base());
    abrir();
    fireEvent.click(radio("formato", "png"));
    imagenFalla = true;
    await act(async () => void fireEvent.click(descargar()));
    expect(estado()).toMatch(/cargar el SVG/);
    expect(document.querySelector("[data-dibujo-exportar-estado]")?.getAttribute("role")).toBe("status");
    expect(descargas.nombres).toEqual([]);
    expect(descargar().disabled).toBe(false);
    imagenFalla = false;
    await act(async () => void fireEvent.click(descargar()));
    expect(descargas.nombres).toHaveLength(1);
    expect(estado()).toMatch(/^Descargado:/);
  });
});
