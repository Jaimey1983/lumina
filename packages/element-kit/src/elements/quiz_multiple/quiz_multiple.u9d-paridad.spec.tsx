/**
 * U9d.6a — paridad del Quiz (modo autónomo: una pregunta y multipregunta) contra su comportamiento
 * ANTERIOR a migrar al `ActivityShell` (Regla 7): el enunciado y las opciones en cada uno de los 7
 * layouts, la respuesta inmediata (una opción) o con «Enviar» (varias), el mensaje de retroalimentación
 * y la explicación, la navegación «Siguiente pregunta» / «Finalizar quiz», lo que sale hacia
 * `onResponse` (`id`, `[ids]` o `{ answers }`, UNA vez), la tarjeta «Has completado el quiz» y el
 * scoring. SYNCED queda fuera (lo maneja el servidor). El sonido se verifica con `use-sound` falso.
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateActivityResponse } from "@lumina/scoring";
import type { QuizLayoutVariant, QuizMultiple, QuizPregunta } from "@lumina/types/slide";

const sonido = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play: sonido }) }));

import { quizMultipleDefinition as def } from "./quiz_multiple-definition.js";

type Props = { estado: unknown; config: Record<string, unknown> };
const Viewer = def.Viewer as unknown as (p: Props) => React.ReactElement;

beforeEach(() => sonido.mockClear());
afterEach(() => cleanup());

const p1 = (extra: Partial<QuizPregunta> = {}): QuizPregunta => ({
  id: "q1",
  texto: "¿Capital de Francia?",
  opciones: [
    { id: "a", texto: "París", esCorrecta: true },
    { id: "b", texto: "Roma", esCorrecta: false },
    { id: "c", texto: "Lima", esCorrecta: false },
  ],
  ...extra,
});
const p2 = (): QuizPregunta => ({
  id: "q2",
  texto: "¿Cuánto es 2 + 2?",
  opciones: [
    { id: "d", texto: "Cuatro", esCorrecta: true },
    { id: "e", texto: "Cinco", esCorrecta: false },
  ],
});
const quiz = (preguntas: QuizPregunta[], layoutVariant: QuizLayoutVariant = "classic-list"): QuizMultiple => ({
  tipo: "quiz_multiple",
  preguntas,
  deliveryMode: "AUTONOMOUS",
  layoutVariant,
});

const opcion = (texto: string) => screen.getByRole("button", { name: new RegExp(texto) }) as HTMLButtonElement;
const clic = (texto: string) => fireEvent.click(opcion(texto));

describe("Quiz de una pregunta — paridad con el comportamiento anterior (U9d.6a)", () => {
  it("muestra el enunciado y una opción por respuesta", () => {
    render(<Viewer estado={quiz([p1()])} config={{}} />);
    expect(screen.getByText("¿Capital de Francia?")).toBeTruthy();
    for (const t of ["París", "Roma", "Lima"]) expect(opcion(t)).toBeTruthy();
  });

  it("una sola correcta: elegir responde AL INSTANTE, emite el id y marca la pregunta", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={quiz([p1()])} config={{ onResponse }} />);
    clic("París");
    expect(onResponse.mock.calls).toEqual([["a"]]);
    expect(screen.getByText("¡Correcto!")).toBeTruthy();
    expect(opcion("Roma").disabled).toBe(true);
    clic("Roma"); // ya respondió: se ignora
    expect(onResponse).toHaveBeenCalledTimes(1);
  });

  it("elegir mal muestra «Incorrecto…» y suena error; bien suena acierto", () => {
    const { unmount } = render(<Viewer estado={quiz([p1()])} config={{}} />);
    clic("Roma");
    expect(screen.getByText("Incorrecto. La respuesta correcta está resaltada.")).toBeTruthy();
    expect(sonido.mock.calls).toEqual([["wrong"]]);
    unmount();
    sonido.mockClear();
    render(<Viewer estado={quiz([p1()])} config={{}} />);
    clic("París");
    expect(sonido.mock.calls).toEqual([["correct"]]);
  });

  it("usa los mensajes y la explicación de la pregunta cuando los trae", () => {
    const e = quiz([p1({ retroalimentacion: { correcto: "¡Bien hecho!", incorrecto: "Uy.", explicacion: "Es la capital.", mostrarExplicacion: true } })]);
    render(<Viewer estado={e} config={{}} />);
    clic("París");
    expect(screen.getByText("¡Bien hecho!")).toBeTruthy();
    expect(screen.getByText("Es la capital.")).toBeTruthy();
  });

  it("varias correctas: se marcan y recién «Enviar respuesta» emite el arreglo de ids", () => {
    const e = quiz([
      p1({
        multipleRespuesta: true,
        opciones: [
          { id: "a", texto: "París", esCorrecta: true },
          { id: "b", texto: "Roma", esCorrecta: true },
          { id: "c", texto: "Lima", esCorrecta: false },
        ],
      }),
    ]);
    const onResponse = vi.fn();
    render(<Viewer estado={e} config={{ onResponse }} />);
    expect(screen.getByText("Selecciona las opciones correctas y envía.")).toBeTruthy();
    const enviar = screen.getByRole("button", { name: "Enviar respuesta" }) as HTMLButtonElement;
    expect(enviar.disabled).toBe(true);
    clic("París");
    clic("Roma");
    expect(onResponse).not.toHaveBeenCalled();
    fireEvent.click(enviar);
    expect(onResponse.mock.calls).toEqual([[["a", "b"]]]);
    expect(screen.getByText("¡Correcto!")).toBeTruthy();
  });

  it("sin respuesta correcta definida: responde pero no juzga (sin mensaje) y suena `submit`", () => {
    const e = quiz([p1({ opciones: [{ id: "a", texto: "Opción A", esCorrecta: false }, { id: "b", texto: "Opción B", esCorrecta: false }] })]);
    const onResponse = vi.fn();
    render(<Viewer estado={e} config={{ onResponse }} />);
    clic("Opción A");
    expect(onResponse.mock.calls).toEqual([["a"]]);
    expect(screen.queryByText("¡Correcto!")).toBeNull();
    expect(screen.queryByText(/Incorrecto/)).toBeNull();
    expect(sonido.mock.calls).toEqual([["submit"]]);
  });

  it("los 7 layouts muestran el enunciado y TODAS las opciones y responden igual", () => {
    const layouts: QuizLayoutVariant[] = [
      "classic-list", "color-grid", "icon-cards", "pills-horizontal",
      "two-col-color-list", "two-col-neutral-grid", "two-col-image-pills",
    ];
    for (const l of layouts) {
      const onResponse = vi.fn();
      const { unmount } = render(<Viewer estado={quiz([p1({ imagenUrl: "https://x/y.png" })], l)} config={{ onResponse }} />);
      expect(screen.getByText("¿Capital de Francia?"), l).toBeTruthy();
      for (const t of ["París", "Roma", "Lima"]) expect(opcion(t), `${l}/${t}`).toBeTruthy();
      clic("París");
      expect(onResponse.mock.calls, l).toEqual([["a"]]);
      unmount();
    }
  });

  it("`two-col-image-pills` muestra la imagen de la pregunta, o «Sin imagen»", () => {
    const { container, unmount } = render(<Viewer estado={quiz([p1({ imagenUrl: "https://x/y.png" })], "two-col-image-pills")} config={{}} />);
    expect(container.querySelector("img")?.getAttribute("src")).toBe("https://x/y.png");
    unmount();
    render(<Viewer estado={quiz([p1()], "two-col-image-pills")} config={{}} />);
    expect(screen.getByText("Sin imagen")).toBeTruthy();
  });
});

describe("Quiz multipregunta — paridad con el comportamiento anterior (U9d.6a)", () => {
  it("muestra «Pregunta 1 de 2», responde, y habilita «Siguiente pregunta»", () => {
    render(<Viewer estado={quiz([p1(), p2()])} config={{}} />);
    expect(screen.getByText("Pregunta 1 de 2")).toBeTruthy();
    clic("París");
    expect(screen.getByText("¡Correcto!")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Siguiente pregunta" })).toBeTruthy();
  });

  it("NO emite al responder cada pregunta; al «Finalizar quiz» emite UNA vez `{ answers }`", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={quiz([p1(), p2()])} config={{ onResponse }} />);
    clic("Roma");
    fireEvent.click(screen.getByRole("button", { name: "Siguiente pregunta" }));
    expect(screen.getByText("Pregunta 2 de 2")).toBeTruthy();
    expect(onResponse).not.toHaveBeenCalled();
    clic("Cuatro");
    fireEvent.click(screen.getByRole("button", { name: "Finalizar quiz" }));
    expect(onResponse.mock.calls).toEqual([[{ answers: { q1: ["b"], q2: ["d"] } }]]);
  });

  it("al finalizar muestra «Has completado el quiz» con el conteo y suena `submit`", () => {
    render(<Viewer estado={quiz([p1(), p2()])} config={{}} />);
    clic("París");
    fireEvent.click(screen.getByRole("button", { name: "Siguiente pregunta" }));
    clic("Cuatro");
    sonido.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Finalizar quiz" }));
    expect(screen.getByText("Has completado el quiz")).toBeTruthy();
    expect(screen.getByText("2 preguntas respondidas")).toBeTruthy();
    expect(sonido.mock.calls).toEqual([["submit"]]);
  });

  it("cada pregunta suena según acierto o error", () => {
    render(<Viewer estado={quiz([p1(), p2()])} config={{}} />);
    clic("Roma");
    fireEvent.click(screen.getByRole("button", { name: "Siguiente pregunta" }));
    clic("Cuatro");
    expect(sonido.mock.calls).toEqual([["wrong"], ["correct"]]);
  });
});

describe("Quiz — scoring con la respuesta que sale (U9d.6a)", () => {
  it("todas bien 5 · todas mal 1 · la mitad 2,5 (una pregunta: id; varias: { answers })", () => {
    const uno = quiz([p1()]);
    expect(evaluateActivityResponse("quiz_multiple", uno, "a").score).toBe(5);
    expect(evaluateActivityResponse("quiz_multiple", uno, "b").score).toBe(1);
    const dos = quiz([p1(), p2()]);
    const nota = (answers: Record<string, string[]>) => evaluateActivityResponse("quiz_multiple", dos, { answers }).score;
    expect(nota({ q1: ["a"], q2: ["d"] })).toBe(5);
    expect(nota({ q1: ["b"], q2: ["e"] })).toBe(1);
    expect(nota({ q1: ["a"], q2: ["e"] })).toBe(2.5);
  });
});
