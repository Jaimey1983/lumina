/**
 * U9d.6b — paridad del Quiz SINCRONIZADO contra su comportamiento ANTERIOR a pasar sus colores a
 * tokens (Regla 7). Es el contrato con el docente: lo que el viewer EMITE por el socket
 * (`quiz:sync-state`, `quiz:answer`) y cómo reacciona a lo que el servidor manda (`quiz:launch`,
 * `timer:tick`, `timer:end`, `quiz:pause`/`resume`, `quiz:ranking`, `quiz:skip`). Socket falso.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Socket } from "socket.io-client";
import type { QuizMultiple, QuizPregunta } from "@lumina/types/slide";

const sonido = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play: sonido }) }));

import { QuizSyncedViewer } from "./quiz-synced-viewer.js";

type Handler = (payload: unknown) => void;
function crearSocket(estadoInicial?: unknown) {
  const handlers = new Map<string, Set<Handler>>();
  const emitidos: { evento: string; payload: unknown }[] = [];
  const socket = {
    on: (e: string, fn: Handler) => {
      if (!handlers.has(e)) handlers.set(e, new Set());
      handlers.get(e)!.add(fn);
    },
    off: (e: string, fn: Handler) => void handlers.get(e)?.delete(fn),
    emit: (e: string, payload: unknown, cb?: (r: unknown) => void) => {
      emitidos.push({ evento: e, payload });
      if (e === "quiz:sync-state" && cb) cb(estadoInicial ?? { ok: true, state: null });
    },
  };
  const disparar = (e: string, payload: unknown) => act(() => void handlers.get(e)?.forEach((fn) => fn(payload)));
  return { socket: socket as unknown as Socket, emitidos, disparar };
}

beforeEach(() => sonido.mockClear());
afterEach(() => cleanup());

const preg = (id: string, extra: Partial<QuizPregunta> = {}): QuizPregunta => ({
  id,
  texto: `Pregunta ${id}`,
  opciones: [
    { id: `${id}a`, texto: `Correcta ${id}`, esCorrecta: true },
    { id: `${id}b`, texto: `Falsa ${id}`, esCorrecta: false },
  ],
  ...extra,
});
const actividad = (preguntas = [preg("1"), preg("2")]): QuizMultiple => ({
  tipo: "quiz_multiple",
  preguntas,
  deliveryMode: "SYNCED",
  timePerQuestion: 30,
  layoutVariant: "classic-list",
});

function montar(socket: Socket | null, a = actividad()) {
  return render(
    <QuizSyncedViewer activity={a} quizBlockId="blk" classId="cls" studentId="est1" studentName="Ana" liveSocket={socket} />,
  );
}
const lanzar = (disparar: ReturnType<typeof crearSocket>["disparar"], i = 0, a = actividad()) =>
  disparar("quiz:launch", {
    quizBlockId: "blk",
    question: a.preguntas[i],
    questionIndex: i,
    questionId: a.preguntas[i]!.id,
    totalQuestions: a.preguntas.length,
    timePerQuestion: 30,
  });
const opcion = (t: string) => screen.getByRole("button", { name: new RegExp(t) }) as HTMLButtonElement;

describe("Quiz sincronizado — paridad con el comportamiento anterior (U9d.6b)", () => {
  it("sin socket pide conectarse a la sesión en vivo", () => {
    montar(null);
    expect(screen.getByText("Quiz sincronizado — conecta a la sesión en vivo.")).toBeTruthy();
  });

  it("con socket pide el estado (`quiz:sync-state`) y espera al docente", () => {
    const { socket, emitidos } = crearSocket();
    montar(socket);
    expect(emitidos[0]).toEqual({ evento: "quiz:sync-state", payload: { classId: "cls", quizBlockId: "blk", studentId: "est1" } });
    expect(screen.getByText("Esperando al docente…")).toBeTruthy();
  });

  it("`quiz:launch` muestra la pregunta, sus opciones, «Pregunta 1 de 2 · 30s» y la barra de tiempo", () => {
    const { socket, disparar } = crearSocket();
    montar(socket);
    lanzar(disparar);
    expect(screen.getByText("Pregunta 1")).toBeTruthy();
    expect(opcion("Correcta 1")).toBeTruthy();
    expect(screen.getByText(/Pregunta 1 de 2 · 30s/)).toBeTruthy();
  });

  it("ignora los eventos de OTRO bloque", () => {
    const { socket, disparar } = crearSocket();
    montar(socket);
    disparar("quiz:launch", { quizBlockId: "otro", question: preg("1"), questionIndex: 0, questionId: "1", totalQuestions: 2, timePerQuestion: 30 });
    expect(screen.getByText("Esperando al docente…")).toBeTruthy();
  });

  it("una sola correcta: elegir emite `quiz:answer` con los ids, al instante, y muestra el veredicto", () => {
    const { socket, disparar, emitidos } = crearSocket();
    montar(socket);
    lanzar(disparar);
    fireEvent.click(opcion("Correcta 1"));
    const resp = emitidos.find((e) => e.evento === "quiz:answer");
    expect(resp?.payload).toEqual({ classId: "cls", quizBlockId: "blk", studentId: "est1", studentName: "Ana", questionId: "1", optionIds: ["1a"] });
    expect(screen.getByText("¡Correcto!")).toBeTruthy();
    expect(opcion("Falsa 1").disabled).toBe(true);
    expect(sonido.mock.calls).toEqual([["correct"]]);
    fireEvent.click(opcion("Falsa 1"));
    expect(emitidos.filter((e) => e.evento === "quiz:answer")).toHaveLength(1);
  });

  it("varias correctas: «Confirmar respuesta» envía todas las elegidas", () => {
    const multi = actividad([preg("1", { multipleRespuesta: true, opciones: [{ id: "x", texto: "Uno", esCorrecta: true }, { id: "y", texto: "Dos", esCorrecta: true }, { id: "z", texto: "Tres", esCorrecta: false }] })]);
    const { socket, disparar, emitidos } = crearSocket();
    montar(socket, multi);
    lanzar(disparar, 0, multi);
    const confirmar = screen.getByRole("button", { name: "Confirmar respuesta" }) as HTMLButtonElement;
    expect(confirmar.disabled).toBe(true);
    fireEvent.click(opcion("Uno"));
    fireEvent.click(opcion("Dos"));
    fireEvent.click(confirmar);
    expect(emitidos.find((e) => e.evento === "quiz:answer")?.payload).toMatchObject({ optionIds: ["x", "y"] });
  });

  it("`timer:tick` actualiza los segundos; `quiz:pause` bloquea y dice «Pausado»; `quiz:resume` reanuda", () => {
    const { socket, disparar } = crearSocket();
    montar(socket);
    lanzar(disparar);
    disparar("timer:tick", { quizBlockId: "blk", secondsLeft: 12 });
    expect(screen.getByText(/Pregunta 1 de 2 · 12s/)).toBeTruthy();
    disparar("quiz:pause", { quizBlockId: "blk" });
    expect(screen.getByText(/Pregunta 1 de 2 · Pausado/)).toBeTruthy();
    expect(opcion("Correcta 1").disabled).toBe(true);
    disparar("quiz:resume", { quizBlockId: "blk" });
    expect(opcion("Correcta 1").disabled).toBe(false);
  });

  it("`timer:end` sin haber contestado envía una respuesta vacía", () => {
    const { socket, disparar, emitidos } = crearSocket();
    montar(socket);
    lanzar(disparar);
    disparar("timer:end", { quizBlockId: "blk" });
    expect(emitidos.find((e) => e.evento === "quiz:answer")?.payload).toMatchObject({ questionId: "1", optionIds: [] });
  });

  it("`quiz:skip` vuelve a la espera", () => {
    const { socket, disparar } = crearSocket();
    montar(socket);
    lanzar(disparar);
    disparar("quiz:skip", { quizBlockId: "blk" });
    expect(screen.getByText("Esperando al docente…")).toBeTruthy();
  });

  it("`quiz:ranking` muestra el top 5 con posición, nombre y puntos", () => {
    const { socket, disparar } = crearSocket();
    montar(socket);
    const ranking = Array.from({ length: 7 }, (_, i) => ({ studentId: `e${i}`, studentName: `Alumno ${i}`, points: 100 - i, position: i + 1 }));
    disparar("quiz:ranking", { quizBlockId: "blk", ranking });
    expect(screen.getByText("Ranking del quiz")).toBeTruthy();
    expect(screen.getByText("#1")).toBeTruthy();
    expect(screen.getByText("Alumno 4")).toBeTruthy();
    expect(screen.queryByText("Alumno 5")).toBeNull();
  });

  it("recupera una pregunta en curso (con respuesta ya dada) desde `quiz:sync-state`", () => {
    const { socket } = crearSocket({
      ok: true,
      state: { quizBlockId: "blk", status: "active", questionIndex: 0, questionId: "1", secondsLeft: 20, timePerQuestion: 30, totalQuestions: 2, studentAnswer: { optionIds: ["1b"], correct: false } },
    });
    montar(socket);
    expect(screen.getByText("Pregunta 1")).toBeTruthy();
    expect(opcion("Falsa 1").disabled).toBe(true);
    expect(screen.getByText("Incorrecto. La respuesta correcta está resaltada.")).toBeTruthy();
  });
});
