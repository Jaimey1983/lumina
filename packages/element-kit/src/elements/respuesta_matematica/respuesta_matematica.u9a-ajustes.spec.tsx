/**
 * U9a.2 — lo NUEVO de Respuesta matemática tras migrar al shell: lee `ajustes` (tiempo,
 * sonido, estilo) y su panel suma estilos y ajustes comunes al editor de siempre.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MathAnswerActivity } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { normalizarAjustes } from "../../activities/_shared/activity-settings.js";
import { respuestaMatematicaDefinition as def } from "./respuesta_matematica-definition.js";

type PropsViewer = { estado: unknown; config: Record<string, unknown> };
const Viewer = def.Viewer as unknown as (p: PropsViewer) => React.ReactElement;
const Propiedades = def.Propiedades as unknown as (p: {
  estado: unknown;
  config: object;
  onChange(e: unknown): void;
  onConfigChange(c: object): void;
}) => React.ReactElement;

afterEach(cleanup);
beforeEach(() => play.mockClear());

const base = (parche: Partial<MathAnswerActivity> = {}): MathAnswerActivity => ({
  ...(def.crearPorDefecto() as MathAnswerActivity),
  question: "¿3/4 + 1/4?",
  respuesta: "1",
  ...parche,
});
const caja = () => screen.getByLabelText("Tu respuesta") as HTMLInputElement;

describe("Respuesta matemática — ajustes comunes (U9a.2)", () => {
  it("`ajustes.sonido = false` silencia el envío", () => {
    render(<Viewer estado={base({ ajustes: { sonido: false } })} config={{}} />);
    fireEvent.change(caja(), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(play).not.toHaveBeenCalled();
  });

  it("al agotarse `ajustes.tiempoLimiteSeg`: avisa, bloquea el campo y no deja enviar", () => {
    vi.useFakeTimers();
    try {
      const onResponse = vi.fn();
      const { container } = render(
        <Viewer estado={base({ ajustes: { tiempoLimiteSeg: 3 } })} config={{ onResponse }} />,
      );
      expect(screen.getByRole("timer").textContent).toBe("0:03");
      act(() => void vi.advanceTimersByTime(3000));
      expect(screen.getByText("Se acabó el tiempo.")).toBeTruthy();
      expect(caja().disabled).toBe(true);
      fireEvent.submit(container.querySelector("form")!);
      expect(onResponse).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("una expresión ilegible NO detiene el reloj ni cuenta como envío", () => {
    vi.useFakeTimers();
    try {
      const onResponse = vi.fn();
      render(
        <Viewer
          estado={base({ modo: "algebraico", respuesta: "2(x+1)", ajustes: { tiempoLimiteSeg: 5 } })}
          config={{ onResponse }}
        />,
      );
      fireEvent.change(caja(), { target: { value: "2(x+1" } });
      fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
      act(() => void vi.advanceTimersByTime(2000));
      expect(screen.getByRole("timer").textContent).toBe("0:03");
      expect(onResponse).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("`ajustes.estilo` llega al shell (`data-estilo`)", () => {
    const { container } = render(<Viewer estado={base({ ajustes: { estilo: "arcade" } })} config={{}} />);
    expect(container.querySelector('[data-estilo="arcade"]')).toBeTruthy();
  });
});

describe("Propiedades de Respuesta matemática (U9a.2)", () => {
  it("conserva el editor de siempre y suma estilos y ajustes comunes", () => {
    const { container } = render(
      <Propiedades estado={base()} config={{}} onChange={() => undefined} onConfigChange={() => undefined} />,
    );
    expect(screen.getByLabelText("Tolerancia (opc.)")).toBeTruthy(); // del editor
    expect(container.querySelectorAll("[data-preset-id]")).toHaveLength(5);
    expect(container.querySelector("[data-actividad-ajustes]")).toBeTruthy();
    expect(screen.getByLabelText("Límite de tiempo")).toBeTruthy();
    for (const t of ["Calificación", "Vidas", "Pistas", "Orden"]) expect(screen.queryByText(t), t).toBeNull();
  });

  it("elegir «Minimal» guarda solo `ajustes` y deja el ejercicio intacto", () => {
    const original = base({ unidad: "cm", tolerancia: 0.5 });
    const onChange = vi.fn();
    const { container } = render(
      <Propiedades estado={original} config={{}} onChange={onChange} onConfigChange={() => undefined} />,
    );
    fireEvent.click(container.querySelector('[data-preset-id="minimal"]')!);
    const guardada = onChange.mock.lastCall![0] as MathAnswerActivity;
    expect(normalizarAjustes(guardada)).toMatchObject({ estilo: "minimal", sonido: false });
    expect({ ...guardada, ajustes: undefined }).toEqual({ ...original, ajustes: undefined });
  });

  it("la definición declara presets y `apariencia.color`", () => {
    expect(def.presets.map((p) => p.id)).toEqual(["escolar", "examen", "arcade", "minimal", "pizarra"]);
    expect(def.apariencia).toEqual({ color: true, tipografia: false, animacion: false });
  });
});
