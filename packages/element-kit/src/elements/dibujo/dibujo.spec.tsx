import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WIDGET_TIPOS, esWidgetSoloRegistry } from "@lumina/types/widget";
import { BLOCK_FALLBACKS } from "@lumina/types/slide";
import { elementRegistry } from "@lumina/element-kit-core";
import { createDefaultDibujoBlock, DibujoSvg, escenaDeEjemplo, normalizeDibujoWidget } from "../../widgets/dibujo/index.js";
import { dibujoDefinition } from "./dibujo-definition.js";
import { normalizarEscena } from "@lumina/drawing";

import "../../index.js";

afterEach(() => cleanup());

describe("registro y tipos", () => {
  it("está registrado una sola vez, con su catálogo", () => {
    // El registro global no está tipado por catálogo: se consulta por nombre.
    const def = (elementRegistry as unknown as { obtener(tipo: string): { tipo: string; catalogo?: unknown } | undefined }).obtener("dibujo");
    expect(def).toBeDefined();
    expect(def?.tipo).toBe("dibujo");
    expect(def?.catalogo).toMatchObject({ nombre: "Dibujo", familia: "widget", grupo: "lienzo" });
    expect(def).toBe(dibujoDefinition as unknown);
  });

  it("es un widget que vive solo en el registro (Regla 3) y tiene su posición por defecto", () => {
    expect(WIDGET_TIPOS).toContain("dibujo");
    expect(esWidgetSoloRegistry("dibujo")).toBe(true);
    expect(BLOCK_FALLBACKS.dibujo).toEqual({ x: 8, y: 12, ancho: 84, alto: 70 });
  });

  it("declara Editor, Viewer y Propiedades", () => {
    expect(typeof dibujoDefinition.Editor).toBe("function");
    expect(typeof dibujoDefinition.Viewer).toBe("function");
    expect(typeof dibujoDefinition.Propiedades).toBe("function");
  });
});

describe("crearPorDefecto", () => {
  it("nace con un diagrama de ejemplo editable y accesible", () => {
    const b = dibujoDefinition.crearPorDefecto();
    expect(b).toMatchObject({ tipo: "dibujo", x: 8, y: 12, ancho: 84, alto: 70, titulo: "Proceso de decisión" });
    expect(b.descripcionAccesible).toContain("Diagrama de flujo");
    const tipos = b.escena.elementos.map((e) => e.tipo);
    expect(tipos.filter((t) => t === "forma")).toHaveLength(5);
    expect(tipos.filter((t) => t === "linea")).toHaveLength(5);
    expect(tipos.filter((t) => t === "texto")).toHaveLength(1);
  });

  it("los ids son únicos y todos los conectores apuntan a formas que existen", () => {
    const { elementos } = escenaDeEjemplo();
    expect(new Set(elementos.map((e) => e.id)).size).toBe(elementos.length);
    const formas = new Set(elementos.filter((e) => e.tipo === "forma").map((e) => e.id));
    for (const e of elementos) {
      if (e.tipo !== "linea") continue;
      expect(e.origen && formas.has(e.origen.elementoId)).toBe(true);
      expect(e.destino && formas.has(e.destino.elementoId)).toBe(true);
    }
  });

  it("la escena de ejemplo ya está normalizada (no cambia al normalizarla)", () => {
    const e = escenaDeEjemplo();
    expect(normalizarEscena(e)).toEqual(e);
  });

  it("respeta el marco donde se suelta", () => {
    const b = createDefaultDibujoBlock({ izquierdaPct: 5, arribaPct: 6, anchoPct: 40, altoPct: 30 });
    expect([b.x, b.y, b.ancho, b.alto]).toEqual([5, 6, 40, 30]);
  });

  it("cada llamada da una escena independiente", () => {
    const a = createDefaultDibujoBlock();
    const b = createDefaultDibujoBlock();
    expect(a.escena).not.toBe(b.escena);
    expect(a.escena).toEqual(b.escena);
  });
});

describe("normalizeDibujoWidget", () => {
  it("un bloque vacío o basura recibe todo por defecto", () => {
    const b = normalizeDibujoWidget({});
    expect(b).toMatchObject({ tipo: "dibujo", x: 8, y: 12, ancho: 84, alto: 70 });
    expect(b.escena.elementos).toEqual([]);
    expect(normalizeDibujoWidget({ x: "a" as unknown as number, ancho: -5, alto: NaN, escena: 7 })).toMatchObject({ x: 8, ancho: 1, alto: 70 });
  });

  it("conserva el id, el zIndex, el título y la descripción", () => {
    const b = normalizeDibujoWidget({ id: "abc", zIndex: 3, titulo: "Mi dibujo", descripcionAccesible: "Descripción" });
    expect(b).toMatchObject({ id: "abc", zIndex: 3, titulo: "Mi dibujo", descripcionAccesible: "Descripción" });
  });

  it("recorta títulos y descripciones largos y omite los vacíos", () => {
    const b = normalizeDibujoWidget({ titulo: "t".repeat(500), descripcionAccesible: "d".repeat(5000) });
    expect(b.titulo).toHaveLength(120);
    expect(b.descripcionAccesible).toHaveLength(500);
    const v = normalizeDibujoWidget({ titulo: "   ", descripcionAccesible: "" });
    expect(v).not.toHaveProperty("titulo");
    expect(v).not.toHaveProperty("descripcionAccesible");
  });

  it("sanea la escena: colores inválidos, ids repetidos y conexiones rotas", () => {
    const b = normalizeDibujoWidget({
      escena: {
        elementos: [
          { tipo: "forma", id: "a", estilo: { relleno: { tipo: "solido", color: "url(javascript:x)" } } },
          { tipo: "forma", id: "a" },
          { tipo: "linea", id: "l", puntos: [{ x: 0, y: 0 }, { x: 1, y: 1 }], origen: { elementoId: "fantasma", puerto: 0 } },
        ],
      },
    });
    const ids = b.escena.elementos.map((e) => e.id);
    expect(new Set(ids).size).toBe(3);
    const a = b.escena.elementos[0];
    expect(a.tipo === "forma" && a.estilo.relleno).toEqual({ tipo: "solido", color: "#FFFFFF" });
    expect(b.escena.elementos[2]).not.toHaveProperty("origen");
  });

  it("es idempotente", () => {
    const una = normalizeDibujoWidget(createDefaultDibujoBlock());
    expect(normalizeDibujoWidget(una)).toEqual(una);
  });
});

describe("Viewer", () => {
  const Viewer = dibujoDefinition.Viewer;

  it("dibuja un SVG accesible con tantos elementos como la escena", () => {
    const estado = createDefaultDibujoBlock();
    const { container } = render(<Viewer estado={estado} config={{}} />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("role")).toBe("img");
    expect(svg?.getAttribute("aria-label")).toBe("Proceso de decisión");
    expect(svg?.getAttribute("viewBox")).toBe("0 0 1000 470");
    expect(svg?.querySelector("title")?.textContent).toBe("Proceso de decisión");
    expect(svg?.querySelector("desc")?.textContent).toContain("Diagrama de flujo");
    expect(container.querySelectorAll("[data-elemento-id]")).toHaveLength(estado.escena.elementos.length);
  });

  it("muestra el texto de las formas y de las etiquetas", () => {
    const { container } = render(<Viewer estado={createDefaultDibujoBlock()} config={{}} />);
    const texto = container.textContent ?? "";
    for (const esperado of ["Proceso de decisión", "Recibir solicitud", "Aprobar", "Pedir más datos", "Fin", "Sí", "No"]) {
      expect(texto).toContain(esperado);
    }
  });

  it("sin título usa «Dibujo» como nombre accesible", () => {
    const estado = normalizeDibujoWidget({ escena: escenaDeEjemplo() });
    const { container } = render(<Viewer estado={estado} config={{}} />);
    expect(container.querySelector("svg")?.getAttribute("aria-label")).toBe("Dibujo");
    expect(container.querySelector("desc")).toBeNull();
  });

  it("el texto de la escena nunca se interpreta como HTML", () => {
    const estado = normalizeDibujoWidget({
      escena: {
        elementos: [
          { tipo: "texto", id: "t", texto: '<img src=x onerror="window.__xss=1"><script>window.__xss=2</script>' },
          { tipo: "forma", id: "f", nombre: '"><svg onload="window.__xss=3">' },
        ],
      },
    });
    const { container } = render(<Viewer estado={estado} config={{}} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelectorAll("svg")).toHaveLength(1);
    expect(container.textContent).toContain("<img src=x");
    expect((window as unknown as { __xss?: number }).__xss).toBeUndefined();
  });

  it("dos dibujos en la misma página no comparten ids de degradados ni sombras", () => {
    const estado = createDefaultDibujoBlock(); // trae una sombra
    const { container } = render(
      <>
        <Viewer estado={estado} config={{}} />
        <Viewer estado={estado} config={{}} />
      </>,
    );
    const ids = [...container.querySelectorAll("[id]")].map((n) => n.id);
    expect(ids.length).toBeGreaterThanOrEqual(2);
    expect(new Set(ids).size).toBe(ids.length);
    // Cada forma con sombra apunta a un filtro que existe en su propio SVG.
    for (const svg of container.querySelectorAll("svg")) {
      const usados = [...svg.querySelectorAll("[filter]")].map((n) => /url\(#(.+)\)/.exec(n.getAttribute("filter") ?? "")?.[1]);
      expect(usados.length).toBeGreaterThan(0);
      for (const id of usados) expect(svg.querySelector(`[id="${id}"]`)).not.toBeNull();
    }
  });

  it("los tokens del tema se aplican como variables CSS y los hex como atributos", () => {
    const escena = normalizarEscena({
      elementos: [{ tipo: "forma", id: "f", estilo: { relleno: { tipo: "solido", color: "var(--primary)" }, contorno: { color: "#112233", grosor: 2 } } }],
    });
    const { container } = render(<DibujoSvg escena={escena} />);
    const path = container.querySelector("path");
    expect(path?.getAttribute("stroke")).toBe("#112233");
    expect(container.innerHTML).toContain("var(--primary)");
  });

  it("acepta la miniatura sin cambiar lo que dibuja", () => {
    const estado = createDefaultDibujoBlock();
    const a = render(<Viewer estado={estado} config={{ isThumbnail: true }} />).container.querySelectorAll("[data-elemento-id]").length;
    cleanup();
    const b = render(<Viewer estado={estado} config={{}} />).container.querySelectorAll("[data-elemento-id]").length;
    expect(a).toBe(b);
  });

  it("una escena vacía no rompe: SVG sin elementos", () => {
    const { container } = render(<Viewer estado={normalizeDibujoWidget({})} config={{}} />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelectorAll("[data-elemento-id]")).toHaveLength(0);
  });
});

describe("Editor", () => {
  const Editor = dibujoDefinition.Editor;

  it("muestra el mismo dibujo y selecciona el bloque al hacer clic", () => {
    const seleccionar = vi.fn();
    const estado = createDefaultDibujoBlock();
    const { container } = render(<Editor estado={estado} config={{ onEnsureBlockSelected: seleccionar }} onChange={() => undefined} />);
    expect(container.querySelectorAll("[data-elemento-id]")).toHaveLength(estado.escena.elementos.length);
    fireEvent.click(container.querySelector("[data-dibujo]") as Element);
    expect(seleccionar).toHaveBeenCalledTimes(1);
  });

  it("funciona sin el callback de selección", () => {
    const { container } = render(<Editor estado={createDefaultDibujoBlock()} config={{}} onChange={() => undefined} />);
    expect(() => fireEvent.click(container.querySelector("[data-dibujo]") as Element)).not.toThrow();
  });
});

describe("Propiedades", () => {
  const Propiedades = dibujoDefinition.Propiedades;
  const montar = (estado = createDefaultDibujoBlock()) => {
    const onChange = vi.fn();
    render(<Propiedades estado={estado} config={{}} onChange={onChange} onConfigChange={() => undefined} />);
    return onChange;
  };

  it("edita el título y la descripción conservando la escena", () => {
    const estado = createDefaultDibujoBlock();
    const onChange = montar(estado);
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Ciclo del agua" } });
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ titulo: "Ciclo del agua", escena: estado.escena }));
    fireEvent.change(screen.getByLabelText("Descripción para lectores de pantalla"), { target: { value: "Una descripción" } });
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ descripcionAccesible: "Una descripción" }));
  });

  it("limita la longitud de los campos", () => {
    montar();
    expect(screen.getByLabelText("Título").getAttribute("maxlength")).toBe("120");
    expect(screen.getByLabelText("Descripción para lectores de pantalla").getAttribute("maxlength")).toBe("500");
  });

  it("resume el contenido y concuerda el número", () => {
    montar();
    expect(document.querySelector("[data-dibujo-resumen]")?.textContent).toBe("11 elementos en el lienzo.");
    cleanup();
    montar(normalizeDibujoWidget({ escena: { elementos: [{ tipo: "forma" }] } }));
    expect(document.querySelector("[data-dibujo-resumen]")?.textContent).toBe("1 elemento en el lienzo.");
    cleanup();
    montar(normalizeDibujoWidget({}));
    expect(document.querySelector("[data-dibujo-resumen]")?.textContent).toBe("El lienzo está vacío.");
  });

  it("«Cargar el ejemplo» repone la escena de ejemplo sin tocar el título", () => {
    const vacio = normalizeDibujoWidget({ titulo: "Mío" });
    const onChange = montar(vacio);
    fireEvent.click(screen.getByRole("button", { name: "Cargar el ejemplo" }));
    const llamado = onChange.mock.calls.at(-1)?.[0];
    expect(llamado.titulo).toBe("Mío");
    expect(llamado.escena).toEqual(escenaDeEjemplo());
  });

  it("avisa con franqueza que la edición llega después", () => {
    montar();
    expect(document.body.textContent).toContain("Esta versión muestra el dibujo");
  });

  it("tolera un estado guardado a medias", () => {
    expect(() => montar({ tipo: "dibujo" } as never)).not.toThrow();
  });
});
