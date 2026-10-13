/**
 * U9b.3 — lo NUEVO de Emparejar tras migrar al shell: cada lado es un botón con teclado,
 * `aria-pressed` y anuncios; lee `ajustes` (tiempo, semilla, sonido, estilo) y su panel suma
 * estilos y ajustes comunes.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MatchPairs } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { normalizarAjustes } from "../../activities/_shared/activity-settings.js";
import { emparejarDefinition as def } from "./emparejar-definition.js";

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

const base = (parche: Partial<MatchPairs> = {}): MatchPairs => ({
  tipo: "emparejar",
  instruccion: "",
  pares: [
    { id: "p1", izquierda: { texto: "Perro" }, derecha: { texto: "Guau" } },
    { id: "p2", izquierda: { texto: "Gato" }, derecha: { texto: "Miau" } },
  ],
  ...parche,
});
const boton = (n: RegExp | string) => screen.getByRole("button", { name: n });
const anuncio = () => screen.getByTestId("anuncio-tocar-colocar").textContent;
const todoBien = () => {
  fireEvent.click(boton("Perro"));
  fireEvent.click(boton("Guau"));
  fireEvent.click(boton("Gato"));
  fireEvent.click(boton("Miau"));
};

describe("Emparejar — accesibilidad (U9b.3, DU8)", () => {
  it("cada lado es un botón; el elegido lo dice con `aria-pressed` y se anuncia", () => {
    render(<Viewer estado={base()} config={{}} />);
    expect(boton("Perro").getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(boton("Perro"));
    expect(boton("Perro").getAttribute("aria-pressed")).toBe("true");
    expect(anuncio()).toBe("Elegiste Perro. Ahora elige su pareja en la otra columna.");
    fireEvent.click(boton("Perro"));
    expect(anuncio()).toBe("Cancelaste la elección de Perro.");
  });

  it("emparejar y quitar se anuncian, y la pareja queda nombrada en cada lado", () => {
    render(<Viewer estado={base()} config={{}} />);
    fireEvent.click(boton("Perro"));
    fireEvent.click(boton("Guau"));
    expect(anuncio()).toBe("Emparejaste Perro con Guau.");
    expect(boton(/^Perro, emparejado \(pareja 1\)/)).toBeTruthy();
    expect(boton("Guau, emparejado (pareja 1)")).toBeTruthy();
    fireEvent.click(boton(/^Perro, emparejado/));
    expect(anuncio()).toBe("Quitaste la pareja de Perro.");
  });

  it("el derecho avisa con `aria-disabled` mientras no hay un izquierdo elegido", () => {
    render(<Viewer estado={base()} config={{}} />);
    expect(boton("Guau").getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(boton("Perro"));
    expect(boton("Guau").getAttribute("aria-disabled")).toBeNull();
  });

  it("una imagen sin texto se nombra «imagen» en los anuncios", () => {
    const a = base({ pares: [{ id: "p1", izquierda: { imagen: "x.png" }, derecha: { texto: "Guau" } }, { id: "p2", izquierda: { texto: "Gato" }, derecha: { texto: "Miau" } }] });
    render(<Viewer estado={a} config={{}} />);
    fireEvent.click(document.querySelectorAll("button")[0]!);
    expect(anuncio()).toBe("Elegiste imagen. Ahora elige su pareja en la otra columna.");
  });

  it("el encabezado del shell cuenta las parejas hechas", () => {
    render(<Viewer estado={base()} config={{}} />);
    fireEvent.click(boton("Perro"));
    fireEvent.click(boton("Guau"));
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("1");
  });
});

describe("Emparejar — ajustes comunes (U9b.3)", () => {
  it("con semilla la columna derecha tiene el MISMO orden aunque cambie el azar; sin semilla, no", () => {
    const grande = base({
      pares: Array.from({ length: 6 }, (_, i) => ({ id: `p${i}`, izquierda: { texto: `I${i}` }, derecha: { texto: `D${i}` } })),
    });
    const orden = (a: MatchPairs, v: number) => {
      vi.spyOn(Math, "random").mockReturnValue(v);
      const r = render(<Viewer estado={a} config={{}} />);
      const o = screen.getAllByRole("button").map((b) => b.textContent).filter((t) => t?.startsWith("D"));
      r.unmount();
      vi.restoreAllMocks();
      return o;
    };
    expect(orden(grande, 0.1)).not.toEqual(orden(grande, 0.9));
    const fija = { ...grande, ajustes: { semilla: 5 } };
    expect(orden(fija, 0.1)).toEqual(orden(fija, 0.9));
  });

  it("`ajustes.sonido = false` silencia el envío", () => {
    render(<Viewer estado={base({ ajustes: { sonido: false } })} config={{}} />);
    todoBien();
    fireEvent.click(boton("Enviar"));
    expect(play).not.toHaveBeenCalled();
  });

  it("al agotarse `ajustes.tiempoLimiteSeg`: avisa, bloquea los lados y no deja enviar", () => {
    vi.useFakeTimers();
    try {
      const onResponse = vi.fn();
      render(<Viewer estado={base({ ajustes: { tiempoLimiteSeg: 3 } })} config={{ onResponse }} />);
      act(() => void vi.advanceTimersByTime(3000));
      expect(screen.getByText("Se acabó el tiempo.")).toBeTruthy();
      expect((boton("Perro") as HTMLButtonElement).disabled).toBe(true);
      expect((boton("Enviar") as HTMLButtonElement).disabled).toBe(true);
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

describe("Propiedades de Emparejar (U9b.3)", () => {
  it("conserva el editor de siempre y suma estilos y ajustes comunes", () => {
    const { container } = render(
      <Propiedades estado={base()} config={{}} onChange={() => undefined} onConfigChange={() => undefined} />,
    );
    expect(container.querySelectorAll("[data-preset-id]")).toHaveLength(5);
    expect(container.querySelector("[data-actividad-ajustes]")).toBeTruthy();
    expect(screen.getByLabelText("Límite de tiempo")).toBeTruthy();
    expect(screen.getByLabelText("Mismo orden para todos")).toBeTruthy();
    expect(screen.queryByLabelText("Barajar")).toBeNull();
    for (const t of ["Calificación", "Vidas", "Pistas"]) expect(screen.queryByText(t), t).toBeNull();
  });

  it("elegir «Minimal» guarda solo `ajustes` y deja los pares intactos", () => {
    const original = base();
    const onChange = vi.fn();
    const { container } = render(
      <Propiedades estado={original} config={{}} onChange={onChange} onConfigChange={() => undefined} />,
    );
    fireEvent.click(container.querySelector('[data-preset-id="minimal"]')!);
    const guardada = onChange.mock.lastCall![0] as MatchPairs;
    expect(normalizarAjustes(guardada)).toMatchObject({ estilo: "minimal", sonido: false });
    expect({ ...guardada, ajustes: undefined }).toEqual({ ...original, ajustes: undefined });
  });

  it("la definición declara presets y `apariencia.color`", () => {
    expect(def.presets.map((p) => p.id)).toEqual(["escolar", "examen", "arcade", "minimal", "pizarra"]);
    expect(def.apariencia).toEqual({ color: true, tipografia: false, animacion: false });
  });
});
