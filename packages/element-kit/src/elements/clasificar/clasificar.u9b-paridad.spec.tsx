/**
 * U9b.2 — paridad de Clasificar contra su comportamiento ANTERIOR a migrar al `ActivityShell`
 * (Regla 7).
 *
 * El arrastre se simula entregando el evento de dnd-kit (`onDragEnd` con `{ active, over }`) a
 * través de un `DndContext` falso: se fija la LÓGICA (dónde queda cada pieza, cuándo se puede
 * verificar, qué respuesta sale y qué nota recibe), no el gesto. Los ids de las zonas son el
 * contrato del evento: `sin-clasificar` y el `id` de cada categoría.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateActivityResponse } from "@lumina/scoring";
import type { ClasificarActivity } from "@lumina/types/slide";

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

import { ClasificarViewer as ViewerComponente } from "../../activities/clasificar/index.js";
import { clasificarDefinition } from "./clasificar-definition.js";

type Props = { estado: unknown; config: Record<string, unknown> };
const Viewer = clasificarDefinition.Viewer as unknown as (p: Props) => React.ReactElement;

beforeEach(() => {
  let i = 0;
  const seq = [0.11, 0.87, 0.32, 0.64, 0.19, 0.73, 0.41, 0.58, 0.26, 0.91];
  vi.spyOn(Math, "random").mockImplementation(() => seq[i++ % seq.length]!);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  captura.alSoltar = null;
});

const actividad = (config: Partial<ClasificarActivity["configuracion"]> = {}): ClasificarActivity => ({
  tipo: "clasificar",
  configuracion: { columnas: 2, colorCategorias: ["#2563EB", "#16A34A"], permitirReintento: true, ...config },
  categorias: [
    { id: "c1", nombre: "Animales" },
    { id: "c2", nombre: "Plantas" },
  ],
  items: [
    { id: "a", texto: "Perro", categoriaId: "c1" },
    { id: "b", texto: "Gato", categoriaId: "c1" },
    { id: "c", texto: "Rosa", categoriaId: "c2" },
    { id: "d", texto: "Pino", categoriaId: "c2" },
  ],
});
const ID: Record<string, string> = { Perro: "a", Gato: "b", Rosa: "c", Pino: "d" };

function soltar(texto: string, zona: string | null) {
  act(() => captura.alSoltar!({ active: { id: ID[texto]! }, over: zona ? { id: zona } : null }));
}
/** Textos que hay en la columna cuyo encabezado es `nombre` (encabezado + lista dentro de un contenedor). */
const enColumna = (nombre: string) => {
  const cab = screen.getByText(nombre);
  const col = cab.parentElement!;
  // Solo las piezas: los `div` hoja de la columna que no son el encabezado.
  return [...col.querySelectorAll("div")]
    .filter((d) => d !== cab && d.children.length === 0)
    .map((d) => d.textContent!.trim())
    .filter(Boolean);
};
const sinClasificar = () => enColumna("Elementos para clasificar");
const verificar = () => screen.getByRole("button", { name: "Verificar" }) as HTMLButtonElement;
function clasificarTodo(destinos: Record<string, string>) {
  for (const [t, z] of Object.entries(destinos)) soltar(t, z);
}
const BIEN = { Perro: "c1", Gato: "c1", Rosa: "c2", Pino: "c2" };

describe("Clasificar — paridad con el comportamiento anterior (U9b.2)", () => {
  it("muestra el área «Elementos para clasificar» con todas las piezas mezcladas (azar fijo) y las columnas", () => {
    render(<Viewer estado={actividad()} config={{}} />);
    expect(sinClasificar()).toEqual(["Gato", "Pino", "Rosa", "Perro"]); // medido con el viewer viejo
    expect(screen.getByText("Animales")).toBeTruthy();
    expect(screen.getByText("Plantas")).toBeTruthy();
    expect(verificar().disabled).toBe(true);
  });

  it("soltar en una categoría mueve la pieza; en `sin-clasificar` la devuelve; sin destino no hace nada", () => {
    render(<Viewer estado={actividad()} config={{}} />);
    soltar("Perro", "c1");
    expect(enColumna("Animales")).toEqual(["Perro"]);
    expect(sinClasificar()).not.toContain("Perro");
    soltar("Perro", "c2");
    expect(enColumna("Animales")).toEqual([]);
    expect(enColumna("Plantas")).toEqual(["Perro"]);
    soltar("Perro", "sin-clasificar");
    expect(enColumna("Plantas")).toEqual([]);
    expect(sinClasificar()).toContain("Perro");
    soltar("Gato", null);
    expect(sinClasificar()).toContain("Gato");
  });

  it("«Verificar» solo se habilita con TODAS las piezas clasificadas", () => {
    render(<Viewer estado={actividad()} config={{}} />);
    clasificarTodo({ Perro: "c1", Gato: "c1", Rosa: "c2" });
    expect(verificar().disabled).toBe(true);
    soltar("Pino", "c2");
    expect(verificar().disabled).toBe(false);
  });

  it("verificar emite UNA vez `{ ubicaciones }` por `onResponse` (todas las piezas) y muestra la nota", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={actividad()} config={{ onResponse }} />);
    clasificarTodo(BIEN);
    fireEvent.click(verificar());
    expect(onResponse.mock.calls).toEqual([[{ ubicaciones: { a: "c1", b: "c1", c: "c2", d: "c2" } }]]);
    expect(screen.getByText("5.0")).toBeTruthy();
    expect(screen.getByText("¡Muy bien!")).toBeTruthy();
  });

  it("tras verificar desaparecen el área de origen y el botón «Verificar»", () => {
    render(<Viewer estado={actividad()} config={{}} />);
    clasificarTodo(BIEN);
    fireEvent.click(verificar());
    expect(screen.queryByText("Elementos para clasificar")).toBeNull();
    expect(screen.queryByRole("button", { name: "Verificar" })).toBeNull();
  });

  it("una clasificación con errores da nota menor y «Sigue practicando» si no aprueba", () => {
    render(<Viewer estado={actividad()} config={{}} />);
    clasificarTodo({ Perro: "c2", Gato: "c2", Rosa: "c1", Pino: "c1" });
    fireEvent.click(verificar());
    expect(screen.getByText("1.0")).toBeTruthy();
    expect(screen.getByText("Sigue practicando")).toBeTruthy();
  });

  it("calificación con @lumina/scoring: todo bien 5, todo mal nota mínima, mitad 2,5", () => {
    const a = actividad();
    const nota = (u: Record<string, string>) => {
      const ev = evaluateActivityResponse("clasificar", a, { ubicaciones: u });
      return { correct: ev.correct, score: ev.score };
    };
    expect(nota({ a: "c1", b: "c1", c: "c2", d: "c2" })).toEqual({ correct: true, score: 5 });
    expect(nota({ a: "c2", b: "c2", c: "c1", d: "c1" })).toEqual({ correct: false, score: 1 });
    expect(nota({ a: "c1", b: "c2", c: "c2", d: "c1" })).toEqual({ correct: false, score: 2.5 });
  });

  it("«Reintentar» (si `permitirReintento`) devuelve todo al área de origen y quita el resultado", () => {
    render(<Viewer estado={actividad()} config={{}} />);
    clasificarTodo(BIEN);
    fireEvent.click(verificar());
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(screen.queryByText("5.0")).toBeNull();
    expect(sinClasificar().sort()).toEqual(["Gato", "Perro", "Pino", "Rosa"]);
    expect(enColumna("Animales")).toEqual([]);
    expect(verificar().disabled).toBe(true);
  });

  it("con `permitirReintento = false` el resultado no ofrece «Reintentar»", () => {
    render(<Viewer estado={actividad({ permitirReintento: false })} config={{}} />);
    clasificarTodo(BIEN);
    fireEvent.click(verificar());
    expect(screen.getByText("5.0")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Reintentar" })).toBeNull();
  });

  it("el componente (prop `actividad`) acepta `onResponse` directo", () => {
    const onResponse = vi.fn();
    render(<ViewerComponente actividad={actividad()} onResponse={onResponse} />);
    clasificarTodo(BIEN);
    fireEvent.click(verificar());
    expect(onResponse).toHaveBeenCalledTimes(1);
  });
});
