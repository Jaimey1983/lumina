import { describe, expect, it } from "vitest";
import { render, within } from "@testing-library/react";
import { evaluateActivityResponse } from "@lumina/scoring";
import {
  SopaLetrasEditor as LegacySopaLetrasEditor,
  SopaLetrasViewer as LegacySopaLetrasViewer,
  createDefaultSopaLetras,
} from "lumina-frontend/activities/sopa-letras";
import { elementRegistry } from "../../index.js";
import type { ElementDefinition } from "../../contract.js";
import { sopaLetrasDefinition, evaluarSopaLetras } from "./sopa_letras-definition.js";
import type { SopaLetrasConfig, SopaLetrasEstado } from "./sopa_letras-types.js";

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
  const a = createDefaultSopaLetras();
    return { actividad: a, respuesta: { encontradas: a.palabras.map((p) => p.texto) } };
}

function casoIncorrecto() {
  const a = createDefaultSopaLetras();
    return { actividad: a, respuesta: { encontradas: [] } };
}

describe("SopaLetras — paridad ElementDefinition vs legacy (E2.4)", () => {
  it("crearPorDefecto envuelve createDefaultSopaLetras", () => {
    const fromDef = sopaLetrasDefinition.crearPorDefecto();
    const fromLegacy = createDefaultSopaLetras();
    expect(fromDef).toEqual(fromLegacy);
    expect(fromDef.tipo).toBe("sopa_letras");
  });

  it("misma actividad + misma respuesta → mismo correct, score y details", () => {
    for (const [nombre, caso] of [
      ["perfecto", casoPerfecto()],
      ["incorrecto", casoIncorrecto()],
    ] as const) {
      const expected = evaluateActivityResponse(
        "sopa_letras",
        caso.actividad,
        caso.respuesta,
      );
      const viaKit = evaluarSopaLetras(caso.actividad, caso.respuesta);
      expect(viaKit.correct, nombre).toBe(expected.correct);
      expect(viaKit.score, nombre).toBe(expected.score);
      expect(viaKit.details, nombre).toEqual(expected.details);
      expect(sopaLetrasDefinition.puntuacion(caso.actividad, caso.respuesta), nombre).toBe(
        expected.score,
      );
    }
  });

  it("Editor nuevo y viejo producen el mismo DOM visible", () => {
    const actividad = createDefaultSopaLetras();
    const NewEditor = sopaLetrasDefinition.Editor;
    const legacy = withFixedRandom(() =>
      render(<LegacySopaLetrasEditor actividad={actividad} />),
    );
    const next = withFixedRandom(() =>
      render(
        <NewEditor estado={actividad} config={{}} onChange={() => undefined} />,
      ),
    );
    expect(snapshotVisible(next.container)).toEqual(
      snapshotVisible(legacy.container),
    );
    expect(within(next.container).getByText("Sopa de letras")).toBeTruthy();
    expect(within(legacy.container).getByText("Sopa de letras")).toBeTruthy();
    legacy.unmount();
    next.unmount();
  });

  it("Viewer nuevo y viejo producen el mismo DOM visible", () => {
    const actividad = createDefaultSopaLetras();
    const NewViewer = sopaLetrasDefinition.Viewer;
    const legacy = withFixedRandom(() =>
      render(<LegacySopaLetrasViewer actividad={actividad} />),
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
    const def = elementRegistry.obtener("sopa_letras") as
      | ElementDefinition<SopaLetrasEstado, SopaLetrasConfig>
      | undefined;
    expect(def).toBe(sopaLetrasDefinition);
    expect(def?.puntuacion).toBeTypeOf("function");
    expect(def?.apariencia).toEqual({
      color: false,
      tipografia: false,
      animacion: false,
    });
    expect(def?.puntuacion).toBe(sopaLetrasDefinition.puntuacion);
  });
});
