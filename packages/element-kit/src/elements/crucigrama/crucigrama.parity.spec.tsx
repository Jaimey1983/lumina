import { describe, expect, it } from "vitest";
import { render, within } from "@testing-library/react";
import { evaluateActivityResponse } from "@lumina/scoring";
import {
  CrucigramaEditor as LegacyCrucigramaEditor,
  CrucigramaViewer as LegacyCrucigramaViewer,
  createDefaultCrucigrama,
} from "lumina-frontend/activities/crucigrama";
import { elementRegistry } from "../../index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { crucigramaDefinition, evaluarCrucigrama } from "./crucigrama-definition.js";
import type { CrucigramaConfig, CrucigramaEstado } from "./crucigrama-types.js";

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
  const a = createDefaultCrucigrama();
    const celdas: Record<string, string> = {};
    for (const p of a.palabras) {
      const h = p.direccion !== "vertical";
      for (let c = 0; c < p.texto.length; c++) {
        const key = h ? `${p.fila}-${p.columna + c}` : `${p.fila + c}-${p.columna}`;
        celdas[key] = p.texto[c];
      }
    }
    return { actividad: a, respuesta: { celdas } };
}

function casoIncorrecto() {
  const a = createDefaultCrucigrama();
    return { actividad: a, respuesta: { celdas: {} } };
}

describe("Crucigrama — paridad ElementDefinition vs legacy (E2.4)", () => {
  it("crearPorDefecto envuelve createDefaultCrucigrama", () => {
    const fromDef = crucigramaDefinition.crearPorDefecto();
    const fromLegacy = createDefaultCrucigrama();
    expect(fromDef).toEqual(fromLegacy);
    expect(fromDef.tipo).toBe("crucigrama");
  });

  it("misma actividad + misma respuesta → mismo correct, score y details", () => {
    for (const [nombre, caso] of [
      ["perfecto", casoPerfecto()],
      ["incorrecto", casoIncorrecto()],
    ] as const) {
      const expected = evaluateActivityResponse(
        "crucigrama",
        caso.actividad,
        caso.respuesta,
      );
      const viaKit = evaluarCrucigrama(caso.actividad, caso.respuesta);
      expect(viaKit.correct, nombre).toBe(expected.correct);
      expect(viaKit.score, nombre).toBe(expected.score);
      expect(viaKit.details, nombre).toEqual(expected.details);
      expect(crucigramaDefinition.puntuacion(caso.actividad, caso.respuesta), nombre).toBe(
        expected.score,
      );
    }
  });

  it("Editor nuevo y viejo producen el mismo DOM visible", () => {
    const actividad = createDefaultCrucigrama();
    const NewEditor = crucigramaDefinition.Editor;
    const legacy = withFixedRandom(() =>
      render(<LegacyCrucigramaEditor actividad={actividad} />),
    );
    const next = withFixedRandom(() =>
      render(
        <NewEditor estado={actividad} config={{}} onChange={() => undefined} />,
      ),
    );
    expect(snapshotVisible(next.container)).toEqual(
      snapshotVisible(legacy.container),
    );
    expect(within(next.container).getByText("Crucigrama")).toBeTruthy();
    expect(within(legacy.container).getByText("Crucigrama")).toBeTruthy();
    legacy.unmount();
    next.unmount();
  });

  it("Viewer nuevo y viejo producen el mismo DOM visible", () => {
    const actividad = createDefaultCrucigrama();
    const NewViewer = crucigramaDefinition.Viewer;
    const legacy = withFixedRandom(() =>
      render(<LegacyCrucigramaViewer actividad={actividad} />),
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
    const def = elementRegistry.obtener("crucigrama") as
      | ElementDefinition<CrucigramaEstado, CrucigramaConfig>
      | undefined;
    expect(def).toBe(crucigramaDefinition);
    expect(def?.puntuacion).toBeTypeOf("function");
    expect(def?.apariencia).toEqual({
      color: false,
      tipografia: false,
      animacion: false,
    });
    expect(def?.puntuacion).toBe(crucigramaDefinition.puntuacion);
  });
});
