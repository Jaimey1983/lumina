/**
 * U9b.5 — lo NUEVO de Puzzle de imagen tras migrar al shell: lee `ajustes` (tiempo, semilla,
 * intentos, nota, sonido, estilo), se puede jugar con «tocar y colocar» (con piezas y casillas
 * nombradas sin delatar la solución) y su panel suma estilos y ajustes comunes.
 */
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PuzzleImagenActivity } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { normalizarAjustes } from "../../activities/_shared/activity-settings.js";
import { puzzleImagenDefinition as def } from "./puzzle_imagen-definition.js";

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
  play.mockClear();
  original = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = () =>
    ({ left: 0, top: 0, right: 300, bottom: 300, width: 300, height: 300, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
});
afterEach(() => {
  Element.prototype.getBoundingClientRect = original;
  cleanup();
  vi.restoreAllMocks();
});

const base = (parche: Partial<PuzzleImagenActivity> = {}): PuzzleImagenActivity => ({
  ...(def.crearPorDefecto() as PuzzleImagenActivity),
  imagen: "data:image/png;base64,AAAA",
  ...parche,
});
const modoTocar = () => fireEvent.click(screen.getByRole("button", { name: /^Modo:/ }));
const piezasSueltas = () => {
  const zona = screen.getByRole("button", { name: "Piezas sueltas" });
  return within(zona).queryAllByLabelText(/^Pieza \d+$/).map((e) => e.getAttribute("aria-label")!);
};
const anuncio = () => screen.getByTestId("anuncio-tocar-colocar").textContent;
const casilla = (n: number) => screen.getByRole("button", { name: new RegExp(`^Casilla ${n},`) });

describe("Puzzle de imagen — ajustes comunes (U9b.5)", () => {
  it("con semilla el reparto es el MISMO aunque cambie el azar; sin semilla, no", () => {
    const reparto = (a: PuzzleImagenActivity, v: number) => {
      vi.spyOn(Math, "random").mockReturnValue(v);
      const r = render(<Viewer estado={a} config={{}} />);
      // El reparto se ve en qué trozo de la imagen es cada pieza suelta, en orden.
      const o = [...screen.getByText("Piezas").parentElement!.querySelectorAll<HTMLElement>("div")]
        .filter((d) => d.style.backgroundImage.includes("url("))
        .map((d) => d.style.backgroundPosition);
      r.unmount();
      vi.restoreAllMocks();
      return o;
    };
    expect(reparto(base(), 0.1)).not.toEqual(reparto(base(), 0.9));
    const fija = base({ ajustes: { semilla: 11 } });
    expect(reparto(fija, 0.1)).toEqual(reparto(fija, 0.9));
  });

  it("`ajustes.sonido`: suena al verificar y se silencia con `false`", () => {
    const jugar = (a: PuzzleImagenActivity) => {
      const r = render(<Viewer estado={a} config={{}} />);
      modoTocar();
      for (let n = 1; n <= 9; n++) {
        fireEvent.click(screen.getAllByLabelText(/^Pieza \d+$/)[0]!);
        fireEvent.click(casilla(n));
      }
      fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
      r.unmount();
    };
    jugar(base());
    expect(play).toHaveBeenCalledTimes(1);
    play.mockClear();
    jugar(base({ ajustes: { sonido: false } }));
    expect(play).not.toHaveBeenCalled();
  });

  it("al agotarse `ajustes.tiempoLimiteSeg`: avisa y bloquea «Verificar»", () => {
    vi.useFakeTimers();
    try {
      render(<Viewer estado={base({ ajustes: { tiempoLimiteSeg: 3 } })} config={{}} />);
      act(() => void vi.advanceTimersByTime(3000));
      expect(screen.getAllByText("Se acabó el tiempo.").length).toBeGreaterThan(0);
      expect((screen.getByRole("button", { name: "Verificar" }) as HTMLButtonElement).disabled).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("`ajustes.estilo` llega al shell (`data-estilo`)", () => {
    const { container } = render(<Viewer estado={base({ ajustes: { estilo: "arcade" } })} config={{}} />);
    expect(container.querySelector('[data-estilo="arcade"]')).toBeTruthy();
  });

  it("el resultado es un diálogo; «Reintentar» respeta `ajustes.intentos`", () => {
    const terminar = (a: PuzzleImagenActivity) => {
      const r = render(<Viewer estado={a} config={{}} />);
      modoTocar();
      for (let n = 1; n <= 9; n++) {
        fireEvent.click(screen.getAllByLabelText(/^Pieza \d+$/)[0]!);
        fireEvent.click(casilla(n));
      }
      fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
      const hay = within(screen.getByRole("dialog")).queryByRole("button", { name: "Reintentar" }) !== null;
      r.unmount();
      return hay;
    };
    expect(terminar(base())).toBe(true);
    expect(terminar(base({ ajustes: { intentos: 1 } }))).toBe(false);
  });
});

describe("Puzzle de imagen — tocar y colocar (U9b.5, DU8)", () => {
  it("elegir una pieza y tocar una casilla la coloca, con anuncios; la casilla queda nombrada", () => {
    render(<Viewer estado={base()} config={{}} />);
    modoTocar();
    const primera = screen.getAllByLabelText(/^Pieza \d+$/)[0]!;
    const nombre = primera.getAttribute("aria-label")!;
    fireEvent.click(primera);
    expect(anuncio()).toBe(`Elegiste ${nombre}. Ahora elige la zona donde colocarlo.`);
    fireEvent.click(casilla(1));
    expect(anuncio()).toBe(`Colocaste ${nombre} en la casilla 1.`);
    expect(piezasSueltas()).not.toContain(nombre);
    expect(screen.getByRole("button", { name: `Casilla 1, con ${nombre}` })).toBeTruthy();
  });

  it("los nombres de las piezas no delatan su casilla: siguen el reparto, no la solución", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    render(<Viewer estado={base({ ajustes: { semilla: 3 } })} config={{}} />);
    modoTocar();
    const nombres = piezasSueltas();
    expect([...nombres].sort()).toEqual(Array.from({ length: 9 }, (_, i) => `Pieza ${i + 1}`).sort());
    // En el orden de reparto aparecen «Pieza 1…9»: la numeración es la del reparto.
    expect(nombres).toEqual(Array.from({ length: 9 }, (_, i) => `Pieza ${i + 1}`));
  });

  it("tocar una casilla ocupada sin nada elegido selecciona su pieza y se puede mover a otra casilla", () => {
    render(<Viewer estado={base()} config={{}} />);
    modoTocar();
    const primera = screen.getAllByLabelText(/^Pieza \d+$/)[0]!;
    const nombre = primera.getAttribute("aria-label")!;
    fireEvent.click(primera);
    fireEvent.click(casilla(1));
    fireEvent.click(casilla(1)); // ocupada, sin nada elegido: elige su pieza
    expect(anuncio()).toBe(`Elegiste ${nombre}. Ahora elige la zona donde colocarlo.`);
    fireEvent.click(casilla(2));
    expect(screen.getByRole("button", { name: `Casilla 2, con ${nombre}` })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Casilla 1, vacía" })).toBeTruthy();
  });

  it("una pieza puesta se devuelve tocando «Piezas sueltas»", () => {
    render(<Viewer estado={base()} config={{}} />);
    modoTocar();
    const primera = screen.getAllByLabelText(/^Pieza \d+$/)[0]!;
    const nombre = primera.getAttribute("aria-label")!;
    fireEvent.click(primera);
    fireEvent.click(casilla(1));
    fireEvent.click(casilla(1));
    fireEvent.click(screen.getByRole("button", { name: "Piezas sueltas" }));
    expect(piezasSueltas()).toContain(nombre);
  });

  it("el encabezado del shell cuenta las piezas colocadas", () => {
    render(<Viewer estado={base()} config={{}} />);
    modoTocar();
    fireEvent.click(screen.getAllByLabelText(/^Pieza \d+$/)[0]!);
    fireEvent.click(casilla(1));
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("1");
  });
});

describe("Propiedades de Puzzle de imagen (U9b.5)", () => {
  it("conserva el panel de siempre y suma estilos y ajustes comunes", () => {
    const { container } = render(
      <Propiedades estado={base()} config={{}} onChange={() => undefined} onConfigChange={() => undefined} />,
    );
    expect(container.querySelectorAll("[data-preset-id]")).toHaveLength(5);
    expect(container.querySelector("[data-actividad-ajustes]")).toBeTruthy();
    expect(screen.getByLabelText("Límite de tiempo")).toBeTruthy();
    expect(screen.getByLabelText("Mismo orden para todos")).toBeTruthy();
    expect(screen.queryByLabelText("Barajar")).toBeNull();
  });

  it("elegir «Examen» guarda solo `ajustes` y deja la imagen y la configuración intactas", () => {
    const original = base();
    const onChange = vi.fn();
    const { container } = render(
      <Propiedades estado={original} config={{}} onChange={onChange} onConfigChange={() => undefined} />,
    );
    fireEvent.click(container.querySelector('[data-preset-id="examen"]')!);
    const guardada = onChange.mock.lastCall![0] as PuzzleImagenActivity;
    expect(normalizarAjustes(guardada)).toMatchObject({ estilo: "examen", sonido: false, intentos: 1 });
    expect({ ...guardada, ajustes: undefined }).toEqual({ ...original, ajustes: undefined });
  });

  it("la definición declara presets y `apariencia.color`", () => {
    expect(def.presets.map((p) => p.id)).toEqual(["escolar", "examen", "arcade", "minimal", "pizarra"]);
    expect(def.apariencia).toEqual({ color: true, tipografia: false, animacion: false });
  });
});
