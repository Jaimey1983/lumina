/**
 * U9b.4 — lo NUEVO de Ordenar pasos tras migrar al shell: botones Subir/Bajar como alternativa
 * al arrastre (DU8) con anuncios, `ajustes` (tiempo, semilla, sonido, estilo) y su panel.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OrderSteps } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { normalizarAjustes } from "../../activities/_shared/activity-settings.js";
import { ordenarPasosDefinition as def } from "./ordenar_pasos-definition.js";

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

const base = (parche: Partial<OrderSteps> = {}): OrderSteps => ({
  tipo: "ordenar_pasos",
  instruccion: "",
  pasos: [
    { id: "s1", contenido: "Uno", ordenCorrecto: 1 },
    { id: "s2", contenido: "Dos", ordenCorrecto: 2 },
    { id: "s3", contenido: "Tres", ordenCorrecto: 3 },
  ],
  ...parche,
});
const fijo = (): OrderSteps => base({ ajustes: { semilla: 1 } });
/** Orden visible de los pasos (por el nombre accesible de su asa). */
const orden = () => screen.getAllByRole("button", { name: /^Mover «/ }).map((b) => b.getAttribute("aria-label")!.slice(7, -1));
const subir = (t: string) => fireEvent.click(screen.getByRole("button", { name: `Subir «${t}»` }));
const bajar = (t: string) => fireEvent.click(screen.getByRole("button", { name: `Bajar «${t}»` }));
const anuncio = () => document.querySelector('[role="status"][aria-live="polite"]')!.textContent;

describe("Ordenar pasos — alternativa al arrastre (U9b.4, DU8)", () => {
  it("cada paso tiene un asa nombrada y botones Subir/Bajar; los extremos se deshabilitan", () => {
    render(<Viewer estado={fijo()} config={{}} />);
    const o = orden();
    expect((screen.getByRole("button", { name: `Subir «${o[0]}»` }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: `Bajar «${o[2]}»` }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: `Bajar «${o[0]}»` }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("subir y bajar reordenan y se anuncia la nueva posición", () => {
    render(<Viewer estado={fijo()} config={{}} />);
    const [a, b, c] = orden();
    bajar(a!);
    expect(orden()).toEqual([b, a, c]);
    expect(anuncio()).toBe(`«${a}» ahora es el paso 2 de 3.`);
    subir(c!);
    expect(orden()).toEqual([b, c, a]);
    expect(anuncio()).toBe(`«${c}» ahora es el paso 2 de 3.`);
  });

  it("lo enviado respeta el orden hecho con los botones", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={fijo()} config={{ onResponse }} />);
    const o = orden();
    const ids: Record<string, string> = { Uno: "s1", Dos: "s2", Tres: "s3" };
    bajar(o[0]!);
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(onResponse.mock.calls[0][0]).toEqual([o[1], o[0], o[2]].map((t) => ids[t!]));
  });

  it("después de enviar no se puede reordenar (asas y botones bloqueados)", () => {
    render(<Viewer estado={fijo()} config={{}} />);
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    const o = orden();
    expect((screen.getByRole("button", { name: `Bajar «${o[0]}»` }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: `Mover «${o[0]}»` }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("Ordenar pasos — ajustes comunes (U9b.4)", () => {
  it("con semilla el orden inicial es el MISMO aunque cambie el azar; sin semilla, no", () => {
    const grande = base({
      pasos: Array.from({ length: 7 }, (_, i) => ({ id: `s${i}`, contenido: `Paso${i}`, ordenCorrecto: i + 1 })),
    });
    const ord = (a: OrderSteps, v: number) => {
      vi.spyOn(Math, "random").mockReturnValue(v);
      const r = render(<Viewer estado={a} config={{}} />);
      const o = orden();
      r.unmount();
      vi.restoreAllMocks();
      return o;
    };
    expect(ord(grande, 0.1)).not.toEqual(ord(grande, 0.9));
    const fija = { ...grande, ajustes: { semilla: 5 } };
    expect(ord(fija, 0.1)).toEqual(ord(fija, 0.9));
  });

  it("`ajustes.sonido = false` silencia el envío", () => {
    render(<Viewer estado={base({ ajustes: { sonido: false } })} config={{}} />);
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(play).not.toHaveBeenCalled();
  });

  it("al agotarse `ajustes.tiempoLimiteSeg`: avisa, bloquea los pasos y no deja enviar", () => {
    vi.useFakeTimers();
    try {
      const onResponse = vi.fn();
      render(<Viewer estado={base({ ajustes: { tiempoLimiteSeg: 3 } })} config={{ onResponse }} />);
      act(() => void vi.advanceTimersByTime(3000));
      expect(screen.getByText("Se acabó el tiempo.")).toBeTruthy();
      expect((screen.getByRole("button", { name: "Enviar" }) as HTMLButtonElement).disabled).toBe(true);
      expect((screen.getAllByRole("button", { name: /^Mover «/ })[0] as HTMLButtonElement).disabled).toBe(true);
      expect(onResponse).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("`ajustes.estilo` llega al shell (`data-estilo`)", () => {
    const { container } = render(<Viewer estado={base({ ajustes: { estilo: "pizarra" } })} config={{}} />);
    expect(container.querySelector('[data-estilo="pizarra"]')).toBeTruthy();
  });
});

describe("Propiedades de Ordenar pasos (U9b.4)", () => {
  it("conserva el editor de siempre y suma estilos y ajustes comunes", () => {
    const { container } = render(
      <Propiedades estado={base()} config={{}} onChange={() => undefined} onConfigChange={() => undefined} />,
    );
    expect(screen.getByText("Mostrar números de orden al estudiante")).toBeTruthy(); // del editor
    expect(container.querySelectorAll("[data-preset-id]")).toHaveLength(5);
    expect(container.querySelector("[data-actividad-ajustes]")).toBeTruthy();
    expect(screen.getByLabelText("Límite de tiempo")).toBeTruthy();
    expect(screen.getByLabelText("Mismo orden para todos")).toBeTruthy();
    expect(screen.queryByLabelText("Barajar")).toBeNull();
  });

  it("elegir «Examen» guarda solo `ajustes` y deja los pasos intactos", () => {
    const original = base();
    const onChange = vi.fn();
    const { container } = render(
      <Propiedades estado={original} config={{}} onChange={onChange} onConfigChange={() => undefined} />,
    );
    fireEvent.click(container.querySelector('[data-preset-id="examen"]')!);
    const guardada = onChange.mock.lastCall![0] as OrderSteps;
    expect(normalizarAjustes(guardada)).toMatchObject({ estilo: "examen", sonido: false });
    expect({ ...guardada, ajustes: undefined }).toEqual({ ...original, ajustes: undefined });
  });

  it("la definición declara presets y `apariencia.color`", () => {
    expect(def.presets.map((p) => p.id)).toEqual(["escolar", "examen", "arcade", "minimal", "pizarra"]);
    expect(def.apariencia).toEqual({ color: true, tipografia: false, animacion: false });
  });
});
