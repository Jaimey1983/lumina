import { describe, expect, it } from "vitest";
import { render, within } from "@testing-library/react";
import { evaluateActivityResponse } from "@lumina/scoring";
import {
  PuzzlePalabrasEditor as LegacyPuzzlePalabrasEditor,
  PuzzlePalabrasViewer as LegacyPuzzlePalabrasViewer,
  createDefaultPuzzlePalabras,
} from "lumina-frontend/activities/puzzle-palabras";
import { elementRegistry } from "../../index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { puzzlePalabrasDefinition, evaluarPuzzlePalabras } from "./puzzle_palabras-definition.js";
import type { PuzzlePalabrasConfig, PuzzlePalabrasEstado } from "./puzzle_palabras-types.js";

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
  const a = createDefaultPuzzlePalabras();
    return {
      actividad: a,
      respuesta: { tokensPorOracion: a.oraciones.map((o) => o.texto.trim().split(/\s+/)) },
    };
}

function casoIncorrecto() {
  const a = createDefaultPuzzlePalabras();
    return { actividad: a, respuesta: { tokensPorOracion: a.oraciones.map(() => ["x"]) } };
}

describe("PuzzlePalabras — paridad ElementDefinition vs legacy (E2.4)", () => {
  it("crearPorDefecto envuelve createDefaultPuzzlePalabras", () => {
    const fromDef = puzzlePalabrasDefinition.crearPorDefecto();
    const fromLegacy = createDefaultPuzzlePalabras();
    expect(fromDef).toEqual(fromLegacy);
    expect(fromDef.tipo).toBe("puzzle_palabras");
  });

  it("misma actividad + misma respuesta → mismo correct, score y details", () => {
    for (const [nombre, caso] of [
      ["perfecto", casoPerfecto()],
      ["incorrecto", casoIncorrecto()],
    ] as const) {
      const expected = evaluateActivityResponse(
        "puzzle_palabras",
        caso.actividad,
        caso.respuesta,
      );
      const viaKit = evaluarPuzzlePalabras(caso.actividad, caso.respuesta);
      expect(viaKit.correct, nombre).toBe(expected.correct);
      expect(viaKit.score, nombre).toBe(expected.score);
      expect(viaKit.details, nombre).toEqual(expected.details);
      expect(puzzlePalabrasDefinition.puntuacion(caso.actividad, caso.respuesta), nombre).toBe(
        expected.score,
      );
    }
  });

  it("Editor nuevo y viejo producen el mismo DOM visible", () => {
    const actividad = createDefaultPuzzlePalabras();
    const NewEditor = puzzlePalabrasDefinition.Editor;
    const legacy = withFixedRandom(() =>
      render(<LegacyPuzzlePalabrasEditor actividad={actividad} />),
    );
    const next = withFixedRandom(() =>
      render(
        <NewEditor estado={actividad} config={{}} onChange={() => undefined} />,
      ),
    );
    expect(snapshotVisible(next.container)).toEqual(
      snapshotVisible(legacy.container),
    );
    expect(within(next.container).getByText("Puzzle de palabras")).toBeTruthy();
    expect(within(legacy.container).getByText("Puzzle de palabras")).toBeTruthy();
    legacy.unmount();
    next.unmount();
  });

  it("Viewer nuevo y viejo producen el mismo DOM visible", () => {
    const actividad = createDefaultPuzzlePalabras();
    const NewViewer = puzzlePalabrasDefinition.Viewer;
    const legacy = withFixedRandom(() =>
      render(<LegacyPuzzlePalabrasViewer actividad={actividad} />),
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
    const def = elementRegistry.obtener("puzzle_palabras") as
      | ElementDefinition<PuzzlePalabrasEstado, PuzzlePalabrasConfig>
      | undefined;
    expect(def).toBe(puzzlePalabrasDefinition);
    expect(def?.puntuacion).toBeTypeOf("function");
    expect(def?.apariencia).toEqual({
      color: false,
      tipografia: false,
      animacion: false,
    });
    expect(def?.puntuacion).toBe(puzzlePalabrasDefinition.puntuacion);
  });
});
