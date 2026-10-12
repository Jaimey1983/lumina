/**
 * U9d.5 — paridad de Video interactivo contra su comportamiento ANTERIOR a migrar al
 * `ActivityShell` (Regla 7), con un video directo (HTML5): la portada «Toca para comenzar»,
 * el arranque, la pregunta que aparece en su segundo (y pausa o no el video), cómo se contesta
 * («Responder», «¡Correcto!/Incorrecto.», «Continuar»), la respuesta `{ questionIndex, answer }`
 * UNA vez por pregunta y el scoring. Los `data-testid` son contrato con los e2e de Cypress.
 * jsdom no reproduce video: se simulan `play`/`pause` y los eventos `timeupdate`.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateActivityResponse } from "@lumina/scoring";
import type { VideoInteractive } from "@lumina/types/slide";

const sonido = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play: sonido }) }));

import { videoInteractivoDefinition as def } from "./video_interactivo-definition.js";

type Props = { estado: unknown; config: Record<string, unknown> };
const Viewer = def.Viewer as unknown as (p: Props) => React.ReactElement;

const play = vi.fn(() => Promise.resolve());
const pause = vi.fn();
beforeEach(() => {
  play.mockClear();
  pause.mockClear();
  sonido.mockClear();
  HTMLMediaElement.prototype.play = play as unknown as () => Promise<void>;
  HTMLMediaElement.prototype.pause = pause;
});
afterEach(() => cleanup());

const video = (extra: Partial<VideoInteractive> = {}): VideoInteractive => ({
  tipo: "video_interactivo",
  urlVideo: "https://example.com/clase.mp4",
  plataforma: "directo",
  preguntas: [
    {
      id: "q1",
      tiempoSegundos: 5,
      pregunta: "¿De qué color es el cielo?",
      opciones: [
        { id: "a", texto: "Azul", esCorrecta: true },
        { id: "b", texto: "Verde", esCorrecta: false },
      ],
      pausarVideo: true,
    },
    {
      id: "q2",
      tiempoSegundos: 10,
      pregunta: "¿Cuánto es 2 + 2?",
      opciones: [
        { id: "c", texto: "Cuatro", esCorrecta: true },
        { id: "d", texto: "Cinco", esCorrecta: false },
      ],
      pausarVideo: false,
    },
  ],
  ...extra,
});

const reproductor = () => screen.getByTestId("video-player-html5") as HTMLVideoElement;
const empezar = () => fireEvent.click(screen.getByTestId("video-start-button"));
/** Avanza el video al segundo `t` (jsdom no tiene reloj de medios). */
const irA = (t: number) => {
  const v = reproductor();
  Object.defineProperty(v, "currentTime", { value: t, writable: true, configurable: true });
  act(() => void fireEvent(v, new Event("timeupdate")));
};
const opcion = (texto: string) => screen.getAllByTestId("question-option").find((b) => b.textContent?.includes(texto))!;

describe("Video interactivo — paridad con el comportamiento anterior (U9d.5)", () => {
  it("muestra el reproductor con la portada «Toca para comenzar» y sin pregunta", () => {
    render(<Viewer estado={video()} config={{}} />);
    expect(screen.getByTestId("video-interactive-viewer")).toBeTruthy();
    expect(reproductor().getAttribute("src")).toBe("https://example.com/clase.mp4");
    expect(screen.getByText("Toca para comenzar")).toBeTruthy();
    expect(screen.queryByTestId("question-overlay")).toBeNull();
  });

  it("al empezar quita la portada y reproduce", () => {
    render(<Viewer estado={video()} config={{}} />);
    empezar();
    expect(screen.queryByText("Toca para comenzar")).toBeNull();
    expect(play).toHaveBeenCalled();
  });

  it("la pregunta aparece en su segundo, con sus opciones, y pausa el video (`pausarVideo`)", () => {
    render(<Viewer estado={video()} config={{}} />);
    empezar();
    irA(2);
    expect(screen.queryByTestId("question-overlay")).toBeNull();
    irA(5.1);
    expect(screen.getByTestId("question-text").textContent).toBe("¿De qué color es el cielo?");
    expect(screen.getAllByTestId("question-option")).toHaveLength(2);
    expect(pause).toHaveBeenCalled();
  });

  it("una pregunta con `pausarVideo: false` aparece sin pausar", () => {
    render(<Viewer estado={video()} config={{}} />);
    empezar();
    irA(5.1);
    fireEvent.click(opcion("Azul"));
    fireEvent.click(screen.getByRole("button", { name: "Responder" }));
    fireEvent.click(screen.getByTestId("question-close-button"));
    pause.mockClear();
    irA(10.1);
    expect(screen.getByTestId("question-text").textContent).toBe("¿Cuánto es 2 + 2?");
    expect(pause).not.toHaveBeenCalled();
  });

  it("«Responder» solo se habilita al elegir una opción y muestra ¡Correcto! / Incorrecto.", () => {
    render(<Viewer estado={video()} config={{}} />);
    empezar();
    irA(5.1);
    const responder = screen.getByRole("button", { name: "Responder" }) as HTMLButtonElement;
    expect(responder.disabled).toBe(true);
    fireEvent.click(opcion("Verde"));
    expect(responder.disabled).toBe(false);
    fireEvent.click(responder);
    expect(screen.getByText("Incorrecto.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Responder" })).toBeNull();
  });

  it("contestar bien muestra ¡Correcto! y bloquea las opciones", () => {
    render(<Viewer estado={video()} config={{}} />);
    empezar();
    irA(5.1);
    fireEvent.click(opcion("Azul"));
    fireEvent.click(screen.getByRole("button", { name: "Responder" }));
    expect(screen.getByText("¡Correcto!")).toBeTruthy();
    expect((opcion("Verde") as HTMLButtonElement).disabled).toBe(true);
  });

  it("emite UNA respuesta `{ questionIndex, answer }` por pregunta, con el id de la opción", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={video()} config={{ onResponse }} />);
    empezar();
    irA(5.1);
    fireEvent.click(opcion("Verde"));
    expect(onResponse).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Responder" }));
    expect(onResponse.mock.calls).toEqual([[{ questionIndex: 0, answer: "b" }]]);
    fireEvent.click(screen.getByTestId("question-close-button"));
    irA(10.1);
    fireEvent.click(opcion("Cuatro"));
    fireEvent.click(screen.getByRole("button", { name: "Responder" }));
    expect(onResponse.mock.calls).toEqual([
      [{ questionIndex: 0, answer: "b" }],
      [{ questionIndex: 1, answer: "c" }],
    ]);
  });

  it("«Continuar» cierra la pregunta y reanuda el video", () => {
    render(<Viewer estado={video()} config={{}} />);
    empezar();
    irA(5.1);
    fireEvent.click(opcion("Azul"));
    fireEvent.click(screen.getByRole("button", { name: "Responder" }));
    play.mockClear();
    fireEvent.click(screen.getByTestId("question-close-button"));
    expect(screen.queryByTestId("question-overlay")).toBeNull();
    expect(play).toHaveBeenCalled();
  });

  it("suena una vez al contestar", () => {
    render(<Viewer estado={video()} config={{}} />);
    empezar();
    irA(5.1);
    fireEvent.click(opcion("Azul"));
    fireEvent.click(screen.getByRole("button", { name: "Responder" }));
    expect(sonido).toHaveBeenCalledTimes(1);
  });

  it("no vuelve a mostrar una pregunta ya vista al repetirse el `timeupdate`", () => {
    render(<Viewer estado={video()} config={{}} />);
    empezar();
    irA(5.1);
    fireEvent.click(opcion("Azul"));
    fireEvent.click(screen.getByRole("button", { name: "Responder" }));
    fireEvent.click(screen.getByTestId("question-close-button"));
    irA(5.3);
    expect(screen.queryByTestId("question-overlay")).toBeNull();
  });
});

describe("Video interactivo — scoring con la respuesta que sale (U9d.5)", () => {
  it("todas bien 5 · todas mal 1 · una de dos 2,5; sin respuestas no es evaluable", () => {
    const e = video();
    const nota = (r: unknown) => evaluateActivityResponse("video_interactivo", e, r).score;
    expect(nota([{ questionIndex: 0, answer: "a" }, { questionIndex: 1, answer: "c" }])).toBe(5);
    expect(nota([{ questionIndex: 0, answer: "b" }, { questionIndex: 1, answer: "d" }])).toBe(1);
    expect(nota([{ questionIndex: 0, answer: "a" }, { questionIndex: 1, answer: "d" }])).toBe(2.5);
    expect(nota([])).toBeNull();
  });
});
