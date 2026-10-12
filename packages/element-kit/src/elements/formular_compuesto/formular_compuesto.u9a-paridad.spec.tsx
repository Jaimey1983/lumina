/**
 * U9a.7 — paridad de Formular compuesto contra su comportamiento ANTERIOR a migrar al
 * `ActivityShell` (Regla 7): qué emite (`{ answers }` solo con lo escrito), sonido, mensaje,
 * bloqueo y lo que `@lumina/scoring` hace con esa respuesta.
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateActivityResponse } from "@lumina/scoring";
import type { FormularCompuestoActivity } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { FormularCompuestoViewer as ViewerComponente } from "../../activities/chemistry/chemistry-activities.js";
import { formularCompuestoDefinition } from "./formular_compuesto-definition.js";

type Props = { estado: unknown; config: Record<string, unknown> };
const Viewer = formularCompuestoDefinition.Viewer as unknown as (p: Props) => React.ReactElement;

afterEach(cleanup);
beforeEach(() => play.mockClear());

const ejercicio = (parche: Partial<FormularCompuestoActivity> = {}): FormularCompuestoActivity => ({
  tipo: "formular_compuesto",
  instruccion: "Escribe la fórmula de cada compuesto.",
  preguntas: [
    { id: "q1", enunciado: "Óxido de calcio", formula: "CaO" },
    { id: "q2", enunciado: "Cloruro de sodio", formula: "NaCl" },
  ],
  ...parche,
});

const campos = () => screen.getAllByPlaceholderText("Fórmula") as HTMLInputElement[];
const enviar = () => screen.getByRole("button", { name: "Enviar fórmulas" }) as HTMLButtonElement;

describe("Formular compuesto — paridad con el comportamiento anterior (U9a.7)", () => {
  it("muestra la instrucción y, por pregunta, su enunciado y un campo vacío", () => {
    render(<Viewer estado={ejercicio()} config={{}} />);
    expect(screen.getByText("Escribe la fórmula de cada compuesto.")).toBeTruthy();
    expect(screen.getByText("Óxido de calcio")).toBeTruthy();
    expect(screen.getByText("Cloruro de sodio")).toBeTruthy();
    expect(campos().map((c) => c.value)).toEqual(["", ""]);
  });

  it("«Enviar» siempre está habilitado y emite `{ answers }` SOLO con lo escrito (sin recortar), una vez", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={ejercicio()} config={{ onResponse }} />);
    expect(enviar().disabled).toBe(false);
    fireEvent.change(campos()[1], { target: { value: " NaCl " } });
    fireEvent.click(enviar());
    expect(onResponse.mock.calls).toEqual([[{ answers: { q2: " NaCl " } }]]);
    expect(play.mock.calls).toEqual([["submit"]]);
  });

  it("sin escribir nada emite `{ answers: {} }`", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={ejercicio()} config={{ onResponse }} />);
    fireEvent.click(enviar());
    expect(onResponse.mock.calls).toEqual([[{ answers: {} }]]);
  });

  it("al enviar: campos bloqueados, «Respuesta enviada.» y sin botón", () => {
    render(<Viewer estado={ejercicio()} config={{}} />);
    fireEvent.click(enviar());
    expect(campos().every((c) => c.disabled)).toBe(true);
    expect(screen.getByText("Respuesta enviada.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Enviar fórmulas" })).toBeNull();
  });

  it("calificación con @lumina/scoring: todo bien = 5; parcial y nada, valores medidos", () => {
    const a = ejercicio();
    const nota = (answers: Record<string, string>) => {
      const ev = evaluateActivityResponse("formular_compuesto", a, { answers });
      return { correct: ev.correct, score: ev.score };
    };
    expect(nota({ q1: "CaO", q2: "NaCl" })).toEqual({ correct: true, score: 5 });
    expect(nota({ q1: "CaO", q2: "x" })).toEqual({ correct: false, score: 2.5 });
    expect(nota({})).toEqual({ correct: false, score: 1 });
  });

  it("el componente reinicia respuestas y envío al cambiar `editorSyncKey`", () => {
    const a = ejercicio();
    const { rerender } = render(<ViewerComponente activity={a} editorSyncKey="s1" />);
    fireEvent.change(campos()[0], { target: { value: "CaO" } });
    fireEvent.click(enviar());
    rerender(<ViewerComponente activity={a} editorSyncKey="s2" />);
    expect(campos().map((c) => c.value)).toEqual(["", ""]);
    expect(campos().every((c) => !c.disabled)).toBe(true);
  });

  it("por el registro NO se reenvía `editorSyncKey` (el adaptador clásico no lo pasa): no reinicia", () => {
    const a = ejercicio();
    const { rerender } = render(<Viewer estado={a} config={{ editorSyncKey: "s1" }} />);
    fireEvent.click(enviar());
    rerender(<Viewer estado={a} config={{ editorSyncKey: "s2" }} />);
    expect(screen.getByText("Respuesta enviada.")).toBeTruthy();
  });
});
