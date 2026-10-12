/**
 * U9d.4 — lo NUEVO de Historia ramificada tras migrar al shell: lee `ajustes` (estilo, sonido, nota,
 * tiempo), anuncia cada nodo y el feedback, y su panel suma estilos y ajustes comunes.
 */
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HistoriaRamificadaActivity } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { createDefaultHistoriaRamificada } from "../../activities/historia-ramificada/index.js";
import { normalizarAjustes } from "../../activities/_shared/activity-settings.js";
import { historiaRamificadaDefinition as def } from "./historia_ramificada-definition.js";

type PropsViewer = { estado: unknown; config: Record<string, unknown> };
const Viewer = def.Viewer as unknown as (p: PropsViewer) => React.ReactElement;
const Propiedades = def.Propiedades as unknown as (p: {
  estado: unknown;
  config: object;
  onChange(e: unknown): void;
  onConfigChange(c: object): void;
}) => React.ReactElement;

beforeEach(() => {
  vi.useFakeTimers();
  play.mockClear();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const base = (parche: Partial<HistoriaRamificadaActivity> = {}): HistoriaRamificadaActivity => ({
  ...createDefaultHistoriaRamificada(),
  ...parche,
});
const pasar = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const elegir = (texto: string, espera = 0) => {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(texto) }));
  pasar(espera);
};
const anuncio = () => document.querySelector('[role="status"][aria-live="polite"]')!.textContent;

describe("Historia ramificada — `ajustes` (U9d.4)", () => {
  it("`ajustes.estilo` llega al shell (`data-estilo`)", () => {
    const { container } = render(<Viewer estado={base({ ajustes: { estilo: "pizarra" } })} config={{}} />);
    expect(container.querySelector('[data-estilo="pizarra"]')).toBeTruthy();
  });

  it("`ajustes.mostrarNota = false` oculta la nota del resultado", () => {
    render(<Viewer estado={base({ ajustes: { mostrarNota: false } })} config={{}} />);
    elegir("Entrar al castillo");
    elegir("Puerta roja", 900);
    expect(within(screen.getByRole("dialog")).queryByText(/5\.0/)).toBeNull();
  });

  it("al llegar al final, el resultado se abre tras 800 ms con el nodo final a la vista", () => {
    render(<Viewer estado={base()} config={{}} />);
    elegir("Entrar al castillo");
    elegir("Puerta roja", 400);
    expect(screen.queryByRole("dialog")).toBeNull();
    pasar(500);
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("con límite de tiempo, al agotarse sale UNA respuesta con el recorrido hecho y se bloquean las opciones", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={base({ ajustes: { tiempoLimiteSeg: 3 } })} config={{ onResponse }} />);
    elegir("Entrar al castillo");
    pasar(3000);
    expect(onResponse.mock.calls).toEqual([
      [{ historial: [{ nodoId: "nodo-inicio" }, { nodoId: "nodo-castillo", opcionElegida: "op-1a" }] }],
    ]);
    pasar(5000);
    expect(onResponse).toHaveBeenCalledTimes(1);
  });

  it("`ajustes.sonido = false` silencia las opciones evaluadas; con sonido suena acierto", () => {
    // En la historia por defecto «Entrar al castillo» trae `esCorrecta: true`; «Regresar» no la trae.
    const { unmount } = render(<Viewer estado={base({ ajustes: { sonido: false } })} config={{}} />);
    elegir("Entrar al castillo");
    expect(play).not.toHaveBeenCalled();
    unmount();
    render(<Viewer estado={base()} config={{}} />);
    elegir("Regresar al pueblo");
    expect(play).not.toHaveBeenCalled(); // sin `esCorrecta`: no suena
    cleanup();
    render(<Viewer estado={base()} config={{}} />);
    elegir("Entrar al castillo");
    expect(play.mock.calls).toEqual([["correct"]]);
  });

});

describe("Historia ramificada — accesibilidad (U9d.4, DU8)", () => {
  it("el nodo actual se anuncia y el feedback de una opción también", () => {
    render(<Viewer estado={base()} config={{}} />);
    expect(anuncio()).toBe("Inicio. Era una noche oscura y tormentosa. ¿Qué harás?");
    elegir("Entrar al castillo");
    expect(anuncio()).toBe("El castillo. Encuentras dos puertas. Una roja y una azul.");
  });
});

describe("Propiedades de Historia ramificada (U9d.4)", () => {
  it("conserva el panel de siempre y suma estilos y ajustes comunes (sin «Intentos» común)", () => {
    const { container } = render(
      <Propiedades estado={base()} config={{}} onChange={() => undefined} onConfigChange={() => undefined} />,
    );
    expect(container.querySelectorAll("[data-preset-id]")).toHaveLength(5);
    expect(container.querySelector("[data-actividad-ajustes]")).toBeTruthy();
    expect(screen.getByLabelText("Límite de tiempo")).toBeTruthy();
    expect(screen.queryByLabelText("Intentos")).toBeNull();
  });

  it("elegir «Examen» guarda solo `ajustes`", () => {
    const original = base();
    const onChange = vi.fn();
    const { container } = render(
      <Propiedades estado={original} config={{}} onChange={onChange} onConfigChange={() => undefined} />,
    );
    fireEvent.click(container.querySelector('[data-preset-id="examen"]')!);
    const guardada = onChange.mock.lastCall![0] as HistoriaRamificadaActivity;
    expect(normalizarAjustes(guardada)).toMatchObject({ estilo: "examen", sonido: false });
    expect(guardada.nodos).toEqual(original.nodos);
  });

  it("la definición declara presets y `apariencia.color`", () => {
    expect(def.presets.map((p) => p.id)).toEqual(["escolar", "examen", "arcade", "minimal", "pizarra"]);
    expect(def.apariencia).toEqual({ color: true, tipografia: false, animacion: false });
  });
});
