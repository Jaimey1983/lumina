/**
 * U9a.1 — paridad de Respuesta corta contra su comportamiento ANTERIOR a migrar al
 * `ActivityShell` (Regla 7). Se fija lo que el viewer entrega por `onResponse`, lo que
 * `@lumina/scoring` hace con eso, y la mecánica visible (enviar una vez, límites, pista,
 * reinicio por `editorSyncKey`). Medido con el viewer viejo (`useState` + `useEffect`).
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateActivityResponse } from "@lumina/scoring";
import type { ShortAnswerActivity } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { ShortAnswerViewer } from "../../activities/_classic/index.js";
import { shortAnswerDefinition } from "./short_answer-definition.js";

type Props = { estado: unknown; config: Record<string, unknown> };
const Viewer = shortAnswerDefinition.Viewer as unknown as (p: Props) => React.ReactElement;

afterEach(cleanup);
beforeEach(() => play.mockClear());

const pregunta = (parche: Partial<ShortAnswerActivity> = {}): ShortAnswerActivity => ({
  tipo: "short_answer",
  question: "¿Cuál es la capital de Francia?",
  expectedAnswer: "París",
  caseSensitive: false,
  maxLength: 200,
  ...parche,
});

const caja = () => screen.getByPlaceholderText("Escribe tu respuesta aquí…") as HTMLTextAreaElement;
const enviar = () => screen.getByRole("button", { name: "Enviar" }) as HTMLButtonElement;
const escribir = (v: string) => fireEvent.change(caja(), { target: { value: v } });

describe("Respuesta corta — paridad con el comportamiento anterior (U9a.1)", () => {
  it("emite el texto SIN espacios en los bordes, una sola vez, y suena `submit`", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={pregunta()} config={{ onResponse }} />);
    escribir("   París  ");
    fireEvent.click(enviar());
    expect(onResponse.mock.calls).toEqual([["París"]]);
    expect(play.mock.calls).toEqual([["submit"]]);
  });

  it("sin texto (o solo espacios) el botón está deshabilitado y no emite", () => {
    const onResponse = vi.fn();
    const { container } = render(<Viewer estado={pregunta()} config={{ onResponse }} />);
    expect(enviar().disabled).toBe(true);
    escribir("    ");
    expect(enviar().disabled).toBe(true);
    fireEvent.submit(container.querySelector("form")!);
    expect(onResponse).not.toHaveBeenCalled();
    escribir("a");
    expect(enviar().disabled).toBe(false);
  });

  it("al enviar, el formulario desaparece y queda «¡Respuesta enviada!»; un segundo envío se ignora", () => {
    const onResponse = vi.fn();
    const { container } = render(<Viewer estado={pregunta()} config={{ onResponse }} />);
    escribir("Lyon");
    fireEvent.click(enviar());
    expect(screen.getByText(/¡Respuesta enviada!/)).toBeTruthy();
    expect(screen.queryByPlaceholderText("Escribe tu respuesta aquí…")).toBeNull();
    expect(container.querySelector("form")).toBeNull();
    expect(onResponse).toHaveBeenCalledTimes(1);
  });

  it("muestra la pregunta y la pista (con 💡) solo si existe", () => {
    const { rerender } = render(<Viewer estado={pregunta()} config={{}} />);
    expect(screen.getByText("¿Cuál es la capital de Francia?")).toBeTruthy();
    expect(screen.queryByText(/💡/)).toBeNull();
    rerender(<Viewer estado={pregunta({ hint: "Tiene una torre" })} config={{}} />);
    expect(screen.getByText("💡 Tiene una torre")).toBeTruthy();
  });

  it("`maxLength` se aplica a la caja y el contador cuenta lo escrito (200 si falta)", () => {
    render(<Viewer estado={pregunta({ maxLength: 50 })} config={{}} />);
    expect(caja().maxLength).toBe(50);
    escribir("hola");
    expect(screen.getByText("4/50")).toBeTruthy();
    cleanup();
    const sin = { ...pregunta(), maxLength: undefined } as unknown as ShortAnswerActivity;
    render(<Viewer estado={sin} config={{}} />);
    expect(caja().maxLength).toBe(200);
    expect(screen.queryByText(/\/\d+$/)).toBeNull();
  });

  it("es MANUAL en scoring: la respuesta no se califica sola (sin score)", () => {
    const a = pregunta();
    const onResponse = vi.fn();
    render(<Viewer estado={a} config={{ onResponse }} />);
    escribir("París");
    fireEvent.click(enviar());
    const ev = evaluateActivityResponse("short_answer", a, onResponse.mock.calls[0][0]);
    expect({ correct: ev.correct ?? null, score: ev.score ?? null }).toEqual({ correct: null, score: null });
  });

  it("el componente reinicia texto y estado al cambiar `editorSyncKey`", () => {
    const onResponse = vi.fn();
    const a = pregunta();
    const { rerender } = render(<ShortAnswerViewer activity={a} editorSyncKey="s1" onResponse={onResponse} />);
    escribir("uno");
    fireEvent.click(enviar());
    rerender(<ShortAnswerViewer activity={a} editorSyncKey="s2" onResponse={onResponse} />);
    expect(caja().value).toBe("");
    escribir("dos");
    fireEvent.click(enviar());
    expect(onResponse.mock.calls).toEqual([["uno"], ["dos"]]);
  });

  it("por el registro NO se reenvía `editorSyncKey` (el adaptador clásico no lo pasa): no reinicia", () => {
    const a = pregunta();
    const { rerender } = render(<Viewer estado={a} config={{ editorSyncKey: "s1" }} />);
    escribir("uno");
    fireEvent.click(enviar());
    rerender(<Viewer estado={a} config={{ editorSyncKey: "s2" }} />);
    expect(screen.getByText(/¡Respuesta enviada!/)).toBeTruthy();
  });

  it("variante oscura: renderiza lo mismo (texto de la pregunta visible)", () => {
    render(<ShortAnswerViewer activity={pregunta()} variant="dark" />);
    expect(screen.getByText("¿Cuál es la capital de Francia?")).toBeTruthy();
  });
});
