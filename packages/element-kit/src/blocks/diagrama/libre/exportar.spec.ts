import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizarEscena, type Escena } from "@lumina/drawing";
import { ESCALA_PNG_POR_DEFECTO, FONDO_DEL_TEMA, descargarEscena, exportarEscena, svgDeEscena } from "./exportar.js";

const forma = (id: string, x: number, y: number, extra: Record<string, unknown> = {}) => ({ id, tipo: "forma", forma: "rectangulo", transformacion: { x, y, ancho: 100, alto: 60, rotacion: 0 }, ...extra });

/** 4 elementos visibles (A, B, L, T) + 1 oculto (O) + un grupo que no se dibuja (G). */
const base = (extra: Record<string, unknown> = {}): Escena =>
  normalizarEscena({
    ancho: 600,
    alto: 300,
    fondo: null,
    elementos: [
      forma("A", 20, 20, { texto: "Hola <b> & 'x'", descripcion: "Caja de entrada" }),
      forma("B", 300, 20, { forma: "elipse", nombre: "Salida", estilo: { relleno: { tipo: "solido", color: "var(--primary)" }, contorno: { color: "var(--foreground)", grosor: 2, patron: "solido" } } }),
      forma("O", 20, 150, { oculto: true }),
      { id: "L", tipo: "linea", puntos: [{ x: 120, y: 50 }, { x: 300, y: 50 }], origen: { elementoId: "A", puerto: 1 }, destino: { elementoId: "B", puerto: 3 } },
      { id: "T", tipo: "texto", texto: "Nota", transformacion: { x: 20, y: 230, ancho: 100, alto: 30, rotacion: 0 }, estiloTexto: { color: "var(--foreground)" } },
      { id: "G", tipo: "grupo", hijos: ["A", "B"] },
    ],
    ...extra,
  });

/** `Blob.text()` no existe en jsdom. */
const leer = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(String(lector.result));
    lector.onerror = () => reject(lector.error);
    lector.readAsText(blob);
  });
const analizar = (svg: string): Document => new DOMParser().parseFromString(svg, "image/svg+xml");
const sinError = (doc: Document): boolean => doc.getElementsByTagName("parsererror").length === 0;
const opciones = { tema: "claro" as const, fondo: true };

describe("SVG de la escena", () => {
  it("es XML válido y tiene tantos elementos como la escena (sin lo oculto ni los grupos)", () => {
    const { svg } = svgDeEscena(base(), opciones);
    const doc = analizar(svg);
    expect(sinError(doc)).toBe(true);
    expect(doc.documentElement.tagName).toBe("svg");
    expect([...doc.querySelectorAll("[data-elemento-id]")].map((n) => n.getAttribute("data-elemento-id"))).toEqual(["A", "B", "L", "T"]);
  });

  it("es un documento autónomo: xmlns, medidas de la escena, imagen con título", () => {
    const { svg, ancho, alto } = svgDeEscena(base(), { ...opciones, titulo: "Mi flujo", descripcion: "Una caja que lleva a una elipse." });
    expect([ancho, alto]).toEqual([600, 300]);
    const raiz = analizar(svg).documentElement;
    expect(raiz.getAttribute("xmlns")).toBe("http://www.w3.org/2000/svg");
    expect(raiz.getAttribute("viewBox")).toBe("0 0 600 300");
    expect(raiz.getAttribute("width")).toBe("600");
    expect(raiz.getAttribute("role")).toBe("img");
    expect(raiz.querySelector(":scope > title")?.textContent).toBe("Mi flujo");
    expect(raiz.querySelector(":scope > desc")?.textContent).toBe("Una caja que lleva a una elipse.");
  });

  it("sin título cae en «Dibujo» y sin descripción no hay <desc>", () => {
    const raiz = analizar(svgDeEscena(base(), opciones).svg).documentElement;
    expect(raiz.querySelector(":scope > title")?.textContent).toBe("Dibujo");
    expect(raiz.querySelector(":scope > desc")).toBeNull();
  });

  it("cada elemento lleva su descripción (o su nombre) como <title>", () => {
    const doc = analizar(svgDeEscena(base(), opciones).svg);
    expect(doc.querySelector('[data-elemento-id="A"] > title')?.textContent).toBe("Caja de entrada");
    expect(doc.querySelector('[data-elemento-id="B"] > title')?.textContent).toBe("Salida");
    expect(doc.querySelector('[data-elemento-id="T"] > title')).toBeNull();
  });

  it("los textos son texto real y se escapan (el archivo sigue siendo XML válido)", () => {
    const { svg } = svgDeEscena(base(), opciones);
    // el texto se reparte en líneas: se comprueban las piezas, no la frase entera
    expect(svg).toContain("&lt;b&gt;");
    expect(svg).toContain("&amp;");
    expect(svg).toContain("&apos;x&apos;");
    expect(svg).not.toContain("<b>");
    const doc = analizar(svg);
    expect(doc.querySelector('[data-elemento-id="A"]')?.textContent).toContain("<b>");
    expect(doc.querySelector('[data-elemento-id="A"]')?.textContent).toContain("'x'");
  });

  it("un título o una descripción con símbolos también se escapan", () => {
    const { svg } = svgDeEscena(base(), { ...opciones, titulo: 'A & B "<x>"', descripcion: "<script>alert(1)</script>" });
    const doc = analizar(svg);
    expect(sinError(doc)).toBe(true);
    expect(doc.querySelector("script")).toBeNull();
    expect(doc.documentElement.querySelector(":scope > title")?.textContent).toBe('A & B "<x>"');
  });

  it("una entrada inválida no lo rompe: sale un SVG válido y vacío", () => {
    for (const basura of [null, undefined, 42, "x", [], { elementos: "no" }]) {
      const { svg } = svgDeEscena(basura, opciones);
      expect(sinError(analizar(svg))).toBe(true);
      expect(analizar(svg).querySelectorAll("[data-elemento-id]")).toHaveLength(0);
    }
  });

  it("es determinista y no modifica la escena que recibe", () => {
    const e = base();
    const antes = JSON.stringify(e);
    expect(svgDeEscena(e, opciones).svg).toBe(svgDeEscena(e, opciones).svg);
    expect(JSON.stringify(e)).toBe(antes);
  });
});

describe("tema", () => {
  it("claro y oscuro no dejan variables CSS (no existen fuera de la app)", () => {
    for (const tema of ["claro", "oscuro"] as const) expect(svgDeEscena(base(), { tema, fondo: true }).svg).not.toContain("var(");
  });

  it("los colores del tema se resuelven distinto en cada uno; los colores propios no cambian", () => {
    const claro = svgDeEscena(base(), { tema: "claro", fondo: true }).svg;
    const oscuro = svgDeEscena(base(), { tema: "oscuro", fondo: true }).svg;
    expect(claro).toContain("#2563EB"); // --primary claro (relleno de B)
    expect(oscuro).toContain("#60A5FA"); // --primary oscuro
    expect(claro).not.toContain("#60A5FA");
    expect(oscuro).not.toContain("#2563EB");
    const propio = (tema: "claro" | "oscuro") => svgDeEscena(normalizarEscena({ elementos: [forma("A", 0, 0, { estilo: { relleno: { tipo: "solido", color: "#AA5500" } } })] }), { tema, fondo: true }).svg;
    expect(propio("claro")).toContain("#AA5500");
    expect(propio("oscuro")).toContain("#AA5500");
  });

  it("el texto con color de tema se lee sobre el fondo de cada tema", () => {
    const texto = (tema: "claro" | "oscuro") => analizar(svgDeEscena(base(), { tema, fondo: true }).svg).querySelector('[data-elemento-id="T"] text')?.getAttribute("fill");
    expect(texto("claro")).toBe("#0F172A");
    expect(texto("oscuro")).toBe("#F1F5F9");
  });
});

describe("fondo", () => {
  const fondoDe = (svg: string): Element | null => [...analizar(svg).documentElement.children].find((n) => n.tagName === "rect") ?? null;

  it("con fondo y sin fondo propio usa el del tema; el de la escena, si lo tiene, manda", () => {
    expect(fondoDe(svgDeEscena(base(), { tema: "claro", fondo: true }).svg)?.getAttribute("fill")).toBe(FONDO_DEL_TEMA.claro);
    expect(fondoDe(svgDeEscena(base(), { tema: "oscuro", fondo: true }).svg)?.getAttribute("fill")).toBe(FONDO_DEL_TEMA.oscuro);
    for (const tema of ["claro", "oscuro"] as const) expect(fondoDe(svgDeEscena(base({ fondo: "#ABCDEF" }), { tema, fondo: true }).svg)?.getAttribute("fill")).toBe("#ABCDEF");
  });

  it("el rectángulo de fondo cubre toda la escena", () => {
    const f = fondoDe(svgDeEscena(base(), opciones).svg);
    expect([f?.getAttribute("width"), f?.getAttribute("height")]).toEqual(["600", "300"]);
  });

  it("sin fondo no hay rectángulo de fondo, tenga o no fondo la escena", () => {
    expect(fondoDe(svgDeEscena(base(), { tema: "claro", fondo: false }).svg)).toBeNull();
    expect(fondoDe(svgDeEscena(base({ fondo: "#ABCDEF" }), { tema: "oscuro", fondo: false }).svg)).toBeNull();
  });
});

describe("archivo", () => {
  const originalCrear = URL.createObjectURL;
  const originalRevocar = URL.revokeObjectURL;
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    URL.createObjectURL = originalCrear;
    URL.revokeObjectURL = originalRevocar;
  });

  /** Navegador simulado: `Image` que carga sola y un canvas falso que registra su tamaño. */
  function simular(opciones: { falla?: boolean } = {}) {
    URL.createObjectURL = vi.fn(() => "blob:fake");
    URL.revokeObjectURL = vi.fn();
    class ImagenFalsa {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_v: string) {
        queueMicrotask(() => (opciones.falla ? this.onerror?.() : this.onload?.()));
      }
    }
    vi.stubGlobal("Image", ImagenFalsa);
    const lienzo = { width: 0, height: 0, getContext: vi.fn(() => ({ drawImage: vi.fn() })), toBlob: vi.fn((cb: (b: Blob | null) => void) => cb(new Blob(["png"], { type: "image/png" }))) };
    const crear = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation(((tag: string) => (tag === "canvas" ? (lienzo as unknown as HTMLCanvasElement) : crear(tag))) as typeof document.createElement);
    return lienzo;
  }

  it("SVG: tipo y nombre salen del título", async () => {
    const { blob, nombre } = await exportarEscena(base(), { ...opciones, formato: "svg", titulo: "Mi flujo: ¡listo!" });
    expect(nombre).toBe("mi-flujo-listo.svg");
    expect(blob.type).toContain("image/svg+xml");
    expect(await leer(blob)).toContain("<svg");
  });

  it("sin título (o sin letras) se llama «dibujo»; un título «Diagrama» se respeta", async () => {
    expect((await exportarEscena(base(), { ...opciones, formato: "svg" })).nombre).toBe("dibujo.svg");
    expect((await exportarEscena(base(), { ...opciones, formato: "svg", titulo: "¡¡¡" })).nombre).toBe("dibujo.svg");
    expect((await exportarEscena(base(), { ...opciones, formato: "svg", titulo: "Diagrama" })).nombre).toBe("diagrama.svg");
  });

  it("PNG: el tamaño es el de la escena por la resolución pedida (2× por defecto; fuera de rango vuelve a 2×)", async () => {
    const lienzo = simular();
    const r = await exportarEscena(base(), { ...opciones, formato: "png", titulo: "Mi flujo" });
    expect(r.nombre).toBe("mi-flujo.png");
    expect(r.blob.type).toBe("image/png");
    expect([lienzo.width, lienzo.height]).toEqual([600 * ESCALA_PNG_POR_DEFECTO, 300 * ESCALA_PNG_POR_DEFECTO]);
    await exportarEscena(base(), { ...opciones, formato: "png", escala: 3 });
    expect([lienzo.width, lienzo.height]).toEqual([1800, 900]);
    await exportarEscena(base(), { ...opciones, formato: "png", escala: 1 });
    expect([lienzo.width, lienzo.height]).toEqual([600, 300]);
    await exportarEscena(base(), { ...opciones, formato: "png", escala: 50 });
    expect([lienzo.width, lienzo.height]).toEqual([1200, 600]);
  });

  it("PNG: si el navegador no puede cargar la imagen, rechaza con un mensaje", async () => {
    simular({ falla: true });
    await expect(exportarEscena(base(), { ...opciones, formato: "png" })).rejects.toThrow(/cargar el SVG/);
  });

  it("descargarEscena pulsa un enlace con el nombre del archivo y lo retira", async () => {
    simular();
    const nombres: string[] = [];
    const original = document.body.appendChild.bind(document.body);
    vi.spyOn(document.body, "appendChild").mockImplementation(((nodo: Node) => {
      if (nodo instanceof HTMLAnchorElement) nombres.push(nodo.download);
      return original(nodo);
    }) as typeof document.body.appendChild);
    const clic = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const nombre = await descargarEscena(base(), { ...opciones, formato: "svg", titulo: "Mi flujo" });
    expect(nombre).toBe("mi-flujo.svg");
    expect(nombres).toEqual(["mi-flujo.svg"]);
    expect(clic).toHaveBeenCalledTimes(1);
    expect(document.querySelector("a[download]")).toBeNull();
  });
});
