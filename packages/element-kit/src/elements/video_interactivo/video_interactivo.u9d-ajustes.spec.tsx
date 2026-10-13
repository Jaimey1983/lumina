/**
 * U9d.5 — lo NUEVO de Video interactivo tras migrar al shell: lee `ajustes` (estilo, sonido), el
 * progreso cuenta las preguntas contestadas, anuncia cada pregunta, conserva el reveal de la
 * correcta y su panel suma estilos y ajustes comunes.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { VideoInteractive } from "@lumina/types/slide";

const sonido = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play: sonido }) }));

import { normalizarAjustes } from "../../activities/_shared/activity-settings.js";
import { videoInteractivoDefinition as def } from "./video_interactivo-definition.js";

type PropsViewer = { estado: unknown; config: Record<string, unknown> };
const Viewer = def.Viewer as unknown as (p: PropsViewer) => React.ReactElement;
const Propiedades = def.Propiedades as unknown as (p: {
  estado: unknown;
  config: object;
  onChange(e: unknown): void;
  onConfigChange(c: object): void;
}) => React.ReactElement;

beforeEach(() => {
  sonido.mockClear();
  HTMLMediaElement.prototype.play = (() => Promise.resolve()) as unknown as () => Promise<void>;
  HTMLMediaElement.prototype.pause = () => undefined;
});
afterEach(() => cleanup());

const base = (parche: Partial<VideoInteractive> = {}): VideoInteractive => ({
  tipo: "video_interactivo",
  urlVideo: "https://example.com/clase.mp4",
  plataforma: "directo",
  preguntas: [
    { id: "q1", tiempoSegundos: 5, pregunta: "Uno", opciones: [{ id: "a", texto: "Azul", esCorrecta: true }, { id: "b", texto: "Verde", esCorrecta: false }], pausarVideo: true },
    { id: "q2", tiempoSegundos: 10, pregunta: "Dos", opciones: [{ id: "c", texto: "Cuatro", esCorrecta: true }, { id: "d", texto: "Cinco", esCorrecta: false }], pausarVideo: true },
  ],
  ...parche,
});
const irA = (t: number) => {
  const v = screen.getByTestId("video-player-html5");
  Object.defineProperty(v, "currentTime", { value: t, writable: true, configurable: true });
  act(() => void fireEvent(v, new Event("timeupdate")));
};
const opcion = (texto: string) => screen.getAllByTestId("question-option").find((b) => b.textContent?.includes(texto))!;
const responder = (texto: string) => {
  fireEvent.click(opcion(texto));
  fireEvent.click(screen.getByRole("button", { name: "Responder" }));
};
const anuncio = () => document.querySelector('[data-testid="video-interactive-viewer"] [role="status"][aria-live="polite"]')!.textContent;

describe("Video interactivo — `ajustes` (U9d.5)", () => {
  it("`ajustes.estilo` llega al shell (`data-estilo`)", () => {
    const { container } = render(<Viewer estado={base({ ajustes: { estilo: "pizarra" } })} config={{}} />);
    expect(container.querySelector('[data-estilo="pizarra"]')).toBeTruthy();
  });

  it("`ajustes.sonido = false` silencia; con sonido suena acierto o error", () => {
    const { unmount } = render(<Viewer estado={base({ ajustes: { sonido: false } })} config={{}} />);
    fireEvent.click(screen.getByTestId("video-start-button"));
    irA(5.1);
    responder("Azul");
    expect(sonido).not.toHaveBeenCalled();
    unmount();
    render(<Viewer estado={base()} config={{}} />);
    fireEvent.click(screen.getByTestId("video-start-button"));
    irA(5.1);
    responder("Verde");
    expect(sonido.mock.calls).toEqual([["wrong"]]);
  });

  it("el progreso cuenta las preguntas contestadas (cada una una sola vez)", () => {
    render(<Viewer estado={base()} config={{}} />);
    expect(screen.getByText("0/2")).toBeTruthy();
    fireEvent.click(screen.getByTestId("video-start-button"));
    irA(5.1);
    responder("Azul");
    expect(screen.getByText("1/2")).toBeTruthy();
    fireEvent.click(screen.getByTestId("question-close-button"));
    irA(10.1);
    responder("Cinco");
    expect(screen.getByText("2/2")).toBeTruthy();
  });

  it("al contestar mal se revela la correcta (siempre, como antes)", () => {
    render(<Viewer estado={base()} config={{}} />);
    fireEvent.click(screen.getByTestId("video-start-button"));
    irA(5.1);
    responder("Verde");
    // La opción correcta no elegida deja de estar «apagada» (no tiene la clase de opacidad).
    expect(opcion("Azul").className).not.toMatch(/apagada/);
    expect(opcion("Verde").className).toMatch(/incorrecta/);
  });

  it("cada pregunta se anuncia por `aria-live`", () => {
    render(<Viewer estado={base()} config={{}} />);
    fireEvent.click(screen.getByTestId("video-start-button"));
    expect(anuncio()).toBe("");
    irA(5.1);
    expect(anuncio()).toBe("Pregunta del video: Uno");
  });
});

describe("Propiedades de Video interactivo (U9d.5)", () => {
  it("conserva el editor de siempre y suma estilos y ajustes comunes (solo sonido y aspecto)", () => {
    const { container } = render(
      <Propiedades estado={base()} config={{}} onChange={() => undefined} onConfigChange={() => undefined} />,
    );
    expect(container.querySelectorAll("[data-preset-id]")).toHaveLength(5);
    expect(container.querySelector("[data-actividad-ajustes]")).toBeTruthy();
    expect(screen.queryByLabelText("Límite de tiempo")).toBeNull();
    expect(screen.queryByLabelText("Intentos")).toBeNull();
  });

  it("elegir «Examen» guarda solo `ajustes`", () => {
    const original = base();
    const onChange = vi.fn();
    const { container } = render(
      <Propiedades estado={original} config={{}} onChange={onChange} onConfigChange={() => undefined} />,
    );
    fireEvent.click(container.querySelector('[data-preset-id="examen"]')!);
    const guardada = onChange.mock.lastCall![0] as VideoInteractive;
    expect(normalizarAjustes(guardada)).toMatchObject({ estilo: "examen", sonido: false });
    expect(guardada.preguntas).toEqual(original.preguntas);
  });

  it("la definición declara presets y `apariencia.color`", () => {
    expect(def.presets.map((p) => p.id)).toEqual(["escolar", "examen", "arcade", "minimal", "pizarra"]);
    expect(def.apariencia).toEqual({ color: true, tipografia: false, animacion: false });
  });
});
