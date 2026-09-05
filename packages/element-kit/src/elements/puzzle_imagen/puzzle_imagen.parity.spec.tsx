import { describe, expect, it } from "vitest";
import { render, within } from "@testing-library/react";
import { evaluateActivityResponse } from "@lumina/scoring";
import {
  PuzzleImagenEditor as LegacyPuzzleImagenEditor,
  PuzzleImagenViewer as LegacyPuzzleImagenViewer,
  createDefaultPuzzleImagen,
} from "lumina-frontend/activities/puzzle-imagen";
import { elementRegistry } from "../../index.js";
import type { ElementDefinition } from "../../contract.js";
import { puzzleImagenDefinition, evaluarPuzzleImagen } from "./puzzle_imagen-definition.js";
import type { PuzzleImagenConfig, PuzzleImagenEstado } from "./puzzle_imagen-types.js";

function withFixedRandom<T>(fn: () => T): T {
  const original = Math.random;
  let i = 0;
  const seq = [0.11, 0.87, 0.32, 0.64, 0.19, 0.73, 0.41, 0.58, 0.26, 0.91];
  Math.random = () => seq[i++ % seq.length]!;
  try {
    return fn();
  } finally {
    Math.random = original;
  }
}

function snapshotVisible(container: HTMLElement) {
  return {
    text: container.textContent?.replace(/\s+/g, " ").trim(),
    headings: [...container.querySelectorAll("h1,h2,h3,h4,span")].map(
      (el) => el.textContent?.trim(),
    ),
    buttons: [...container.querySelectorAll("button")].map((el) =>
      el.textContent?.trim(),
    ),
  };
}

function casoPerfecto() {
  const a = createDefaultPuzzleImagen();
    const n = a.configuracion.filas * a.configuracion.columnas;
    return { actividad: a, respuesta: { slots: Array.from({ length: n }, (_, i) => i) } };
}

function casoIncorrecto() {
  const a = createDefaultPuzzleImagen();
    const n = a.configuracion.filas * a.configuracion.columnas;
    return { actividad: a, respuesta: { slots: Array.from({ length: n }, (_, i) => n - 1 - i) } };
}

describe("PuzzleImagen — paridad ElementDefinition vs legacy (E2.4)", () => {
  it("crearPorDefecto envuelve createDefaultPuzzleImagen", () => {
    const fromDef = puzzleImagenDefinition.crearPorDefecto();
    const fromLegacy = createDefaultPuzzleImagen();
    expect(fromDef).toEqual(fromLegacy);
    expect(fromDef.tipo).toBe("puzzle_imagen");
  });

  it("misma actividad + misma respuesta → mismo correct, score y details", () => {
    for (const [nombre, caso] of [
      ["perfecto", casoPerfecto()],
      ["incorrecto", casoIncorrecto()],
    ] as const) {
      const expected = evaluateActivityResponse(
        "puzzle_imagen",
        caso.actividad,
        caso.respuesta,
      );
      const viaKit = evaluarPuzzleImagen(caso.actividad, caso.respuesta);
      expect(viaKit.correct, nombre).toBe(expected.correct);
      expect(viaKit.score, nombre).toBe(expected.score);
      expect(viaKit.details, nombre).toEqual(expected.details);
      expect(puzzleImagenDefinition.puntuacion(caso.actividad, caso.respuesta), nombre).toBe(
        expected.score,
      );
    }
  });

  it("Editor nuevo y viejo producen el mismo DOM visible", () => {
    const actividad = createDefaultPuzzleImagen();
    const NewEditor = puzzleImagenDefinition.Editor;
    const legacy = withFixedRandom(() =>
      render(<LegacyPuzzleImagenEditor actividad={actividad} />),
    );
    const next = withFixedRandom(() =>
      render(
        <NewEditor estado={actividad} config={{}} onChange={() => undefined} />,
      ),
    );
    expect(snapshotVisible(next.container)).toEqual(
      snapshotVisible(legacy.container),
    );
    expect(within(next.container).getByText("Puzzle de imagen")).toBeTruthy();
    expect(within(legacy.container).getByText("Puzzle de imagen")).toBeTruthy();
    legacy.unmount();
    next.unmount();
  });

  it("Viewer nuevo y viejo producen el mismo DOM visible", () => {
    const actividad = createDefaultPuzzleImagen();
    const NewViewer = puzzleImagenDefinition.Viewer;
    const legacy = withFixedRandom(() =>
      render(<LegacyPuzzleImagenViewer actividad={actividad} />),
    );
    const next = withFixedRandom(() =>
      render(<NewViewer estado={actividad} config={{}} />),
    );
    expect(snapshotVisible(next.container)).toEqual(
      snapshotVisible(legacy.container),
    );
    legacy.unmount();
    next.unmount();
  });

  it("está registrado en el registry con puntuacion y apariencia", () => {
    const def = elementRegistry.obtener("puzzle_imagen") as
      | ElementDefinition<PuzzleImagenEstado, PuzzleImagenConfig>
      | undefined;
    expect(def).toBe(puzzleImagenDefinition);
    expect(def?.puntuacion).toBeTypeOf("function");
    expect(def?.apariencia).toEqual({
      color: false,
      tipografia: false,
      animacion: false,
    });
    expect(def?.puntuacion).toBe(puzzleImagenDefinition.puntuacion);
  });
});
