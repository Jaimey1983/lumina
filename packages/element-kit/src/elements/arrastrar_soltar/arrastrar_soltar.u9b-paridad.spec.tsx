/**
 * U9b.6 — paridad de Arrastrar y soltar contra su comportamiento ANTERIOR a migrar al
 * `ActivityShell` (Regla 7): dónde queda cada elemento, la capacidad máxima de las zonas, qué
 * respuestas salen (BORRADORES `wrapActivityDraftResponse([{ itemId, zoneId }])` en cada
 * colocación y la respuesta final sin envolver), el sonido, el bloqueo y lo que `@lumina/scoring`
 * hace con ellas.
 *
 * El viejo usaba el arrastre nativo de HTML5 (sin teclado ni táctil); el nuevo, dnd-kit. El
 * ayudante `soltar` opera AMBOS mecanismos con el mismo gesto lógico: dispara los eventos HTML5
 * (los entiende el viejo) y entrega el `onDragEnd` de dnd-kit (lo entiende el nuevo, con un
 * `DndContext` falso). El contrato de destino del nuevo: el `id` de cada zona y `disponibles` para
 * el conjunto de elementos sin ubicar.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  evaluateActivityResponse,
  isActivityDraftResponse,
  unwrapActivityDraftResponse,
} from "@lumina/scoring";
import type { DragDrop } from "@lumina/types/slide";

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

import { DragDropActivity } from "../../activities/_classic/index.js";
import { arrastrarSoltarDefinition } from "./arrastrar_soltar-definition.js";

type Props = { estado: unknown; config: Record<string, unknown> };
const Viewer = arrastrarSoltarDefinition.Viewer as unknown as (p: Props) => React.ReactElement;

beforeEach(() => play.mockClear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  captura.alSoltar = null;
});

const actividad = (zonas?: DragDrop["zonas"]): DragDrop => ({
  tipo: "arrastrar_soltar",
  instruccion: "Clasifica los animales.",
  items: [
    { id: "i1", texto: "Perro" },
    { id: "i2", texto: "Gato" },
    { id: "i3", texto: "Pez" },
    { id: "i4", texto: "Atún" },
  ],
  zonas: zonas ?? [
    { id: "z1", etiqueta: "Mamíferos", itemsCorrectos: ["i1", "i2"] },
    { id: "z2", etiqueta: "Peces", itemsCorrectos: ["i3", "i4"] },
  ],
});
const ID: Record<string, string> = { Perro: "i1", Gato: "i2", Pez: "i3", Atún: "i4" };
const ZONA: Record<string, string> = { Mamíferos: "z1", Peces: "z2" };

function soltar(texto: string, destino: string) {
  const store: Record<string, string> = {};
  const dataTransfer = { setData: (k: string, v: string) => void (store[k] = v), getData: (k: string) => store[k] ?? "" };
  const item = screen.getByText(texto);
  const blanco = destino === "disponibles" ? screen.getByText("Elementos disponibles") : screen.getByText(destino);
  fireEvent.dragStart(item, { dataTransfer });
  fireEvent.dragOver(blanco, { dataTransfer });
  fireEvent.drop(blanco, { dataTransfer });
  fireEvent.dragEnd(item, { dataTransfer });
  if (captura.alSoltar) {
    act(() => captura.alSoltar!({ active: { id: ID[texto]! }, over: { id: destino === "disponibles" ? "disponibles" : ZONA[destino]! } }));
  }
}
const enviar = () => screen.getByRole("button", { name: "Enviar" }) as HTMLButtonElement;
const borradores = (fn: ReturnType<typeof vi.fn>) =>
  fn.mock.calls.filter((c) => isActivityDraftResponse(c[0])).map((c) => unwrapActivityDraftResponse(c[0]));
const finales = (fn: ReturnType<typeof vi.fn>) => fn.mock.calls.filter((c) => !isActivityDraftResponse(c[0])).map((c) => c[0]);
const TODO_BIEN: [string, string][] = [["Perro", "Mamíferos"], ["Gato", "Mamíferos"], ["Pez", "Peces"], ["Atún", "Peces"]];

describe("Arrastrar y soltar — paridad con el comportamiento anterior (U9b.6)", () => {
  it("muestra la instrucción, «Elementos disponibles» con todos los elementos y las zonas vacías", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={actividad()} config={{ onResponse }} />);
    expect(screen.getByText("Clasifica los animales.")).toBeTruthy();
    for (const t of ["Perro", "Gato", "Pez", "Atún"]) expect(screen.getByText(t)).toBeTruthy();
    expect(screen.getAllByText("Suelta aquí")).toHaveLength(2);
    expect(enviar().disabled).toBe(true);
    // Al montar no se emite nada.
    expect(onResponse).not.toHaveBeenCalled();
  });

  it("soltar un elemento en una zona lo saca de «disponibles» y emite un BORRADOR con todos los elementos", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={actividad()} config={{ onResponse }} />);
    soltar("Perro", "Mamíferos");
    expect(borradores(onResponse)).toEqual([
      [
        { itemId: "i1", zoneId: "z1" },
        { itemId: "i2", zoneId: null },
        { itemId: "i3", zoneId: null },
        { itemId: "i4", zoneId: null },
      ],
    ]);
    expect(screen.getAllByText("Suelta aquí")).toHaveLength(1);
  });

  it("de zona a zona y de vuelta a «disponibles» emite un borrador por cada movimiento", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={actividad()} config={{ onResponse }} />);
    soltar("Perro", "Mamíferos");
    soltar("Perro", "Peces");
    soltar("Perro", "disponibles");
    const b = borradores(onResponse) as { itemId: string; zoneId: string | null }[][];
    expect(b.map((r) => r[0]!.zoneId)).toEqual(["z1", "z2", null]);
    expect(screen.getAllByText("Suelta aquí")).toHaveLength(2);
  });

  it("una zona con `capacidadMaxima` llena rechaza otro elemento (y no emite)", () => {
    const onResponse = vi.fn();
    const a = actividad([
      { id: "z1", etiqueta: "Mamíferos", itemsCorrectos: ["i1", "i2"], capacidadMaxima: 1 },
      { id: "z2", etiqueta: "Peces", itemsCorrectos: ["i3", "i4"] },
    ]);
    render(<Viewer estado={a} config={{ onResponse }} />);
    soltar("Perro", "Mamíferos");
    soltar("Gato", "Mamíferos");
    expect(borradores(onResponse)).toHaveLength(1);
    expect(screen.getAllByText("Suelta aquí")).toHaveLength(1);
  });

  it("«Enviar» se habilita con TODOS ubicados y el conjunto de «disponibles» lo dice", () => {
    render(<Viewer estado={actividad()} config={{}} />);
    for (const [t, z] of TODO_BIEN.slice(0, 3)) soltar(t, z);
    expect(enviar().disabled).toBe(true);
    soltar("Atún", "Peces");
    expect(enviar().disabled).toBe(false);
    expect(screen.getByText("Todos los elementos están ubicados")).toBeTruthy();
  });

  it("enviar emite la respuesta FINAL (sin envolver) una vez, suena `submit` y bloquea todo", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={actividad()} config={{ onResponse }} />);
    for (const [t, z] of TODO_BIEN) soltar(t, z);
    fireEvent.click(enviar());
    expect(finales(onResponse)).toEqual([
      [
        { itemId: "i1", zoneId: "z1" },
        { itemId: "i2", zoneId: "z1" },
        { itemId: "i3", zoneId: "z2" },
        { itemId: "i4", zoneId: "z2" },
      ],
    ]);
    expect(play.mock.calls).toEqual([["submit"]]);
    expect(screen.getByText(/¡Respuesta enviada!/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Enviar" })).toBeNull();
    const n = onResponse.mock.calls.length;
    soltar("Perro", "Peces");
    expect(onResponse.mock.calls).toHaveLength(n);
  });

  it("calificación con @lumina/scoring (borrador o final): todo bien 5, todo mal 1, mitad 2,5", () => {
    const a = actividad();
    const nota = (z: [string, string][]) => {
      const ev = evaluateActivityResponse("arrastrar_soltar", a, z.map(([itemId, zoneId]) => ({ itemId, zoneId })));
      return { correct: ev.correct, score: ev.score };
    };
    expect(nota([["i1", "z1"], ["i2", "z1"], ["i3", "z2"], ["i4", "z2"]])).toEqual({ correct: true, score: 5 });
    expect(nota([["i1", "z2"], ["i2", "z2"], ["i3", "z1"], ["i4", "z1"]])).toEqual({ correct: false, score: 1 });
    expect(nota([["i1", "z1"], ["i2", "z1"], ["i3", "z1"], ["i4", "z1"]])).toEqual({ correct: false, score: 2.5 });
  });

  it("el componente reinicia con `editorSyncKey` y al cambiar la identidad de `items`; por el registro NO se reenvía la clave", () => {
    const a = actividad();
    const { rerender } = render(<DragDropActivity actividad={a} modo="viewer" editorSyncKey="s1" />);
    soltar("Perro", "Mamíferos");
    rerender(<DragDropActivity actividad={a} modo="viewer" editorSyncKey="s2" />);
    expect(screen.getAllByText("Suelta aquí")).toHaveLength(2);
    soltar("Perro", "Mamíferos");
    rerender(<DragDropActivity actividad={actividad()} modo="viewer" editorSyncKey="s2" />);
    expect(screen.getAllByText("Suelta aquí")).toHaveLength(2);
    cleanup();
    const r2 = render(<Viewer estado={a} config={{ editorSyncKey: "s1" }} />);
    soltar("Perro", "Mamíferos");
    r2.rerender(<Viewer estado={a} config={{ editorSyncKey: "s2" }} />);
    expect(screen.getAllByText("Suelta aquí")).toHaveLength(1);
  });

  it("el modo `editor` muestra la vista previa con los elementos y las zonas (sin interacción)", () => {
    render(<DragDropActivity actividad={actividad()} modo="editor" />);
    expect(screen.getByText("Elementos")).toBeTruthy();
    expect(screen.getByText("Zonas")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Enviar" })).toBeNull();
  });
});
