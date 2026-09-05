import { describe, expect, it } from "vitest";
import { render, within } from "@testing-library/react";
import { evaluateActivityResponse } from "@lumina/scoring";
import {
  AbrirCajaEditor as LegacyAbrirCajaEditor,
  AbrirCajaViewer as LegacyAbrirCajaViewer,
  createDefaultAbrirCaja,
} from "lumina-frontend/activities/abrir-caja";
import { elementRegistry } from "../../index.js";
import type { ElementDefinition } from "../../contract.js";
import { abrirCajaDefinition, evaluarAbrirCaja } from "./abrir_caja-definition.js";
import type { AbrirCajaConfig, AbrirCajaEstado } from "./abrir_caja-types.js";

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
  const a = createDefaultAbrirCaja();
    return {
      actividad: a,
      respuesta: {
        cajasAbiertas: a.cajas.filter((c) => c.contenido.esCorrecta === true).map((c) => c.id),
      },
    };
}

function casoIncorrecto() {
  const a = createDefaultAbrirCaja();
    return { actividad: a, respuesta: { cajasAbiertas: [] } };
}

describe("AbrirCaja — paridad ElementDefinition vs legacy (E2.4)", () => {
  it("crearPorDefecto envuelve createDefaultAbrirCaja", () => {
    const fromDef = abrirCajaDefinition.crearPorDefecto();
    const fromLegacy = createDefaultAbrirCaja();
    expect(fromDef).toEqual(fromLegacy);
    expect(fromDef.tipo).toBe("abrir_caja");
  });

  it("misma actividad + misma respuesta → mismo correct, score y details", () => {
    for (const [nombre, caso] of [
      ["perfecto", casoPerfecto()],
      ["incorrecto", casoIncorrecto()],
    ] as const) {
      const expected = evaluateActivityResponse(
        "abrir_caja",
        caso.actividad,
        caso.respuesta,
      );
      const viaKit = evaluarAbrirCaja(caso.actividad, caso.respuesta);
      expect(viaKit.correct, nombre).toBe(expected.correct);
      expect(viaKit.score, nombre).toBe(expected.score);
      expect(viaKit.details, nombre).toEqual(expected.details);
      expect(abrirCajaDefinition.puntuacion(caso.actividad, caso.respuesta), nombre).toBe(
        expected.score,
      );
    }
  });

  it("Editor nuevo y viejo producen el mismo DOM visible", () => {
    const actividad = createDefaultAbrirCaja();
    const NewEditor = abrirCajaDefinition.Editor;
    const legacy = withFixedRandom(() =>
      render(<LegacyAbrirCajaEditor actividad={actividad} />),
    );
    const next = withFixedRandom(() =>
      render(
        <NewEditor estado={actividad} config={{}} onChange={() => undefined} />,
      ),
    );
    expect(snapshotVisible(next.container)).toEqual(
      snapshotVisible(legacy.container),
    );
    expect(within(next.container).getByText("Abrir caja")).toBeTruthy();
    expect(within(legacy.container).getByText("Abrir caja")).toBeTruthy();
    legacy.unmount();
    next.unmount();
  });

  it("Viewer nuevo y viejo producen el mismo DOM visible", () => {
    const actividad = createDefaultAbrirCaja();
    const NewViewer = abrirCajaDefinition.Viewer;
    const legacy = withFixedRandom(() =>
      render(<LegacyAbrirCajaViewer actividad={actividad} />),
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
    const def = elementRegistry.obtener("abrir_caja") as
      | ElementDefinition<AbrirCajaEstado, AbrirCajaConfig>
      | undefined;
    expect(def).toBe(abrirCajaDefinition);
    expect(def?.puntuacion).toBeTypeOf("function");
    expect(def?.apariencia).toEqual({
      color: false,
      tipografia: false,
      animacion: false,
    });
    expect(def?.puntuacion).toBe(abrirCajaDefinition.puntuacion);
  });
});
