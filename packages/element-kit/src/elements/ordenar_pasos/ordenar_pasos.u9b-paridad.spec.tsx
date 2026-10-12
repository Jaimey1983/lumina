/**
 * U9b.4 — paridad de Ordenar pasos contra su comportamiento ANTERIOR a migrar al
 * `ActivityShell` (Regla 7): orden inicial mezclado, cómo se reordena, qué respuesta sale (los
 * ids en el orden del alumno), el sonido, el bloqueo y lo que `@lumina/scoring` hace con ella.
 *
 * El arrastre se simula entregando el evento de dnd-kit (`onDragEnd` con `{ active, over }`) a
 * través de un `DndContext` falso: se fija la LÓGICA, no el gesto.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateActivityResponse } from "@lumina/scoring";
import type { OrderSteps } from "@lumina/types/slide";

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

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { OrderStepsViewer as ViewerComponente } from "../../activities/_classic/index.js";
import { ordenarPasosDefinition } from "./ordenar_pasos-definition.js";

type Props = { estado: unknown; config: Record<string, unknown> };
const Viewer = ordenarPasosDefinition.Viewer as unknown as (p: Props) => React.ReactElement;

beforeEach(() => {
  play.mockClear();
  let i = 0;
  const seq = [0.11, 0.87, 0.32, 0.64, 0.19, 0.73, 0.41, 0.58, 0.26, 0.91];
  vi.spyOn(Math, "random").mockImplementation(() => seq[i++ % seq.length]!);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  captura.alSoltar = null;
});

const pasos = (parche: Partial<OrderSteps> & { mostrarNumeros?: boolean } = {}): OrderSteps =>
  ({
    tipo: "ordenar_pasos",
    instruccion: "Ordena el proceso.",
    pasos: [
      { id: "s1", contenido: "Hervir agua", ordenCorrecto: 1 },
      { id: "s2", contenido: "Echar pasta", ordenCorrecto: 2 },
      { id: "s3", contenido: "Escurrir", ordenCorrecto: 3 },
      { id: "s4", contenido: "Servir", ordenCorrecto: 4 },
    ],
    ...parche,
  }) as OrderSteps;

const ID: Record<string, string> = { "Hervir agua": "s1", "Echar pasta": "s2", Escurrir: "s3", Servir: "s4" };
const mover = (texto: string, sobre: string | null) =>
  act(() => captura.alSoltar!({ active: { id: ID[texto]! }, over: sobre ? { id: ID[sobre] ?? sobre } : null }));
/** Textos de los pasos, en el orden visible. */
const orden = () =>
  Object.keys(ID)
    .map((t) => ({ t, n: screen.queryByText(t) }))
    .filter((x) => x.n)
    .sort((a, b) => (a.n!.compareDocumentPosition(b.n!) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
    .map((x) => x.t);
const enviar = () => screen.getByRole("button", { name: "Enviar" });
const CORRECTO = ["Hervir agua", "Echar pasta", "Escurrir", "Servir"];

describe("Ordenar pasos — paridad con el comportamiento anterior (U9b.4)", () => {
  it("muestra la instrucción y los pasos mezclados (azar fijo)", () => {
    render(<Viewer estado={pasos()} config={{}} />);
    expect(screen.getByText("Ordena el proceso.")).toBeTruthy();
    expect(orden()).toEqual(["Echar pasta", "Servir", "Escurrir", "Hervir agua"]); // medido con el viejo
  });

  it("los números 1…n solo aparecen con `mostrarNumeros` (si falta, no se ven)", () => {
    const { unmount } = render(<Viewer estado={pasos({ mostrarNumeros: true })} config={{}} />);
    expect(["1", "2", "3", "4"].every((n) => screen.queryByText(n))).toBe(true);
    unmount();
    render(<Viewer estado={pasos()} config={{}} />);
    expect(screen.queryByText("1")).toBeNull();
  });

  it("soltar un paso sobre otro lo mueve a esa posición; sobre sí mismo o sin destino no hace nada", () => {
    render(<Viewer estado={pasos()} config={{}} />);
    const antes = orden();
    mover("Servir", "Servir");
    mover("Servir", null);
    expect(orden()).toEqual(antes);
    mover("Hervir agua", "Servir"); // el último pasa a la posición de «Servir» (segunda)
    expect(orden()).toEqual(["Echar pasta", "Hervir agua", "Servir", "Escurrir"]);
  });

  it("«Enviar» siempre está habilitado y emite los ids en el orden del alumno, una vez", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={pasos()} config={{ onResponse }} />);
    expect((enviar() as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(enviar());
    expect(onResponse.mock.calls).toEqual([[["s2", "s4", "s3", "s1"]]]);
    expect(screen.queryByRole("button", { name: "Enviar" })).toBeNull();
  });

  it("al enviar queda «¡Respuesta enviada!» y ya no se puede reordenar", () => {
    render(<Viewer estado={pasos()} config={{}} />);
    fireEvent.click(enviar());
    expect(screen.getByText(/¡Respuesta enviada!/)).toBeTruthy();
    const antes = orden();
    mover("Hervir agua", "Servir");
    expect(orden()).toEqual(antes);
  });

  it("sonido: `correct` con el orden correcto y `wrong` si no", () => {
    const { unmount } = render(<Viewer estado={pasos()} config={{}} />);
    // De [s2,s4,s3,s1] a [s1,s2,s3,s4]: dos movimientos.
    mover("Hervir agua", "Echar pasta");
    mover("Servir", "Escurrir");
    expect(orden()).toEqual(CORRECTO);
    fireEvent.click(enviar());
    expect(play.mock.calls).toEqual([["correct"]]);
    unmount();
    play.mockClear();
    render(<Viewer estado={pasos()} config={{}} />);
    fireEvent.click(enviar());
    expect(play.mock.calls).toEqual([["wrong"]]);
  });

  it("calificación con @lumina/scoring: orden correcto 5, invertido nota mínima, mitad (2,5)", () => {
    const a = pasos();
    const nota = (ids: string[]) => {
      const ev = evaluateActivityResponse("ordenar_pasos", a, ids);
      return { correct: ev.correct, score: ev.score };
    };
    expect(nota(["s1", "s2", "s3", "s4"])).toEqual({ correct: true, score: 5 });
    expect(nota(["s4", "s3", "s2", "s1"])).toEqual({ correct: false, score: 1 });
    expect(nota(["s1", "s2", "s4", "s3"])).toEqual({ correct: false, score: 2.5 });
  });

  it("el componente reinicia el orden al cambiar `editorSyncKey`; por el registro NO", () => {
    const a = pasos();
    const { rerender } = render(<ViewerComponente activity={a} editorSyncKey="s1" />);
    fireEvent.click(enviar());
    rerender(<ViewerComponente activity={a} editorSyncKey="s2" />);
    expect(screen.queryByText(/¡Respuesta enviada!/)).toBeNull();
    cleanup();
    const r2 = render(<Viewer estado={a} config={{ editorSyncKey: "s1" }} />);
    fireEvent.click(enviar());
    r2.rerender(<Viewer estado={a} config={{ editorSyncKey: "s2" }} />);
    expect(screen.getByText(/¡Respuesta enviada!/)).toBeTruthy();
  });

  it("cambiar la identidad de `pasos` (p. ej. al editar) vuelve a mezclar y reabre el envío", () => {
    const { rerender } = render(<ViewerComponente activity={pasos()} />);
    fireEvent.click(enviar());
    rerender(<ViewerComponente activity={pasos()} />);
    expect(screen.queryByText(/¡Respuesta enviada!/)).toBeNull();
  });
});
