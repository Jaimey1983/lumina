import { describe, expect, it } from "vitest";
import { render, within } from "@testing-library/react";
import { evaluateActivityResponse } from "@lumina/scoring";
import {
  HistoriaRamificadaEditor as LegacyHistoriaRamificadaEditor,
  HistoriaRamificadaViewer as LegacyHistoriaRamificadaViewer,
  createDefaultHistoriaRamificada,
} from "lumina-frontend/activities/historia-ramificada";
import { elementRegistry } from "../../index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { historiaRamificadaDefinition, evaluarHistoriaRamificada } from "./historia_ramificada-definition.js";
import type { HistoriaRamificadaConfig, HistoriaRamificadaEstado } from "./historia_ramificada-types.js";

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
  const a = createDefaultHistoriaRamificada();
    return { actividad: a, respuesta: { historial: [{ nodoId: "nodo-final-bueno" }] } };
}

function casoIncorrecto() {
  const a = createDefaultHistoriaRamificada();
    return { actividad: a, respuesta: { historial: [{ nodoId: "nodo-pueblo" }] } };
}

describe("HistoriaRamificada — paridad ElementDefinition vs legacy (E2.4)", () => {
  it("crearPorDefecto envuelve createDefaultHistoriaRamificada", () => {
    const fromDef = historiaRamificadaDefinition.crearPorDefecto();
    const fromLegacy = createDefaultHistoriaRamificada();
    expect(fromDef).toEqual(fromLegacy);
    expect(fromDef.tipo).toBe("historia_ramificada");
  });

  it("misma actividad + misma respuesta → mismo correct, score y details", () => {
    for (const [nombre, caso] of [
      ["perfecto", casoPerfecto()],
      ["incorrecto", casoIncorrecto()],
    ] as const) {
      const expected = evaluateActivityResponse(
        "historia_ramificada",
        caso.actividad,
        caso.respuesta,
      );
      const viaKit = evaluarHistoriaRamificada(caso.actividad, caso.respuesta);
      expect(viaKit.correct, nombre).toBe(expected.correct);
      expect(viaKit.score, nombre).toBe(expected.score);
      expect(viaKit.details, nombre).toEqual(expected.details);
      expect(historiaRamificadaDefinition.puntuacion(caso.actividad, caso.respuesta), nombre).toBe(
        expected.score,
      );
    }
  });

  it("Editor nuevo y viejo producen el mismo DOM visible", () => {
    const actividad = createDefaultHistoriaRamificada();
    const NewEditor = historiaRamificadaDefinition.Editor;
    const legacy = withFixedRandom(() =>
      render(<LegacyHistoriaRamificadaEditor actividad={actividad} />),
    );
    const next = withFixedRandom(() =>
      render(
        <NewEditor estado={actividad} config={{}} onChange={() => undefined} />,
      ),
    );
    expect(snapshotVisible(next.container)).toEqual(
      snapshotVisible(legacy.container),
    );
    expect(within(next.container).getByText("+ Nodo")).toBeTruthy();
    expect(within(legacy.container).getByText("+ Nodo")).toBeTruthy();
    legacy.unmount();
    next.unmount();
  });

  it("Viewer nuevo y viejo producen el mismo DOM visible", () => {
    const actividad = createDefaultHistoriaRamificada();
    const NewViewer = historiaRamificadaDefinition.Viewer;
    const legacy = withFixedRandom(() =>
      render(<LegacyHistoriaRamificadaViewer actividad={actividad} />),
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
    const def = elementRegistry.obtener("historia_ramificada") as
      | ElementDefinition<HistoriaRamificadaEstado, HistoriaRamificadaConfig>
      | undefined;
    expect(def).toBe(historiaRamificadaDefinition);
    expect(def?.puntuacion).toBeTypeOf("function");
    expect(def?.apariencia).toEqual({
      color: false,
      tipografia: false,
      animacion: false,
    });
    expect(def?.puntuacion).toBe(historiaRamificadaDefinition.puntuacion);
  });
});
