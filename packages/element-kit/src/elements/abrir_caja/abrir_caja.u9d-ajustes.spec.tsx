/**
 * U9d.3 — lo NUEVO de Abrir la caja tras migrar al shell: conserva `ajustes` al hidratar el slide,
 * lee `ajustes` (estilo, sonido, nota, tiempo), anuncia cada apertura, nombra cada caja y su panel
 * suma estilos y ajustes comunes.
 */
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AbrirCajaActivity } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { abrirCajaFingerprint, normalizarAbrirCaja } from "../../activities/abrir-caja/abrir-caja-config.js";
import { normalizarAjustes } from "../../activities/_shared/activity-settings.js";
import { abrirCajaDefinition as def } from "./abrir_caja-definition.js";

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

const base = (parche: Partial<AbrirCajaActivity> = {}): AbrirCajaActivity => ({
  tipo: "abrir_caja",
  configuracion: { filas: 2, columnas: 2, colorCaja: "#2563EB", animacionApertura: "fade" },
  cajas: [
    { id: "c1", etiqueta: "Caja 1", contenido: { texto: "Premio", esCorrecta: true } },
    { id: "c2", etiqueta: "Caja 2", contenido: { texto: "Nada", esCorrecta: false } },
  ],
  ...parche,
});
const pasar = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const caja = (nombre: string | RegExp) => screen.getByRole("button", { name: nombre });
const anuncio = () => document.querySelector('[role="status"][aria-live="polite"]')!.textContent;

describe("Abrir la caja — `ajustes` y normalizador (U9d.3)", () => {
  it("el normalizador de hidratación CONSERVA `ajustes` (antes los descartaba)", () => {
    const a = base({ ajustes: { estilo: "pizarra", sonido: false } });
    expect(normalizarAbrirCaja(a).ajustes).toEqual({ estilo: "pizarra", sonido: false });
    expect(normalizarAbrirCaja(base()).ajustes).toBeUndefined();
  });

  it("la huella es del contenido: cambiar un ajuste NO reinicia lo abierto", () => {
    expect(abrirCajaFingerprint(base({ ajustes: { estilo: "arcade" } }))).toBe(abrirCajaFingerprint(base()));
    const { rerender } = render(<Viewer estado={base()} config={{}} />);
    fireEvent.click(caja("Caja 1"));
    pasar(500);
    rerender(<Viewer estado={base({ ajustes: { estilo: "arcade" } })} config={{}} />);
    expect(screen.getByText(/1 de 2 cajas abiertas/)).toBeTruthy();
  });

  it("`ajustes.estilo` llega al shell (`data-estilo`)", () => {
    const { container } = render(<Viewer estado={base({ ajustes: { estilo: "pizarra" } })} config={{}} />);
    expect(container.querySelector('[data-estilo="pizarra"]')).toBeTruthy();
  });

  it("`ajustes.sonido = false` silencia; con sonido suena acierto o error al abrir", () => {
    const { unmount } = render(<Viewer estado={base({ ajustes: { sonido: false } })} config={{}} />);
    fireEvent.click(caja("Caja 1"));
    expect(play).not.toHaveBeenCalled();
    unmount();
    render(<Viewer estado={base()} config={{}} />);
    fireEvent.click(caja("Caja 1"));
    pasar(500);
    fireEvent.click(caja("Caja 2"));
    expect(play.mock.calls).toEqual([["correct"], ["wrong"]]);
  });

  it("no evaluable: abrir no suena ni anuncia correcto/incorrecto", () => {
    const e = base({ cajas: [{ id: "c1", etiqueta: "Caja 1", contenido: { texto: "A" } }, { id: "c2", etiqueta: "Caja 2", contenido: { texto: "B" } }] });
    render(<Viewer estado={e} config={{}} />);
    fireEvent.click(caja("Caja 1"));
    expect(play).not.toHaveBeenCalled();
    expect(anuncio()).toBe("Abriste Caja 1: A.");
  });

  it("`ajustes.mostrarNota = false` oculta la nota del resultado", () => {
    render(<Viewer estado={base({ ajustes: { mostrarNota: false } })} config={{}} />);
    fireEvent.click(caja("Caja 1"));
    pasar(500);
    fireEvent.click(caja("Caja 2"));
    pasar(500);
    expect(within(screen.getByRole("dialog")).queryByText(/5\.0/)).toBeNull();
  });

  it("con límite de tiempo, al agotarse sale UNA respuesta con lo abierto y la rejilla se bloquea", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={base({ ajustes: { tiempoLimiteSeg: 3 } })} config={{ onResponse }} />);
    fireEvent.click(caja("Caja 1"));
    pasar(3000);
    expect(onResponse.mock.calls).toEqual([[{ cajasAbiertas: ["c1"] }]]);
    expect((caja("Caja 2") as HTMLButtonElement).disabled).toBe(true);
    pasar(5000);
    expect(onResponse).toHaveBeenCalledTimes(1);
  });
});

describe("Abrir la caja — accesibilidad (U9d.3, DU8)", () => {
  it("cada apertura se anuncia con su contenido y si era correcta", () => {
    render(<Viewer estado={base()} config={{}} />);
    fireEvent.click(caja("Caja 1"));
    expect(anuncio()).toBe("Abriste Caja 1: Premio. Correcta.");
  });

  it("la caja abierta conserva su nombre accesible con el contenido", () => {
    render(<Viewer estado={base()} config={{}} />);
    fireEvent.click(caja("Caja 2"));
    pasar(500);
    expect(caja("Caja 2: Nada, incorrecta")).toBeTruthy();
  });
});

describe("Propiedades de Abrir la caja (U9d.3)", () => {
  it("conserva el panel de siempre y suma estilos y ajustes comunes", () => {
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
    const guardada = onChange.mock.lastCall![0] as AbrirCajaActivity;
    expect(normalizarAjustes(guardada)).toMatchObject({ estilo: "examen", sonido: false });
    expect(guardada.cajas).toEqual(original.cajas);
    expect(normalizarAjustes(normalizarAbrirCaja(guardada))).toMatchObject({ estilo: "examen" });
  });

  it("la definición declara presets y `apariencia.color`", () => {
    expect(def.presets.map((p) => p.id)).toEqual(["escolar", "examen", "arcade", "minimal", "pizarra"]);
    expect(def.apariencia).toEqual({ color: true, tipografia: false, animacion: false });
  });
});
