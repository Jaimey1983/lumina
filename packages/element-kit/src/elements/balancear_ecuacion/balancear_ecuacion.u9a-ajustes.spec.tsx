/**
 * U9a.6 — lo NUEVO de Balancear ecuación tras migrar al shell: lee `ajustes` (tiempo, sonido,
 * estilo), los botones +/− tienen nombre accesible y su panel suma estilos y ajustes comunes.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BalancearEcuacionActivity } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { normalizarAjustes } from "../../activities/_shared/activity-settings.js";
import { balancearEcuacionDefinition as def } from "./balancear_ecuacion-definition.js";

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

const base = (parche: Partial<BalancearEcuacionActivity> = {}): BalancearEcuacionActivity => ({
  ...def.crearPorDefecto(),
  ...parche,
});
const enviar = () => screen.getByRole("button", { name: "Enviar coeficientes" }) as HTMLButtonElement;

describe("Balancear ecuación — ajustes comunes (U9a.6)", () => {
  it("cada botón +/− dice a qué especie pertenece", () => {
    render(<Viewer estado={base()} config={{}} />);
    for (const f of ["H2", "O2", "H2O"]) {
      expect(screen.getByRole("button", { name: `Sumar uno a ${f}` })).toBeTruthy();
      expect(screen.getByRole("button", { name: `Quitar uno a ${f}` })).toBeTruthy();
    }
  });

  it("después de enviar ya no se pueden mover los coeficientes (antes el número seguía cambiando)", () => {
    render(<Viewer estado={base()} config={{}} />);
    fireEvent.click(enviar());
    expect((screen.getByRole("button", { name: "Sumar uno a H2" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("`ajustes.sonido = false` silencia el envío", () => {
    render(<Viewer estado={base({ ajustes: { sonido: false } })} config={{}} />);
    fireEvent.click(enviar());
    expect(play).not.toHaveBeenCalled();
  });

  it("al agotarse `ajustes.tiempoLimiteSeg`: avisa, bloquea los botones y no emite", () => {
    vi.useFakeTimers();
    try {
      const onResponse = vi.fn();
      render(<Viewer estado={base({ ajustes: { tiempoLimiteSeg: 3 } })} config={{ onResponse }} />);
      act(() => void vi.advanceTimersByTime(3000));
      expect(screen.getByText("Se acabó el tiempo.")).toBeTruthy();
      expect(enviar().disabled).toBe(true);
      fireEvent.click(enviar());
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

describe("Propiedades de Balancear ecuación (U9a.6)", () => {
  it("conserva el editor de siempre y suma estilos y ajustes comunes", () => {
    const { container } = render(
      <Propiedades estado={base()} config={{}} onChange={() => undefined} onConfigChange={() => undefined} />,
    );
    expect(screen.getByText("Ecuación (sin coeficientes)")).toBeTruthy(); // del editor
    expect(container.querySelectorAll("[data-preset-id]")).toHaveLength(5);
    expect(container.querySelector("[data-actividad-ajustes]")).toBeTruthy();
    expect(screen.getByLabelText("Límite de tiempo")).toBeTruthy();
    for (const t of ["Calificación", "Vidas", "Pistas", "Orden"]) expect(screen.queryByText(t), t).toBeNull();
  });

  it("elegir «Examen» guarda solo `ajustes` y deja la ecuación intacta", () => {
    const original = base();
    const onChange = vi.fn();
    const { container } = render(
      <Propiedades estado={original} config={{}} onChange={onChange} onConfigChange={() => undefined} />,
    );
    fireEvent.click(container.querySelector('[data-preset-id="examen"]')!);
    const guardada = onChange.mock.lastCall![0] as BalancearEcuacionActivity;
    expect(normalizarAjustes(guardada)).toMatchObject({ estilo: "examen", sonido: false });
    expect({ ...guardada, ajustes: undefined }).toEqual({ ...original, ajustes: undefined });
  });

  it("la definición declara presets y `apariencia.color`", () => {
    expect(def.presets.map((p) => p.id)).toEqual(["escolar", "examen", "arcade", "minimal", "pizarra"]);
    expect(def.apariencia).toEqual({ color: true, tipografia: false, animacion: false });
  });
});
