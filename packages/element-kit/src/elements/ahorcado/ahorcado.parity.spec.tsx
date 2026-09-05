import { describe, expect, it } from "vitest";
import { render, within } from "@testing-library/react";
import { evaluateActivityResponse } from "@lumina/scoring";
import {
  AhorcadoEditor as LegacyAhorcadoEditor,
  AhorcadoViewer as LegacyAhorcadoViewer,
  createDefaultAhorcado,
} from "lumina-frontend/activities/ahorcado";
import { elementRegistry } from "../../index.js";
import type { ElementDefinition } from "../../contract.js";
import { ahorcadoDefinition, evaluarAhorcado } from "./ahorcado-definition.js";
import type { AhorcadoConfig, AhorcadoEstado } from "./ahorcado-types.js";

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
  const a = createDefaultAhorcado();
    const letras = a.configuracion.palabra.toUpperCase().replace(/[^A-ZÑ]/g, "").split("");
    return {
      actividad: a,
      respuesta: { ganado: true, letrasFalladas: [], letrasAdivinadas: [...new Set(letras)] },
    };
}

function casoIncorrecto() {
  const a = createDefaultAhorcado();
    return {
      actividad: a,
      respuesta: { ganado: false, letrasFalladas: ["X", "Y", "Z", "Q", "W", "K"], letrasAdivinadas: [] },
    };
}

describe("Ahorcado — paridad ElementDefinition vs legacy (E2.4)", () => {
  it("crearPorDefecto envuelve createDefaultAhorcado", () => {
    const fromDef = ahorcadoDefinition.crearPorDefecto();
    const fromLegacy = createDefaultAhorcado();
    expect(fromDef).toEqual(fromLegacy);
    expect(fromDef.tipo).toBe("ahorcado");
  });

  it("misma actividad + misma respuesta → mismo correct, score y details", () => {
    for (const [nombre, caso] of [
      ["perfecto", casoPerfecto()],
      ["incorrecto", casoIncorrecto()],
    ] as const) {
      const expected = evaluateActivityResponse(
        "ahorcado",
        caso.actividad,
        caso.respuesta,
      );
      const viaKit = evaluarAhorcado(caso.actividad, caso.respuesta);
      expect(viaKit.correct, nombre).toBe(expected.correct);
      expect(viaKit.score, nombre).toBe(expected.score);
      expect(viaKit.details, nombre).toEqual(expected.details);
      expect(ahorcadoDefinition.puntuacion(caso.actividad, caso.respuesta), nombre).toBe(
        expected.score,
      );
    }
  });

  it("Editor nuevo y viejo producen el mismo DOM visible", () => {
    const actividad = createDefaultAhorcado();
    const NewEditor = ahorcadoDefinition.Editor;
    const legacy = withFixedRandom(() =>
      render(<LegacyAhorcadoEditor actividad={actividad} />),
    );
    const next = withFixedRandom(() =>
      render(
        <NewEditor estado={actividad} config={{}} onChange={() => undefined} />,
      ),
    );
    expect(snapshotVisible(next.container)).toEqual(
      snapshotVisible(legacy.container),
    );
    expect(within(next.container).getByText("Ahorcado")).toBeTruthy();
    expect(within(legacy.container).getByText("Ahorcado")).toBeTruthy();
    legacy.unmount();
    next.unmount();
  });

  it("Viewer nuevo y viejo producen el mismo DOM visible", () => {
    const actividad = createDefaultAhorcado();
    const NewViewer = ahorcadoDefinition.Viewer;
    const legacy = withFixedRandom(() =>
      render(<LegacyAhorcadoViewer actividad={actividad} />),
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
    const def = elementRegistry.obtener("ahorcado") as
      | ElementDefinition<AhorcadoEstado, AhorcadoConfig>
      | undefined;
    expect(def).toBe(ahorcadoDefinition);
    expect(def?.puntuacion).toBeTypeOf("function");
    expect(def?.apariencia).toEqual({
      color: false,
      tipografia: false,
      animacion: false,
    });
    expect(def?.puntuacion).toBe(ahorcadoDefinition.puntuacion);
  });
});
