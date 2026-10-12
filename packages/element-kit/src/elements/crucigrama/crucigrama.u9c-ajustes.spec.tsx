/**
 * U9c.3 — lo NUEVO de Crucigrama tras migrar al shell: lee `ajustes` (estilo, sonido, nota,
 * tiempo), se maneja con el teclado (flechas, Enter, Retroceso), nombra cada celda y anuncia la
 * pista; su panel suma estilos y ajustes comunes sin ofrecer «Intentos».
 */
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CrucigramaActivity } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { normalizarAjustes } from "../../activities/_shared/activity-settings.js";
import { crucigramaDefinition as def } from "./crucigrama-definition.js";

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
  play.mockClear();
  original = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = () =>
    ({ left: 0, top: 0, right: 300, bottom: 300, width: 300, height: 300, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
});
afterEach(() => {
  Element.prototype.getBoundingClientRect = original;
  cleanup();
  vi.useRealTimers();
});

const base = (parche: Partial<CrucigramaActivity> = {}): CrucigramaActivity => ({
  tipo: "crucigrama",
  configuracion: { tamanoCelda: 40, colorCelda: "#ffffff", colorTexto: "#111111" },
  palabras: [
    { id: "p1", texto: "SOL", pista: "Brilla de día", direccion: "horizontal", fila: 0, columna: 0 },
    { id: "p2", texto: "SAL", pista: "Condimento blanco", direccion: "vertical", fila: 0, columna: 0 },
  ],
  ...parche,
});
const celdas = () => [...document.querySelectorAll("input")] as HTMLInputElement[];
const verificar = () => screen.getByRole("button", { name: "Verificar" });
const anuncio = () => document.querySelector('[role="status"][aria-live="polite"]')!.textContent;
const rellenar = (letras: string[]) => letras.forEach((l, i) => fireEvent.change(celdas()[i]!, { target: { value: l } }));
const pasar = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

describe("Crucigrama — `ajustes` (U9c.3)", () => {
  it("`ajustes.estilo` llega al shell (`data-estilo`)", () => {
    const { container } = render(<Viewer estado={base({ ajustes: { estilo: "pizarra" } })} config={{}} />);
    expect(container.querySelector('[data-estilo="pizarra"]')).toBeTruthy();
  });

  it("`ajustes.sonido = false` silencia la verificación; con sonido suena", () => {
    const { unmount } = render(<Viewer estado={base({ ajustes: { sonido: false } })} config={{}} />);
    rellenar(["S", "O", "L", "A", "L"]);
    fireEvent.click(verificar());
    expect(play).not.toHaveBeenCalled();
    unmount();
    render(<Viewer estado={base()} config={{}} />);
    rellenar(["S", "O", "L", "A", "L"]);
    fireEvent.click(verificar());
    expect(play).toHaveBeenCalledWith("correct");
  });

  it("`ajustes.mostrarNota = false` oculta la nota del resultado", () => {
    render(<Viewer estado={base({ ajustes: { mostrarNota: false } })} config={{}} />);
    rellenar(["S", "O", "L", "A", "L"]);
    fireEvent.click(verificar());
    expect(within(screen.getByRole("dialog")).queryByText(/5\.0/)).toBeNull();
  });

  it("el shell NO ofrece «Reintentar» ni muestra «Intento 1 de …» (una sola verificación)", () => {
    render(<Viewer estado={base({ ajustes: { intentos: 3 } })} config={{}} />);
    expect(screen.queryByText(/Intento \d/)).toBeNull();
    rellenar(["X", "X", "X", "X", "X"]);
    fireEvent.click(verificar());
    expect(screen.queryByRole("button", { name: /reintentar/i })).toBeNull();
  });

  it("tiempo agotado: emite UNA respuesta con lo escrito y bloquea la rejilla", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={base({ ajustes: { tiempoLimiteSeg: 3 } })} config={{ onResponse }} />);
    fireEvent.change(celdas()[0]!, { target: { value: "S" } });
    pasar(3000);
    expect(screen.getAllByText("Se acabó el tiempo.").length).toBeGreaterThan(0);
    expect(celdas().every((c) => c.readOnly)).toBe(true);
    expect(onResponse.mock.calls).toEqual([[{ celdas: { "0-0": "S" } }]]);
  });

  it("acepta el alias `onComplete` y prefiere `onResponse`", () => {
    const onResponse = vi.fn();
    const onComplete = vi.fn();
    render(<Viewer estado={base()} config={{ onResponse, onComplete }} />);
    rellenar(["S", "O", "L", "A", "L"]);
    fireEvent.click(verificar());
    expect(onResponse).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
  });
});

describe("Crucigrama — teclado y anuncios (U9c.3, DU8)", () => {
  it("una sola celda entra al orden de tabulación y cada celda tiene nombre", () => {
    render(<Viewer estado={base()} config={{}} />);
    expect(celdas().filter((c) => c.tabIndex === 0)).toHaveLength(1);
    expect(screen.getByLabelText(/^Fila 1, columna 1, inicio de la palabra 1/)).toBeTruthy();
  });

  it("las flechas se mueven por la rejilla y la pista de la palabra activa se anuncia", () => {
    render(<Viewer estado={base()} config={{}} />);
    const [c00] = celdas();
    c00!.focus();
    fireEvent.keyDown(c00!, { key: "ArrowRight" });
    expect(document.activeElement).toBe(celdas()[1]);
    expect(anuncio()).toContain("Brilla de día");
    fireEvent.keyDown(celdas()[1]!, { key: "ArrowLeft" });
    fireEvent.keyDown(celdas()[0]!, { key: "ArrowDown" });
    expect(document.activeElement).toBe(celdas()[3]);
    expect(anuncio()).toContain("Condimento blanco");
  });

  it("Retroceso en una celda vacía borra la anterior de la palabra y vuelve a ella", () => {
    render(<Viewer estado={base()} config={{}} />);
    fireEvent.change(celdas()[0]!, { target: { value: "S" } });
    fireEvent.click(celdas()[1]!); // activa la palabra horizontal
    fireEvent.keyDown(celdas()[1]!, { key: "Backspace" });
    expect(celdas()[0]!.value).toBe("");
    expect(document.activeElement).toBe(celdas()[0]);
  });

  it("al verificar se marcan las celdas correctas/incorrectas en su nombre accesible", () => {
    render(<Viewer estado={base()} config={{}} />);
    rellenar(["S", "O", "L", "A", "X"]);
    fireEvent.click(verificar());
    expect(screen.getByLabelText(/columna 2.*correcta$/)).toBeTruthy();
    expect(screen.getByLabelText(/Fila 3, columna 1.*incorrecta$/)).toBeTruthy();
  });
});

describe("Propiedades de Crucigrama (U9c.3)", () => {
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
    const guardada = onChange.mock.lastCall![0] as CrucigramaActivity;
    expect(normalizarAjustes(guardada)).toMatchObject({ estilo: "examen", sonido: false });
    expect(guardada.palabras).toEqual(original.palabras);
  });

  it("la definición declara presets y `apariencia.color`", () => {
    expect(def.presets.map((p) => p.id)).toEqual(["escolar", "examen", "arcade", "minimal", "pizarra"]);
    expect(def.apariencia).toEqual({ color: true, tipografia: false, animacion: false });
  });
});
