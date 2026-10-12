/**
 * U9a.2 — paridad de Respuesta matemática contra su comportamiento ANTERIOR a migrar al
 * `ActivityShell` (Regla 7): qué entrega por `onResponse`, cómo la califica `@lumina/scoring`
 * y la mecánica visible (validación del modo algebraico, unidad, límites, reinicio).
 * Complementa `activities/_classic/respuesta-matematica.spec.tsx`, que sigue vigente.
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateActivityResponse } from "@lumina/scoring";
import type { MathAnswerActivity } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { RespuestaMatematicaViewer as ViewerComponente } from "../../activities/_classic/index.js";
import { respuestaMatematicaDefinition } from "./respuesta_matematica-definition.js";

type Props = { estado: unknown; config: Record<string, unknown> };
const Viewer = respuestaMatematicaDefinition.Viewer as unknown as (p: Props) => React.ReactElement;

afterEach(cleanup);
beforeEach(() => play.mockClear());

const numerica = (parche: Partial<MathAnswerActivity> = {}): MathAnswerActivity => ({
  ...(respuestaMatematicaDefinition.crearPorDefecto() as MathAnswerActivity),
  question: "¿Cuánto es 3/4 + 1/4?",
  respuesta: "1",
  ...parche,
});
const algebraica = (parche: Partial<MathAnswerActivity> = {}): MathAnswerActivity =>
  numerica({ modo: "algebraico", question: "Factoriza 2x+2", respuesta: "2(x+1)", ...parche });

const caja = () => screen.getByLabelText("Tu respuesta") as HTMLInputElement;
const enviar = () => screen.getByRole("button", { name: "Enviar" }) as HTMLButtonElement;
const escribir = (v: string) => fireEvent.change(caja(), { target: { value: v } });

describe("Respuesta matemática — paridad con el comportamiento anterior (U9a.2)", () => {
  it("modo numérico: emite el texto recortado una sola vez y suena `submit`", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={numerica()} config={{ onResponse }} />);
    escribir("  1,0 ");
    fireEvent.click(enviar());
    expect(onResponse.mock.calls).toEqual([["1,0"]]);
    expect(play.mock.calls).toEqual([["submit"]]);
  });

  it("sin texto (o solo espacios) no se puede enviar", () => {
    const onResponse = vi.fn();
    const { container } = render(<Viewer estado={numerica()} config={{ onResponse }} />);
    expect(enviar().disabled).toBe(true);
    escribir("   ");
    expect(enviar().disabled).toBe(true);
    fireEvent.submit(container.querySelector("form")!);
    expect(onResponse).not.toHaveBeenCalled();
  });

  it("al enviar queda «¡Respuesta enviada!» y el formulario desaparece", () => {
    render(<Viewer estado={numerica()} config={{}} />);
    escribir("1");
    fireEvent.click(enviar());
    expect(screen.getByText(/¡Respuesta enviada!/)).toBeTruthy();
    expect(screen.queryByLabelText("Tu respuesta")).toBeNull();
  });

  it("modo numérico: placeholder, ayuda, `inputMode` y límite de 40 caracteres", () => {
    render(<Viewer estado={numerica()} config={{}} />);
    expect(caja().placeholder).toBe("Escribe un número");
    expect(caja().getAttribute("inputmode")).toBe("decimal");
    expect(caja().maxLength).toBe(40);
    expect(screen.getByText("Usa coma para los decimales. Puedes escribir fracciones como 3/4.")).toBeTruthy();
  });

  it("modo algebraico: placeholder, ayuda, `inputMode` y límite de 200 caracteres", () => {
    render(<Viewer estado={algebraica()} config={{}} />);
    expect(caja().placeholder).toBe("Escribe una expresión");
    expect(caja().getAttribute("inputmode")).toBe("text");
    expect(caja().maxLength).toBe(200);
    expect(screen.getByText("Escribe una expresión, por ejemplo 2(x+1), x^2−1 o sqrt(x).")).toBeTruthy();
  });

  it("la unidad solo se muestra en modo numérico", () => {
    const { rerender } = render(<Viewer estado={numerica({ unidad: "cm" })} config={{}} />);
    expect(screen.getByText("cm")).toBeTruthy();
    rerender(<Viewer estado={algebraica({ unidad: "cm" })} config={{}} />);
    expect(screen.queryByText("cm")).toBeNull();
  });

  it("muestra la pista (con 💡) solo si existe", () => {
    const { rerender } = render(<Viewer estado={numerica()} config={{}} />);
    expect(screen.queryByText(/💡/)).toBeNull();
    rerender(<Viewer estado={numerica({ hint: "Suma fracciones" })} config={{}} />);
    expect(screen.getByText("💡 Suma fracciones")).toBeTruthy();
  });

  it("algebraico ilegible: no envía, avisa («Revisa tu expresión: …») y el aviso se borra al escribir", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={algebraica()} config={{ onResponse }} />);
    escribir("2(x+1");
    fireEvent.click(enviar());
    expect(onResponse).not.toHaveBeenCalled();
    expect(play).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toMatch(/^Revisa tu expresión: .*paréntesis/);
    escribir("2(x+1)");
    expect(screen.queryByRole("alert")).toBeNull();
    fireEvent.click(enviar());
    expect(onResponse.mock.calls).toEqual([["2(x+1)"]]);
  });

  it("modo numérico NO valida: envía lo que el alumno escribió, aunque no sea un número", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={numerica()} config={{ onResponse }} />);
    escribir("cuatro");
    fireEvent.click(enviar());
    expect(onResponse.mock.calls).toEqual([["cuatro"]]);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("calificación con @lumina/scoring: acierto = nota máxima, error = nota mínima (numérica y algebraica)", () => {
    const casos: [MathAnswerActivity, string, boolean][] = [
      [numerica(), "1,0", true],
      [numerica(), "2", false],
      [numerica({ respuesta: "3,14" }), "3,15", true],
      [algebraica(), "2x+2", true],
      [algebraica(), "2x+3", false],
    ];
    for (const [a, escrito, correcto] of casos) {
      const onResponse = vi.fn();
      render(<Viewer estado={a} config={{ onResponse }} />);
      escribir(escrito);
      fireEvent.click(enviar());
      const ev = evaluateActivityResponse("respuesta_matematica", a, onResponse.mock.calls[0][0]);
      expect({ escrito, correct: ev.correct, score: ev.score }, `${a.modo}:${escrito}`).toEqual({
        escrito,
        correct: correcto,
        score: correcto ? 5 : 1,
      });
      cleanup();
    }
  });

  it("el componente reinicia texto, aviso y estado al cambiar `editorSyncKey`", () => {
    const onResponse = vi.fn();
    const a = algebraica();
    const { rerender } = render(<ViewerComponente activity={a} editorSyncKey="s1" onResponse={onResponse} />);
    escribir("2(x+1");
    fireEvent.click(enviar());
    expect(screen.getByRole("alert")).toBeTruthy();
    rerender(<ViewerComponente activity={a} editorSyncKey="s2" onResponse={onResponse} />);
    expect(caja().value).toBe("");
    expect(screen.queryByRole("alert")).toBeNull();
    escribir("2x+2");
    fireEvent.click(enviar());
    expect(onResponse.mock.calls).toEqual([["2x+2"]]);
  });

  it("por el registro NO se reenvía `editorSyncKey` (el adaptador clásico no lo pasa): no reinicia", () => {
    const a = numerica();
    const { rerender } = render(<Viewer estado={a} config={{ editorSyncKey: "s1" }} />);
    escribir("1");
    fireEvent.click(enviar());
    rerender(<Viewer estado={a} config={{ editorSyncKey: "s2" }} />);
    expect(screen.getByText(/¡Respuesta enviada!/)).toBeTruthy();
  });
});
