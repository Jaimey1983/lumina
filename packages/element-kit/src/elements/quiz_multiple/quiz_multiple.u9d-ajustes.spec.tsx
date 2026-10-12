/**
 * U9d.6 — lo NUEVO del Quiz autónomo tras migrar al shell: lee `ajustes` (estilo, sonido, tiempo),
 * se bloquea al agotarse el tiempo emitiendo lo contestado, y las opciones se anuncian al lector
 * de pantalla (varias correctas = botones de alternancia; la opción corregida dice qué fue).
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { QuizMultiple, QuizPregunta } from "@lumina/types/slide";

const sonido = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play: sonido }) }));

import { quizMultipleDefinition as def } from "./quiz_multiple-definition.js";

type PropsViewer = { estado: unknown; config: Record<string, unknown> };
const Viewer = def.Viewer as unknown as (p: PropsViewer) => React.ReactElement;

beforeEach(() => {
  vi.useFakeTimers();
  sonido.mockClear();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const pregunta = (id: string, extra: Partial<QuizPregunta> = {}): QuizPregunta => ({
  id,
  texto: `Pregunta ${id}`,
  opciones: [
    { id: `${id}a`, texto: `Correcta ${id}`, esCorrecta: true },
    { id: `${id}b`, texto: `Falsa ${id}`, esCorrecta: false },
  ],
  ...extra,
});
const quiz = (preguntas: QuizPregunta[], parche: Partial<QuizMultiple> = {}): QuizMultiple => ({
  tipo: "quiz_multiple",
  preguntas,
  deliveryMode: "AUTONOMOUS",
  layoutVariant: "classic-list",
  ...parche,
});
const opcion = (texto: string) => screen.getByRole("button", { name: new RegExp(texto) }) as HTMLButtonElement;
const pasar = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

describe("Quiz autónomo — `ajustes` (U9d.6)", () => {
  it("`ajustes.estilo` llega al shell (`data-estilo`)", () => {
    const { container } = render(<Viewer estado={quiz([pregunta("1")], { ajustes: { estilo: "pizarra" } })} config={{}} />);
    expect(container.querySelector('[data-estilo="pizarra"]')).toBeTruthy();
  });

  it("`ajustes.sonido = false` silencia; con sonido suena acierto o error", () => {
    const { unmount } = render(<Viewer estado={quiz([pregunta("1")], { ajustes: { sonido: false } })} config={{}} />);
    fireEvent.click(opcion("Correcta 1"));
    expect(sonido).not.toHaveBeenCalled();
    unmount();
    render(<Viewer estado={quiz([pregunta("1")])} config={{}} />);
    fireEvent.click(opcion("Falsa 1"));
    expect(sonido.mock.calls).toEqual([["wrong"]]);
  });

  it("con límite de tiempo y una pregunta sin contestar, al agotarse sale UNA respuesta vacía y se bloquean las opciones", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={quiz([pregunta("1")], { ajustes: { tiempoLimiteSeg: 3 } })} config={{ onResponse }} />);
    pasar(3000);
    expect(onResponse.mock.calls).toEqual([[[]]]);
    expect(opcion("Correcta 1").disabled).toBe(true);
    expect(screen.getAllByText("Se acabó el tiempo.").length).toBeGreaterThan(0);
    pasar(5000);
    expect(onResponse).toHaveBeenCalledTimes(1);
  });

  it("con límite de tiempo y varias preguntas, al agotarse sale `{ answers }` con lo contestado", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={quiz([pregunta("1"), pregunta("2")], { ajustes: { tiempoLimiteSeg: 3 } })} config={{ onResponse }} />);
    fireEvent.click(opcion("Correcta 1"));
    pasar(3000);
    expect(onResponse.mock.calls).toEqual([[{ answers: { "1": ["1a"] } }]]);
    expect(opcion("Siguiente pregunta").disabled).toBe(true);
  });

  it("contestar a tiempo no emite nada extra al pasar el tiempo (una pregunta)", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={quiz([pregunta("1")], { ajustes: { tiempoLimiteSeg: 3 } })} config={{ onResponse }} />);
    fireEvent.click(opcion("Correcta 1"));
    pasar(10_000);
    expect(onResponse.mock.calls).toEqual([["1a"]]);
  });
});

describe("Quiz autónomo — accesibilidad (U9d.6, DU8)", () => {
  it("con varias correctas, las opciones son botones de alternancia (`aria-pressed`)", () => {
    const e = quiz([pregunta("1", { multipleRespuesta: true })]);
    render(<Viewer estado={e} config={{}} />);
    expect(opcion("Correcta 1").getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(opcion("Correcta 1"));
    expect(opcion("Correcta 1").getAttribute("aria-pressed")).toBe("true");
  });

  it("al corregir, cada opción dice si fue tu respuesta correcta, incorrecta o la correcta", () => {
    render(<Viewer estado={quiz([pregunta("1")])} config={{}} />);
    fireEvent.click(opcion("Falsa 1"));
    expect(opcion("Falsa 1").textContent).toContain("tu respuesta, incorrecta");
    expect(opcion("Correcta 1").textContent).toContain("la respuesta correcta");
  });

  it("el veredicto es un `status` para el lector de pantalla", () => {
    render(<Viewer estado={quiz([pregunta("1")])} config={{}} />);
    fireEvent.click(opcion("Correcta 1"));
    expect(screen.getByText("¡Correcto!").getAttribute("role")).toBe("status");
  });
});
