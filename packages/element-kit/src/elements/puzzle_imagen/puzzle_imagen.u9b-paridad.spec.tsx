/**
 * U9b.5 — paridad de Puzzle de imagen contra su comportamiento ANTERIOR a migrar al
 * `ActivityShell` (Regla 7): qué piezas hay en el origen y en el tablero, cómo se mueven, cuándo
 * se puede verificar, qué respuestas salen (BORRADORES `wrapActivityDraftResponse({ slots })` en
 * cada cambio y la respuesta final `{ slots }`) y lo que `@lumina/scoring` hace con ellas.
 *
 * El arrastre se simula entregando el evento de dnd-kit (`onDragEnd` con `{ active, over }`) a
 * través de un `DndContext` falso. Los ids (`pieza-<i>`, `slot-<p>`, `origen`) son el contrato
 * del evento. jsdom no tiene layout: se le da un tamaño fijo a todo elemento para que el tablero
 * calcule el tamaño de las piezas.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateActivityResponse, unwrapActivityDraftResponse, isActivityDraftResponse } from "@lumina/scoring";
import type { PuzzleImagenActivity } from "@lumina/types/slide";

type Ev = { active: { id: string }; over: { id: string } | null };
const captura = vi.hoisted(() => ({ alSoltar: null as null | ((e: Ev) => void) }));
vi.mock("@dnd-kit/core", async (original) => {
  const real = await original<typeof import("@dnd-kit/core")>();
  return {
    ...real,
    DndContext: ({ children, onDragEnd }: { children: React.ReactNode; onDragEnd?: (e: Ev) => void }) => {
      captura.alSoltar = onDragEnd ?? null;
      return <>{children}</>;
    },
    DragOverlay: () => null,
  };
});

import { PuzzleImagenViewer as ViewerComponente } from "../../activities/puzzle-imagen/index.js";
import { puzzleImagenDefinition } from "./puzzle_imagen-definition.js";

type Props = { estado: unknown; config: Record<string, unknown> };
const Viewer = puzzleImagenDefinition.Viewer as unknown as (p: Props) => React.ReactElement;

let original: typeof Element.prototype.getBoundingClientRect;
beforeEach(() => {
  original = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = () =>
    ({ left: 0, top: 0, right: 300, bottom: 300, width: 300, height: 300, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
  let i = 0;
  const seq = [0.11, 0.87, 0.32, 0.64, 0.19, 0.73, 0.41, 0.58, 0.26, 0.91];
  vi.spyOn(Math, "random").mockImplementation(() => seq[i++ % seq.length]!);
});
afterEach(() => {
  Element.prototype.getBoundingClientRect = original;
  cleanup();
  vi.restoreAllMocks();
  captura.alSoltar = null;
});

const puzzle = (config: Partial<PuzzleImagenActivity["configuracion"]> = {}): PuzzleImagenActivity => ({
  tipo: "puzzle_imagen",
  configuracion: { filas: 3, columnas: 3, mostrarVista: true, dificultad: "facil", ...config },
  imagen: "data:image/png;base64,AAAA",
});

const soltar = (id: string, sobre: string | null) =>
  act(() => captura.alSoltar!({ active: { id }, over: sobre ? { id: sobre } : null }));

/** Índice de pieza que representa un elemento con imagen de fondo (3×3: posiciones 0/50/100 %). */
const indiceDe = (el: HTMLElement, columnas = 3) => {
  const [x, y] = el.style.backgroundPosition.split(" ").map((v) => parseFloat(v));
  const paso = 100 / (columnas - 1);
  return Math.round(y! / paso) * columnas + Math.round(x! / paso);
};
const piezasEn = (rotulo: string) => {
  const zona = screen.getByText(rotulo).parentElement!;
  return [...zona.querySelectorAll<HTMLElement>("div")]
    .filter((d) => d.style.backgroundImage.includes("url("))
    .map((d) => indiceDe(d));
};
const origen = () => piezasEn("Piezas");
const tablero = () => piezasEn("Armalo aquí");
const verificar = () => screen.getByRole("button", { name: "Verificar" }) as HTMLButtonElement;
const colocarTodas = () => {
  for (let i = 0; i < 9; i++) soltar(`pieza-${i}`, `slot-${i}`);
};
const borradores = (fn: ReturnType<typeof vi.fn>) =>
  fn.mock.calls.filter((c) => isActivityDraftResponse(c[0])).map((c) => (unwrapActivityDraftResponse(c[0]) as { slots: (number | null)[] }).slots);
const finales = (fn: ReturnType<typeof vi.fn>) => fn.mock.calls.filter((c) => !isActivityDraftResponse(c[0])).map((c) => c[0]);

describe("Puzzle de imagen — paridad con el comportamiento anterior (U9b.5)", () => {
  it("sin imagen muestra «Sin imagen configurada»", () => {
    render(<Viewer estado={{ ...puzzle(), imagen: "" }} config={{}} />);
    expect(screen.getByText("Sin imagen configurada")).toBeTruthy();
  });

  it("arranca con todas las piezas mezcladas en «Piezas» (azar fijo) y el tablero vacío", () => {
    render(<Viewer estado={puzzle()} config={{}} />);
    expect(origen()).toEqual([4, 5, 1, 7, 8, 3, 2, 6, 0]); // medido con el viewer viejo
    expect(tablero()).toEqual([]);
    expect(verificar().disabled).toBe(true);
  });

  it("la referencia se ve con `mostrarVista` salvo en dificultad difícil; los números de casilla solo en fácil", () => {
    const { unmount } = render(<Viewer estado={puzzle()} config={{}} />);
    expect(screen.getByAltText("Referencia")).toBeTruthy();
    expect(["1", "2", "3", "4", "5", "6", "7", "8", "9"].every((n) => screen.queryByText(n))).toBe(true);
    unmount();
    render(<Viewer estado={puzzle({ dificultad: "dificil" })} config={{}} />);
    expect(screen.queryByAltText("Referencia")).toBeNull();
    expect(screen.queryByText("1")).toBeNull();
  });

  it("emite un BORRADOR `{ slots }` al montar y otro en cada cambio del tablero", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={puzzle()} config={{ onResponse }} />);
    expect(borradores(onResponse)).toEqual([Array(9).fill(null)]);
    soltar("pieza-3", "slot-0");
    expect(borradores(onResponse).at(-1)).toEqual([3, null, null, null, null, null, null, null, null]);
    expect(borradores(onResponse)).toHaveLength(2);
  });

  it("soltar una pieza en una casilla la saca del origen; de casilla a casilla libera la anterior", () => {
    render(<Viewer estado={puzzle()} config={{}} />);
    soltar("pieza-3", "slot-0");
    expect(origen()).not.toContain(3);
    expect(tablero()).toEqual([3]);
    soltar("pieza-3", "slot-4");
    expect(tablero()).toEqual([3]);
    expect(origen()).toHaveLength(8);
  });

  it("soltar sobre una casilla ocupada devuelve la pieza desplazada al origen", () => {
    render(<Viewer estado={puzzle()} config={{}} />);
    soltar("pieza-3", "slot-0");
    soltar("pieza-8", "slot-0");
    expect(tablero()).toEqual([8]);
    expect(origen()).toContain(3);
    expect(origen()).not.toContain(8);
  });

  it("soltar una pieza del tablero en «origen» la devuelve; sin destino no hace nada", () => {
    render(<Viewer estado={puzzle()} config={{}} />);
    soltar("pieza-3", "slot-0");
    soltar("pieza-3", null);
    expect(tablero()).toEqual([3]);
    soltar("pieza-3", "origen");
    expect(tablero()).toEqual([]);
    expect(origen()).toContain(3);
  });

  it("«Verificar» solo se habilita con TODAS las piezas en el tablero", () => {
    render(<Viewer estado={puzzle()} config={{}} />);
    for (let i = 0; i < 8; i++) soltar(`pieza-${i}`, `slot-${i}`);
    expect(verificar().disabled).toBe(true);
    soltar("pieza-8", "slot-8");
    expect(verificar().disabled).toBe(false);
  });

  it("verificar emite la respuesta FINAL `{ slots }` (no borrador), muestra la nota y deja de emitir borradores", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={puzzle()} config={{ onResponse }} />);
    colocarTodas();
    fireEvent.click(verificar());
    expect(finales(onResponse)).toEqual([{ slots: [0, 1, 2, 3, 4, 5, 6, 7, 8] }]);
    expect(screen.getByText("5.0")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Verificar" })).toBeNull();
    const n = onResponse.mock.calls.length;
    soltar("pieza-0", "slot-1");
    expect(onResponse.mock.calls).toHaveLength(n);
  });

  it("calificación con @lumina/scoring (borrador o final): todo bien 5, todo mal nota mínima, cuatro de nueve (2,8)", () => {
    const a = puzzle();
    const nota = (slots: (number | null)[]) => {
      const ev = evaluateActivityResponse("puzzle_imagen", a, { slots });
      return { correct: ev.correct, score: ev.score };
    };
    expect(nota([0, 1, 2, 3, 4, 5, 6, 7, 8])).toEqual({ correct: true, score: 5 });
    expect(nota([1, 2, 3, 4, 5, 6, 7, 8, 0])).toEqual({ correct: false, score: 1 });
    expect(nota([0, 1, 2, 3, 5, 4, 6, 8, 7])).toEqual({ correct: false, score: 2.8 });
  });

  it("«Reintentar» del resultado vuelve a mezclar y vacía el tablero", () => {
    render(<Viewer estado={puzzle()} config={{}} />);
    colocarTodas();
    fireEvent.click(verificar());
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(tablero()).toEqual([]);
    expect([...origen()].sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(verificar().disabled).toBe(true);
  });

  it("el componente (prop `actividad`) acepta `onResponse` directo", () => {
    const onResponse = vi.fn();
    render(<ViewerComponente actividad={puzzle()} onResponse={onResponse} />);
    expect(onResponse).toHaveBeenCalled();
  });
});
