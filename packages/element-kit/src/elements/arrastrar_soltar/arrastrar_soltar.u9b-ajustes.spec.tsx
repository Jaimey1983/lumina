/**
 * U9b.6 — lo NUEVO de Arrastrar y soltar tras migrar al shell: ya no es el arrastre nativo de
 * HTML5 sino dnd-kit (teclado, táctil, anuncios), hay «tocar y colocar», aviso de zona llena,
 * `ajustes` (tiempo, sonido, estilo) y su panel suma estilos y ajustes comunes.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isActivityDraftResponse, unwrapActivityDraftResponse } from "@lumina/scoring";
import type { DragDrop } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { normalizarAjustes } from "../../activities/_shared/activity-settings.js";
import { arrastrarSoltarDefinition as def } from "./arrastrar_soltar-definition.js";

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

const base = (parche: Partial<DragDrop> = {}): DragDrop => ({
  tipo: "arrastrar_soltar",
  instruccion: "Clasifica.",
  items: [
    { id: "i1", texto: "Perro" },
    { id: "i2", texto: "Gato" },
    { id: "i3", texto: "Pez" },
  ],
  zonas: [
    { id: "z1", etiqueta: "Mamíferos", itemsCorrectos: ["i1", "i2"], capacidadMaxima: 1 },
    { id: "z2", etiqueta: "Peces", itemsCorrectos: ["i3"] },
  ],
  ...parche,
});
const modoTocar = () => fireEvent.click(screen.getByRole("button", { name: /^Modo:/ }));
const ficha = (t: string) => screen.getByRole("button", { name: t });
const zona = (n: string) => screen.getByRole("button", { name: n });
const anuncio = () => screen.getByTestId("anuncio-tocar-colocar").textContent;
const colocar = (t: string, z: string) => {
  fireEvent.click(ficha(t));
  fireEvent.click(zona(z));
};

describe("Arrastrar y soltar — tocar y colocar (U9b.6, DU8)", () => {
  it("elegir un elemento y tocar una zona lo coloca, con anuncios; se devuelve tocando «Elementos disponibles»", () => {
    render(<Viewer estado={base()} config={{}} />);
    modoTocar();
    fireEvent.click(ficha("Perro"));
    expect(anuncio()).toBe("Elegiste Perro. Ahora elige la zona donde colocarlo.");
    fireEvent.click(zona("Mamíferos"));
    expect(anuncio()).toBe("Colocaste Perro en Mamíferos.");
    expect(screen.getAllByText("Suelta aquí")).toHaveLength(1);
    fireEvent.click(ficha("Perro"));
    fireEvent.click(zona("Elementos disponibles"));
    expect(screen.getAllByText("Suelta aquí")).toHaveLength(2);
  });

  it("una zona llena (`capacidadMaxima`) avisa por qué no cabe el elemento y no emite", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={base()} config={{ onResponse }} />);
    modoTocar();
    colocar("Perro", "Mamíferos");
    const antes = onResponse.mock.calls.length;
    colocar("Gato", "Mamíferos");
    // Aparece a la vista y en la región `aria-live` (por eso dos veces).
    expect(screen.getAllByText("Mamíferos está llena: no caben más elementos.")).toHaveLength(2);
    expect(anuncio()).toBe("Mamíferos está llena: no caben más elementos.");
    expect(onResponse.mock.calls).toHaveLength(antes);
  });

  it("emite el mismo BORRADOR que antes al colocar con el toque", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={base()} config={{ onResponse }} />);
    modoTocar();
    colocar("Pez", "Peces");
    const calls = onResponse.mock.calls.map((c) => c[0]);
    expect(isActivityDraftResponse(calls[0])).toBe(true);
    expect(unwrapActivityDraftResponse(calls[0])).toEqual([
      { itemId: "i1", zoneId: null },
      { itemId: "i2", zoneId: null },
      { itemId: "i3", zoneId: "z2" },
    ]);
  });

  it("Enter y Escape: elige, cancela y coloca con el teclado", () => {
    render(<Viewer estado={base()} config={{}} />);
    modoTocar();
    fireEvent.keyDown(ficha("Gato"), { key: "Enter" });
    expect(ficha("Gato").getAttribute("aria-pressed")).toBe("true");
    fireEvent.keyDown(ficha("Gato"), { key: "Escape" });
    expect(ficha("Gato").getAttribute("aria-pressed")).toBe("false");
    fireEvent.keyDown(ficha("Gato"), { key: " " });
    fireEvent.keyDown(zona("Peces"), { key: "Enter" });
    expect(screen.getAllByText("Suelta aquí")).toHaveLength(1);
  });

  it("el encabezado del shell cuenta los elementos colocados y tras enviar nada se mueve", () => {
    render(<Viewer estado={base()} config={{}} />);
    modoTocar();
    colocar("Perro", "Mamíferos");
    colocar("Pez", "Peces");
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("2");
    colocar("Gato", "Peces");
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    fireEvent.click(ficha("Pez"));
    expect(ficha("Pez").getAttribute("aria-pressed")).not.toBe("true");
  });
});

describe("Arrastrar y soltar — ajustes comunes (U9b.6)", () => {
  const completo = (a: DragDrop) => {
    modoTocar();
    colocar("Perro", "Mamíferos");
    colocar("Gato", "Peces");
    colocar("Pez", "Peces");
    expect(a).toBeTruthy();
  };

  it("`ajustes.sonido = false` silencia el envío", () => {
    const a = base({ ajustes: { sonido: false } });
    render(<Viewer estado={a} config={{}} />);
    completo(a);
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(play).not.toHaveBeenCalled();
  });

  it("al agotarse `ajustes.tiempoLimiteSeg`: avisa, bloquea y no deja enviar", () => {
    vi.useFakeTimers();
    try {
      const onResponse = vi.fn();
      render(<Viewer estado={base({ ajustes: { tiempoLimiteSeg: 3 } })} config={{ onResponse }} />);
      act(() => void vi.advanceTimersByTime(3000));
      expect(screen.getByText("Se acabó el tiempo.")).toBeTruthy();
      expect((screen.getByRole("button", { name: "Enviar" }) as HTMLButtonElement).disabled).toBe(true);
      expect(onResponse).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("`ajustes.estilo` llega al shell (`data-estilo`)", () => {
    const { container } = render(<Viewer estado={base({ ajustes: { estilo: "arcade" } })} config={{}} />);
    expect(container.querySelector('[data-estilo="arcade"]')).toBeTruthy();
  });
});

describe("Propiedades de Arrastrar y soltar (U9b.6)", () => {
  it("conserva el editor de siempre y suma estilos y ajustes comunes (sin «mismo orden»: no se baraja)", () => {
    const { container } = render(
      <Propiedades estado={base()} config={{}} onChange={() => undefined} onConfigChange={() => undefined} />,
    );
    expect(screen.getByText("Zonas destino")).toBeTruthy(); // del editor
    expect(container.querySelectorAll("[data-preset-id]")).toHaveLength(5);
    expect(container.querySelector("[data-actividad-ajustes]")).toBeTruthy();
    expect(screen.getByLabelText("Límite de tiempo")).toBeTruthy();
    expect(screen.queryByLabelText("Mismo orden para todos")).toBeNull();
  });

  it("elegir «Minimal» guarda solo `ajustes` y deja elementos y zonas intactos", () => {
    const original = base();
    const onChange = vi.fn();
    const { container } = render(
      <Propiedades estado={original} config={{}} onChange={onChange} onConfigChange={() => undefined} />,
    );
    fireEvent.click(container.querySelector('[data-preset-id="minimal"]')!);
    const guardada = onChange.mock.lastCall![0] as DragDrop;
    expect(normalizarAjustes(guardada)).toMatchObject({ estilo: "minimal", sonido: false });
    expect({ ...guardada, ajustes: undefined }).toEqual({ ...original, ajustes: undefined });
  });

  it("la definición declara presets y `apariencia.color`", () => {
    expect(def.presets.map((p) => p.id)).toEqual(["escolar", "examen", "arcade", "minimal", "pizarra"]);
    expect(def.apariencia).toEqual({ color: true, tipografia: false, animacion: false });
  });
});
