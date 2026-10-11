/**
 * U4 — paridad de Verdadero/Falso contra su comportamiento ANTERIOR a migrar al
 * `ActivityShell` (Regla 7). Se compara lo que el viewer entrega por `onResponse` y la
 * nota que `@lumina/scoring` le da a eso; los textos y la mecánica de «responder una vez»
 * se midieron con el viewer viejo (`useState` + `useEffect` sobre `editorSyncKey`).
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateActivityResponse } from "@lumina/scoring";
import type { TrueFalse } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { TrueFalseViewer } from "../../activities/_classic/index.js";
import { verdaderoFalsoDefinition } from "./verdadero_falso-definition.js";

type Props = { estado: unknown; config: Record<string, unknown> };
const Viewer = verdaderoFalsoDefinition.Viewer as unknown as (p: Props) => React.ReactElement;

afterEach(cleanup);
beforeEach(() => play.mockClear());

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

describe("Verdadero/Falso sobre el shell — retroalimentación y ajustes (U4)", () => {
  const mensaje = () => screen.queryAllByRole("status").map((n) => n.textContent).filter(Boolean);

  it("muestra el mensaje de acierto o de error, y la explicación solo si se pide", () => {
    const a = afirmacion({ retroalimentacion: { explicacion: "A nivel del mar.", mostrarExplicacion: true } });
    const { unmount } = render(<Viewer estado={a} config={{}} />);
    fireEvent.click(boton("Falso"));
    expect(screen.getByText(/La respuesta correcta es Verdadero\./)).toBeTruthy();
    expect(screen.getByText("A nivel del mar.")).toBeTruthy();
    unmount();
    render(<Viewer estado={afirmacion({ retroalimentacion: { explicacion: "oculta" } })} config={{}} />);
    fireEvent.click(boton("Verdadero"));
    expect(screen.getByText("¡Correcto!")).toBeTruthy();
    expect(screen.queryByText("oculta")).toBeNull();
  });

  it("usa los textos del docente cuando existen; `ajustes.mostrarSolucion` fuerza la explicación", () => {
    const a = {
      ...afirmacion({ retroalimentacion: { correcto: "¡Eso!", incorrecto: "No exactamente.", explicacion: "Detalle" } }),
      ajustes: { mostrarSolucion: true },
    };
    const { unmount } = render(<Viewer estado={a} config={{}} />);
    fireEvent.click(boton("Falso"));
    expect(screen.getByText("No exactamente.")).toBeTruthy();
    expect(screen.getByText("Detalle")).toBeTruthy();
    unmount();
    render(<Viewer estado={a} config={{}} />);
    fireEvent.click(boton("Verdadero"));
    expect(screen.getByText("¡Eso!")).toBeTruthy();
  });

  it("`ajustes.retroalimentacion = 'ninguna'` no muestra mensaje pero sí emite la respuesta", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={{ ...afirmacion(), ajustes: { retroalimentacion: "ninguna" } }} config={{ onResponse }} />);
    fireEvent.click(boton("Verdadero"));
    expect(screen.queryByText("¡Correcto!")).toBeNull();
    expect(onResponse.mock.calls).toEqual([[true]]);
  });

  it("al agotarse `ajustes.tiempoLimiteSeg` sin responder: avisa y bloquea los botones", () => {
    vi.useFakeTimers();
    try {
      const onResponse = vi.fn();
      render(<Viewer estado={{ ...afirmacion(), ajustes: { tiempoLimiteSeg: 3 } }} config={{ onResponse }} />);
      expect(screen.getByRole("timer").textContent).toBe("0:03");
      act(() => void vi.advanceTimersByTime(3000));
      expect(screen.getByText("Se acabó el tiempo.")).toBeTruthy();
      expect((boton("Verdadero") as HTMLButtonElement).disabled).toBe(true);
      fireEvent.click(boton("Verdadero"));
      expect(onResponse).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("un lector de pantalla recibe el mensaje (región `status`) tras responder", () => {
    render(<Viewer estado={afirmacion()} config={{}} />);
    expect(mensaje()).toEqual([]);
    fireEvent.click(boton("Verdadero"));
    expect(mensaje()).toContain("¡Correcto!");
  });

  it("la variante oscura sigue funcionando", () => {
    const onResponse = vi.fn();
    render(<TrueFalseViewer activity={afirmacion()} variant="dark" onResponse={onResponse} />);
    fireEvent.click(boton("Falso"));
    expect(onResponse.mock.calls).toEqual([[false]]);
  });
});

describe("Verdadero/Falso — feedback de sonido y movimiento (U5)", () => {
  it("el acierto suena 'correct', el error 'wrong' y sin clave 'submit'", () => {
    for (const [estado, elegida, sonido] of [
      [afirmacion(), "Verdadero", "correct"],
      [afirmacion(), "Falso", "wrong"],
      [{ ...afirmacion(), respuestaCorrecta: undefined } as unknown as TrueFalse, "Falso", "submit"],
    ] as const) {
      play.mockClear();
      render(<Viewer estado={estado} config={{}} />);
      fireEvent.click(boton(elegida));
      expect(play.mock.calls, `${elegida}/${sonido}`).toEqual([[sonido]]);
      cleanup();
    }
  });

  it("no suena nada hasta responder y un segundo clic no repite el sonido", () => {
    render(<Viewer estado={afirmacion()} config={{}} />);
    expect(play).not.toHaveBeenCalled();
    fireEvent.click(boton("Verdadero"));
    fireEvent.click(boton("Falso"));
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("las dos opciones van en un nodo de movimiento (la elegida hace el pulso o la sacudida)", () => {
    const { container } = render(<Viewer estado={afirmacion()} config={{}} />);
    expect(container.querySelectorAll("[data-feedback-motion]")).toHaveLength(2);
  });

  it("ya no depende de las clases globales de animación", () => {
    const { container } = render(<Viewer estado={afirmacion()} config={{}} />);
    fireEvent.click(boton("Falso"));
    expect(container.querySelector(".lumina-viewer-shake")).toBeNull();
    expect(container.querySelector(".animate-in")).toBeNull();
  });
});
