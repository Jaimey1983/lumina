import { describe, expect, it } from "vitest";
import { render, within } from "@testing-library/react";
import { evaluateActivityResponse } from "@lumina/scoring";
import {
  ClasificarEditor as LegacyClasificarEditor,
  ClasificarViewer as LegacyClasificarViewer,
  createDefaultClasificar,
} from "lumina-frontend/activities/clasificar";
import { elementRegistry } from "../../index.js";
import type { ElementDefinition } from "../../contract.js";
import { clasificarDefinition, evaluarClasificar } from "./clasificar-definition.js";
import type { ClasificarConfig, ClasificarEstado } from "./clasificar-types.js";

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
  const a = createDefaultClasificar();
    return {
      actividad: a,
      respuesta: {
        ubicaciones: Object.fromEntries(a.items.map((i) => [i.id, i.categoriaId])),
      },
    };
}

function casoIncorrecto() {
  const a = createDefaultClasificar();
    return {
      actividad: a,
      respuesta: {
        ubicaciones: Object.fromEntries(a.items.map((i) => [i.id, "x"])),
      },
    };
}

describe("Clasificar — paridad ElementDefinition vs legacy (E2.4)", () => {
  it("crearPorDefecto envuelve createDefaultClasificar", () => {
    const fromDef = clasificarDefinition.crearPorDefecto();
    const fromLegacy = createDefaultClasificar();
    expect(fromDef).toEqual(fromLegacy);
    expect(fromDef.tipo).toBe("clasificar");
  });

  it("misma actividad + misma respuesta → mismo correct, score y details", () => {
    for (const [nombre, caso] of [
      ["perfecto", casoPerfecto()],
      ["incorrecto", casoIncorrecto()],
    ] as const) {
      const expected = evaluateActivityResponse(
        "clasificar",
        caso.actividad,
        caso.respuesta,
      );
      const viaKit = evaluarClasificar(caso.actividad, caso.respuesta);
      expect(viaKit.correct, nombre).toBe(expected.correct);
      expect(viaKit.score, nombre).toBe(expected.score);
      expect(viaKit.details, nombre).toEqual(expected.details);
      expect(clasificarDefinition.puntuacion(caso.actividad, caso.respuesta), nombre).toBe(
        expected.score,
      );
    }
  });

  it("Editor nuevo y viejo producen el mismo DOM visible", () => {
    const actividad = createDefaultClasificar();
    const NewEditor = clasificarDefinition.Editor;
    const legacy = withFixedRandom(() =>
      render(<LegacyClasificarEditor actividad={actividad} />),
    );
    const next = withFixedRandom(() =>
      render(
        <NewEditor estado={actividad} config={{}} onChange={() => undefined} />,
      ),
    );
    expect(snapshotVisible(next.container)).toEqual(
      snapshotVisible(legacy.container),
    );
    expect(within(next.container).getByText("Clasificar")).toBeTruthy();
    expect(within(legacy.container).getByText("Clasificar")).toBeTruthy();
    legacy.unmount();
    next.unmount();
  });

  it("Viewer nuevo y viejo producen el mismo DOM visible", () => {
    const actividad = createDefaultClasificar();
    const NewViewer = clasificarDefinition.Viewer;
    const legacy = withFixedRandom(() =>
      render(<LegacyClasificarViewer actividad={actividad} />),
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
    const def = elementRegistry.obtener("clasificar") as
      | ElementDefinition<ClasificarEstado, ClasificarConfig>
      | undefined;
    expect(def).toBe(clasificarDefinition);
    expect(def?.puntuacion).toBeTypeOf("function");
    expect(def?.apariencia).toEqual({
      color: false,
      tipografia: false,
      animacion: false,
    });
    expect(def?.puntuacion).toBe(clasificarDefinition.puntuacion);
  });
});
