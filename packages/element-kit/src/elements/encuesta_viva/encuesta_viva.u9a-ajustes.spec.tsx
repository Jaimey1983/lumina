/**
 * U9a.4 — lo NUEVO de Encuesta viva tras migrar al shell: lee `ajustes` (tiempo, sonido,
 * estilo), las barras de resultado son accesibles y su panel suma estilos y ajustes comunes.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LivePoll } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { normalizarAjustes } from "../../activities/_shared/activity-settings.js";
import { encuestaVivaDefinition as def } from "./encuesta_viva-definition.js";

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

const base = (parche: Partial<LivePoll> = {}): LivePoll => ({
  ...(def.crearPorDefecto() as LivePoll),
  ...parche,
});

describe("Encuesta viva — ajustes comunes (U9a.4)", () => {
  it("`ajustes.sonido = false` silencia el voto", () => {
    render(<Viewer estado={base({ ajustes: { sonido: false } })} config={{}} />);
    fireEvent.click(screen.getByRole("button", { name: "Opción 1" }));
    expect(play).not.toHaveBeenCalled();
  });

  it("al agotarse `ajustes.tiempoLimiteSeg`: avisa, bloquea las opciones y no emite", () => {
    vi.useFakeTimers();
    try {
      const onResponse = vi.fn();
      render(<Viewer estado={base({ ajustes: { tiempoLimiteSeg: 3 } })} config={{ onResponse }} />);
      expect(screen.getByRole("timer").textContent).toBe("0:03");
      act(() => void vi.advanceTimersByTime(3000));
      expect(screen.getByText("Se acabó el tiempo.")).toBeTruthy();
      const opcion = screen.getByRole("button", { name: "Opción 1" }) as HTMLButtonElement;
      expect(opcion.disabled).toBe(true);
      fireEvent.click(opcion);
      expect(onResponse).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("el campo legacy `tiempoLimiteSeg` (sin `ajustes`) ahora SÍ se respeta: antes el viewer lo ignoraba", () => {
    vi.useFakeTimers();
    try {
      render(<Viewer estado={base({ tiempoLimiteSeg: 2 })} config={{}} />);
      act(() => void vi.advanceTimersByTime(2000));
      expect(screen.getByText("Se acabó el tiempo.")).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it("votar a tiempo detiene el reloj", () => {
    vi.useFakeTimers();
    try {
      render(<Viewer estado={base({ ajustes: { tiempoLimiteSeg: 3 } })} config={{}} />);
      fireEvent.click(screen.getByRole("button", { name: "Opción 2" }));
      act(() => void vi.advanceTimersByTime(10_000));
      expect(screen.queryByText("Se acabó el tiempo.")).toBeNull();
      expect(screen.getByText(/¡Voto registrado!/)).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it("tras votar cada barra es un `progressbar` con su valor y nombre", () => {
    render(<Viewer estado={base()} config={{}} />);
    fireEvent.click(screen.getByRole("button", { name: "Opción 1" }));
    const barras = screen.getAllByRole("progressbar");
    // El shell no pinta progreso sin `total`: solo las 3 barras de resultado.
    expect(barras.map((b) => b.getAttribute("aria-label"))).toEqual(["Opción 1", "Opción 2", "Opción 3"]);
    expect(barras.reduce((s, b) => s + Number(b.getAttribute("aria-valuenow")), 0)).toBe(100);
  });

  it("`ajustes.estilo` llega al shell (`data-estilo`)", () => {
    const { container } = render(<Viewer estado={base({ ajustes: { estilo: "arcade" } })} config={{}} />);
    expect(container.querySelector('[data-estilo="arcade"]')).toBeTruthy();
  });
});

describe("Propiedades de Encuesta viva (U9a.4)", () => {
  it("conserva el editor de siempre y suma estilos y ajustes comunes", () => {
    const { container } = render(
      <Propiedades estado={base()} config={{}} onChange={() => undefined} onConfigChange={() => undefined} />,
    );
    expect(screen.getByText("Pregunta de la encuesta")).toBeTruthy(); // del editor
    expect(container.querySelectorAll("[data-preset-id]")).toHaveLength(5);
    expect(container.querySelector("[data-actividad-ajustes]")).toBeTruthy();
    expect(screen.getByLabelText("Límite de tiempo")).toBeTruthy();
    for (const t of ["Calificación", "Vidas", "Pistas", "Orden"]) expect(screen.queryByText(t), t).toBeNull();
  });

  it("elegir «Examen» guarda solo `ajustes` y deja la encuesta intacta", () => {
    const original = base();
    const onChange = vi.fn();
    const { container } = render(
      <Propiedades estado={original} config={{}} onChange={onChange} onConfigChange={() => undefined} />,
    );
    fireEvent.click(container.querySelector('[data-preset-id="examen"]')!);
    const guardada = onChange.mock.lastCall![0] as LivePoll;
    expect(normalizarAjustes(guardada)).toMatchObject({ estilo: "examen", sonido: false });
    expect({ ...guardada, ajustes: undefined }).toEqual({ ...original, ajustes: undefined });
  });

  it("la definición declara presets y `apariencia.color`", () => {
    expect(def.presets.map((p) => p.id)).toEqual(["escolar", "examen", "arcade", "minimal", "pizarra"]);
    expect(def.apariencia).toEqual({ color: true, tipografia: false, animacion: false });
  });
});
