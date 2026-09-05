import { describe, expect, it } from "vitest";
import { render, within } from "@testing-library/react";
import { evaluateActivityResponse } from "@lumina/scoring";
import {
  GlobosEditor as LegacyGlobosEditor,
  GlobosViewer as LegacyGlobosViewer,
  createDefaultGlobos,
} from "lumina-frontend/activities/globos";
import { elementRegistry } from "../../index.js";
import type { ElementDefinition } from "../../contract.js";
import { globosDefinition, evaluarGlobos } from "./globos-definition.js";
import type { GlobosConfig, GlobosEstado } from "./globos-types.js";

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
  const a = createDefaultGlobos();
    return {
      actividad: a,
      respuesta: { puntosObtenidos: a.preguntas.length, puntosMaximos: a.preguntas.length },
    };
}

function casoIncorrecto() {
  const a = createDefaultGlobos();
    return { actividad: a, respuesta: { puntosObtenidos: 0, puntosMaximos: a.preguntas.length } };
}

describe("Globos — paridad ElementDefinition vs legacy (E2.4)", () => {
  it("crearPorDefecto envuelve createDefaultGlobos", () => {
    const fromDef = globosDefinition.crearPorDefecto();
    const fromLegacy = createDefaultGlobos();
    expect(fromDef).toEqual(fromLegacy);
    expect(fromDef.tipo).toBe("globos");
  });

  it("misma actividad + misma respuesta → mismo correct, score y details", () => {
    for (const [nombre, caso] of [
      ["perfecto", casoPerfecto()],
      ["incorrecto", casoIncorrecto()],
    ] as const) {
      const expected = evaluateActivityResponse(
        "globos",
        caso.actividad,
        caso.respuesta,
      );
      const viaKit = evaluarGlobos(caso.actividad, caso.respuesta);
      expect(viaKit.correct, nombre).toBe(expected.correct);
      expect(viaKit.score, nombre).toBe(expected.score);
      expect(viaKit.details, nombre).toEqual(expected.details);
      expect(globosDefinition.puntuacion(caso.actividad, caso.respuesta), nombre).toBe(
        expected.score,
      );
    }
  });

  it("Editor nuevo y viejo producen el mismo DOM visible", () => {
    const actividad = createDefaultGlobos();
    const NewEditor = globosDefinition.Editor;
    const legacy = withFixedRandom(() =>
      render(<LegacyGlobosEditor actividad={actividad} />),
    );
    const next = withFixedRandom(() =>
      render(
        <NewEditor estado={actividad} config={{}} onChange={() => undefined} />,
      ),
    );
    expect(snapshotVisible(next.container)).toEqual(
      snapshotVisible(legacy.container),
    );
    expect(within(next.container).getByText("Globos")).toBeTruthy();
    expect(within(legacy.container).getByText("Globos")).toBeTruthy();
    legacy.unmount();
    next.unmount();
  });

  it("Viewer nuevo y viejo producen el mismo DOM visible", () => {
    const actividad = createDefaultGlobos();
    const NewViewer = globosDefinition.Viewer;
    const legacy = withFixedRandom(() =>
      render(<LegacyGlobosViewer actividad={actividad} />),
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
    const def = elementRegistry.obtener("globos") as
      | ElementDefinition<GlobosEstado, GlobosConfig>
      | undefined;
    expect(def).toBe(globosDefinition);
    expect(def?.puntuacion).toBeTypeOf("function");
    expect(def?.apariencia).toEqual({
      color: false,
      tipografia: false,
      animacion: false,
    });
    expect(def?.puntuacion).toBe(globosDefinition.puntuacion);
  });
});
