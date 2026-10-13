/**
 * U9a.5 — lo NUEVO de Nube de palabras tras migrar al shell: lee `ajustes` (tiempo, sonido,
 * estilo) y su panel suma estilos y ajustes comunes al editor de siempre.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WordCloud } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { normalizarAjustes } from "../../activities/_shared/activity-settings.js";
import { nubePalabrasDefinition as def } from "./nube_palabras-definition.js";

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

const base = (parche: Partial<WordCloud> = {}): WordCloud => ({
  ...(def.crearPorDefecto() as WordCloud),
  ...parche,
});
const caja = () => screen.getByLabelText("Tu palabra") as HTMLInputElement;
const enviar = () => screen.getByRole("button", { name: "Enviar" }) as HTMLButtonElement;

describe("Nube de palabras — ajustes comunes (U9a.5)", () => {
  it("`ajustes.sonido = false` silencia el envío", () => {
    render(<Viewer estado={base({ ajustes: { sonido: false } })} config={{}} />);
    fireEvent.change(caja(), { target: { value: "sol" } });
    fireEvent.click(enviar());
    expect(play).not.toHaveBeenCalled();
  });

  it("al agotarse `ajustes.tiempoLimiteSeg`: avisa, bloquea campo y botón y no emite", () => {
    vi.useFakeTimers();
    try {
      const onResponse = vi.fn();
      render(<Viewer estado={base({ ajustes: { tiempoLimiteSeg: 3 } })} config={{ onResponse }} />);
      fireEvent.change(caja(), { target: { value: "sol" } });
      act(() => void vi.advanceTimersByTime(3000));
      expect(screen.getByText("Se acabó el tiempo.")).toBeTruthy();
      expect(caja().disabled).toBe(true);
      expect(enviar().disabled).toBe(true);
      fireEvent.click(enviar());
      expect(onResponse).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("enviar varias palabras NO detiene el reloj; la última del tope sí cierra la actividad", () => {
    vi.useFakeTimers();
    try {
      render(<Viewer estado={base({ maxPalabrasPorUsuario: 2, ajustes: { tiempoLimiteSeg: 5 } })} config={{}} />);
      fireEvent.change(caja(), { target: { value: "uno" } });
      fireEvent.click(enviar());
      act(() => void vi.advanceTimersByTime(1000));
      expect(screen.getByRole("timer").textContent).toBe("0:04");
      fireEvent.change(caja(), { target: { value: "dos" } });
      fireEvent.click(enviar());
      act(() => void vi.advanceTimersByTime(10_000));
      expect(screen.queryByText("Se acabó el tiempo.")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("`ajustes.estilo` llega al shell (`data-estilo`)", () => {
    const { container } = render(<Viewer estado={base({ ajustes: { estilo: "pizarra" } })} config={{}} />);
    expect(container.querySelector('[data-estilo="pizarra"]')).toBeTruthy();
  });
});

describe("Propiedades de Nube de palabras (U9a.5)", () => {
  it("conserva el editor de siempre y suma estilos y ajustes comunes", () => {
    const { container } = render(
      <Propiedades estado={base()} config={{}} onChange={() => undefined} onConfigChange={() => undefined} />,
    );
    expect(screen.getByLabelText("Palabras por estudiante")).toBeTruthy(); // del editor
    expect(container.querySelectorAll("[data-preset-id]")).toHaveLength(5);
    expect(container.querySelector("[data-actividad-ajustes]")).toBeTruthy();
    expect(screen.getByLabelText("Límite de tiempo")).toBeTruthy();
    for (const t of ["Calificación", "Vidas", "Pistas", "Orden"]) expect(screen.queryByText(t), t).toBeNull();
  });

  it("elegir «Minimal» guarda solo `ajustes` y deja la actividad intacta", () => {
    const original = base();
    const onChange = vi.fn();
    const { container } = render(
      <Propiedades estado={original} config={{}} onChange={onChange} onConfigChange={() => undefined} />,
    );
    fireEvent.click(container.querySelector('[data-preset-id="minimal"]')!);
    const guardada = onChange.mock.lastCall![0] as WordCloud;
    expect(normalizarAjustes(guardada)).toMatchObject({ estilo: "minimal", sonido: false });
    expect({ ...guardada, ajustes: undefined }).toEqual({ ...original, ajustes: undefined });
  });

  it("la definición declara presets y `apariencia.color`", () => {
    expect(def.presets.map((p) => p.id)).toEqual(["escolar", "examen", "arcade", "minimal", "pizarra"]);
    expect(def.apariencia).toEqual({ color: true, tipografia: false, animacion: false });
  });
});
