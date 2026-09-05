import { describe, expect, it } from "vitest";
import { render, within } from "@testing-library/react";
import { evaluateActivityResponse } from "@lumina/scoring";
import {
  AnagramaEditor as LegacyAnagramaEditor,
  AnagramaViewer as LegacyAnagramaViewer,
  createDefaultAnagrama,
  type AnagramaActivity,
} from "lumina-frontend/activities/anagrama";
import type { ElementDefinition } from "../../contract.js";
import {
  anagramaDefinition,
  evaluarAnagrama,
} from "./anagrama-definition.js";
import type { AnagramaConfig, AnagramaEstado } from "./anagrama-types.js";

function respuestaDesdeTextos(
  actividad: AnagramaActivity,
  textos: string[],
): { slotsPorPalabra: string[][] } {
  return {
    slotsPorPalabra: actividad.palabras.map((p, i) =>
      (textos[i] ?? p.texto).toUpperCase().replace(/\s+/g, "").split(""),
    ),
  };
}

function respuestaPerfecta(actividad: AnagramaActivity) {
  return respuestaDesdeTextos(
    actividad,
    actividad.palabras.map((p) => p.texto),
  );
}

/** `mezclarLetras` usa Math.random — misma secuencia para legacy y kit. */
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

function snapshotEditor(container: HTMLElement) {
  return {
    heading: container.querySelector("h3")?.textContent,
    wordCount: container.querySelector("p.text-xs")?.textContent,
    hint: container.querySelector(".italic")?.textContent,
    letterTiles: [...container.querySelectorAll(".font-bold")].map(
      (el) => el.textContent,
    ),
    slotCount: container.querySelectorAll(".border-dashed").length,
    more: [...container.querySelectorAll("div")].find((el) =>
      el.textContent?.trim().startsWith("+"),
    )?.textContent,
  };
}

function snapshotViewer(container: HTMLElement) {
  const q = within(container);
  return {
    progress: q.queryByText(/Palabra \d+ de \d+/)?.textContent,
    intentos: q.queryByText(/Intentos restantes/)?.textContent,
    hint: container.querySelector(".text-blue-900")?.textContent,
    origenLabel: q.queryByText("Letras disponibles:")?.textContent,
    destinoLabel: q.queryByText("Coloca las letras aquí:")?.textContent,
    letterTiles: [...container.querySelectorAll(".font-bold")]
      .map((el) => el.textContent?.trim())
      .filter((t) => t && t.length === 1),
    slotCount: [...container.querySelectorAll(".w-10")].filter(
      (el) => !el.className.includes("font-bold") && !el.textContent?.trim(),
    ).length,
  };
}

describe("Anagrama — paridad ElementDefinition vs legacy (E2.3)", () => {
  it("crearPorDefecto envuelve createDefaultAnagrama", () => {
    const fromDef = anagramaDefinition.crearPorDefecto();
    const fromLegacy = createDefaultAnagrama();
    expect(fromDef).toEqual(fromLegacy);
    expect(fromDef.tipo).toBe("anagrama");
  });

  it("misma actividad + misma respuesta → mismo correct y mismo score", () => {
    const actividad = createDefaultAnagrama();
    const casos = [
      { nombre: "perfecto", respuesta: respuestaPerfecta(actividad) },
      {
        nombre: "todo mal",
        respuesta: respuestaDesdeTextos(
          actividad,
          actividad.palabras.map((p) => "X".repeat(p.texto.length)),
        ),
      },
      {
        nombre: "parcial (1 de 3)",
        respuesta: {
          slotsPorPalabra: [
            actividad.palabras[0]!.texto.toUpperCase().split(""),
            ["X"],
            ["Y"],
          ],
        },
      },
      {
        nombre: "fixture SOL",
        actividad: {
          tipo: "anagrama" as const,
          configuracion: { mostrarPista: true, intentos: 3 },
          palabras: [{ texto: "SOL", pista: "astro" }],
        },
        respuesta: { slotsPorPalabra: [["S", "O", "L"]] },
      },
    ];

    for (const caso of casos) {
      const def = "actividad" in caso && caso.actividad ? caso.actividad : actividad;
      const expected = evaluateActivityResponse("anagrama", def, caso.respuesta);
      const viaKit = evaluarAnagrama(def, caso.respuesta);
      expect(viaKit.correct, caso.nombre).toBe(expected.correct);
      expect(viaKit.score, caso.nombre).toBe(expected.score);
      expect(viaKit.details, caso.nombre).toEqual(expected.details);
      expect(anagramaDefinition.puntuacion(def, caso.respuesta), caso.nombre).toBe(
        expected.score,
      );
    }
  });

  it("Editor nuevo y viejo producen el mismo DOM visible", () => {
    const actividad = createDefaultAnagrama();
    const NewEditor = anagramaDefinition.Editor;

    const legacy = withFixedRandom(() =>
      render(<LegacyAnagramaEditor actividad={actividad} />),
    );
    const next = withFixedRandom(() =>
      render(
        <NewEditor estado={actividad} config={{}} onChange={() => undefined} />,
      ),
    );

    expect(snapshotEditor(next.container)).toEqual(
      snapshotEditor(legacy.container),
    );
    expect(within(next.container).getByText("Anagrama")).toBeTruthy();
    expect(within(legacy.container).getByText("Anagrama")).toBeTruthy();
  });

  it("Viewer nuevo y viejo producen el mismo DOM visible", () => {
    const actividad = createDefaultAnagrama();
    const NewViewer = anagramaDefinition.Viewer;

    const legacy = withFixedRandom(() =>
      render(<LegacyAnagramaViewer actividad={actividad} />),
    );
    const next = withFixedRandom(() =>
      render(<NewViewer estado={actividad} config={{}} />),
    );

    expect(snapshotViewer(next.container)).toEqual(
      snapshotViewer(legacy.container),
    );
    expect(within(next.container).getByText(/Palabra 1 de 3/)).toBeTruthy();
    expect(within(legacy.container).getByText(/Palabra 1 de 3/)).toBeTruthy();
  });

  it("está registrado en el registry con puntuacion y apariencia", async () => {
    const { elementRegistry } = await import("../../index.js");
    const def = elementRegistry.obtener("anagrama") as
      | ElementDefinition<AnagramaEstado, AnagramaConfig>
      | undefined;
    expect(def).toBe(anagramaDefinition);
    expect(def?.puntuacion).toBeTypeOf("function");
    expect(def?.apariencia).toEqual({
      color: false,
      tipografia: false,
      animacion: false,
    });
    expect(def?.puntuacion).toBe(anagramaDefinition.puntuacion);
  });
});
