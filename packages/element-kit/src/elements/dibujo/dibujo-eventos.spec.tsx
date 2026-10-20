import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizarEscena, type Escena } from "@lumina/drawing";
import { elementosAccesibles, ListaAccesible } from "./accesibilidad.js";
import { dibujoDefinition } from "./dibujo-definition.js";
import type { DibujoConfig, DibujoEstado } from "./dibujo-types.js";

afterEach(() => cleanup());

const forma = (id: string, x: number, y: number, extra: Record<string, unknown> = {}) => ({ id, tipo: "forma", forma: "rectangulo", transformacion: { x, y, ancho: 100, alto: 60, rotacion: 0 }, ...extra });

const escena = (): Escena =>
  normalizarEscena({
    ancho: 600,
    alto: 300,
    elementos: [
      forma("C", 300, 200, { texto: "Abajo a la derecha" }),
      forma("B", 300, 20, { texto: "Arriba a la derecha", descripcion: "Caja de salida" }),
      forma("A", 20, 20, { nombre: "Entrada" }),
      forma("O", 20, 100, { oculto: true }),
      { id: "T", tipo: "texto", texto: "Una nota", transformacion: { x: 20, y: 200, ancho: 100, alto: 30, rotacion: 0 } },
      { id: "G", tipo: "grupo", hijos: ["A", "B"] },
    ],
  });

const estado = (): DibujoEstado => ({ ...dibujoDefinition.crearPorDefecto(), titulo: "Mi dibujo", escena: escena() });
const Viewer = dibujoDefinition.Viewer;
const montar = (config: DibujoConfig = {}) => render(<Viewer estado={estado()} config={config} />);
const elemento = (id: string): Element => {
  const n = document.querySelector(`[data-elemento-id="${id}"]`);
  if (!n) throw new Error(`No se dibuja ${id}`);
  return n;
};

describe("eventos que declara y emite", () => {
  it("la definición declara clic y parte_clic", () => {
    expect(dibujoDefinition.eventos).toEqual(["clic", "parte_clic"]);
  });

  it("un clic sobre un elemento emite `clic` y `parte_clic` con el id de ese elemento, en ese orden", () => {
    const emitir = vi.fn();
    montar({ emitir });
    fireEvent.click(elemento("B").querySelector("path") as Element);
    expect(emitir.mock.calls).toEqual([["clic"], ["parte_clic", { parte: "B" }]]);
  });

  it("cada elemento lleva su propio id (también el que está dentro de un grupo y los textos)", () => {
    const emitir = vi.fn();
    montar({ emitir });
    for (const id of ["A", "B", "C", "T"]) {
      emitir.mockClear();
      fireEvent.click(elemento(id).querySelector("path, rect, text") as Element);
      expect(emitir).toHaveBeenLastCalledWith("parte_clic", { parte: id });
    }
  });

  it("un clic en el fondo del dibujo emite solo `clic`", () => {
    const emitir = vi.fn();
    const { container } = montar({ emitir });
    fireEvent.click(container.querySelector("svg") as Element);
    expect(emitir.mock.calls).toEqual([["clic"]]);
  });

  it("sin motor (sin `emitir`) no emite nada, no falla y no ofrece botones ni cursor de clic", () => {
    const { container } = montar({});
    expect(() => fireEvent.click(elemento("A").querySelector("path") as Element)).not.toThrow();
    expect(container.querySelector("[data-dibujo-interactivo]")).toBeNull();
    expect(container.querySelectorAll("[data-dibujo-lista-accesible] button")).toHaveLength(0);
  });

  it("en una miniatura no emite, aunque haya motor, y no pone la lista de lectores", () => {
    const emitir = vi.fn();
    const { container } = montar({ emitir, isThumbnail: true });
    fireEvent.click(elemento("A").querySelector("path") as Element);
    expect(emitir).not.toHaveBeenCalled();
    expect(container.querySelector("[data-dibujo-lista-accesible]")).toBeNull();
  });

  it("con motor, los elementos se ven clicables", () => {
    const { container } = montar({ emitir: vi.fn() });
    expect(container.querySelector("[data-dibujo-interactivo]")?.className).toContain("cursor-pointer");
  });

  it("un elemento oculto no se dibuja, así que no se puede tocar", () => {
    montar({ emitir: vi.fn() });
    expect(document.querySelector('[data-elemento-id="O"]')).toBeNull();
  });
});

describe("lista de elementos para lectores de pantalla", () => {
  it("orden de lectura: de arriba abajo y, a la misma altura, de izquierda a derecha; sin grupos ni ocultos", () => {
    expect(elementosAccesibles(escena()).map((e) => e.id)).toEqual(["A", "B", "T", "C"]);
  });

  it("la descripción que escribió el docente manda; si no, el nombre; si no, una que describe el elemento", () => {
    const e = elementosAccesibles(escena());
    expect(e.find((x) => x.id === "B")).toMatchObject({ etiqueta: "Caja de salida", conDescripcion: true });
    expect(e.find((x) => x.id === "A")).toMatchObject({ etiqueta: "Entrada", conDescripcion: false });
    expect(e.find((x) => x.id === "C")).toMatchObject({ etiqueta: "Rectángulo «Abajo a la derecha»", conDescripcion: false });
    expect(e.find((x) => x.id === "T")?.etiqueta).toBe("Texto «Una nota»");
  });

  it("una forma más alta que su vecina sigue en la misma fila (la fila se decide por el centro, no por el borde de arriba)", () => {
    const e = normalizarEscena({
      elementos: [
        { id: "alta", tipo: "forma", forma: "rombo", nombre: "Alta", transformacion: { x: 300, y: 40, ancho: 200, alto: 120, rotacion: 0 } },
        { id: "baja", tipo: "forma", forma: "rectangulo", nombre: "Baja", transformacion: { x: 20, y: 70, ancho: 200, alto: 60, rotacion: 0 } },
        { id: "debajo", tipo: "forma", forma: "rectangulo", nombre: "Debajo", transformacion: { x: 20, y: 300, ancho: 100, alto: 60, rotacion: 0 } },
      ],
    });
    expect(elementosAccesibles(e).map((x) => x.id)).toEqual(["baja", "alta", "debajo"]);
  });

  it("un conector se lee en su sitio, entre las formas que une", () => {
    const e = normalizarEscena({
      elementos: [
        forma("A", 20, 20, { nombre: "Uno" }),
        forma("B", 400, 20, { nombre: "Dos" }),
        { id: "L", tipo: "linea", puntos: [{ x: 120, y: 50 }, { x: 400, y: 50 }], origen: { elementoId: "A", puerto: 1 }, destino: { elementoId: "B", puerto: 3 } },
      ],
    });
    expect(elementosAccesibles(e).map((x) => x.id)).toEqual(["A", "L", "B"]);
  });

  it("una descripción en blanco no cuenta", () => {
    const e = normalizarEscena({ elementos: [forma("A", 0, 0, { descripcion: "   " })] });
    expect(elementosAccesibles(e)[0]).toMatchObject({ etiqueta: "Rectángulo", conDescripcion: false });
  });

  it("lo oculto por un grupo oculto tampoco sale", () => {
    const e = normalizarEscena({ elementos: [forma("A", 0, 0), forma("B", 200, 0), { id: "G", tipo: "grupo", hijos: ["A", "B"], oculto: true }, forma("C", 0, 200)] });
    expect(elementosAccesibles(e).map((x) => x.id)).toEqual(["C"]);
  });

  it("sin elementos visibles no hay lista", () => {
    const { container } = render(<ListaAccesible escena={normalizarEscena({ elementos: [] })} />);
    expect(container.firstChild).toBeNull();
  });

  it("es una lista con nombre, fuera de la vista (sr-only) y solo se muestra al recibir el foco", () => {
    const { container } = montar({});
    const ul = container.querySelector("[data-dibujo-lista-accesible]") as HTMLElement;
    expect(ul.getAttribute("aria-label")).toBe("Elementos del dibujo");
    expect(ul.className).toContain("sr-only");
    expect(ul.className).toContain("focus-within:not-sr-only");
    expect([...ul.querySelectorAll("li")].map((li) => li.textContent)).toEqual(["Entrada", "Caja de salida", "Texto «Una nota»", "Rectángulo «Abajo a la derecha»"]);
  });

  it("con motor cada elemento es un botón que emite lo mismo que el clic, una sola vez", () => {
    const emitir = vi.fn();
    const { container } = montar({ emitir });
    const botones = [...container.querySelectorAll<HTMLButtonElement>("[data-dibujo-lista-accesible] button")];
    expect(botones.map((b) => b.textContent)).toEqual(["Entrada", "Caja de salida", "Texto «Una nota»", "Rectángulo «Abajo a la derecha»"]);
    fireEvent.click(botones[1] as HTMLButtonElement);
    expect(emitir.mock.calls).toEqual([["clic"], ["parte_clic", { parte: "B" }]]);
  });

  it("el dibujo sigue siendo una imagen con el título del dibujo (el interior no se lee: por eso existe la lista)", () => {
    const { container } = montar({});
    const svg = container.querySelector("svg") as SVGSVGElement;
    expect(svg.getAttribute("role")).toBe("img");
    expect(svg.getAttribute("aria-label")).toBe("Mi dibujo");
  });
});
