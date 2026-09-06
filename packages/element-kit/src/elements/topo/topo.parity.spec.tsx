import { describe, expect, it } from "vitest";
import { render, within } from "@testing-library/react";
import { evaluateActivityResponse } from "@lumina/scoring";
import {
  TopoEditor as LegacyTopoEditor,
  TopoViewer as LegacyTopoViewer,
  createDefaultTopo,
} from "lumina-frontend/activities/topo";
import { elementRegistry } from "../../index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { topoDefinition, evaluarTopo } from "./topo-definition.js";
import type { TopoConfig, TopoEstado } from "./topo-types.js";

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
  const a = createDefaultTopo();
    return {
      actividad: a,
      respuesta: { puntosObtenidos: a.preguntas.length, puntosMaximos: a.preguntas.length },
    };
}

function casoIncorrecto() {
  const a = createDefaultTopo();
    return { actividad: a, respuesta: { puntosObtenidos: 0, puntosMaximos: a.preguntas.length } };
}

describe("Topo — paridad ElementDefinition vs legacy (E2.4)", () => {
  it("crearPorDefecto envuelve createDefaultTopo", () => {
    const fromDef = topoDefinition.crearPorDefecto();
    const fromLegacy = createDefaultTopo();
    expect(fromDef).toEqual(fromLegacy);
    expect(fromDef.tipo).toBe("topo");
  });

  it("misma actividad + misma respuesta → mismo correct, score y details", () => {
    for (const [nombre, caso] of [
      ["perfecto", casoPerfecto()],
      ["incorrecto", casoIncorrecto()],
    ] as const) {
      const expected = evaluateActivityResponse(
        "topo",
        caso.actividad,
        caso.respuesta,
      );
      const viaKit = evaluarTopo(caso.actividad, caso.respuesta);
      expect(viaKit.correct, nombre).toBe(expected.correct);
      expect(viaKit.score, nombre).toBe(expected.score);
      expect(viaKit.details, nombre).toEqual(expected.details);
      expect(topoDefinition.puntuacion(caso.actividad, caso.respuesta), nombre).toBe(
        expected.score,
      );
    }
  });

  it("Editor nuevo y viejo producen el mismo DOM visible", () => {
    const actividad = createDefaultTopo();
    const NewEditor = topoDefinition.Editor;
    const legacy = withFixedRandom(() =>
      render(<LegacyTopoEditor actividad={actividad} />),
    );
    const next = withFixedRandom(() =>
      render(
        <NewEditor estado={actividad} config={{}} onChange={() => undefined} />,
      ),
    );
    expect(snapshotVisible(next.container)).toEqual(
      snapshotVisible(legacy.container),
    );
    expect(within(next.container).getByText("Golpea al topo")).toBeTruthy();
    expect(within(legacy.container).getByText("Golpea al topo")).toBeTruthy();
    legacy.unmount();
    next.unmount();
  });

  it("Viewer nuevo y viejo producen el mismo DOM visible", () => {
    const actividad = createDefaultTopo();
    const NewViewer = topoDefinition.Viewer;
    const legacy = withFixedRandom(() =>
      render(<LegacyTopoViewer actividad={actividad} />),
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
    const def = elementRegistry.obtener("topo") as
      | ElementDefinition<TopoEstado, TopoConfig>
      | undefined;
    expect(def).toBe(topoDefinition);
    expect(def?.puntuacion).toBeTypeOf("function");
    expect(def?.apariencia).toEqual({
      color: false,
      tipografia: false,
      animacion: false,
    });
    expect(def?.puntuacion).toBe(topoDefinition.puntuacion);
  });
});
