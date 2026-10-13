/**
 * U9d.1 — lo NUEVO de Globos tras migrar al shell: conserva `ajustes` al hidratar el slide, lee
 * `ajustes` (estilo, sonido, nota, semilla), un globo escapado cuesta una vida, solo cuenta una
 * respuesta por pregunta y su panel suma estilos y ajustes comunes.
 */
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GlobosActivity } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { globosFingerprint, normalizarGlobos } from "../../activities/globos/globos-config.js";
import { normalizarAjustes } from "../../activities/_shared/activity-settings.js";
import { globosDefinition as def } from "./globos-definition.js";

type PropsViewer = { estado: unknown; config: Record<string, unknown> };
const Viewer = def.Viewer as unknown as (p: PropsViewer) => React.ReactElement;
const Propiedades = def.Propiedades as unknown as (p: {
  estado: unknown;
  config: object;
  onChange(e: unknown): void;
  onConfigChange(c: object): void;
}) => React.ReactElement;

let alto: PropertyDescriptor | undefined;
beforeEach(() => {
  vi.useFakeTimers({
    toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "requestAnimationFrame", "cancelAnimationFrame", "performance", "Date"],
  });
  vi.spyOn(Math, "random").mockReturnValue(0.5);
  play.mockClear();
  alto = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientHeight");
  Object.defineProperty(HTMLElement.prototype, "clientHeight", { configurable: true, get: () => 400 });
});
afterEach(() => {
  if (alto) Object.defineProperty(HTMLElement.prototype, "clientHeight", alto);
  else delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientHeight;
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const base = (parche: Partial<GlobosActivity> = {}, cfg: Partial<GlobosActivity["configuracion"]> = {}): GlobosActivity => ({
  tipo: "globos",
  configuracion: { velocidad: "lenta", vidas: 3, tiempoLimite: 60, colorGlobos: ["#EF4444", "#3B82F6"], ...cfg },
  preguntas: [
    { id: "q1", enunciado: "Uno", opciones: [{ texto: "A", correcta: true }, { texto: "B", correcta: false }, { texto: "C", correcta: false }] },
    { id: "q2", enunciado: "Dos", opciones: [{ texto: "D", correcta: true }, { texto: "E", correcta: false }, { texto: "F", correcta: false }] },
  ],
  ...parche,
});
const pasar = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const globo = (t: string) => screen.getByRole("button", { name: t });
const orden = () => screen.getAllByRole("button").map((b) => b.textContent).join("");
const anuncio = () => document.querySelector('[role="status"][aria-live="polite"]')!.textContent;

describe("Globos — `ajustes` y normalizador (U9d.1)", () => {
  it("el normalizador de hidratación CONSERVA `ajustes` (antes los descartaba)", () => {
    const a = base({ ajustes: { estilo: "pizarra", sonido: false } });
    expect(normalizarGlobos(a).ajustes).toEqual({ estilo: "pizarra", sonido: false });
    expect(normalizarGlobos(base()).ajustes).toBeUndefined();
  });

  it("la huella es del contenido: cambiar un ajuste NO reinicia la partida", () => {
    expect(globosFingerprint(base({ ajustes: { estilo: "arcade" } }))).toBe(globosFingerprint(base()));
    const { rerender } = render(<Viewer estado={base()} config={{}} />);
    fireEvent.click(globo("A"));
    pasar(500);
    expect(screen.getByText("Dos")).toBeTruthy();
    rerender(<Viewer estado={base({ ajustes: { estilo: "arcade" } })} config={{}} />);
    expect(screen.getByText("Dos")).toBeTruthy();
  });

  it("`ajustes.estilo` llega al shell (`data-estilo`)", () => {
    const { container } = render(<Viewer estado={base({ ajustes: { estilo: "pizarra" } })} config={{}} />);
    expect(container.querySelector('[data-estilo="pizarra"]')).toBeTruthy();
  });

  it("vidas y tiempo siguen saliendo de `configuracion` (3 vidas, 60 s por defecto)", () => {
    render(<Viewer estado={base()} config={{}} />);
    expect(screen.getByRole("img", { name: "Vidas: 3 de 3" })).toBeTruthy();
    expect(screen.getByRole("timer", { name: "Tiempo restante: 1:00" })).toBeTruthy();
  });

  it("`ajustes.semilla` da el mismo orden de globos en dos montajes", () => {
    Math.random = () => 0.5;
    const e = base({ ajustes: { semilla: 11 } });
    const a = render(<Viewer estado={e} config={{}} />);
    const primero = orden();
    a.unmount();
    render(<Viewer estado={e} config={{}} />);
    expect(orden()).toBe(primero);
  });

  it("`ajustes.sonido = false` silencia; con sonido suena acierto y error", () => {
    const { unmount } = render(<Viewer estado={base({ ajustes: { sonido: false } })} config={{}} />);
    fireEvent.click(globo("B"));
    expect(play).not.toHaveBeenCalled();
    unmount();
    render(<Viewer estado={base()} config={{}} />);
    fireEvent.click(globo("B"));
    pasar(500);
    fireEvent.click(globo("D"));
    expect(play.mock.calls).toEqual([["wrong"], ["correct"]]);
  });

  it("`ajustes.mostrarNota = false` oculta la nota del resultado", () => {
    render(<Viewer estado={base({ ajustes: { mostrarNota: false } }, { vidas: 1 })} config={{}} />);
    fireEvent.click(globo("B"));
    pasar(1000);
    expect(within(screen.getByRole("dialog")).queryByText(/1\.0/)).toBeNull();
  });
});

describe("Globos — reglas del juego (U9d.1)", () => {
  it("un globo que se escapa por arriba cuesta una vida (hay que dejarlos subir)", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={base({}, { velocidad: "rapida", tiempoLimite: 300, vidas: 3 })} config={{ onResponse }} />);
    pasar(1000);
    expect(screen.getByRole("img", { name: "Vidas: 3 de 3" })).toBeTruthy();
    pasar(6000);
    // Los tres globos escapan a la vez: sin vidas, termina con 0 puntos.
    expect(onResponse.mock.calls).toEqual([[{ puntosObtenidos: 0, puntosMaximos: 2 }]]);
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("pinchar un segundo globo antes del avance NO cuenta (antes avanzaba dos preguntas)", () => {
    render(<Viewer estado={base()} config={{}} />);
    fireEvent.click(globo("A"));
    fireEvent.click(globo("B")); // ya respondió: se ignora
    pasar(500);
    expect(screen.getByText("Dos")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Vidas: 3 de 3" })).toBeTruthy();
  });

  it("cada pinchazo se anuncia por `aria-live`", () => {
    render(<Viewer estado={base()} config={{}} />);
    fireEvent.click(globo("B"));
    expect(anuncio()).toBe("Incorrecto: B.");
    pasar(500);
    fireEvent.click(globo("D"));
    expect(anuncio()).toBe("Correcto: D.");
  });
});

describe("Propiedades de Globos (U9d.1)", () => {
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
    const guardada = onChange.mock.lastCall![0] as GlobosActivity;
    expect(normalizarAjustes(guardada)).toMatchObject({ estilo: "examen", sonido: false });
    expect(guardada.preguntas).toEqual(original.preguntas);
    expect(normalizarAjustes(normalizarGlobos(guardada))).toMatchObject({ estilo: "examen" });
  });

  it("la definición declara presets y `apariencia.color`", () => {
    expect(def.presets.map((p) => p.id)).toEqual(["escolar", "examen", "arcade", "minimal", "pizarra"]);
    expect(def.apariencia).toEqual({ color: true, tipografia: false, animacion: false });
  });
});
