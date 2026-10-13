/**
 * U9d.2 — lo NUEVO de Topo tras migrar al shell: conserva `ajustes` al hidratar el slide, lee
 * `ajustes` (estilo, sonido, nota, semilla), los topos que se esconden cuestan una vida de forma
 * determinista, anuncia cada jugada y su panel suma estilos y ajustes comunes.
 */
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TopoActivity } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { normalizarTopo, topoFingerprint } from "../../activities/topo/topo-config.js";
import { normalizarAjustes } from "../../activities/_shared/activity-settings.js";
import { topoDefinition as def } from "./topo-definition.js";

type PropsViewer = { estado: unknown; config: Record<string, unknown> };
const Viewer = def.Viewer as unknown as (p: PropsViewer) => React.ReactElement;
const Propiedades = def.Propiedades as unknown as (p: {
  estado: unknown;
  config: object;
  onChange(e: unknown): void;
  onConfigChange(c: object): void;
}) => React.ReactElement;

let original: typeof Element.prototype.getBoundingClientRect;
beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(Math, "random").mockReturnValue(0.5);
  play.mockClear();
  original = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = () =>
    ({ left: 0, top: 0, right: 300, bottom: 300, width: 300, height: 300, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
});
afterEach(() => {
  Element.prototype.getBoundingClientRect = original;
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const base = (parche: Partial<TopoActivity> = {}, cfg: Partial<TopoActivity["configuracion"]> = {}): TopoActivity => ({
  tipo: "topo",
  configuracion: { velocidad: "lenta", vidas: 3, tiempoLimite: 60, filas: 2, columnas: 3, ...cfg },
  preguntas: [
    { id: "q1", enunciado: "Uno", opciones: [{ texto: "A", correcta: true }, { texto: "B", correcta: false }, { texto: "C", correcta: false }] },
    { id: "q2", enunciado: "Dos", opciones: [{ texto: "D", correcta: true }, { texto: "E", correcta: false }, { texto: "F", correcta: false }] },
  ],
  ...parche,
});
const pasar = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const golpear = (t: string) => fireEvent.click(screen.getByRole("button", { name: t }));
const anuncio = () => document.querySelector('[role="status"][aria-live="polite"]')!.textContent;
const orden = () => (screen.getAllByRole("button") as HTMLButtonElement[]).map((b) => (b.disabled ? "." : b.textContent)).join("");

describe("Topo — `ajustes` y normalizador (U9d.2)", () => {
  it("el normalizador de hidratación CONSERVA `ajustes` (antes los descartaba)", () => {
    const a = base({ ajustes: { estilo: "pizarra", sonido: false } });
    expect(normalizarTopo(a).ajustes).toEqual({ estilo: "pizarra", sonido: false });
    expect(normalizarTopo(base()).ajustes).toBeUndefined();
  });

  it("la huella es del contenido: cambiar un ajuste NO reinicia la partida", () => {
    expect(topoFingerprint(base({ ajustes: { estilo: "arcade" } }))).toBe(topoFingerprint(base()));
    const { rerender } = render(<Viewer estado={base()} config={{}} />);
    golpear("A");
    pasar(400);
    expect(screen.getByText("Dos")).toBeTruthy();
    rerender(<Viewer estado={base({ ajustes: { estilo: "arcade" } })} config={{}} />);
    expect(screen.getByText("Dos")).toBeTruthy();
  });

  it("`ajustes.estilo` llega al shell y vidas/tiempo salen de `configuracion`", () => {
    const { container } = render(<Viewer estado={base({ ajustes: { estilo: "pizarra" } })} config={{}} />);
    expect(container.querySelector('[data-estilo="pizarra"]')).toBeTruthy();
    expect(screen.getByRole("img", { name: "Vidas: 3 de 3" })).toBeTruthy();
    expect(screen.getByRole("timer", { name: "Tiempo restante: 1:00" })).toBeTruthy();
  });

  it("`ajustes.semilla` da el mismo reparto de topos en dos montajes", () => {
    const e = base({ ajustes: { semilla: 21 } });
    const a = render(<Viewer estado={e} config={{}} />);
    const primero = orden();
    a.unmount();
    render(<Viewer estado={e} config={{}} />);
    expect(orden()).toBe(primero);
  });

  it("`ajustes.sonido = false` silencia; con sonido suena error y acierto", () => {
    const { unmount } = render(<Viewer estado={base({ ajustes: { sonido: false } })} config={{}} />);
    golpear("B");
    expect(play).not.toHaveBeenCalled();
    unmount();
    render(<Viewer estado={base()} config={{}} />);
    golpear("B");
    golpear("A");
    expect(play.mock.calls).toEqual([["wrong"], ["correct"]]);
  });

  it("`ajustes.mostrarNota = false` oculta la nota del resultado", () => {
    render(<Viewer estado={base({ ajustes: { mostrarNota: false } }, { vidas: 1 })} config={{}} />);
    golpear("B");
    pasar(1000);
    expect(within(screen.getByRole("dialog")).queryByText(/1\.0/)).toBeNull();
  });
});

describe("Topo — reglas del juego (U9d.2)", () => {
  it("si los topos se esconden sin acertar cuesta UNA vida (no una por topo)", () => {
    render(<Viewer estado={base()} config={{}} />);
    pasar(2600);
    expect(screen.getByRole("img", { name: "Vidas: 2 de 3" })).toBeTruthy();
  });

  it("con una sola vida, dejar que se escondan termina el juego en la primera pregunta", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={base({}, { vidas: 1 })} config={{ onResponse }} />);
    pasar(2600);
    expect(onResponse.mock.calls).toEqual([[{ puntosObtenidos: 0, puntosMaximos: 2 }]]);
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("acertar a tiempo NO cuesta vida aunque otros topos queden sin golpear", () => {
    render(<Viewer estado={base()} config={{}} />);
    golpear("A");
    pasar(3000);
    expect(screen.getByRole("img", { name: "Vidas: 2 de 3" })).toBeTruthy(); // solo la pregunta 2 se escapó
  });

  it("cada jugada se anuncia por `aria-live`", () => {
    render(<Viewer estado={base()} config={{}} />);
    expect(anuncio()).toBe("Pregunta 1 de 2: Uno");
    golpear("B");
    expect(anuncio()).toBe("Incorrecto: B.");
    golpear("A");
    expect(anuncio()).toBe("Correcto: A.");
  });

  it("los huecos vacíos tienen nombre accesible", () => {
    render(<Viewer estado={base()} config={{}} />);
    expect(screen.getAllByRole("button", { name: "Hueco vacío" })).toHaveLength(3);
  });
});

describe("Propiedades de Topo (U9d.2)", () => {
  it("conserva el panel de siempre y suma estilos y ajustes comunes", () => {
    const { container } = render(
      <Propiedades estado={base()} config={{}} onChange={() => undefined} onConfigChange={() => undefined} />,
    );
    expect(container.querySelectorAll("[data-preset-id]")).toHaveLength(5);
    expect(container.querySelector("[data-actividad-ajustes]")).toBeTruthy();
    expect(screen.getByLabelText("Mismo orden para todos")).toBeTruthy();
    expect(screen.queryByLabelText("Intentos")).toBeNull();
  });

  it("elegir «Examen» guarda solo `ajustes`", () => {
    const original = base();
    const onChange = vi.fn();
    const { container } = render(
      <Propiedades estado={original} config={{}} onChange={onChange} onConfigChange={() => undefined} />,
    );
    fireEvent.click(container.querySelector('[data-preset-id="examen"]')!);
    const guardada = onChange.mock.lastCall![0] as TopoActivity;
    expect(normalizarAjustes(guardada)).toMatchObject({ estilo: "examen", sonido: false });
    expect(guardada.preguntas).toEqual(original.preguntas);
    expect(normalizarAjustes(normalizarTopo(guardada))).toMatchObject({ estilo: "examen" });
  });

  it("la definición declara presets y `apariencia.color`", () => {
    expect(def.presets.map((p) => p.id)).toEqual(["escolar", "examen", "arcade", "minimal", "pizarra"]);
    expect(def.apariencia).toEqual({ color: true, tipografia: false, animacion: false });
  });
});
