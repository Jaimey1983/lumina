/**
 * U9a.3 — lo NUEVO de Completar blancos tras migrar al shell: lee `ajustes` (tiempo, sonido,
 * estilo), los campos tienen nombre accesible y su panel suma estilos y ajustes comunes.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FillBlanks } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { normalizarAjustes } from "../../activities/_shared/activity-settings.js";
import { completarBlancosDefinition as def } from "./completar_blancos-definition.js";

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

const base = (parche: Partial<FillBlanks> = {}): FillBlanks => ({
  ...(def.crearPorDefecto() as FillBlanks),
  ...parche,
});
const enviar = () => screen.getByRole("button", { name: "Enviar" });

describe("Completar blancos — ajustes comunes (U9a.3)", () => {
  it("cada hueco tiene nombre accesible («Hueco 1», «Hueco 2»…)", () => {
    render(<Viewer estado={base()} config={{}} />);
    expect(screen.getAllByLabelText(/^Hueco \d+$/).map((i) => i.getAttribute("aria-label"))).toEqual([
      "Hueco 1",
      "Hueco 2",
    ]);
  });

  it("`ajustes.sonido = false` silencia el envío", () => {
    render(<Viewer estado={base({ ajustes: { sonido: false } })} config={{}} />);
    fireEvent.click(enviar());
    expect(play).not.toHaveBeenCalled();
  });

  it("al agotarse `ajustes.tiempoLimiteSeg`: avisa, bloquea los campos y el botón y no emite", () => {
    vi.useFakeTimers();
    try {
      const onResponse = vi.fn();
      render(<Viewer estado={base({ ajustes: { tiempoLimiteSeg: 3 } })} config={{ onResponse }} />);
      expect(screen.getByRole("timer").textContent).toBe("0:03");
      act(() => void vi.advanceTimersByTime(3000));
      expect(screen.getByText("Se acabó el tiempo.")).toBeTruthy();
      expect((screen.getByLabelText("Hueco 1") as HTMLInputElement).disabled).toBe(true);
      expect((enviar() as HTMLButtonElement).disabled).toBe(true);
      fireEvent.click(enviar());
      expect(onResponse).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("`ajustes.estilo` llega al shell (`data-estilo`)", () => {
    const { container } = render(<Viewer estado={base({ ajustes: { estilo: "examen" } })} config={{}} />);
    expect(container.querySelector('[data-estilo="examen"]')).toBeTruthy();
  });
});

describe("Propiedades de Completar blancos (U9a.3)", () => {
  it("conserva el editor de siempre y suma estilos y ajustes comunes", () => {
    const { container } = render(
      <Propiedades estado={base()} config={{}} onChange={() => undefined} onConfigChange={() => undefined} />,
    );
    expect(screen.getByText(/Respuestas correctas/)).toBeTruthy(); // del editor
    expect(container.querySelectorAll("[data-preset-id]")).toHaveLength(5);
    expect(container.querySelector("[data-actividad-ajustes]")).toBeTruthy();
    expect(screen.getByLabelText("Límite de tiempo")).toBeTruthy();
    for (const t of ["Calificación", "Vidas", "Pistas", "Orden"]) expect(screen.queryByText(t), t).toBeNull();
  });

  it("elegir «Pizarra» guarda solo `ajustes` y deja el ejercicio intacto", () => {
    const original = base();
    const onChange = vi.fn();
    const { container } = render(
      <Propiedades estado={original} config={{}} onChange={onChange} onConfigChange={() => undefined} />,
    );
    fireEvent.click(container.querySelector('[data-preset-id="pizarra"]')!);
    const guardada = onChange.mock.lastCall![0] as FillBlanks;
    expect(normalizarAjustes(guardada)).toMatchObject({ estilo: "pizarra", sonido: true });
    expect({ ...guardada, ajustes: undefined }).toEqual({ ...original, ajustes: undefined });
  });

  it("la definición declara presets y `apariencia.color`", () => {
    expect(def.presets.map((p) => p.id)).toEqual(["escolar", "examen", "arcade", "minimal", "pizarra"]);
    expect(def.apariencia).toEqual({ color: true, tipografia: false, animacion: false });
  });
});
