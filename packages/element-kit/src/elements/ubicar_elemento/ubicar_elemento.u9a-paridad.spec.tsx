/**
 * U9a.8 — paridad de Ubicar elemento contra su comportamiento ANTERIOR a migrar al
 * `ActivityShell` (Regla 7): qué emite (`{ placements }` con 0 donde no se escribió), sonido,
 * mensaje, bloqueo y lo que `@lumina/scoring` hace con esa respuesta.
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateActivityResponse } from "@lumina/scoring";
import type { UbicarElementoActivity } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { UbicarElementoViewer as ViewerComponente } from "../../activities/chemistry/chemistry-activities.js";
import { ubicarElementoDefinition } from "./ubicar_elemento-definition.js";

type Props = { estado: unknown; config: Record<string, unknown> };
const Viewer = ubicarElementoDefinition.Viewer as unknown as (p: Props) => React.ReactElement;

afterEach(cleanup);
beforeEach(() => play.mockClear());

const ejercicio = (parche: Partial<UbicarElementoActivity> = {}): UbicarElementoActivity => ({
  tipo: "ubicar_elemento",
  instruccion: "Indica el periodo y el grupo de cada elemento.",
  elementos: [
    { id: "e1", symbol: "Na", periodo: 3, grupo: 1 },
    { id: "e2", symbol: "Cl", periodo: 3, grupo: 17 },
  ],
  ...parche,
});

const periodos = () => screen.getAllByPlaceholderText("Periodo") as HTMLInputElement[];
const grupos = () => screen.getAllByPlaceholderText("Grupo") as HTMLInputElement[];
const enviar = () => screen.getByRole("button", { name: "Enviar ubicaciones" }) as HTMLButtonElement;
const escribir = (el: HTMLInputElement, v: string) => fireEvent.change(el, { target: { value: v } });

describe("Ubicar elemento — paridad con el comportamiento anterior (U9a.8)", () => {
  it("muestra la instrucción y, por elemento, su símbolo con campos de periodo (1–7) y grupo (1–18) vacíos", () => {
    render(<Viewer estado={ejercicio()} config={{}} />);
    expect(screen.getByText("Indica el periodo y el grupo de cada elemento.")).toBeTruthy();
    expect(screen.getByText("Na")).toBeTruthy();
    expect(screen.getByText("Cl")).toBeTruthy();
    expect(periodos().map((i) => [i.value, i.min, i.max])).toEqual([["", "1", "7"], ["", "1", "7"]]);
    expect(grupos().map((i) => [i.value, i.min, i.max])).toEqual([["", "1", "18"], ["", "1", "18"]]);
  });

  it("«Enviar» siempre está habilitado y emite `{ placements }` con 0 donde no se escribió, una vez", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={ejercicio()} config={{ onResponse }} />);
    expect(enviar().disabled).toBe(false);
    escribir(periodos()[0], "3");
    escribir(grupos()[1], "17");
    fireEvent.click(enviar());
    expect(onResponse.mock.calls).toEqual([
      [
        {
          placements: [
            { id: "e1", periodo: 3, grupo: 0 },
            { id: "e2", periodo: 0, grupo: 17 },
          ],
        },
      ],
    ]);
    expect(play.mock.calls).toEqual([["submit"]]);
  });

  it("sin escribir nada emite todo en 0", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={ejercicio()} config={{ onResponse }} />);
    fireEvent.click(enviar());
    expect(onResponse.mock.calls).toEqual([
      [{ placements: [{ id: "e1", periodo: 0, grupo: 0 }, { id: "e2", periodo: 0, grupo: 0 }] }],
    ]);
  });

  it("al enviar: campos bloqueados, «Respuesta enviada.» y sin botón", () => {
    render(<Viewer estado={ejercicio()} config={{}} />);
    fireEvent.click(enviar());
    expect([...periodos(), ...grupos()].every((i) => i.disabled)).toBe(true);
    expect(screen.getByText("Respuesta enviada.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Enviar ubicaciones" })).toBeNull();
  });

  it("calificación con @lumina/scoring: todo bien = 5; parcial y nada, valores medidos", () => {
    const a = ejercicio();
    const nota = (placements: { id: string; periodo: number; grupo: number }[]) => {
      const ev = evaluateActivityResponse("ubicar_elemento", a, { placements });
      return { correct: ev.correct, score: ev.score };
    };
    expect(
      nota([{ id: "e1", periodo: 3, grupo: 1 }, { id: "e2", periodo: 3, grupo: 17 }]),
    ).toEqual({ correct: true, score: 5 });
    expect(
      nota([{ id: "e1", periodo: 3, grupo: 1 }, { id: "e2", periodo: 1, grupo: 1 }]),
    ).toEqual({ correct: false, score: 2.5 });
    expect(
      nota([{ id: "e1", periodo: 0, grupo: 0 }, { id: "e2", periodo: 0, grupo: 0 }]),
    ).toEqual({ correct: false, score: 1 });
  });

  it("el componente reinicia respuestas y envío al cambiar `editorSyncKey`", () => {
    const a = ejercicio();
    const { rerender } = render(<ViewerComponente activity={a} editorSyncKey="s1" />);
    escribir(periodos()[0], "3");
    fireEvent.click(enviar());
    rerender(<ViewerComponente activity={a} editorSyncKey="s2" />);
    expect(periodos().map((i) => i.value)).toEqual(["", ""]);
    expect(periodos().every((i) => !i.disabled)).toBe(true);
  });

  it("por el registro NO se reenvía `editorSyncKey` (el adaptador clásico no lo pasa): no reinicia", () => {
    const a = ejercicio();
    const { rerender } = render(<Viewer estado={a} config={{ editorSyncKey: "s1" }} />);
    fireEvent.click(enviar());
    rerender(<Viewer estado={a} config={{ editorSyncKey: "s2" }} />);
    expect(screen.getByText("Respuesta enviada.")).toBeTruthy();
  });
});
