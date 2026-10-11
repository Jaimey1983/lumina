/**
 * T9 — Progreso: variantes circular / semicírculo / pasos, hitos con etiqueta y modo objetivo.
 * El cálculo de los modos `slides` y `manual` NO cambia (se prueba aquí con una tabla).
 */
import { cleanup, render, screen } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import type { ProgresoWidget } from "@lumina/types/widget";
import { SlideNavContext } from "@lumina/editor-shared/slide-nav-context";
import {
  mergedProgresoConfig,
  normalizeProgresoWidget,
  resolveProgresoObjetivo,
  resolveProgresoPercent,
  resolveProgresoValor,
} from "./progreso-config.js";
import { createDefaultProgresoBlock } from "./progreso-defaults.js";
import { ProgresoViewer } from "./progreso-viewer.js";

afterEach(() => cleanup());

function bloque(parcial: Record<string, unknown> = {}): ProgresoWidget {
  return { ...createDefaultProgresoBlock(), modo: "manual", porcentaje: 40, ...parcial } as ProgresoWidget;
}

function conSlides(hijo: ReactNode, slideIndex: number, slideCount: number) {
  return createElement(
    SlideNavContext.Provider,
    { value: { navigate: null, slideIndex, slideCount } },
    hijo,
  );
}

describe("cálculo de siempre (sin cambios)", () => {
  it("modo slides: (índice + 1) / total, acotado", () => {
    const casos: [number, number, number][] = [
      [0, 4, 25],
      [1, 4, 50],
      [3, 4, 100],
      [9, 4, 100],
      [-2, 4, 25],
      [0, 0, 0],
    ];
    for (const [idx, total, esperado] of casos) {
      expect(resolveProgresoPercent(0, "slides", idx, total), `${idx}/${total}`).toBe(esperado);
    }
  });

  it("modo manual: el porcentaje, acotado a 0–100", () => {
    expect(resolveProgresoPercent(40, "manual", 0, 0)).toBe(40);
    expect(resolveProgresoPercent(140, "manual", 0, 0)).toBe(100);
    expect(resolveProgresoPercent(-5, "manual", 0, 0)).toBe(0);
  });
});

describe("modo objetivo", () => {
  it("resolveProgresoObjetivo: actual / meta, acotado; sin meta válida da 0", () => {
    expect(resolveProgresoObjetivo(30, 50)).toBe(60);
    expect(resolveProgresoObjetivo(80, 50)).toBe(100);
    expect(resolveProgresoObjetivo(5, 0)).toBe(0);
    expect(resolveProgresoObjetivo(NaN, 10)).toBe(0);
  });

  it("solo reemplaza al modo manual; en modo diapositiva se ignora", () => {
    const cfg = (modo: string) =>
      mergedProgresoConfig(bloque({ modo, modoObjetivo: true, valorActual: 30, meta: 50, unidad: "pts" }));
    expect(resolveProgresoValor(cfg("manual"), 0, 0)).toEqual({ percent: 60, rotulo: "30 / 50 pts" });
    expect(resolveProgresoValor(cfg("slides"), 1, 4)).toEqual({ percent: 50 });
  });

  it("el visor muestra «30 / 50 puntos» y 60 %", () => {
    render(<ProgresoViewer block={bloque({ modoObjetivo: true, valorActual: 30, meta: 50, unidad: "puntos" })} />);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("60");
    expect(screen.getByText(/30 \/ 50 puntos/)).toBeTruthy();
  });
});

describe("normalización", () => {
  it("por defecto no escribe ninguna opción nueva", () => {
    const n = normalizeProgresoWidget(createDefaultProgresoBlock()) as unknown as Record<string, unknown>;
    for (const k of ["variante", "hitos", "numeroPasos", "modoObjetivo", "valorActual", "meta", "unidad"]) {
      expect(k in n, k).toBe(false);
    }
  });

  it("ordena y acota los hitos, recorta etiquetas y descarta basura", () => {
    const n = normalizeProgresoWidget(
      bloque({
        variante: "pasos",
        hitos: [
          { valor: 150, etiqueta: "Fin" },
          { valor: 20, etiqueta: "  Inicio  " },
          "x",
          null,
        ],
        numeroPasos: 99,
      }),
    ) as unknown as Record<string, unknown>;
    expect(n.variante).toBe("pasos");
    expect(n.hitos).toEqual([
      { valor: 20, etiqueta: "Inicio" },
      { valor: 100, etiqueta: "Fin" },
    ]);
    expect(n.numeroPasos).toBe(12);
  });

  it("una variante inválida se ignora", () => {
    expect("variante" in (normalizeProgresoWidget(bloque({ variante: "cometa" })) as object)).toBe(false);
  });
});

describe("variantes", () => {
  it("lineal: barra con el ancho del porcentaje (como siempre)", () => {
    const { container } = render(<ProgresoViewer block={bloque()} />);
    const barra = container.querySelector("[style*='width: 40%']");
    expect(barra).not.toBeNull();
    expect(screen.getByRole("progressbar").getAttribute("data-variante")).toBe("lineal");
  });

  it("circular: anillo cuyo trazo es el 40 % de la circunferencia y número al centro", () => {
    const { container } = render(<ProgresoViewer block={bloque({ variante: "circular" })} />);
    const arco = container.querySelectorAll("circle")[1];
    const [trazo, total] = (arco.getAttribute("stroke-dasharray") ?? "").split(" ").map(Number);
    expect(trazo / total).toBeCloseTo(0.4, 3);
    expect(container.querySelector("svg text")?.textContent).toBe("40%");
  });

  it("circular sin mostrarPorcentaje no escribe el número", () => {
    const { container } = render(<ProgresoViewer block={bloque({ variante: "circular", mostrarPorcentaje: false })} />);
    expect(container.querySelector("svg text")).toBeNull();
  });

  it("semicírculo: trazo proporcional a la mitad de la circunferencia", () => {
    const { container } = render(<ProgresoViewer block={bloque({ variante: "semicirculo", porcentaje: 50 })} />);
    const arco = container.querySelectorAll("path")[1];
    const [trazo, total] = (arco.getAttribute("stroke-dasharray") ?? "").split(" ").map(Number);
    expect(trazo / total).toBeCloseTo(0.5, 3);
  });

  it("pasos (manual): numeroPasos casillas y se completan según el porcentaje", () => {
    const { container } = render(
      <ProgresoViewer block={bloque({ variante: "pasos", numeroPasos: 5, porcentaje: 60 })} />,
    );
    const pasos = container.querySelectorAll("ol > li");
    expect(pasos).toHaveLength(5);
    expect(container.querySelectorAll("[data-paso-hecho]")).toHaveLength(3);
  });

  it("pasos (diapositivas): una casilla por diapositiva", () => {
    const { container } = render(
      conSlides(<ProgresoViewer block={bloque({ variante: "pasos", modo: "slides" })} />, 1, 4),
    );
    expect(container.querySelectorAll("ol > li")).toHaveLength(4);
    expect(container.querySelectorAll("[data-paso-hecho]")).toHaveLength(2);
  });

  it("pasos usa las etiquetas de los hitos por posición", () => {
    render(
      <ProgresoViewer
        block={bloque({ variante: "pasos", numeroPasos: 3, hitos: [{ valor: 0, etiqueta: "Leer" }, { valor: 1, etiqueta: "Hacer" }] })}
      />,
    );
    expect(screen.getByText("Leer")).toBeTruthy();
    expect(screen.getByText("Hacer")).toBeTruthy();
  });
});

describe("hitos en la barra lineal", () => {
  const hitos = [
    { valor: 25, etiqueta: "Inicio" },
    { valor: 50, etiqueta: "Mitad" },
    { valor: 100, etiqueta: "Meta" },
  ];

  it("marca como alcanzados los que ya pasó y anuncia el último en la región viva", () => {
    const { container } = render(<ProgresoViewer block={bloque({ hitos, porcentaje: 60 })} />);
    const alcanzados = Array.from(container.querySelectorAll("[data-hito-alcanzado]")).map((n) => n.textContent);
    expect(alcanzados).toEqual(["Inicio", "Mitad"]);
    expect(screen.getByRole("status").textContent).toContain("Hito: Mitad");
  });

  it("sin hitos no hay marcas; antes del primero no se anuncia ninguno", () => {
    const { container, unmount } = render(<ProgresoViewer block={bloque()} />);
    expect(container.querySelectorAll("[data-hito-alcanzado]")).toHaveLength(0);
    unmount();
    render(<ProgresoViewer block={bloque({ hitos, porcentaje: 10 })} />);
    expect(screen.getByRole("status").textContent).not.toContain("Hito");
  });
});
