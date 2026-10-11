/**
 * T10 — Contador: variantes (dígitos / flip-clock / anillo), hitos con aviso visual y sonoro,
 * semáforo y presets. El comportamiento de siempre (temporizador, cronómetro, número y
 * «al terminar → siguiente») NO cambia: se prueba aquí con la config legada.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ContadorWidget } from "@lumina/types/widget";
import { SlideNavContext } from "@lumina/editor-shared/slide-nav-context";
import { CONTADOR_PRESETS } from "../../elements/contador/contador-definition.js";
import {
  createDefaultContadorBlock,
  hitosAlcanzados,
  normalizeContadorWidget,
  semaforoDeFraccion,
} from "./contador-defaults.js";
import { ContadorViewer } from "./contador-viewer.js";

const sonar = vi.hoisted(() => vi.fn());
vi.mock("./contador-sound.js", () => ({ sonarHito: sonar }));

beforeEach(() => {
  vi.useFakeTimers();
  sonar.mockClear();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function bloque(parcial: Record<string, unknown> = {}): ContadorWidget {
  return { ...createDefaultContadorBlock(), ...parcial } as ContadorWidget;
}

function avanzar(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function viva(container: HTMLElement): string {
  return container.querySelector('[role="status"]')?.textContent ?? "";
}

describe("config legada: normalización sin claves nuevas", () => {
  it("un bloque sin opciones T10 no gana ninguna clave nueva", () => {
    const n = normalizeContadorWidget(bloque()) as unknown as Record<string, unknown>;
    for (const k of ["variante", "hitos", "hitosAlerta", "semaforo"]) expect(k in n).toBe(false);
  });

  it("descarta valores inválidos y acota/ordena los hitos", () => {
    const n = normalizeContadorWidget(
      bloque({
        variante: "cubo",
        hitosAlerta: "ruidosa",
        semaforo: "si",
        hitos: [
          { segundos: 30, etiqueta: "b" },
          { segundos: 0, etiqueta: "cero" },
          { segundos: 10, etiqueta: "  a  " },
          "basura",
        ],
      }),
    ) as unknown as Record<string, unknown>;
    expect(n.variante).toBeUndefined();
    expect(n.hitosAlerta).toBeUndefined();
    expect(n.semaforo).toBeUndefined();
    expect(n.hitos).toEqual([
      { segundos: 10, etiqueta: "a" },
      { segundos: 30, etiqueta: "b" },
    ]);
  });
});

describe("comportamiento de siempre (sin cambios)", () => {
  it("temporizador: cuenta atrás desde `segundos` y se detiene en 00:00", () => {
    const { container } = render(<ContadorViewer block={bloque({ segundos: 3 })} />);
    expect(container.textContent).toContain("00:03");
    avanzar(1100);
    expect(container.textContent).toContain("00:01");
    avanzar(3000);
    expect(container.textContent).toContain("00:00");
    expect(viva(container)).toBe("Tiempo terminado");
  });

  it("cronómetro: sube desde cero", () => {
    const { container } = render(<ContadorViewer block={bloque({ modo: "cronometro" })} />);
    avanzar(2100);
    expect(container.textContent).toContain("00:02");
  });

  it("número: suma, resta y reinicia con el paso configurado", () => {
    const { container } = render(
      <ContadorViewer block={bloque({ modo: "numero", valorInicial: 5, valorPaso: 2 })} />,
    );
    fireEvent.click(screen.getByLabelText("Sumar"));
    fireEvent.click(screen.getByLabelText("Sumar"));
    expect(container.textContent).toContain("9");
    fireEvent.click(screen.getByLabelText("Restar"));
    expect(container.textContent).toContain("7");
    fireEvent.click(screen.getByLabelText("Reiniciar"));
    expect(container.textContent).toContain("5");
  });

  it("al terminar → siguiente navega; con runtime emite fin_contador y no navega", () => {
    const navigate = vi.fn();
    const envolver = (hijo: ReactNode) =>
      createElement(SlideNavContext.Provider, { value: { navigate, slideIndex: 0, slideCount: 3 } }, hijo);
    render(envolver(<ContadorViewer block={bloque({ segundos: 1, alTerminar: "siguiente" })} />));
    avanzar(1500);
    expect(navigate).toHaveBeenCalledWith({ kind: "siguiente" });
    cleanup();
    navigate.mockClear();
    const emitir = vi.fn();
    render(
      envolver(<ContadorViewer block={bloque({ segundos: 1, alTerminar: "siguiente" })} emitir={emitir} />),
    );
    avanzar(1500);
    expect(emitir).toHaveBeenCalledWith("fin_contador");
    expect(navigate).not.toHaveBeenCalled();
  });

  it("sin hitos ni aviso sonoro, nunca suena nada (ni al terminar)", () => {
    render(<ContadorViewer block={bloque({ segundos: 1 })} />);
    avanzar(2000);
    expect(sonar).not.toHaveBeenCalled();
  });
});

describe("hitos: lógica pura", () => {
  const hitos = [
    { segundos: 10, etiqueta: "a" },
    { segundos: 30, etiqueta: "b" },
  ];
  it("temporizador: alcanzado cuando quedan <= segundos; ignora los >= duración total", () => {
    expect(hitosAlcanzados("temporizador", 60, hitos, 60)).toEqual([]);
    expect(hitosAlcanzados("temporizador", 30, hitos, 60)).toEqual([1]);
    expect(hitosAlcanzados("temporizador", 9.2, hitos, 60)).toEqual([0, 1]);
    expect(hitosAlcanzados("temporizador", 5, [{ segundos: 60, etiqueta: "" }], 60)).toEqual([]);
  });
  it("cronómetro: alcanzado cuando transcurrieron >= segundos; número nunca", () => {
    expect(hitosAlcanzados("cronometro", 9.9, hitos, 0)).toEqual([]);
    expect(hitosAlcanzados("cronometro", 10, hitos, 0)).toEqual([0]);
    expect(hitosAlcanzados("numero", 999, hitos, 0)).toEqual([]);
  });
  it("semáforo por fracción restante", () => {
    expect(semaforoDeFraccion(1)).toBe("verde");
    expect(semaforoDeFraccion(0.5)).toBe("amarillo");
    expect(semaforoDeFraccion(0.2)).toBe("rojo");
  });
});

describe("hitos en el visor", () => {
  const conHitos = (extra: Record<string, unknown> = {}) =>
    bloque({ segundos: 10, hitos: [{ segundos: 5, etiqueta: "Mitad" }], ...extra });

  it("avisa una sola vez: cartel, región viva y se apaga solo", () => {
    const { container } = render(<ContadorViewer block={conHitos()} />);
    expect(container.textContent).not.toContain("Mitad");
    avanzar(5200);
    expect(container.textContent).toContain("Mitad");
    expect(viva(container)).toBe("Hito: Mitad");
    expect(sonar).not.toHaveBeenCalled(); // aviso `visual` por defecto
    avanzar(3000);
    expect(container.textContent).not.toContain("Mitad");
  });

  it("con aviso sonoro suena en el hito (1 vez) y al terminar", () => {
    render(<ContadorViewer block={conHitos({ hitosAlerta: "ambas" })} />);
    avanzar(5200);
    expect(sonar).toHaveBeenCalledTimes(1);
    expect(sonar).toHaveBeenLastCalledWith(false);
    avanzar(2000);
    expect(sonar).toHaveBeenCalledTimes(1);
    avanzar(4000);
    expect(sonar).toHaveBeenLastCalledWith(true);
  });

  it("reiniciar permite que el hito vuelva a avisar", () => {
    render(<ContadorViewer block={conHitos({ hitosAlerta: "sonora" })} />);
    avanzar(5200);
    fireEvent.click(screen.getByLabelText("Reiniciar"));
    fireEvent.click(screen.getByLabelText("Iniciar"));
    avanzar(5300);
    expect(sonar.mock.calls.filter(([f]) => f === false)).toHaveLength(2);
  });

  it("sin etiqueta muestra el tiempo del hito; en miniatura no avisa", () => {
    const { container } = render(
      <ContadorViewer block={conHitos({ hitos: [{ segundos: 5, etiqueta: "" }] })} />,
    );
    avanzar(5200);
    expect(container.textContent).toContain("00:05");
    cleanup();
    const mini = render(<ContadorViewer block={conHitos({ hitosAlerta: "ambas" })} isThumbnail />);
    avanzar(6000);
    expect(mini.container.textContent).not.toContain("Mitad");
    expect(sonar).not.toHaveBeenCalled();
  });

  it("cronómetro: avisa al transcurrir los segundos del hito", () => {
    const { container } = render(
      <ContadorViewer block={bloque({ modo: "cronometro", hitos: [{ segundos: 3, etiqueta: "Tres" }] })} />,
    );
    avanzar(2500);
    expect(container.textContent).not.toContain("Tres");
    avanzar(900);
    expect(container.textContent).toContain("Tres");
  });
});

describe("variantes", () => {
  it("dígitos (defecto): sin anillo ni casillas", () => {
    const { container } = render(<ContadorViewer block={bloque({ autoIniciar: false })} />);
    expect(container.querySelector('[class*="anilloSvg"]')).toBeNull();
    expect(container.querySelector('[data-variante="digitos"]')).not.toBeNull();
  });

  it("flip-clock: una casilla por dígito y el texto completo sigue ahí", () => {
    const { container } = render(
      <ContadorViewer block={bloque({ variante: "flip", segundos: 125, autoIniciar: false })} />,
    );
    expect(container.querySelector('[data-variante="flip"]')).not.toBeNull();
    expect(container.textContent).toContain("02:05");
    expect(container.querySelectorAll("span").length).toBeGreaterThanOrEqual(5);
  });

  it("flip-clock: solo gira la casilla que cambia", () => {
    const { container } = render(
      <ContadorViewer block={bloque({ variante: "flip", segundos: 25 })} />,
    );
    const girando = () => container.querySelectorAll('[class*="caraGira"]').length;
    expect(girando()).toBe(0);
    avanzar(1100);
    expect(girando()).toBe(1);
  });

  it("anillo: dibuja el arco y el vacío sigue al tiempo restante", () => {
    const { container } = render(
      <ContadorViewer block={bloque({ variante: "anillo", segundos: 100, autoIniciar: false })} />,
    );
    const arco = container.querySelector('[class*="anilloArco"]');
    expect(arco).not.toBeNull();
    expect(Number(arco?.getAttribute("stroke-dashoffset"))).toBeCloseTo(0, 5);
    cleanup();
    avanzar(0);
    const medio = render(
      <ContadorViewer block={bloque({ variante: "anillo", segundos: 100 })} />,
    );
    avanzar(50_000);
    const a = medio.container.querySelector('[class*="anilloArco"]');
    const total = Number(a?.getAttribute("stroke-dasharray"));
    expect(Number(a?.getAttribute("stroke-dashoffset")) / total).toBeCloseTo(0.5, 1);
  });

  it("el modo número ignora la variante", () => {
    const { container } = render(
      <ContadorViewer block={bloque({ modo: "numero", variante: "anillo" })} />,
    );
    expect(container.querySelector('[class*="anilloSvg"]')).toBeNull();
    expect(container.querySelector('[data-variante="digitos"]')).not.toBeNull();
  });
});

describe("semáforo", () => {
  it("el acento pasa de verde a amarillo y rojo; sin la opción usa el color de acento", () => {
    const color = (c: HTMLElement) =>
      (c.querySelector('[data-variante]') as HTMLElement).style.getPropertyValue("--ct-acento");
    const { container } = render(<ContadorViewer block={bloque({ semaforo: true, segundos: 10 })} />);
    expect(color(container)).toContain("--lw-color-success");
    avanzar(6000);
    expect(color(container)).toContain("--lw-color-warning");
    avanzar(3000);
    expect(color(container)).toContain("--lw-color-danger");
    cleanup();
    const sin = render(<ContadorViewer block={bloque({ segundos: 10 })} />);
    expect(color(sin.container)).toBe("#38bdf8");
  });
});

describe("presets de T10", () => {
  it("existen los pedidos y todos producen un estado válido", () => {
    const ids = CONTADOR_PRESETS.map((p) => p.id);
    for (const id of ["pomodoro-completo", "cuenta-atras-dramatica", "cronometro-debate", "semaforo-grupal"]) {
      expect(ids).toContain(id);
    }
    for (const p of CONTADOR_PRESETS) {
      const n = normalizeContadorWidget({ ...createDefaultContadorBlock(), ...p.estadoPatch } as ContadorWidget);
      expect(n.tipo).toBe("contador");
    }
  });

  it("los presets de dinámica conservan sus hitos y avisos tras normalizar", () => {
    const p = CONTADOR_PRESETS.find((x) => x.id === "cuenta-atras-dramatica")!;
    const n = normalizeContadorWidget({ ...createDefaultContadorBlock(), ...p.estadoPatch } as ContadorWidget) as unknown as Record<string, unknown>;
    expect(n.semaforo).toBe(true);
    expect(n.hitosAlerta).toBe("ambas");
    expect((n.hitos as unknown[]).length).toBe(2);
  });
});
