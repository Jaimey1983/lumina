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

import { normalizarAjustes } from "../../activities/_shared/activity-settings.js";
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

describe("Quiz sincronizado — `ajustes` (U9d.6b)", () => {
  type Handler = (p: unknown) => void;
  function socketFalso() {
    const handlers = new Map<string, Set<Handler>>();
    const socket = {
      on: (e: string, fn: Handler) => void (handlers.get(e) ?? handlers.set(e, new Set()).get(e)!).add(fn),
      off: (e: string, fn: Handler) => void handlers.get(e)?.delete(fn),
      emit: (e: string, _p: unknown, cb?: (r: unknown) => void) => {
        if (e === "quiz:sync-state") cb?.({ ok: true, state: null });
      },
    };
    return { socket: socket as never, disparar: (e: string, p: unknown) => act(() => void handlers.get(e)?.forEach((fn) => fn(p))) };
  }
  const synced = (parche: Partial<QuizMultiple> = {}) =>
    quiz([pregunta("1")], { deliveryMode: "SYNCED", timePerQuestion: 30, ...parche });

  async function montar(estado: QuizMultiple) {
    const { QuizSyncedViewer } = await import("../../activities/_classic/quiz/quiz-synced-viewer.js");
    const { socket, disparar } = socketFalso();
    const r = render(<QuizSyncedViewer activity={estado} quizBlockId="b" classId="c" studentId="e" studentName="Ana" liveSocket={socket} />);
    disparar("quiz:launch", { quizBlockId: "b", question: estado.preguntas[0], questionIndex: 0, questionId: "1", totalQuestions: 1, timePerQuestion: 30 });
    return r;
  }

  it("`ajustes.estilo` también llega al sincronizado (`data-estilo`)", async () => {
    const { container } = await montar(synced({ ajustes: { estilo: "pizarra" } }));
    expect(container.querySelector('[data-estilo="pizarra"]')).toBeTruthy();
  });

  it("`ajustes.sonido = false` silencia al contestar en el sincronizado; con sonido suena", async () => {
    const a = await montar(synced({ ajustes: { sonido: false } }));
    fireEvent.click(opcion("Correcta 1"));
    expect(sonido).not.toHaveBeenCalled();
    a.unmount();
    await montar(synced());
    fireEvent.click(opcion("Falsa 1"));
    expect(sonido.mock.calls).toEqual([["wrong"]]);
  });

  it("la pregunta lanzada se anuncia por `aria-live`", async () => {
    await montar(synced());
    const anuncios = [...document.querySelectorAll('[role="status"][aria-live="polite"]')].map((e) => e.textContent);
    expect(anuncios).toContain("Pregunta 1 de 1: Pregunta 1");
  });
});

describe("Propiedades del Quiz (U9d.6b)", () => {
  const Propiedades = def.Propiedades as unknown as (p: {
    estado: unknown;
    config: object;
    onChange(e: unknown): void;
    onConfigChange(c: object): void;
  }) => React.ReactElement;

  it("conserva el editor de siempre y suma estilos y ajustes comunes (solo sonido y aspecto)", () => {
    const { container } = render(
      <Propiedades estado={quiz([pregunta("1")])} config={{}} onChange={() => undefined} onConfigChange={() => undefined} />,
    );
    expect(container.querySelectorAll("[data-preset-id]")).toHaveLength(5);
    expect(container.querySelector("[data-actividad-ajustes]")).toBeTruthy();
    expect(screen.queryByLabelText("Límite de tiempo")).toBeNull();
    expect(screen.queryByLabelText("Intentos")).toBeNull();
  });

  it("elegir «Examen» guarda solo `ajustes` y deja las preguntas intactas", () => {
    const original = quiz([pregunta("1")]);
    const onChange = vi.fn();
    const { container } = render(
      <Propiedades estado={original} config={{}} onChange={onChange} onConfigChange={() => undefined} />,
    );
    fireEvent.click(container.querySelector('[data-preset-id="examen"]')!);
    const guardada = onChange.mock.lastCall![0] as QuizMultiple;
    expect(normalizarAjustes(guardada)).toMatchObject({ estilo: "examen", sonido: false });
    expect(guardada.preguntas).toEqual(original.preguntas);
  });

  it("la definición declara presets y `apariencia.color`", () => {
    expect(def.presets.map((p) => p.id)).toEqual(["escolar", "examen", "arcade", "minimal", "pizarra"]);
    expect(def.apariencia).toEqual({ color: true, tipografia: false, animacion: false });
  });
});
