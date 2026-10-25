// Y38c: el estudiante pliega y despliega ramas en el visor, sin guardar nada. Los golden de `__golden__/visor-*.html` se generaron con el
// código de `main` ANTES de tocar el visor (Regla 7) y no se regeneran.

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { conectarFormas, fijarColapso, normalizarEscena, type Escena } from "@lumina/drawing";
import { diagramaDefinition } from "../../../elements/diagrama/diagrama-definition.js";
import type { DiagramaConfig, DiagramaEstado } from "../../../elements/diagrama/diagrama-types.js";
import { createDefaultFlujoBlock } from "../diagrama-defaults.js";

afterEach(() => cleanup());

const aqui = dirname(fileURLToPath(import.meta.url));
const golden = (nombre: string): string => readFileSync(join(aqui, "__golden__", nombre), "utf8");

const forma = (id: string, x: number, y: number, extra: Record<string, unknown> = {}) => ({ id, tipo: "forma", forma: "rectangulo", transformacion: { x, y, ancho: 100, alto: 60, rotacion: 0 }, ...extra });
const sinRamas = (): Escena =>
  normalizarEscena({
    ancho: 600,
    alto: 300,
    elementos: [forma("C", 300, 200, { texto: "Abajo" }), forma("B", 300, 20, { texto: "Arriba", descripcion: "Caja de salida" }), forma("A", 20, 20, { nombre: "Entrada" }), forma("O", 20, 100, { oculto: true }), { id: "G", tipo: "grupo", hijos: ["A", "B"] }],
  });
/** r → a, b; a → a1, a2. El docente deja plegada «a». */
const conRamas = (plegarA = true): Escena => {
  let e = normalizarEscena({ ancho: 600, alto: 300, elementos: ["r", "a", "b", "a1", "a2"].map((id, i) => forma(id, 20 + i * 110, 20 + (i % 3) * 90, { texto: id })) });
  for (const [p, h] of [["r", "a"], ["r", "b"], ["a", "a1"], ["a", "a2"]] as const) e = conectarFormas(e, p, h);
  return plegarA ? fijarColapso(e, ["a"], true) : e;
};

const estadoDe = (escena: Escena): DiagramaEstado => ({ ...createDefaultFlujoBlock({ id: "d1" }), titulo: "Mi dibujo", escena }) as unknown as DiagramaEstado;
const Viewer = diagramaDefinition.Viewer;
const montar = (escena: Escena, config: DiagramaConfig = {}) => render(<Viewer estado={estadoDe(escena)} config={config} />);
const normalizar = (html: string): string => html.replace(/dibujor\d+/g, "dibujoX");

const dibujado = (id: string): boolean => document.querySelector(`[data-elemento-id="${id}"]`) !== null;
const marcador = (id: string): Element | null => document.querySelector(`[data-colapsar-id="${id}"]`);
const textoMarcador = (id: string): string => marcador(id)?.textContent ?? "";
const botonRama = (id: string): HTMLButtonElement | null => document.querySelector<HTMLButtonElement>(`[data-rama-lista="${id}"]`);
const anuncio = (): string => document.querySelector("[data-rama-anuncio]")?.textContent ?? "";

describe("Y38c — compatibilidad: un visor sin ramas es el de siempre (golden de `main`)", () => {
  it("sin ramas, con motor", () => {
    const { container } = montar(sinRamas(), { emitir: vi.fn() });
    expect(normalizar(container.innerHTML)).toBe(golden("visor-sin-ramas-motor.html"));
  });

  it("sin ramas, sin motor", () => {
    const { container } = montar(sinRamas(), {});
    expect(normalizar(container.innerHTML)).toBe(golden("visor-sin-ramas-sin-motor.html"));
  });

  it("la miniatura de un diagrama con ramas: solo los «+N» del docente, sin «−», sin lista, como antes", () => {
    const { container } = montar(conRamas(), { isThumbnail: true, emitir: vi.fn() });
    expect(normalizar(container.innerHTML)).toBe(golden("visor-miniatura-con-ramas.html"));
  });
});

describe("Y38c — plegar y desplegar con el marcador", () => {
  it("se ve el «+N» del docente y los «−» de las ramas abiertas; lo plegado no se dibuja", () => {
    montar(conRamas(), { emitir: vi.fn() });
    expect(textoMarcador("a")).toBe("+2");
    expect(textoMarcador("r")).toBe("−");
    expect(dibujado("a1")).toBe(false);
    expect(dibujado("a2")).toBe(false);
  });

  it("un clic en el «+2» despliega la rama; otro clic en el «−» la vuelve a plegar", () => {
    montar(conRamas(), { emitir: vi.fn() });
    fireEvent.click(marcador("a")?.querySelector("circle") as Element);
    expect(dibujado("a1") && dibujado("a2")).toBe(true);
    expect(textoMarcador("a")).toBe("−");
    fireEvent.click(marcador("a")?.querySelector("circle") as Element);
    expect(dibujado("a1")).toBe(false);
    expect(textoMarcador("a")).toBe("+2");
  });

  it("el estudiante también puede plegar lo que el docente dejó abierto", () => {
    montar(conRamas(), { emitir: vi.fn() });
    expect(dibujado("b")).toBe(true);
    fireEvent.click(marcador("r")?.querySelector("circle") as Element);
    expect(dibujado("b")).toBe(false);
    expect(textoMarcador("r")).toBe("+4");
  });

  it("funciona también sin motor (plegar es del estudiante, no de las reglas)", () => {
    montar(conRamas(), {});
    fireEvent.click(marcador("a")?.querySelector("circle") as Element);
    expect(dibujado("a1")).toBe(true);
  });

  it("los marcadores se ven clicables", () => {
    const { container } = montar(conRamas(), {});
    expect(container.querySelector("figure")?.className).toContain("[&_[data-colapsar-id]]:cursor-pointer");
  });
});

describe("Y38c — el marcador no emite eventos (DY83); lo demás, como siempre", () => {
  it("un clic en el marcador no emite `clic` ni `parte_clic`", () => {
    const emitir = vi.fn();
    montar(conRamas(), { emitir });
    fireEvent.click(marcador("a")?.querySelector("circle") as Element);
    fireEvent.click(marcador("r")?.querySelector("text") as Element);
    expect(emitir).not.toHaveBeenCalled();
  });

  it("un clic en una forma con ramas emite `clic` y `parte_clic` y no pliega nada", () => {
    const emitir = vi.fn();
    montar(conRamas(), { emitir });
    fireEvent.click(document.querySelector('[data-elemento-id="r"] path, [data-elemento-id="r"] rect') as Element);
    expect(emitir.mock.calls).toEqual([["clic"], ["parte_clic", { parte: "r" }]]);
    expect(dibujado("a1")).toBe(false);
    expect(textoMarcador("r")).toBe("−");
  });

  it("un clic en el fondo emite solo `clic`", () => {
    const emitir = vi.fn();
    const { container } = montar(conRamas(), { emitir });
    fireEvent.click(container.querySelector("svg") as Element);
    expect(emitir.mock.calls).toEqual([["clic"]]);
  });
});

describe("Y38c — no se guarda nada y se reinicia (DY76)", () => {
  it("plegar no cambia el bloque recibido ni llama a nada de guardado", () => {
    const escena = conRamas();
    const antes = JSON.stringify(escena);
    const estado = estadoDe(escena);
    render(<Viewer estado={estado} config={{ emitir: vi.fn() }} />);
    fireEvent.click(marcador("a")?.querySelector("circle") as Element);
    expect(JSON.stringify(escena)).toBe(antes);
    expect(JSON.stringify(estado.escena)).toBe(antes);
  });

  it("al volver a abrir el visor, vuelve a lo del docente", () => {
    const escena = conRamas();
    const primera = render(<Viewer estado={estadoDe(escena)} config={{}} />);
    fireEvent.click(marcador("a")?.querySelector("circle") as Element);
    expect(dibujado("a1")).toBe(true);
    primera.unmount();
    render(<Viewer estado={estadoDe(escena)} config={{}} />);
    expect(dibujado("a1")).toBe(false);
    expect(textoMarcador("a")).toBe("+2");
  });

  it("si cambia la escena del bloque, se descarta lo alternado", () => {
    const una = conRamas();
    const r = render(<Viewer estado={estadoDe(una)} config={{}} />);
    fireEvent.click(marcador("a")?.querySelector("circle") as Element);
    expect(dibujado("a1")).toBe(true);
    r.rerender(<Viewer estado={estadoDe(conRamas())} config={{}} />);
    expect(dibujado("a1")).toBe(false);
    expect(textoMarcador("a")).toBe("+2");
  });

  it("si solo se vuelve a dibujar con la misma escena, se conserva", () => {
    const escena = conRamas();
    const estado = estadoDe(escena);
    const r = render(<Viewer estado={estado} config={{}} />);
    fireEvent.click(marcador("a")?.querySelector("circle") as Element);
    r.rerender(<Viewer estado={estado} config={{}} />);
    expect(dibujado("a1")).toBe(true);
  });
});

describe("Y38c — la miniatura", () => {
  it("no responde al clic en un «+N» y no emite", () => {
    const emitir = vi.fn();
    montar(conRamas(), { isThumbnail: true, emitir });
    fireEvent.click(marcador("a")?.querySelector("circle") as Element);
    expect(dibujado("a1")).toBe(false);
    expect(emitir).not.toHaveBeenCalled();
  });

  it("muestra los «+N» y no los «−»", () => {
    montar(conRamas(), { isThumbnail: true });
    expect(textoMarcador("a")).toBe("+2");
    expect(marcador("r")).toBeNull();
  });
});

describe("Y38c — la lista para lectores de pantalla", () => {
  it("ofrece «Plegar rama» / «Desplegar rama» solo en las formas con hijos, con `aria-expanded`", () => {
    montar(conRamas(), { emitir: vi.fn() });
    expect(botonRama("r")?.getAttribute("aria-expanded")).toBe("true");
    expect(botonRama("r")?.textContent).toBe("Plegar rama");
    expect(botonRama("a")?.getAttribute("aria-expanded")).toBe("false");
    expect(botonRama("a")?.textContent).toBe("Desplegar rama (2 ocultos)");
    expect(botonRama("b")).toBeNull();
  });

  it("el botón tiene un nombre accesible que dice de qué elemento es", () => {
    montar(conRamas(), { emitir: vi.fn() });
    expect(botonRama("a")?.getAttribute("aria-label")).toBe("Desplegar la rama de Rectángulo «a»");
    expect(screen.getByRole("button", { name: "Plegar la rama de Rectángulo «r»" })).toBeTruthy();
  });

  it("lo plegado no se lista, y al desplegar aparece", () => {
    montar(conRamas(), { emitir: vi.fn() });
    expect(document.querySelector('[data-elemento-lista="a1"]')).toBeNull();
    fireEvent.click(botonRama("a") as HTMLButtonElement);
    expect(document.querySelector('[data-elemento-lista="a1"]')).not.toBeNull();
  });

  it("alterna sin motor también, y no emite nada con motor", () => {
    montar(conRamas(), {});
    fireEvent.click(botonRama("a") as HTMLButtonElement);
    expect(dibujado("a1")).toBe(true);
    cleanup();
    const emitir = vi.fn();
    montar(conRamas(), { emitir });
    fireEvent.click(botonRama("a") as HTMLButtonElement);
    expect(emitir).not.toHaveBeenCalled();
  });

  it("«elegir» sigue exigiendo motor: sin motor hay solo el botón de rama", () => {
    montar(conRamas(), {});
    expect(document.querySelectorAll("[data-dibujo-lista-accesible] button")).toHaveLength(2); // r y a, las dos formas con hijos
  });

  it("el foco se queda en el botón al alternar", () => {
    montar(conRamas(), { emitir: vi.fn() });
    const b = botonRama("a") as HTMLButtonElement;
    b.focus();
    fireEvent.click(b);
    expect(document.activeElement).toBe(botonRama("a"));
    expect(botonRama("a")?.textContent).toBe("Plegar rama");
  });

  it("anuncia el cambio en la región `aria-live`", () => {
    montar(conRamas(), { emitir: vi.fn() });
    expect(anuncio()).toBe("");
    fireEvent.click(botonRama("a") as HTMLButtonElement);
    expect(anuncio()).toBe("Rama desplegada.");
    fireEvent.click(botonRama("r") as HTMLButtonElement);
    expect(anuncio()).toBe("Rama plegada: 4 elementos ocultos.");
    expect(document.querySelector("[data-rama-anuncio]")?.getAttribute("aria-live")).toBe("polite");
  });

  it("sin ramas no hay botones de rama ni región de anuncio (la prueba de siempre: cero botones sin motor)", () => {
    const { container } = montar(sinRamas(), {});
    expect(container.querySelectorAll("[data-dibujo-lista-accesible] button")).toHaveLength(0);
    expect(container.querySelector("[data-rama-anuncio]")).toBeNull();
  });
});
