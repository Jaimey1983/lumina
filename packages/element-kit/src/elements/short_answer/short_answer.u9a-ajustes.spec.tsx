/**
 * U9a.1 — lo NUEVO de Respuesta corta tras migrar al shell: lee `ajustes` (tiempo, sonido,
 * estilo) y su panel de propiedades suma estilos y ajustes comunes al editor de siempre.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ShortAnswerActivity } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { normalizarAjustes } from "../../activities/_shared/activity-settings.js";
import { shortAnswerDefinition } from "./short_answer-definition.js";

type PropsViewer = { estado: unknown; config: Record<string, unknown> };
const Viewer = shortAnswerDefinition.Viewer as unknown as (p: PropsViewer) => React.ReactElement;
const Propiedades = shortAnswerDefinition.Propiedades as unknown as (p: {
  estado: unknown;
  config: object;
  onChange(e: unknown): void;
  onConfigChange(c: object): void;
}) => React.ReactElement;

afterEach(cleanup);
beforeEach(() => play.mockClear());

const base = (): ShortAnswerActivity => shortAnswerDefinition.crearPorDefecto() as ShortAnswerActivity;
const conPregunta = (parche: Partial<ShortAnswerActivity> = {}): ShortAnswerActivity => ({
  ...base(),
  question: "¿Capital de Francia?",
  ...parche,
});

describe("Respuesta corta — ajustes comunes (U9a.1)", () => {
  it("`ajustes.sonido = false` silencia el envío", () => {
    render(<Viewer estado={conPregunta({ ajustes: { sonido: false } })} config={{}} />);
    fireEvent.change(screen.getByPlaceholderText("Escribe tu respuesta aquí…"), { target: { value: "París" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(play).not.toHaveBeenCalled();
  });

  it("al agotarse `ajustes.tiempoLimiteSeg`: avisa, bloquea la caja y no deja enviar", () => {
    vi.useFakeTimers();
    try {
      const onResponse = vi.fn();
      const { container } = render(
        <Viewer estado={conPregunta({ ajustes: { tiempoLimiteSeg: 3 } })} config={{ onResponse }} />,
      );
      expect(screen.getByRole("timer").textContent).toBe("0:03");
      act(() => void vi.advanceTimersByTime(3000));
      expect(screen.getByText("Se acabó el tiempo.")).toBeTruthy();
      expect((screen.getByPlaceholderText("Escribe tu respuesta aquí…") as HTMLTextAreaElement).disabled).toBe(true);
      fireEvent.submit(container.querySelector("form")!);
      expect(onResponse).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("enviar a tiempo detiene el reloj: no aparece «Se acabó el tiempo.»", () => {
    vi.useFakeTimers();
    try {
      const onResponse = vi.fn();
      render(<Viewer estado={conPregunta({ ajustes: { tiempoLimiteSeg: 3 } })} config={{ onResponse }} />);
      fireEvent.change(screen.getByPlaceholderText("Escribe tu respuesta aquí…"), { target: { value: "París" } });
      fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
      act(() => void vi.advanceTimersByTime(10_000));
      expect(screen.queryByText("Se acabó el tiempo.")).toBeNull();
      expect(onResponse.mock.calls).toEqual([["París"]]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("`ajustes.estilo` llega al shell (`data-estilo`)", () => {
    const { container } = render(<Viewer estado={conPregunta({ ajustes: { estilo: "pizarra" } })} config={{}} />);
    expect(container.querySelector('[data-estilo="pizarra"]')).toBeTruthy();
  });

  it("una pregunta sin pregunta ni ajustes (slide viejo) se ve y se envía como siempre", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={base()} config={{ onResponse }} />);
    fireEvent.change(screen.getByPlaceholderText("Escribe tu respuesta aquí…"), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(onResponse.mock.calls).toEqual([["x"]]);
    expect(screen.queryByRole("timer")).toBeNull();
  });
});

describe("Propiedades de Respuesta corta (U9a.1)", () => {
  it("conserva el editor de siempre y suma estilos y ajustes comunes", () => {
    const { container } = render(
      <Propiedades estado={base()} config={{}} onChange={() => undefined} onConfigChange={() => undefined} />,
    );
    expect(screen.getByText("Respuesta corta")).toBeTruthy(); // cabecera del editor
    expect(screen.getByPlaceholderText("Escribe la pregunta…")).toBeTruthy();
    expect(container.querySelectorAll("[data-preset-id]")).toHaveLength(5);
    expect(container.querySelector("[data-actividad-ajustes]")).toBeTruthy();
    expect(screen.getByLabelText("Límite de tiempo")).toBeTruthy();
  });

  it("el panel NO ofrece lo que el viewer no lee (intentos, vidas, nota, barajar)", () => {
    render(<Propiedades estado={base()} config={{}} onChange={() => undefined} onConfigChange={() => undefined} />);
    for (const t of ["Calificación", "Vidas", "Pistas", "Orden"]) expect(screen.queryByText(t), t).toBeNull();
  });

  it("elegir «Examen» guarda solo `ajustes` y deja la pregunta intacta", () => {
    const original = conPregunta();
    const onChange = vi.fn();
    const { container } = render(
      <Propiedades estado={original} config={{}} onChange={onChange} onConfigChange={() => undefined} />,
    );
    fireEvent.click(container.querySelector('[data-preset-id="examen"]')!);
    const guardada = onChange.mock.lastCall![0] as ShortAnswerActivity;
    expect(normalizarAjustes(guardada)).toMatchObject({ estilo: "examen", sonido: false });
    expect({ ...guardada, ajustes: undefined }).toEqual({ ...original, ajustes: undefined });
  });

  it("la definición declara presets y `apariencia.color`", () => {
    expect(shortAnswerDefinition.presets.map((p) => p.id)).toEqual(["escolar", "examen", "arcade", "minimal", "pizarra"]);
    expect(shortAnswerDefinition.apariencia).toEqual({ color: true, tipografia: false, animacion: false });
  });
});
