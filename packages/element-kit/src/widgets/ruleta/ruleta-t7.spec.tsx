/**
 * T7 — Ruleta: etiquetas multilínea, pesos, «eliminar ganador» con historial, tick de
 * sonido (WebAudio) y confeti. Los valores por defecto no cambian (ver el spec de paridad).
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  anguloDeMatriz,
  calcularIndiceBajoIndicador,
  calcularRotacionHastaGanador,
  calcularSectores,
  dividirEtiqueta,
  elegirGanadorPonderado,
  pesoDe,
} from "./ruleta-config.js";
import { createDefaultRuletaWidget, normalizeRuletaBlock } from "./ruleta-defaults.js";
import { RuletaViewer } from "./ruleta-viewer.js";
import { RuletaWheel } from "./ruleta-wheel.js";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("dividirEtiqueta", () => {
  it("una etiqueta corta queda intacta en una línea", () => {
    expect(dividirEtiqueta("Equipo 1", 14, 3)).toEqual(["Equipo 1"]);
  });

  it("parte por palabras y no trunca a 11 caracteres", () => {
    expect(dividirEtiqueta("Los Investigadores Curiosos", 14, 3)).toEqual([
      "Los",
      "Investigadores",
      "Curiosos",
    ]);
    expect(dividirEtiqueta("Ana María Pérez", 10, 3)).toEqual(["Ana María", "Pérez"]);
  });

  it("corta una palabra más larga que la línea", () => {
    expect(dividirEtiqueta("Electroencefalografista", 10, 3)).toEqual(["Electroenc", "efalografi", "sta"]);
  });

  it("si no entra en las líneas permitidas termina en «…»", () => {
    const lineas = dividirEtiqueta("uno dos tres cuatro cinco seis siete", 8, 2);
    expect(lineas).toHaveLength(2);
    expect(lineas[1].endsWith("…")).toBe(true);
  });
});

describe("pesos", () => {
  it("pesoDe: válido, o 1 si falta/ es inválido, con tope", () => {
    expect(pesoDe({ peso: 3 })).toBe(3);
    expect(pesoDe({})).toBe(1);
    expect(pesoDe({ peso: -2 })).toBe(1);
    expect(pesoDe({ peso: "x" })).toBe(1);
    expect(pesoDe({ peso: 999 })).toBe(20);
  });

  it("calcularSectores sin pesos reparte en partes iguales y con pesos, en proporción", () => {
    const iguales = calcularSectores(4);
    expect(iguales[0].fin - iguales[0].inicio).toBeCloseTo(Math.PI / 2);
    const pond = calcularSectores(2, [1, 3]);
    expect(pond[0].fin - pond[0].inicio).toBeCloseTo(Math.PI / 2);
    expect(pond[1].fin - pond[1].inicio).toBeCloseTo((3 * Math.PI) / 2);
    expect(pond[1].fin).toBeCloseTo(-Math.PI / 2 + 2 * Math.PI);
  });

  it("elegirGanadorPonderado respeta los umbrales y con pesos iguales es floor(azar × n)", () => {
    expect(elegirGanadorPonderado([1, 3], 0.1)).toBe(0);
    expect(elegirGanadorPonderado([1, 3], 0.26)).toBe(1);
    expect(elegirGanadorPonderado([1, 3], 0.99)).toBe(1);
    for (const azar of [0, 0.17, 0.5, 0.83, 0.999]) {
      expect(elegirGanadorPonderado([1, 1, 1, 1, 1, 1], azar)).toBe(Math.floor(azar * 6));
    }
  });

  it("la rotación deja el centro del sector ponderado bajo el indicador", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    for (const indice of [0, 1, 2]) {
      const pesos = [1, 3, 2];
      const destino = calcularRotacionHastaGanador(indice, 3, 0, 6, 6, pesos);
      expect(calcularIndiceBajoIndicador(destino, 3, pesos)).toBe(indice);
    }
  });

  it("anguloDeMatriz lee el giro de una matriz CSS", () => {
    expect(anguloDeMatriz("matrix(0, 1, -1, 0, 0, 0)")).toBeCloseTo(90);
    expect(anguloDeMatriz("none")).toBe(0);
  });
});

describe("normalización", () => {
  it("conserva el peso válido y no escribe el de por defecto", () => {
    const w = normalizeRuletaBlock({
      tipo: "ruleta",
      items: [
        { id: "a", texto: "A", peso: 3 },
        { id: "b", texto: "B", peso: 1 },
        { id: "c", texto: "C" },
      ],
    });
    expect(w.items[0]).toEqual({ id: "a", texto: "A", peso: 3 });
    expect(w.items[1]).toEqual({ id: "b", texto: "B" });
    expect(w.items[2]).toEqual({ id: "c", texto: "C" });
  });

  it("las opciones nuevas solo aparecen cuando están activas", () => {
    expect(Object.keys(createDefaultRuletaWidget().configuracion).sort()).toEqual(
      ["colores", "duracionGiro", "mostrarGanador", "sonido"],
    );
    const c = normalizeRuletaBlock({
      tipo: "ruleta",
      configuracion: { modoEliminar: true, confeti: false, mostrarHistorial: true },
    }).configuracion as Record<string, unknown>;
    expect(c.modoEliminar).toBe(true);
    expect(c.mostrarHistorial).toBe(true);
    expect("confeti" in c).toBe(false);
  });
});

describe("etiquetas de la rueda", () => {
  it("una etiqueta larga se reparte en líneas y no se corta con «…» a los 11 caracteres", () => {
    const { container } = render(
      <RuletaWheel items={[{ texto: "Los Investigadores Curiosos" }, { texto: "Equipo 2" }]} colores={["#f00", "#0f0"]} />,
    );
    const textos = Array.from(container.querySelectorAll("text"));
    expect(textos[0].querySelectorAll("tspan")).toHaveLength(3);
    expect(textos[0].textContent).toContain("Investigadores");
    expect(textos[0].textContent).not.toContain("…");
    expect(textos[1].querySelectorAll("tspan")).toHaveLength(0);
  });
});

// ── Visor ────────────────────────────────────────────────────────────────
interface Giro {
  terminar: () => void;
}
let giros: Giro[] = [];

beforeEach(() => {
  giros = [];
  Object.defineProperty(HTMLElement.prototype, "animate", {
    configurable: true,
    value: () => {
      let fin: () => void = () => undefined;
      const finished = new Promise<void>((ok) => {
        fin = ok;
      });
      giros.push({ terminar: fin });
      return { finished, cancel: vi.fn() };
    },
  });
});

async function girar() {
  fireEvent.click(screen.getByRole("button", { name: "Girar" }));
  await act(async () => {
    giros[giros.length - 1]?.terminar();
    await Promise.resolve();
  });
}

function bloque(config: Record<string, unknown>, items?: { id: string; texto: string; peso?: number }[]) {
  const base = createDefaultRuletaWidget();
  return {
    ...base,
    configuracion: { ...base.configuracion, ...config },
    ...(items ? { items } : {}),
  };
}

describe("RuletaViewer — pesos", () => {
  it("con pesos [1,3] el 2.º ítem sale con el 75 % del azar", async () => {
    const items = [
      { id: "a", texto: "Poco", peso: 1 },
      { id: "b", texto: "Mucho", peso: 3 },
    ];
    vi.spyOn(Math, "random").mockReturnValue(0.3);
    render(<RuletaViewer block={bloque({}, items)} />);
    await girar();
    expect(screen.getByRole("status").textContent).toBe("Ganador: Mucho");
  });
});

describe("RuletaViewer — eliminar ganador e historial", () => {
  const items = [
    { id: "a", texto: "Ana" },
    { id: "b", texto: "Beto" },
    { id: "c", texto: "Cami" },
  ];

  it("el ganador sale de la rueda en la tirada siguiente y el historial lo registra", async () => {
    const azar = vi.spyOn(Math, "random");
    azar.mockReturnValue(0); // 1.º ítem de lo que quede
    const { container } = render(<RuletaViewer block={bloque({ modoEliminar: true }, items)} />);
    expect(container.querySelectorAll("svg text")).toHaveLength(3);

    await girar();
    expect(screen.getByRole("status").textContent).toBe("Ganador: Ana");
    expect(container.querySelectorAll("svg text")).toHaveLength(3); // sigue en la rueda hasta la próxima tirada
    expect(screen.getByText("Quedan 2.", { exact: false })).toBeTruthy();

    await girar();
    expect(screen.getByRole("status").textContent).toBe("Ganador: Beto");
    expect(container.querySelectorAll("svg text")).toHaveLength(2);

    const historial = screen.getByRole("list", { name: "Historial de tiradas" });
    expect(historial.textContent).toContain("Ana");
    expect(historial.textContent).toContain("Beto");
  });

  it("cuando queda uno no se puede girar; Reiniciar restaura todo", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const { container } = render(<RuletaViewer block={bloque({ modoEliminar: true }, items)} />);
    await girar(); // Ana
    await girar(); // Beto (Ana fuera)
    expect((screen.getByRole("button", { name: "Girar" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/Ya no quedan más/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Reiniciar" }));
    expect(container.querySelectorAll("svg text")).toHaveLength(3);
    expect((screen.getByRole("button", { name: "Girar" }) as HTMLButtonElement).disabled).toBe(false);
    expect(screen.queryByRole("list", { name: "Historial de tiradas" })).toBeNull();
  });

  it("mostrarHistorial lista las tiradas sin quitar a nadie", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const { container } = render(<RuletaViewer block={bloque({ mostrarHistorial: true }, items)} />);
    await girar();
    await girar();
    expect(container.querySelectorAll("svg text")).toHaveLength(3);
    expect(screen.getByRole("list", { name: "Historial de tiradas" }).querySelectorAll("li")).toHaveLength(2);
  });

  it("por defecto no hay historial ni «Reiniciar»", async () => {
    render(<RuletaViewer block={createDefaultRuletaWidget()} />);
    await girar();
    expect(screen.queryByRole("list", { name: "Historial de tiradas" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Reiniciar" })).toBeNull();
  });
});

describe("RuletaViewer — confeti", () => {
  it("con confeti activo lanza piezas al parar; sin él, no", async () => {
    const { container, unmount } = render(<RuletaViewer block={bloque({ confeti: true })} />);
    await girar();
    expect(container.querySelector("[data-ruleta-confeti]")?.children.length).toBeGreaterThan(0);
    unmount();

    const sin = render(<RuletaViewer block={createDefaultRuletaWidget()} />);
    await girar();
    expect(sin.container.querySelector("[data-ruleta-confeti]")?.children.length).toBe(0);
  });

  it("con «reducir movimiento» no hay confeti", async () => {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduce"), media: q }));
    const { container } = render(<RuletaViewer block={bloque({ confeti: true })} />);
    await girar();
    expect(container.querySelector("[data-ruleta-confeti]")?.children.length).toBe(0);
  });
});

describe("RuletaViewer — sonido (WebAudio)", () => {
  function simularAudio() {
    const ticks: number[] = [];
    class FakeAudio {
      currentTime = 0;
      destination = {};
      resume() {
        return Promise.resolve();
      }
      close() {
        return Promise.resolve();
      }
      createOscillator() {
        ticks.push(1);
        const nodo: Record<string, unknown> = {
          type: "",
          frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
          connect: () => nodo,
          start() {},
          stop() {},
        };
        return nodo;
      }
      createGain() {
        const g: Record<string, unknown> = {
          gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
          connect: () => g,
        };
        return g;
      }
    }
    vi.stubGlobal("AudioContext", FakeAudio);
    return ticks;
  }

  function simularFrames(angulos: number[]) {
    const cola: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cola.push(cb);
      return cola.length;
    });
    vi.stubGlobal("cancelAnimationFrame", () => undefined);
    let k = 0;
    const original = window.getComputedStyle.bind(window);
    vi.spyOn(window, "getComputedStyle").mockImplementation((el: Element, pseudo?: string | null) => {
      // Solo la rueda (la única con `transform: rotate(...)` en línea) devuelve el ángulo simulado.
      if (!(el instanceof HTMLElement) || !el.style.transform.startsWith("rotate")) return original(el, pseudo);
      const a = ((angulos[Math.min(k++, angulos.length - 1)] ?? 0) * Math.PI) / 180;
      return { transform: `matrix(${Math.cos(a)}, ${Math.sin(a)}, ${-Math.sin(a)}, ${Math.cos(a)}, 0, 0)` } as CSSStyleDeclaration;
    });
    return () => {
      const cb = cola.shift();
      cb?.(0);
    };
  }

  it("con `sonido` suena un tick cada vez que cambia el sector bajo el indicador", () => {
    const ticks = simularAudio();
    const frame = simularFrames([0, 0, 300, 300, 240]); // idx 0, 0, 1, 1, 2
    render(<RuletaViewer block={bloque({ sonido: true })} />);
    fireEvent.click(screen.getByRole("button", { name: "Girar" }));
    for (let i = 0; i < 5; i++) frame();
    expect(ticks).toHaveLength(2);
  });

  it("sin `sonido` no se crea el audio ni se mide la rueda", () => {
    const ticks = simularAudio();
    render(<RuletaViewer block={createDefaultRuletaWidget()} />);
    fireEvent.click(screen.getByRole("button", { name: "Girar" }));
    expect(ticks).toHaveLength(0);
  });

  it("sin WebAudio la ruleta gira igual, en silencio", async () => {
    vi.stubGlobal("AudioContext", undefined);
    render(<RuletaViewer block={bloque({ sonido: true })} />);
    await girar();
    expect(screen.getByRole("status").textContent).toMatch(/^Ganador: /);
  });
});
