/**
 * U9a.6 — paridad de Balancear ecuación contra su comportamiento ANTERIOR a migrar al
 * `ActivityShell` (Regla 7): coeficientes iniciales, +/−, tope en 0, envío `{ coefficients }`,
 * sonido, mensaje y reinicio, más lo que `@lumina/scoring` hace con esa respuesta.
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateActivityResponse } from "@lumina/scoring";
import type { BalancearEcuacionActivity } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { BalancearEcuacionViewer as ViewerComponente } from "../../activities/chemistry/chemistry-activities.js";
import { balancearEcuacionDefinition } from "./balancear_ecuacion-definition.js";

type Props = { estado: unknown; config: Record<string, unknown> };
const Viewer = balancearEcuacionDefinition.Viewer as unknown as (p: Props) => React.ReactElement;

afterEach(cleanup);
beforeEach(() => play.mockClear());

const ecuacion = (parche: Partial<BalancearEcuacionActivity> = {}): BalancearEcuacionActivity => ({
  tipo: "balancear_ecuacion",
  instruccion: "Ajusta los coeficientes.",
  ecuacion: "H2 + O2 -> H2O",
  ...parche,
});

/** Botones en el orden del DOM: [−, +] por especie y, al final, «Enviar coeficientes». */
const botones = (c: HTMLElement) => [...c.querySelectorAll("button")] as HTMLButtonElement[];
const menos = (c: HTMLElement, i: number) => botones(c)[i * 2];
const mas = (c: HTMLElement, i: number) => botones(c)[i * 2 + 1];
const enviar = () => screen.getByRole("button", { name: "Enviar coeficientes" }) as HTMLButtonElement;
/** Coeficiente mostrado de cada especie, en orden. */
const coeficientes = (c: HTMLElement) =>
  [...c.querySelectorAll("span.font-semibold, [data-coeficiente]")].map((e) => e.textContent);

describe("Balancear ecuación — paridad con el comportamiento anterior (U9a.6)", () => {
  it("muestra la instrucción y una especie por término, cada una con coeficiente 1", () => {
    const { container } = render(<Viewer estado={ecuacion()} config={{}} />);
    expect(screen.getByText("Ajusta los coeficientes.")).toBeTruthy();
    for (const f of ["H2", "O2", "H2O"]) expect(screen.getByText(f)).toBeTruthy();
    expect(coeficientes(container)).toEqual(["1", "1", "1"]);
  });

  it("+ y − cambian el coeficiente de SU especie, y no bajan de 0", () => {
    const { container } = render(<Viewer estado={ecuacion()} config={{}} />);
    fireEvent.click(mas(container, 0));
    fireEvent.click(mas(container, 0));
    fireEvent.click(mas(container, 2));
    expect(coeficientes(container)).toEqual(["3", "1", "2"]);
    fireEvent.click(menos(container, 1));
    fireEvent.click(menos(container, 1));
    fireEvent.click(menos(container, 1));
    expect(coeficientes(container)).toEqual(["3", "0", "2"]);
  });

  it("con algún coeficiente en 0 «Enviar» está deshabilitado y no emite", () => {
    const onResponse = vi.fn();
    const { container } = render(<Viewer estado={ecuacion()} config={{ onResponse }} />);
    fireEvent.click(menos(container, 0));
    expect(enviar().disabled).toBe(true);
    fireEvent.click(enviar());
    expect(onResponse).not.toHaveBeenCalled();
    fireEvent.click(mas(container, 0));
    expect(enviar().disabled).toBe(false);
  });

  it("emite `{ coefficients: [...] }` en el orden reactivos→productos una sola vez y suena `submit`", () => {
    const onResponse = vi.fn();
    const { container } = render(<Viewer estado={ecuacion()} config={{ onResponse }} />);
    fireEvent.click(mas(container, 0)); // H2 → 2
    fireEvent.click(mas(container, 2)); // H2O → 2
    fireEvent.click(enviar());
    expect(onResponse.mock.calls).toEqual([[{ coefficients: [2, 1, 2] }]]);
    expect(play.mock.calls).toEqual([["submit"]]);
  });

  it("al enviar queda «Respuesta enviada.» y desaparece el botón de enviar", () => {
    render(<Viewer estado={ecuacion()} config={{}} />);
    fireEvent.click(enviar());
    expect(screen.getByText("Respuesta enviada.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Enviar coeficientes" })).toBeNull();
  });

  it("una ecuación inválida muestra «La ecuación del docente no es válida.»", () => {
    render(<Viewer estado={ecuacion({ ecuacion: "esto no es una ecuación" })} config={{}} />);
    expect(screen.getByText("La ecuación del docente no es válida.")).toBeTruthy();
  });

  it("calificación con @lumina/scoring: [2,1,2] es correcta (5); [1,1,1] no (nota mínima)", () => {
    const a = ecuacion();
    const bien = evaluateActivityResponse("balancear_ecuacion", a, { coefficients: [2, 1, 2] });
    const mal = evaluateActivityResponse("balancear_ecuacion", a, { coefficients: [1, 1, 1] });
    expect({ correct: bien.correct, score: bien.score }).toEqual({ correct: true, score: 5 });
    expect({ correct: mal.correct, score: mal.score }).toEqual({ correct: false, score: 1 });
  });

  it("el componente reinicia coeficientes y envío al cambiar `editorSyncKey` o la ecuación", () => {
    const a = ecuacion();
    const { container, rerender } = render(<ViewerComponente activity={a} editorSyncKey="s1" />);
    fireEvent.click(mas(container, 0));
    fireEvent.click(enviar());
    rerender(<ViewerComponente activity={a} editorSyncKey="s2" />);
    expect(coeficientes(container)).toEqual(["1", "1", "1"]);
    expect(enviar().disabled).toBe(false);
    fireEvent.click(mas(container, 1));
    rerender(<ViewerComponente activity={ecuacion({ ecuacion: "N2 + H2 -> NH3" })} editorSyncKey="s2" />);
    expect(coeficientes(container)).toEqual(["1", "1", "1"]);
  });

  it("por el registro NO se reenvía `editorSyncKey` (el adaptador clásico no lo pasa): no reinicia", () => {
    const a = ecuacion();
    const { rerender } = render(<Viewer estado={a} config={{ editorSyncKey: "s1" }} />);
    fireEvent.click(enviar());
    rerender(<Viewer estado={a} config={{ editorSyncKey: "s2" }} />);
    expect(screen.getByText("Respuesta enviada.")).toBeTruthy();
  });
});
