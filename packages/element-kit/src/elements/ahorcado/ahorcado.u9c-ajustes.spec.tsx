/**
 * U9c.1 — lo NUEVO de Ahorcado tras migrar al shell: conserva `ajustes` al hidratar el slide,
 * se juega también con el teclado físico, anuncia cada jugada y lee `ajustes` (tiempo, sonido,
 * nota, estilo); su panel suma estilos y ajustes comunes.
 */
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AhorcadoActivity } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { normalizarAhorcado } from "../../activities/ahorcado/ahorcado-config.js";
import { normalizarAjustes } from "../../activities/_shared/activity-settings.js";
import { ahorcadoDefinition as def } from "./ahorcado-definition.js";

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

const base = (parche: Partial<AhorcadoActivity> = {}): AhorcadoActivity => ({
  tipo: "ahorcado",
  configuracion: { palabra: "SOL", pista: "", categoria: "", maxIntentos: 4 },
  ...parche,
});
const tecla = (l: string) => screen.getByRole("button", { name: l }) as HTMLButtonElement;
const anuncio = () => document.querySelector('[role="status"][aria-live="polite"]')!.textContent;
const teclear = (key: string) => fireEvent.keyDown(screen.getByRole("group", { name: "Ahorcado" }), { key });
const pasar = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

describe("Ahorcado — `ajustes` y normalizador (U9c.1)", () => {
  it("el normalizador de hidratación CONSERVA `ajustes` (antes los descartaba)", () => {
    const a = base({ ajustes: { estilo: "pizarra", sonido: false } });
    expect(normalizarAhorcado(a).ajustes).toEqual({ estilo: "pizarra", sonido: false });
    expect(normalizarAhorcado(base()).ajustes).toBeUndefined();
  });

  it("cambiar un ajuste a mitad de partida NO la reinicia (la huella es del contenido)", () => {
    const { rerender } = render(<Viewer estado={base()} config={{}} />);
    fireEvent.click(tecla("Z"));
    expect(screen.getByText("3/4 intentos")).toBeTruthy();
    rerender(<Viewer estado={base({ ajustes: { estilo: "arcade" } })} config={{}} />);
    expect(screen.getByText("3/4 intentos")).toBeTruthy();
  });

  it("`ajustes.estilo` llega al shell (`data-estilo`)", () => {
    const { container } = render(<Viewer estado={base({ ajustes: { estilo: "pizarra" } })} config={{}} />);
    expect(container.querySelector('[data-estilo="pizarra"]')).toBeTruthy();
  });

  it("`ajustes.sonido = false` silencia las jugadas", () => {
    render(<Viewer estado={base({ ajustes: { sonido: false } })} config={{}} />);
    fireEvent.click(tecla("S"));
    fireEvent.click(tecla("Z"));
    expect(play).not.toHaveBeenCalled();
  });

  it("suena acierto o error en cada jugada", () => {
    render(<Viewer estado={base()} config={{}} />);
    fireEvent.click(tecla("S"));
    fireEvent.click(tecla("Z"));
    expect(play.mock.calls).toEqual([["correct"], ["wrong"]]);
  });

  it("`ajustes.mostrarNota = false` oculta la nota del resultado", () => {
    render(<Viewer estado={base({ ajustes: { mostrarNota: false } })} config={{}} />);
    for (const l of ["S", "O", "L"]) fireEvent.click(tecla(l));
    pasar(350);
    expect(within(screen.getByRole("dialog")).queryByText(/5\.0/)).toBeNull();
  });

  it("el shell NO pinta vidas (el contador de intentos es el del juego)", () => {
    render(<Viewer estado={base({ configuracion: { palabra: "SOL", pista: "", categoria: "", maxIntentos: 6 } })} config={{}} />);
    expect(screen.queryByLabelText(/vidas/i)).toBeNull();
    expect(screen.getAllByText(/intentos/)).toHaveLength(1);
  });
});

describe("Ahorcado — tiempo agotado (U9c.1)", () => {
  it("cuenta como perdida: revela la palabra, emite UNA respuesta con lo jugado y bloquea el teclado", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={base({ ajustes: { tiempoLimiteSeg: 3 } })} config={{ onResponse }} />);
    fireEvent.click(tecla("S"));
    pasar(3000);
    expect(screen.getByText(/La palabra era:/)).toBeTruthy();
    expect(onResponse.mock.calls).toEqual([[{ letrasAdivinadas: ["S"], letrasFalladas: [] }]]);
    expect(tecla("A").disabled).toBe(true);
    expect(screen.getAllByText("Se acabó el tiempo.").length).toBeGreaterThan(0);
  });

  it("ganar a tiempo detiene el reloj", () => {
    render(<Viewer estado={base({ ajustes: { tiempoLimiteSeg: 5 } })} config={{}} />);
    for (const l of ["S", "O", "L"]) fireEvent.click(tecla(l));
    pasar(10_000);
    expect(screen.queryByText("Se acabó el tiempo.")).toBeNull();
  });
});

describe("Ahorcado — teclado y anuncios (U9c.1, DU8)", () => {
  it("el teclado físico juega la letra, con o sin tilde, y la Ñ", () => {
    render(<Viewer estado={base({ configuracion: { palabra: "CANCION", pista: "", categoria: "", maxIntentos: 6 } })} config={{}} />);
    teclear("c");
    teclear("Ó");
    expect(tecla("C").disabled).toBe(true);
    expect(tecla("O").disabled).toBe(true);
    teclear("ñ");
    expect(tecla("Ñ").disabled).toBe(true);
    expect(screen.getByText("5/6 intentos")).toBeTruthy(); // la Ñ no está en CANCION
  });

  it("ignora combinaciones con Ctrl/Alt, teclas largas y letras ya jugadas", () => {
    render(<Viewer estado={base()} config={{}} />);
    const grupo = screen.getByRole("group", { name: "Ahorcado" });
    fireEvent.keyDown(grupo, { key: "z", ctrlKey: true });
    fireEvent.keyDown(grupo, { key: "Enter" });
    expect(screen.getByText("4/4 intentos")).toBeTruthy();
    teclear("z");
    teclear("z");
    expect(screen.getByText("3/4 intentos")).toBeTruthy();
  });

  it("cada jugada y el final se anuncian; la palabra tiene una descripción hablada", () => {
    render(<Viewer estado={base()} config={{}} />);
    expect(screen.getByRole("img", { name: "Palabra: hueco, hueco, hueco" })).toBeTruthy();
    fireEvent.click(tecla("S"));
    expect(anuncio()).toBe("La S está en la palabra.");
    expect(screen.getByRole("img", { name: "Palabra: S, hueco, hueco" })).toBeTruthy();
    fireEvent.click(tecla("Z"));
    expect(anuncio()).toBe("La Z no está. Te quedan 3 de 4 intentos.");
    fireEvent.click(tecla("O"));
    fireEvent.click(tecla("L"));
    expect(anuncio()).toBe("¡Ganaste! La palabra era SOL.");
  });

  it("al perder se anuncia la palabra", () => {
    render(<Viewer estado={base()} config={{}} />);
    for (const l of ["A", "B", "C", "D"]) fireEvent.click(tecla(l));
    expect(anuncio()).toBe("Perdiste. La palabra era SOL.");
  });
});

describe("Propiedades de Ahorcado (U9c.1)", () => {
  it("conserva el panel de siempre y suma estilos y ajustes comunes (sin «Intentos» común)", () => {
    const { container } = render(
      <Propiedades estado={base()} config={{}} onChange={() => undefined} onConfigChange={() => undefined} />,
    );
    expect(container.querySelectorAll("[data-preset-id]")).toHaveLength(5);
    expect(container.querySelector("[data-actividad-ajustes]")).toBeTruthy();
    expect(screen.getByLabelText("Límite de tiempo")).toBeTruthy();
    expect(screen.queryByLabelText("Intentos")).toBeNull();
    expect(screen.queryByLabelText("Mismo orden para todos")).toBeNull();
  });

  it("elegir «Examen» guarda solo `ajustes` y el normalizador los conserva al releer", () => {
    const original = base();
    const onChange = vi.fn();
    const { container } = render(
      <Propiedades estado={original} config={{}} onChange={onChange} onConfigChange={() => undefined} />,
    );
    fireEvent.click(container.querySelector('[data-preset-id="examen"]')!);
    const guardada = onChange.mock.lastCall![0] as AhorcadoActivity;
    expect(normalizarAjustes(guardada)).toMatchObject({ estilo: "examen", sonido: false });
    expect(guardada.configuracion).toEqual(original.configuracion);
    // Releer el slide (hidratación) no pierde los ajustes.
    expect(normalizarAjustes(normalizarAhorcado(guardada))).toMatchObject({ estilo: "examen", sonido: false });
  });

  it("la definición declara presets y `apariencia.color`", () => {
    expect(def.presets.map((p) => p.id)).toEqual(["escolar", "examen", "arcade", "minimal", "pizarra"]);
    expect(def.apariencia).toEqual({ color: true, tipografia: false, animacion: false });
  });
});
