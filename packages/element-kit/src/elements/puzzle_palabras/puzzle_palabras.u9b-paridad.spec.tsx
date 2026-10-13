/**
 * U9b.1 — paridad de Puzzle de palabras contra su comportamiento ANTERIOR a migrar al
 * `ActivityShell` (Regla 7).
 *
 * El arrastre se simula entregando el evento de dnd-kit directamente (`onDragEnd` con
 * `{ active: { id }, over: { id } }`): lo que se fija es la LÓGICA (qué pasa con las palabras
 * al soltarlas, verificar, reintentar, finalizar y qué respuesta sale), no el gesto. El gesto
 * por teclado/tocar está cubierto en `puzzle_palabras.u9b-ajustes.spec.tsx` y en U6.
 * Los ids de las piezas (`tok-<i>-<texto>`, `tok-r<i>-<texto>` tras reintentar) y de las zonas
 * (`zona-origen`, `zona-destino`) son parte del contrato del evento y se conservan.
 */
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateActivityResponse } from "@lumina/scoring";
import type { PuzzlePalabrasActivity } from "@lumina/types/slide";

type Ev = { active: { id: string }; over: { id: string } | null };
const captura = vi.hoisted(() => ({ alSoltar: null as null | ((e: Ev) => void) }));
vi.mock("../../activities/_shared/activity-dnd-root.js", () => ({
  ActivityDndRoot: ({
    children,
    onDragEnd,
  }: {
    children: React.ReactNode;
    onDragEnd?: (e: Ev) => void;
  }) => {
    captura.alSoltar = onDragEnd ?? null;
    return <div>{children}</div>;
  },
}));

import { PuzzlePalabrasViewer as ViewerComponente } from "../../activities/puzzle-palabras/index.js";
import { puzzlePalabrasDefinition } from "./puzzle_palabras-definition.js";

type Props = { estado: unknown; config: Record<string, unknown> };
const Viewer = puzzlePalabrasDefinition.Viewer as unknown as (p: Props) => React.ReactElement;

const azarFijo = () => {
  let i = 0;
  const seq = [0.11, 0.87, 0.32, 0.64, 0.19, 0.73, 0.41, 0.58, 0.26, 0.91];
  return vi.spyOn(Math, "random").mockImplementation(() => seq[i++ % seq.length]!);
};

beforeEach(() => {
  azarFijo();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  captura.alSoltar = null;
});

const actividad = (
  parche: Partial<PuzzlePalabrasActivity> = {},
  config: Partial<PuzzlePalabrasActivity["configuracion"]> = {},
): PuzzlePalabrasActivity => ({
  tipo: "puzzle_palabras",
  configuracion: { mostrarPista: true, permitirReintento: true, ...config },
  oraciones: [
    { texto: "El sol sale", pista: "Amanece" },
    { texto: "Hola mundo" },
  ],
  ...parche,
});

/** Textos de las piezas que hay ahora en la zona de «Palabras disponibles». */
const origen = () => {
  const zona = screen.getByText("Palabras disponibles:").parentElement!;
  return within(zona).queryAllByRole("button").map((b) => b.textContent!.trim());
};
/** Textos de las piezas ya colocadas (todo botón que no es de origen ni de acción). */
const ACCIONES = /^(Verificar|Reintentar|Siguiente|Finalizar|Modo:.*)$/;
const destino = () => {
  const todas = screen
    .queryAllByRole("button")
    .map((b) => b.textContent!.trim())
    .filter((t) => !ACCIONES.test(t));
  const o = origen();
  const resto = [...todas];
  for (const t of o) {
    const k = resto.indexOf(t);
    if (k >= 0) resto.splice(k, 1);
  }
  return resto;
};

/** Registro de ids: el primer render fija `tok-<i>-<texto>` por orden de origen. */
function idsIniciales(prefijo = "tok-") {
  return origen().map((t, i) => ({ id: `${prefijo}${i}-${t}`, texto: t }));
}
function soltar(id: string, sobre: string | null) {
  act(() => captura.alSoltar!({ active: { id }, over: sobre ? { id: sobre } : null }));
}
/** Coloca las palabras de `orden` (textos) en el destino, usando los ids de `ids`. */
function colocar(ids: { id: string; texto: string }[], orden: string[]) {
  const libres = [...ids];
  for (const t of orden) {
    const k = libres.findIndex((x) => x.texto === t);
    soltar(libres[k]!.id, "zona-destino");
    libres.splice(k, 1);
  }
}
const boton = (n: RegExp | string) => screen.getByRole("button", { name: n }) as HTMLButtonElement;

describe("Puzzle de palabras — paridad con el comportamiento anterior (U9b.1)", () => {
  it("arranca en «Oración 1 de N» con las palabras de la primera oración mezcladas (azar fijo)", () => {
    render(<Viewer estado={actividad()} config={{}} />);
    expect(screen.getByText("Oración 1 de 2")).toBeTruthy();
    expect(origen()).toEqual(["sale", "sol", "El"]); // medido con el viewer viejo
    expect(screen.getByText("Arrastra las palabras aquí")).toBeTruthy();
  });

  it("la pista se muestra solo con `mostrarPista` y si la oración la tiene", () => {
    const { unmount } = render(<Viewer estado={actividad()} config={{}} />);
    expect(screen.getByText(/Amanece/)).toBeTruthy();
    unmount();
    render(<Viewer estado={actividad({}, { mostrarPista: false })} config={{}} />);
    expect(screen.queryByText(/Amanece/)).toBeNull();
  });

  it("«Verificar» está deshabilitado sin palabras en el destino", () => {
    render(<Viewer estado={actividad()} config={{}} />);
    expect(boton("Verificar").disabled).toBe(true);
  });

  it("soltar en el destino mueve la pieza; soltar en el origen la devuelve; otros destinos se ignoran", () => {
    render(<Viewer estado={actividad()} config={{}} />);
    const ids = idsIniciales();
    soltar(ids[2]!.id, "zona-destino"); // «El»
    expect(origen()).toEqual(["sale", "sol"]);
    expect(destino()).toEqual(["El"]);
    expect(screen.queryByText("Arrastra las palabras aquí")).toBeNull();
    soltar(ids[2]!.id, "zona-destino"); // ya está: sin cambios
    expect(destino()).toEqual(["El"]);
    soltar(ids[2]!.id, "zona-origen");
    expect(origen().sort()).toEqual(["El", "sale", "sol"]);
    soltar(ids[0]!.id, "otra-cosa");
    soltar(ids[0]!.id, null);
    expect(destino()).toEqual([]);
  });

  it("verificar con la oración bien armada: «✓ ¡Correcto!», sin reintento, y las piezas se bloquean", () => {
    render(<Viewer estado={actividad()} config={{}} />);
    colocar(idsIniciales(), ["El", "sol", "sale"]);
    fireEvent.click(boton("Verificar"));
    expect(screen.getByText("✓ ¡Correcto!")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Reintentar" })).toBeNull();
    expect(boton("Siguiente")).toBeTruthy();
  });

  it("verificar con la oración mal armada: «✗ Incorrecto» + la respuesta, y ofrece «Reintentar»", () => {
    render(<Viewer estado={actividad()} config={{}} />);
    colocar(idsIniciales(), ["sol", "El", "sale"]);
    fireEvent.click(boton("Verificar"));
    expect(screen.getByText("✗ Incorrecto")).toBeTruthy();
    expect(screen.getByText("Respuesta: El sol sale")).toBeTruthy();
    expect(boton("Reintentar")).toBeTruthy();
  });

  it("con `permitirReintento = false` no hay «Reintentar» por oración", () => {
    render(<Viewer estado={actividad({}, { permitirReintento: false })} config={{}} />);
    colocar(idsIniciales(), ["sol", "El", "sale"]);
    fireEvent.click(boton("Verificar"));
    expect(screen.queryByRole("button", { name: "Reintentar" })).toBeNull();
  });

  it("después de verificar ya no se mueven las piezas", () => {
    render(<Viewer estado={actividad()} config={{}} />);
    const ids = idsIniciales();
    colocar(ids, ["El", "sol", "sale"]);
    fireEvent.click(boton("Verificar"));
    soltar(ids[0]!.id, "zona-origen");
    expect(destino()).toEqual(["El", "sol", "sale"]);
  });

  it("«Reintentar» baraja de nuevo esa oración (ids `tok-r…`) y vuelve a «Verificar»", () => {
    render(<Viewer estado={actividad()} config={{}} />);
    colocar(idsIniciales(), ["sol", "El", "sale"]);
    fireEvent.click(boton("Verificar"));
    fireEvent.click(boton("Reintentar"));
    expect(destino()).toEqual([]);
    expect(origen().sort()).toEqual(["El", "sale", "sol"]);
    expect(boton("Verificar").disabled).toBe(true);
    colocar(idsIniciales("tok-r"), ["El", "sol", "sale"]);
    fireEvent.click(boton("Verificar"));
    expect(screen.getByText("✓ ¡Correcto!")).toBeTruthy();
  });

  it("«Siguiente» pasa a la oración 2; la última dice «Finalizar»", () => {
    render(<Viewer estado={actividad()} config={{}} />);
    colocar(idsIniciales(), ["El", "sol", "sale"]);
    fireEvent.click(boton("Verificar"));
    fireEvent.click(boton("Siguiente"));
    expect(screen.getByText("Oración 2 de 2")).toBeTruthy();
    expect(origen().sort()).toEqual(["Hola", "mundo"]);
    colocar(idsIniciales(), ["Hola", "mundo"]);
    fireEvent.click(boton("Verificar"));
    expect(boton("Finalizar")).toBeTruthy();
  });

  it("«Finalizar» emite UNA vez `{ tokensPorOracion }` por `onResponse` y muestra el resultado con la nota", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={actividad()} config={{ onResponse }} />);
    colocar(idsIniciales(), ["El", "sol", "sale"]);
    fireEvent.click(boton("Verificar"));
    fireEvent.click(boton("Siguiente"));
    colocar(idsIniciales(), ["Hola", "mundo"]);
    fireEvent.click(boton("Verificar"));
    fireEvent.click(boton("Finalizar"));
    expect(onResponse.mock.calls).toEqual([
      [{ tokensPorOracion: [["El", "sol", "sale"], ["Hola", "mundo"]] }],
    ]);
    expect(screen.getByText("5.0")).toBeTruthy();
    expect(screen.getByText("¡Muy bien!")).toBeTruthy();
  });

  it("nunca emite borradores: antes de finalizar `onResponse` no se llamó", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={actividad()} config={{ onResponse }} />);
    colocar(idsIniciales(), ["El", "sol", "sale"]);
    fireEvent.click(boton("Verificar"));
    fireEvent.click(boton("Siguiente"));
    expect(onResponse).not.toHaveBeenCalled();
  });

  it("calificación con @lumina/scoring: todo bien 5, todo mal nota mínima, mitad en medio (2,5)", () => {
    const a = actividad();
    const nota = (t: string[][]) => {
      const ev = evaluateActivityResponse("puzzle_palabras", a, { tokensPorOracion: t });
      return { correct: ev.correct, score: ev.score };
    };
    expect(nota([["El", "sol", "sale"], ["Hola", "mundo"]])).toEqual({ correct: true, score: 5 });
    expect(nota([["x"], ["y"]])).toEqual({ correct: false, score: 1 });
    expect(nota([["El", "sol", "sale"], ["y"]])).toEqual({ correct: false, score: 2.5 });
  });

  it("el resultado final con «Reintentar» reinicia toda la actividad (oración 1, piezas mezcladas)", () => {
    render(<Viewer estado={actividad()} config={{}} />);
    colocar(idsIniciales(), ["sol", "El", "sale"]);
    fireEvent.click(boton("Verificar"));
    fireEvent.click(boton("Siguiente"));
    colocar(idsIniciales(), ["mundo", "Hola"]);
    fireEvent.click(boton("Verificar"));
    fireEvent.click(boton("Finalizar"));
    // Hay dos «Reintentar»: el de la oración (aún visible) y el del resultado, que es el último.
    fireEvent.click(screen.getAllByRole("button", { name: "Reintentar" }).at(-1)!);
    expect(screen.getByText("Oración 1 de 2")).toBeTruthy();
    expect(origen().sort()).toEqual(["El", "sale", "sol"]);
    expect(destino()).toEqual([]);
  });

  it("el componente acepta `onResponse` directo (prop `actividad`)", () => {
    const onResponse = vi.fn();
    render(<ViewerComponente actividad={actividad({ oraciones: [{ texto: "Hola mundo" }] })} onResponse={onResponse} />);
    colocar(idsIniciales(), ["Hola", "mundo"]);
    fireEvent.click(boton("Verificar"));
    fireEvent.click(boton("Finalizar"));
    expect(onResponse.mock.calls).toEqual([[{ tokensPorOracion: [["Hola", "mundo"]] }]]);
  });
});
