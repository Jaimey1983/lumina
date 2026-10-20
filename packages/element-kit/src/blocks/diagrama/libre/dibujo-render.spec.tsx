import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { normalizarEscena } from "@lumina/drawing";
import { DibujoSvg } from "./dibujo-render.js";

afterEach(() => cleanup());

const caja = (id: string, texto: string, x: number, extra: Record<string, unknown> = {}) => ({
  tipo: "forma",
  id,
  forma: "rectangulo",
  transformacion: { x, y: 40, ancho: 160, alto: 70, rotacion: 0 },
  texto,
  ...extra,
});

const escena = () =>
  normalizarEscena({
    ancho: 1000,
    alto: 470,
    elementos: [
      caja("a", "Recibir solicitud", 20, { estilo: { sombra: { x: 0, y: 4, desenfoque: 8, color: "#00000055" } } }),
      caja("b", "Aprobar", 300),
      {
        tipo: "linea",
        id: "l",
        puntos: [
          { x: 180, y: 75 },
          { x: 300, y: 75 },
        ],
        origen: { elementoId: "a", puerto: 1 },
        destino: { elementoId: "b", puerto: 3 },
        fin: "flecha",
        texto: "Sí",
      },
    ],
  });

describe("DibujoSvg (el dibujo de una escena)", () => {
  it("es un SVG accesible con tantos elementos como la escena", () => {
    const e = escena();
    const { container } = render(<DibujoSvg escena={e} titulo="Proceso de decisión" descripcion="Diagrama de flujo" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("role")).toBe("img");
    expect(svg?.getAttribute("aria-label")).toBe("Proceso de decisión");
    expect(svg?.getAttribute("viewBox")).toBe("0 0 1000 470");
    expect(svg?.querySelector("title")?.textContent).toBe("Proceso de decisión");
    expect(svg?.querySelector("desc")?.textContent).toBe("Diagrama de flujo");
    expect(container.querySelectorAll("[data-elemento-id]")).toHaveLength(e.elementos.length);
  });

  it("muestra el texto de las formas y de las etiquetas", () => {
    const { container } = render(<DibujoSvg escena={escena()} />);
    for (const esperado of ["Recibir solicitud", "Aprobar", "Sí"]) expect(container.textContent).toContain(esperado);
  });

  it("sin título usa «Dibujo» como nombre accesible y sin descripción no pone <desc>", () => {
    const { container } = render(<DibujoSvg escena={escena()} />);
    expect(container.querySelector("svg")?.getAttribute("aria-label")).toBe("Dibujo");
    expect(container.querySelector("desc")).toBeNull();
  });

  it("el texto de la escena nunca se interpreta como HTML", () => {
    const e = normalizarEscena({
      elementos: [
        { tipo: "texto", id: "t", texto: '<img src=x onerror="window.__xss=1"><script>window.__xss=2</script>' },
        { tipo: "forma", id: "f", nombre: '"><svg onload="window.__xss=3">' },
      ],
    });
    const { container } = render(<DibujoSvg escena={e} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelectorAll("svg")).toHaveLength(1);
    expect(container.textContent).toContain("<img src=x");
    expect((window as unknown as { __xss?: number }).__xss).toBeUndefined();
  });

  it("dos dibujos en la misma página no comparten ids de degradados ni sombras", () => {
    const e = escena();
    const { container } = render(
      <>
        <DibujoSvg escena={e} />
        <DibujoSvg escena={e} />
      </>,
    );
    const ids = [...container.querySelectorAll("[id]")].map((n) => n.id);
    expect(ids.length).toBeGreaterThanOrEqual(2);
    expect(new Set(ids).size).toBe(ids.length);
    for (const svg of container.querySelectorAll("svg")) {
      const usados = [...svg.querySelectorAll("[filter]")].map((n) => /url\(#(.+)\)/.exec(n.getAttribute("filter") ?? "")?.[1]);
      expect(usados.length).toBeGreaterThan(0);
      for (const id of usados) expect(svg.querySelector(`[id="${id}"]`)).not.toBeNull();
    }
  });

  it("los tokens del tema se aplican como variables CSS y los hex como atributos", () => {
    const e = normalizarEscena({
      elementos: [{ tipo: "forma", id: "f", estilo: { relleno: { tipo: "solido", color: "var(--primary)" }, contorno: { color: "#112233", grosor: 2 } } }],
    });
    const { container } = render(<DibujoSvg escena={e} />);
    expect(container.querySelector("path")?.getAttribute("stroke")).toBe("#112233");
    expect(container.innerHTML).toContain("var(--primary)");
  });

  it("una escena vacía no rompe: SVG sin elementos", () => {
    const { container } = render(<DibujoSvg escena={normalizarEscena({})} />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelectorAll("[data-elemento-id]")).toHaveLength(0);
  });
});
