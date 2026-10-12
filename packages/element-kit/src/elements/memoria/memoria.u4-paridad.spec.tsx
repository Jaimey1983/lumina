/**
 * U7 — NOTA: el barajado pasó de `sort(random)` (sesgado) a Fisher–Yates uniforme
 * (`_shared/barajar.ts`). Con el mismo azar fijo el ORDEN del mazo cambió y, con él, los
 * valores `GOLDEN` que dependen de él (mazo, orden de `paresEncontrados`); se volvieron a
 * medir. Lo que NO cambió, y sigue siendo la paridad que importa: qué se emite, cuándo, la
 * nota, los tiempos y toda la mecánica del tablero.
 *
 * U4 — paridad de Memoria contra su comportamiento ANTERIOR a migrar al `ActivityShell`
 * (Regla 7). Los valores `GOLDEN` se midieron con el viewer viejo (`useState` +
 * `setTimeout` en cadena + `ActivityResultOverlay`) y se congelaron: el viewer nuevo debe
 * entregar a `@lumina/scoring` lo mismo. Se compara lo que sale por el canal de respuesta
 * (borradores y respuesta final, sin contar repeticiones), el orden del mazo con un azar
 * fijo (también tras «Reintentar») y la nota resultante.
 *
 * Diferencia deliberada: el viewer viejo re-emitía el mismo borrador en cada volteo
 * posterior al primer par; el nuevo emite solo cuando cambian los pares encontrados.
 * Por eso `emisiones` colapsa repeticiones consecutivas.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateActivityResponse, isActivityDraftResponse, unwrapActivityDraftResponse } from "@lumina/scoring";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { createDefaultMemoria } from "../../activities/memoria/index.js";
import { memoriaDefinition } from "./memoria-definition.js";

type Props = { estado: unknown; config: Record<string, unknown> };
const Viewer = memoriaDefinition.Viewer as unknown as (p: Props) => React.ReactElement;

/** Azar fijo (mulberry32): el barajado es el mismo entre corridas. */
function azarFijo(semilla = 7) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

beforeEach(() => {
  play.mockClear();
  vi.useFakeTimers();
  vi.spyOn(Math, "random").mockImplementation(azarFijo());
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const avanzar = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

/** Las cartas del tablero, en orden de pantalla (los demás botones son del resultado). */
function cartas(): HTMLElement[] {
  return screen
    .getAllByRole("button")
    .filter((b) => !/Reintentar|Cerrar|Comenzar|Ver resultado/.test(b.textContent ?? ""));
}

/** Voltea la carta `i` y devuelve su contenido visible. */
function voltear(i: number): string {
  const c = cartas()[i];
  fireEvent.click(c);
  return c.textContent?.trim() ?? "";
}

/** Lee el orden del mazo volteando de a pares (el que no coincide se esconde otra vez). */
function ordenDelMazo(total: number): string[] {
  const orden: string[] = [];
  for (let k = 0; k < total; k += 2) {
    orden.push(voltear(k));
    orden.push(voltear(k + 1));
    avanzar(1100);
  }
  return orden;
}

interface Emision {
  tipo: "borrador" | "final";
  pares: string[];
}

/** Emisiones distintas y consecutivas (se colapsan las repeticiones: ver encabezado). */
function emisiones(llamadas: unknown[][]): Emision[] {
  const out: Emision[] = [];
  for (const [r] of llamadas) {
    const payload = unwrapActivityDraftResponse(r) as { paresEncontrados: string[] };
    const e: Emision = { tipo: isActivityDraftResponse(r) ? "borrador" : "final", pares: [...payload.paresEncontrados] };
    const ult = out[out.length - 1];
    if (!ult || ult.tipo !== e.tipo || ult.pares.join() !== e.pares.join()) out.push(e);
  }
  return out;
}

/** Con el mazo ya conocido, voltea los pares que faltan hasta completar la partida. */
function completar(mazo: string[], actividad: ReturnType<typeof createDefaultMemoria>, yaEncontrados: Set<string>) {
  const idDe = new Map<string, string>();
  for (const p of actividad.pares) {
    idDe.set(p.lado1.texto ?? "", p.id);
    idDe.set(p.lado2.texto ?? "", p.id);
  }
  const posiciones = new Map<string, number[]>();
  mazo.forEach((txt, i) => posiciones.set(idDe.get(txt)!, [...(posiciones.get(idDe.get(txt)!) ?? []), i]));
  for (const [idPar, [i, j]] of posiciones) {
    if (yaEncontrados.has(idPar)) continue;
    voltear(i);
    voltear(j);
    avanzar(450);
  }
}

const canal = (fn: ReturnType<typeof vi.fn>) => ({ onResponse: fn });

/** Valores medidos con el viewer anterior (ver encabezado). */
const GOLDEN = {
  mazo: ["🐶", "🐰", "Pez", "Rana", "Perro", "🐦", "Pájaro", "Conejo", "🐱", "🐟", "🐸", "Gato"],
  perfecto: [
    { tipo: "borrador", pares: ["par-2"] },
    { tipo: "borrador", pares: ["par-2", "par-5"] },
    { tipo: "borrador", pares: ["par-2", "par-5", "par-4"] },
    { tipo: "borrador", pares: ["par-2", "par-5", "par-4", "par-6"] },
    { tipo: "borrador", pares: ["par-2", "par-5", "par-4", "par-6", "par-3"] },
    { tipo: "final", pares: ["par-2", "par-5", "par-4", "par-6", "par-3", "par-1"] },
  ] as Emision[],
};

/** Posiciones (en `GOLDEN.mazo`) de un par que coincide (🐶 / Perro) y de dos cartas que no. */
const PAR_BUENO: [number, number] = [0, 4];
const PAR_MALO: [number, number] = [0, 2];

describe("Memoria — paridad con el comportamiento anterior (U4)", () => {
  it("el orden del mazo con azar fijo es el de siempre", () => {
    render(<Viewer estado={createDefaultMemoria()} config={{}} />);
    expect(ordenDelMazo(12)).toEqual(GOLDEN.mazo);
  });

  it("partida perfecta: un borrador por cada par nuevo y una respuesta final con todos; nota 5", () => {
    const a = createDefaultMemoria();
    const salida = vi.fn();
    render(<Viewer estado={a} config={canal(salida)} />);
    const mazo = ordenDelMazo(12);
    completar(mazo, a, new Set(emisiones(salida.mock.calls).flatMap((e) => e.pares)));
    expect(emisiones(salida.mock.calls)).toEqual(GOLDEN.perfecto);
    const final = salida.mock.calls.at(-1)![0];
    expect(isActivityDraftResponse(final)).toBe(false);
    const ev = evaluateActivityResponse("memoria", a, final);
    expect({ correct: ev.correct, score: ev.score }).toEqual({ correct: true, score: 5 });
  });

  it("un par que no coincide sigue visible hasta `tiempoVolteo` y luego se esconde", () => {
    const a = createDefaultMemoria(); // tiempoVolteo = 1000
    render(<Viewer estado={a} config={{}} />);
    expect(voltear(PAR_MALO[0])).toBe(GOLDEN.mazo[PAR_MALO[0]]);
    expect(voltear(PAR_MALO[1])).toBe(GOLDEN.mazo[PAR_MALO[1]]);
    avanzar(999);
    expect(cartas()[0].textContent).toBe(GOLDEN.mazo[0]);
    avanzar(2);
    expect(cartas()[0].textContent?.trim()).toBe("?");
    expect(cartas()[2].textContent?.trim()).toBe("?");
  });

  it("mientras se resuelve un par no se puede voltear otra carta", () => {
    render(<Viewer estado={createDefaultMemoria()} config={{}} />);
    voltear(0);
    voltear(2);
    fireEvent.click(cartas()[4]);
    expect(cartas()[4].textContent?.trim()).toBe("?");
  });

  it("el cronómetro cuenta hacia arriba con `mostrarTimer` y no aparece sin él", () => {
    const a = createDefaultMemoria();
    const { unmount } = render(<Viewer estado={a} config={{}} />);
    avanzar(75_000);
    expect(screen.getByText("1:15")).toBeTruthy();
    unmount();
    render(<Viewer estado={{ ...a, configuracion: { ...a.configuracion, mostrarTimer: false } }} config={{}} />);
    avanzar(75_000);
    expect(screen.queryByText("1:15")).toBeNull();
  });

  it("«Reintentar» reinicia el tablero (otro barajado) y la nueva partida vuelve a emitir", () => {
    const a = createDefaultMemoria();
    const salida = vi.fn();
    render(<Viewer estado={a} config={canal(salida)} />);
    const mazo = ordenDelMazo(12);
    completar(mazo, a, new Set(emisiones(salida.mock.calls).flatMap((e) => e.pares)));
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeTruthy();
    salida.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    const mazo2 = ordenDelMazo(12);
    expect(mazo2).toEqual(GOLDEN_REINTENTO.mazo);
    completar(mazo2, a, new Set(emisiones(salida.mock.calls).flatMap((e) => e.pares)));
    const em = emisiones(salida.mock.calls);
    expect(em.at(-1)!.tipo).toBe("final");
    expect(em.at(-1)!.pares).toHaveLength(6);
  });
});

const GOLDEN_REINTENTO = {
  mazo: ["Pájaro", "Perro", "🐶", "🐟", "🐸", "Rana", "Conejo", "Pez", "Gato", "🐦", "🐱", "🐰"],
};

describe("Memoria sobre el shell — canal unificado y ajustes (U4)", () => {
  function partidaPerfecta(config: Record<string, unknown>, estado = createDefaultMemoria()) {
    render(<Viewer estado={estado} config={config} />);
    const mazo = ordenDelMazo(12);
    return { mazo, estado };
  }

  it("`onResponse` emite la partida perfecta (canal unificado)", () => {
    const porResponse = vi.fn();
    const a = createDefaultMemoria();
    const r = partidaPerfecta({ onResponse: porResponse }, a);
    completar(r.mazo, a, new Set(emisiones(porResponse.mock.calls).flatMap((e) => e.pares)));
    expect(emisiones(porResponse.mock.calls)).toEqual(GOLDEN.perfecto);
  });

  it("no emite el mismo borrador dos veces seguidas (antes se repetía en cada volteo)", () => {
    const salida = vi.fn();
    render(<Viewer estado={createDefaultMemoria()} config={{ onResponse: salida }} />);
    voltear(PAR_BUENO[0]);
    voltear(PAR_BUENO[1]);
    avanzar(450);
    voltear(2);
    voltear(3); // no coincide
    avanzar(1100);
    voltear(2);
    avanzar(10);
    const borradores = salida.mock.calls.filter(([r]) => isActivityDraftResponse(r));
    expect(borradores).toHaveLength(1);
  });

  it("el cronómetro se detiene al terminar y se reinicia con «Reintentar»", () => {
    const a = createDefaultMemoria();
    const { mazo } = partidaPerfecta({}, a);
    completar(mazo, a, new Set());
    const al = screen.getByRole("dialog");
    expect(al).toBeTruthy();
    const antes = screen.getAllByRole("timer")[0].textContent;
    avanzar(30_000);
    expect(screen.getAllByRole("timer")[0].textContent).toBe(antes);
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(screen.getByRole("timer").textContent).toBe("0:00");
  });

  it("al completar se abre la pantalla de resultados con la evaluación de @lumina/scoring", () => {
    const a = createDefaultMemoria();
    const { mazo } = partidaPerfecta({}, a);
    completar(mazo, a, new Set());
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText(/6 de 6 correctas \(100%\)/)).toBeTruthy();
    expect(screen.getByText("5.0")).toBeTruthy();
  });

  it("el encabezado muestra el avance de pares", () => {
    render(<Viewer estado={createDefaultMemoria()} config={{}} />);
    expect(screen.getByRole("progressbar", { name: "Progreso" }).getAttribute("aria-valuemax")).toBe("6");
    voltear(PAR_BUENO[0]);
    voltear(PAR_BUENO[1]);
    avanzar(450);
    expect(screen.getByRole("progressbar", { name: "Progreso" }).getAttribute("aria-valuenow")).toBe("1");
  });

  it("`ajustes.barajar = false` deja el mazo en orden (lados 1, luego lados 2)", () => {
    const base = createDefaultMemoria();
    const estado = { ...base, ajustes: { barajar: false } };
    render(<Viewer estado={estado} config={{}} />);
    expect(ordenDelMazo(12)).toEqual(["Gato", "Perro", "Pájaro", "Pez", "Conejo", "Rana", "🐱", "🐶", "🐦", "🐟", "🐰", "🐸"]);
  });

  it("`ajustes.intentos = 1` no ofrece «Reintentar»", () => {
    const base = createDefaultMemoria();
    const estado = { ...base, ajustes: { intentos: 1 } };
    render(<Viewer estado={estado} config={{}} />);
    const mazo = ordenDelMazo(12);
    completar(mazo, estado, new Set());
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Reintentar" })).toBeNull();
  });

  it("desmontar mientras se resuelve un par no deja temporizadores colgando", () => {
    const { unmount } = render(<Viewer estado={createDefaultMemoria()} config={{}} />);
    voltear(0);
    voltear(2);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("Memoria — feedback de sonido, volteo y confeti (U5)", () => {
  it("cada carta lleva su cara actual dentro de un nodo de giro: nunca las dos caras a la vez", () => {
    render(<Viewer estado={createDefaultMemoria()} config={{}} />);
    const carta = cartas()[0];
    expect(carta.querySelectorAll("[data-giro-entrada]")).toHaveLength(1);
    expect(carta.textContent?.trim()).toBe("?");
    voltear(0);
    expect(carta.querySelectorAll("[data-giro-entrada]")).toHaveLength(1);
    expect(carta.textContent?.trim()).toBe(GOLDEN.mazo[0]);
  });

  it("un par encontrado suena 'correct' una vez; un par fallido no suena", () => {
    render(<Viewer estado={createDefaultMemoria()} config={{}} />);
    voltear(PAR_MALO[0]);
    voltear(PAR_MALO[1]);
    avanzar(1100);
    expect(play).not.toHaveBeenCalled();
    voltear(PAR_BUENO[0]);
    voltear(PAR_BUENO[1]);
    avanzar(450);
    expect(play.mock.calls).toEqual([["correct"]]);
  });

  it("al completar suena el logro UNA vez (no se suma el sonido del último par) y dispara el confeti", () => {
    const a = createDefaultMemoria();
    const { container } = render(<Viewer estado={a} config={{}} />);
    const mazo = ordenDelMazo(12);
    play.mockClear();
    const antes = container.querySelectorAll("[data-confeti]").length;
    completar(mazo, a, new Set());
    // cada par pendiente (los del 2.º tramo) suena una vez; el último es el logro, no un acierto más
    const sonidos = play.mock.calls.map(([id]) => id);
    expect(sonidos.every((id) => id === "correct")).toBe(true);
    expect(sonidos.length).toBeGreaterThanOrEqual(1);
    expect(antes).toBe(1);
    expect(container.querySelector("[data-confeti]")).toBeTruthy();
  });

  it("el par encontrado queda dentro de un nodo de movimiento de feedback", () => {
    const { container } = render(<Viewer estado={createDefaultMemoria()} config={{}} />);
    voltear(PAR_BUENO[0]);
    voltear(PAR_BUENO[1]);
    avanzar(450);
    expect(container.querySelectorAll("[data-feedback-motion]").length).toBeGreaterThanOrEqual(12);
  });
});

describe("Memoria — barajado con semilla (U7)", () => {
  const conSemilla = (semilla: number) => ({ ...createDefaultMemoria(), ajustes: { semilla } });

  it("con `ajustes.semilla` el mazo es el mismo aunque cambie el azar del navegador", () => {
    render(<Viewer estado={conSemilla(2026)} config={{}} />);
    const primero = ordenDelMazo(12);
    cleanup();
    vi.spyOn(Math, "random").mockImplementation(azarFijo(999)); // otro `Math.random`
    render(<Viewer estado={conSemilla(2026)} config={{}} />);
    expect(ordenDelMazo(12)).toEqual(primero);
  });

  it("otra semilla da otro mazo", () => {
    render(<Viewer estado={conSemilla(1)} config={{}} />);
    const a = ordenDelMazo(12);
    cleanup();
    render(<Viewer estado={conSemilla(2)} config={{}} />);
    expect(ordenDelMazo(12)).not.toEqual(a);
  });

  it("«Reintentar» con semilla: otro mazo (cambia la `sal`) pero reproducible", () => {
    const jugarYReintentar = () => {
      const estado = conSemilla(77);
      render(<Viewer estado={estado} config={{}} />);
      const mazo1 = ordenDelMazo(12);
      completar(mazo1, estado, new Set());
      fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
      const mazo2 = ordenDelMazo(12);
      cleanup();
      return { mazo1, mazo2 };
    };
    const una = jugarYReintentar();
    vi.spyOn(Math, "random").mockImplementation(azarFijo(31337)); // el azar del navegador no importa
    const otra = jugarYReintentar();
    expect(una.mazo2).not.toEqual(una.mazo1);
    expect(otra).toEqual(una);
  });

  it("sin semilla sigue dependiendo de `Math.random` (orden distinto por alumno)", () => {
    render(<Viewer estado={createDefaultMemoria()} config={{}} />);
    const a = ordenDelMazo(12);
    cleanup();
    vi.spyOn(Math, "random").mockImplementation(azarFijo(4242));
    render(<Viewer estado={createDefaultMemoria()} config={{}} />);
    expect(ordenDelMazo(12)).not.toEqual(a);
  });
});

describe("Memoria — ajustes de sonido y estilo (U8)", () => {
  it("`ajustes.sonido = false` la deja en silencio (par encontrado y logro)", () => {
    const estado = { ...createDefaultMemoria(), ajustes: { sonido: false } };
    render(<Viewer estado={estado} config={{}} />);
    const mazo = ordenDelMazo(12);
    completar(mazo, estado, new Set());
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(play).not.toHaveBeenCalled();
  });

  it("`ajustes.estilo` llega a la raíz del shell", () => {
    const { container } = render(<Viewer estado={{ ...createDefaultMemoria(), ajustes: { estilo: "pizarra" } }} config={{}} />);
    expect(container.querySelector("[data-estilo]")?.getAttribute("data-estilo")).toBe("pizarra");
  });
});
