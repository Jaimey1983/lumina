import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Escena, Forma } from "@lumina/drawing";
import { EditorLibre } from "./editor-libre.js";
import { posicionesDeAsas, marcoDeSeleccion } from "./asas.js";
import { botonCinta, escena, forma } from "./util-pruebas.js";
import { textoDeCota } from "./medidas-capa.js";

afterEach(cleanup);

// Fila: b (400–500) y c (700–800) a la altura de «a»; «a» (100 de ancho) se reparte entre ellas en x = 550.
const base = (): Escena => escena(forma("a", 100, 100, 100, 100), forma("b", 400, 100, 100, 100), forma("c", 700, 100, 100, 100));
const getForma = (e: Escena, id: string): Forma => e.elementos.find((x) => x.id === id) as Forma;

function montar(e: Escena = base(), { imanOtros = true } = {}) {
  const onCambio = vi.fn<(s: Escena) => void>();
  const onCerrar = vi.fn();
  render(<EditorLibre escena={e} onCambio={onCambio} onCerrar={onCerrar} />);
  const lienzo = screen.getByRole("application", { name: "Lienzo de dibujo" }) as unknown as SVGSVGElement;
  // El imán a otros elementos viene encendido; en estas pruebas solo se apaga si se pide.
  if (!imanOtros) fireEvent.click(botonCinta("Imantar a otros elementos"));
  const vista = () => {
    const g = document.querySelector("[data-dibujo-pagina]")?.parentElement?.getAttribute("transform") ?? "";
    const m = /translate\(([-\d.e]+) ([-\d.e]+)\) scale\(([-\d.e]+)\)/.exec(g);
    return { x: Number(m?.[1]), y: Number(m?.[2]), z: Number(m?.[3]) };
  };
  const evento = (tipo: string, x: number, y: number, extra: Record<string, unknown> = {}): void => {
    const v = vista();
    fireEvent(lienzo, new MouseEvent(tipo, { bubbles: true, cancelable: true, button: 0, clientX: v.x + x * v.z, clientY: v.y + y * v.z, ...extra }));
  };
  return {
    lienzo,
    onCambio,
    onCerrar,
    evento,
    medida: () => document.querySelector("[data-medida]")?.textContent ?? null,
    capa: () => document.querySelector("[data-capa=medidas]"),
    cotas: (tipo?: string) => [...document.querySelectorAll(tipo ? `[data-cota=${tipo}]` : "[data-cota]")].map((c) => c.getAttribute("data-valor")),
    elegir: (x: number, y: number) => {
      evento("pointerdown", x, y);
      evento("pointerup", x, y);
    },
    tecla: (init: KeyboardEventInit) => fireEvent.keyDown(lienzo, init),
  };
}

describe("Y16b — la etiqueta junto al cursor", () => {
  it("al mover muestra «X · Y» mientras dura el arrastre y nada queda al soltar", () => {
    const m = montar(base(), { imanOtros: false });
    m.evento("pointerdown", 150, 150);
    expect(m.medida()).toBeNull(); // todavía no se movió
    m.evento("pointermove", 170, 150);
    m.evento("pointermove", 190, 170);
    expect(m.medida()).toBe("X 140 · Y 120");
    m.evento("pointerup", 190, 170);
    expect(m.capa()).toBeNull();
    expect(m.onCambio).toHaveBeenCalledTimes(1); // una sola entrada de historial
  });

  it("al redimensionar muestra «ancho × alto»", () => {
    const m = montar(base(), { imanOtros: false });
    m.elegir(150, 150);
    const marco = marcoDeSeleccion(base(), ["a"])!;
    const se = posicionesDeAsas(marco, 1).se;
    m.evento("pointerdown", se.x, se.y);
    m.evento("pointermove", se.x + 20, se.y + 10);
    m.evento("pointermove", se.x + 40, se.y + 20);
    expect(m.medida()).toBe("140 × 120");
    m.evento("pointerup", se.x + 40, se.y + 20);
    expect(m.capa()).toBeNull();
  });

  it("al girar muestra el ángulo", () => {
    const m = montar(base(), { imanOtros: false });
    m.elegir(150, 150);
    const marco = marcoDeSeleccion(base(), ["a"])!;
    const rotar = posicionesDeAsas(marco, 1).rotar;
    m.evento("pointerdown", rotar.x, rotar.y);
    m.evento("pointermove", rotar.x + 10, rotar.y + 10);
    // Desde arriba del centro (150, 150) hacia la derecha: 90°.
    m.evento("pointermove", 300, 150);
    expect(m.medida()).toBe("90°");
    m.evento("pointerup", 300, 150);
    expect(m.capa()).toBeNull();
  });

  it("con Ctrl la etiqueta sigue (es la posición, no un imán)", () => {
    const m = montar(base(), { imanOtros: false });
    m.evento("pointerdown", 150, 150, { ctrlKey: true });
    m.evento("pointermove", 190, 170, { ctrlKey: true });
    expect(m.medida()).toBe("X 140 · Y 120");
    m.evento("pointerup", 190, 170, { ctrlKey: true });
  });
});

describe("Y16b — espaciado igual y cotas", () => {
  it("entre dos formas: marca los dos huecos iguales y la forma se imanta al reparto exacto al soltar", () => {
    const m = montar();
    m.evento("pointerdown", 150, 150);
    m.evento("pointermove", 300, 150);
    m.evento("pointermove", 150 + 453, 150); // «a» queda en x = 553: a 3 del reparto (550)
    expect(m.cotas("igual")).toEqual(["50", "50"]);
    m.evento("pointerup", 150 + 453, 150);
    expect(m.capa()).toBeNull();
    expect(getForma(m.onCambio.mock.calls[0]![0], "a").transformacion.x).toBeCloseTo(550, 3);
    expect(m.onCambio).toHaveBeenCalledTimes(1);
  });

  it("muestra la distancia a la vecina alineada más cercana de cada lado mientras se arrastra", () => {
    const m = montar();
    m.evento("pointerdown", 150, 150);
    m.evento("pointermove", 300, 150);
    m.evento("pointermove", 150 + 150, 150); // «a» queda en 250–350: a 50 de «b» (400); a su izquierda no hay vecina
    expect(m.cotas("distancia")).toEqual(["50"]);
    m.evento("pointerup", 300, 150);
  });

  it("con Ctrl no hay cotas ni imán", () => {
    const m = montar();
    m.evento("pointerdown", 150, 150, { ctrlKey: true });
    m.evento("pointermove", 300, 150, { ctrlKey: true });
    m.evento("pointermove", 150 + 453, 150, { ctrlKey: true });
    expect(m.cotas()).toEqual([]);
    m.evento("pointerup", 150 + 453, 150, { ctrlKey: true });
    expect(getForma(m.onCambio.mock.calls[0]![0], "a").transformacion.x).toBeCloseTo(553, 3);
  });

  it("con el imán a otros elementos apagado no hay cotas ni reparto", () => {
    const m = montar(base(), { imanOtros: false });
    m.evento("pointerdown", 150, 150);
    m.evento("pointermove", 300, 150);
    m.evento("pointermove", 150 + 453, 150);
    expect(m.cotas()).toEqual([]);
    m.evento("pointerup", 150 + 453, 150);
    expect(getForma(m.onCambio.mock.calls[0]![0], "a").transformacion.x).toBeCloseTo(553, 3);
  });

  it("una vecina bloqueada no cuenta: sin ella no hay reparto entre dos", () => {
    const e = escena(forma("a", 100, 100, 100, 100), forma("b", 400, 100, 100, 100), forma("c", 700, 100, 100, 100, { bloqueado: true }));
    const m = montar(e);
    m.evento("pointerdown", 150, 150);
    m.evento("pointermove", 300, 150);
    m.evento("pointermove", 150 + 453, 150);
    expect(m.cotas("igual")).toEqual([]);
    m.evento("pointerup", 150 + 453, 150);
  });
});

describe("Y16b — el texto de las cotas", () => {
  it("sin ruido de decimales y con coma", () => {
    expect(textoDeCota(100)).toBe("100");
    expect(textoDeCota(12.5)).toBe("12,5");
    expect(textoDeCota(0.30000000000000004)).toBe("0,3");
    expect(textoDeCota(33.333333)).toBe("33,3");
  });
});

describe("Y16b — sin residuos", () => {
  it("Escape en pleno arrastre quita la etiqueta y las cotas, y la forma vuelve a su sitio", () => {
    const m = montar();
    m.evento("pointerdown", 150, 150);
    m.evento("pointermove", 300, 150);
    m.evento("pointermove", 150 + 453, 150);
    expect(m.capa()).not.toBeNull();
    m.tecla({ key: "Escape" });
    expect(m.capa()).toBeNull();
    expect(m.onCambio).not.toHaveBeenCalled();
    m.evento("pointerup", 150 + 453, 150);
    expect(m.capa()).toBeNull();
    expect(m.onCerrar).not.toHaveBeenCalled();
  });

  it("un clic sin arrastre no muestra medidas", () => {
    const m = montar();
    m.elegir(150, 150);
    expect(m.capa()).toBeNull();
  });
});
