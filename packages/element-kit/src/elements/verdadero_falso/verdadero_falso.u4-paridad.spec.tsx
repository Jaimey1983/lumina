/**
 * U4 — paridad de Verdadero/Falso contra su comportamiento ANTERIOR a migrar al
 * `ActivityShell` (Regla 7). Se compara lo que el viewer entrega por `onResponse` y la
 * nota que `@lumina/scoring` le da a eso; los textos y la mecánica de «responder una vez»
 * se midieron con el viewer viejo (`useState` + `useEffect` sobre `editorSyncKey`).
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { evaluateActivityResponse } from "@lumina/scoring";
import type { TrueFalse } from "@lumina/types/slide";

import { TrueFalseViewer } from "../../activities/_classic/index.js";
import { verdaderoFalsoDefinition } from "./verdadero_falso-definition.js";

type Props = { estado: unknown; config: Record<string, unknown> };
const Viewer = verdaderoFalsoDefinition.Viewer as unknown as (p: Props) => React.ReactElement;

afterEach(cleanup);

const afirmacion = (parche: Partial<TrueFalse> = {}): TrueFalse => ({
  tipo: "verdadero_falso",
  afirmacion: "El agua hierve a 100 °C al nivel del mar.",
  respuestaCorrecta: true,
  ...parche,
});

const boton = (nombre: "Verdadero" | "Falso") => screen.getByRole("button", { name: new RegExp(nombre) });

describe("Verdadero/Falso — paridad con el comportamiento anterior (U4)", () => {
  it("responde una sola vez: emite el booleano elegido y los clics siguientes se ignoran", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={afirmacion()} config={{ onResponse }} />);
    fireEvent.click(boton("Verdadero"));
    fireEvent.click(boton("Falso"));
    fireEvent.click(boton("Verdadero"));
    expect(onResponse.mock.calls).toEqual([[true]]);
  });

  it("al responder, los dos botones quedan deshabilitados", () => {
    render(<Viewer estado={afirmacion()} config={{}} />);
    expect((boton("Verdadero") as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(boton("Falso"));
    expect((boton("Verdadero") as HTMLButtonElement).disabled).toBe(true);
    expect((boton("Falso") as HTMLButtonElement).disabled).toBe(true);
  });

  it("la respuesta se califica con @lumina/scoring: acierto = 5, error = nota mínima", () => {
    const a = afirmacion();
    for (const [elegida, correct, score] of [
      ["Verdadero", true, 5],
      ["Falso", false, 1],
    ] as const) {
      const onResponse = vi.fn();
      render(<Viewer estado={a} config={{ onResponse }} />);
      fireEvent.click(boton(elegida));
      const ev = evaluateActivityResponse("verdadero_falso", a, onResponse.mock.calls[0][0]);
      expect({ correct: ev.correct, score: ev.score }, elegida).toEqual({ correct, score });
      cleanup();
    }
  });

  it("el componente reinicia la respuesta al cambiar `editorSyncKey`", () => {
    const onResponse = vi.fn();
    const a = afirmacion();
    const { rerender } = render(<TrueFalseViewer activity={a} editorSyncKey="s1" onResponse={onResponse} />);
    fireEvent.click(boton("Verdadero"));
    rerender(<TrueFalseViewer activity={a} editorSyncKey="s2" onResponse={onResponse} />);
    expect((boton("Falso") as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(boton("Falso"));
    expect(onResponse.mock.calls).toEqual([[true], [false]]);
  });

  it("por el registro NO se reenvía `editorSyncKey` (el adaptador clásico no lo pasa): no reinicia", () => {
    const a = afirmacion();
    const { rerender } = render(<Viewer estado={a} config={{ editorSyncKey: "s1" }} />);
    fireEvent.click(boton("Verdadero"));
    rerender(<Viewer estado={a} config={{ editorSyncKey: "s2" }} />);
    expect((boton("Falso") as HTMLButtonElement).disabled).toBe(true);
  });

  it("sin `respuestaCorrecta` booleana emite igual y no marca acierto ni error", () => {
    const onResponse = vi.fn();
    const sinClave = { ...afirmacion(), respuestaCorrecta: undefined } as unknown as TrueFalse;
    const { container } = render(<Viewer estado={sinClave} config={{ onResponse }} />);
    fireEvent.click(boton("Falso"));
    expect(onResponse.mock.calls).toEqual([[false]]);
    expect(container.querySelector("svg")).toBeNull(); // sin íconos de acierto/error
  });

  it("al errar se revela la opción correcta; al acertar no hay revelado extra", () => {
    const { container, unmount } = render(<Viewer estado={afirmacion()} config={{}} />);
    fireEvent.click(boton("Falso"));
    // error: ícono en la elegida (error) y en la correcta (revelado)
    expect(container.querySelectorAll("svg")).toHaveLength(2);
    unmount();
    const acierto = render(<Viewer estado={afirmacion()} config={{}} />);
    fireEvent.click(boton("Verdadero"));
    expect(acierto.container.querySelectorAll("svg")).toHaveLength(1);
  });

  it("muestra la afirmación y los dos botones V/F", () => {
    render(<Viewer estado={afirmacion()} config={{}} />);
    expect(screen.getByText("El agua hierve a 100 °C al nivel del mar.")).toBeTruthy();
    expect(screen.getByText("V")).toBeTruthy();
    expect(screen.getByText("F")).toBeTruthy();
  });
});
