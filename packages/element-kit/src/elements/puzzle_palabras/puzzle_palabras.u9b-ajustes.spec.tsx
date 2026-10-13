/**
 * U9b.1 — lo NUEVO de Puzzle de palabras tras migrar al shell: lee `ajustes` (tiempo, semilla,
 * intentos, nota, sonido, estilo), se puede jugar con «tocar y colocar» y su panel suma estilos
 * y ajustes comunes. Aquí el arrastre es el real (sin simular `ActivityDndRoot`).
 */
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PuzzlePalabrasActivity } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { normalizarAjustes } from "../../activities/_shared/activity-settings.js";
import { puzzlePalabrasDefinition as def } from "./puzzle_palabras-definition.js";

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

const base = (parche: Partial<PuzzlePalabrasActivity> = {}): PuzzlePalabrasActivity => ({
  tipo: "puzzle_palabras",
  configuracion: { mostrarPista: true, permitirReintento: true },
  oraciones: [{ texto: "El sol sale por el oriente cada mañana" }],
  ...parche,
});

const origen = () => {
  const zona = screen.getByText("Palabras disponibles:").parentElement!;
  return within(zona).queryAllByRole("button").map((b) => b.textContent!.trim());
};
const pieza = (t: string) => screen.getByRole("button", { name: t });
const modoTocar = () => fireEvent.click(screen.getByRole("button", { name: /^Modo:/ }));

describe("Puzzle de palabras — ajustes comunes (U9b.1)", () => {
  it("sin semilla el orden depende del azar; con semilla es el MISMO aunque cambie el azar", () => {
    const azar = (v: number) => vi.spyOn(Math, "random").mockReturnValue(v);
    const orden = (a: PuzzlePalabrasActivity, v: number) => {
      azar(v);
      const r = render(<Viewer estado={a} config={{}} />);
      const o = origen();
      r.unmount();
      vi.restoreAllMocks();
      return o;
    };
    const libre = base();
    expect(orden(libre, 0.1)).not.toEqual(orden(libre, 0.9));
    const fija = base({ ajustes: { semilla: 42 } });
    expect(orden(fija, 0.1)).toEqual(orden(fija, 0.9));
    expect(orden(base({ ajustes: { semilla: 43 } }), 0.1)).not.toEqual(orden(fija, 0.1));
  });

  it("con semilla, cada oración y cada oración de la actividad tiene su propio orden reproducible", () => {
    const a = base({
      ajustes: { semilla: 7 },
      oraciones: [{ texto: "uno dos tres cuatro cinco" }, { texto: "uno dos tres cuatro cinco" }],
    });
    const { unmount } = render(<Viewer estado={a} config={{}} />);
    const primera = origen();
    unmount();
    render(<Viewer estado={a} config={{}} />);
    expect(origen()).toEqual(primera);
  });

  it("`ajustes.sonido`: suena acierto/error al verificar y se silencia con `false`", () => {
    const jugar = (a: PuzzlePalabrasActivity) => {
      const r = render(<Viewer estado={a} config={{}} />);
      modoTocar();
      for (const t of ["Hola", "mundo"]) {
        fireEvent.click(pieza(t));
        fireEvent.click(screen.getByRole("button", { name: "Tu oración" }));
      }
      fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
      r.unmount();
    };
    const simple = (aj?: PuzzlePalabrasActivity["ajustes"]) =>
      base({ oraciones: [{ texto: "Hola mundo" }], ajustes: aj });
    jugar(simple());
    expect(play).toHaveBeenCalledTimes(1);
    play.mockClear();
    jugar(simple({ sonido: false }));
    expect(play).not.toHaveBeenCalled();
  });

  it("al agotarse `ajustes.tiempoLimiteSeg`: avisa y bloquea las acciones", () => {
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
    const { container } = render(<Viewer estado={base({ ajustes: { estilo: "pizarra" } })} config={{}} />);
    expect(container.querySelector('[data-estilo="pizarra"]')).toBeTruthy();
  });

  it("el resultado final es un diálogo; «Reintentar» solo si la actividad lo permite (nuevo: antes siempre)", () => {
    const terminar = (permitirReintento: boolean) => {
      const a = base({
        configuracion: { mostrarPista: true, permitirReintento },
        oraciones: [{ texto: "Hola mundo" }],
      });
      const r = render(<Viewer estado={a} config={{}} />);
      modoTocar();
      for (const t of ["Hola", "mundo"]) {
        fireEvent.click(pieza(t));
        fireEvent.click(screen.getByRole("button", { name: "Tu oración" }));
      }
      fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
      fireEvent.click(screen.getByRole("button", { name: "Finalizar" }));
      const dialogo = screen.getByRole("dialog");
      const reintento = within(dialogo).queryByRole("button", { name: "Reintentar" });
      r.unmount();
      return reintento !== null;
    };
    expect(terminar(true)).toBe(true);
    expect(terminar(false)).toBe(false);
  });

  it("`ajustes.mostrarNota = false` oculta la nota del resultado", () => {
    const a = base({ oraciones: [{ texto: "Hola mundo" }], ajustes: { mostrarNota: false } });
    render(<Viewer estado={a} config={{}} />);
    modoTocar();
    for (const t of ["Hola", "mundo"]) {
      fireEvent.click(pieza(t));
      fireEvent.click(screen.getByRole("button", { name: "Tu oración" }));
    }
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    fireEvent.click(screen.getByRole("button", { name: "Finalizar" }));
    expect(within(screen.getByRole("dialog")).queryByText(/5\.0/)).toBeNull();
  });
});

describe("Puzzle de palabras — tocar y colocar (U9b.1, DU8)", () => {
  it("elegir una palabra y tocar la zona la coloca; vuelve tocando «Palabras disponibles»; con anuncios", () => {
    render(<Viewer estado={base({ oraciones: [{ texto: "Hola mundo" }] })} config={{}} />);
    modoTocar();
    fireEvent.click(pieza("Hola"));
    expect(pieza("Hola").getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("anuncio-tocar-colocar").textContent).toBe(
      "Elegiste Hola. Ahora elige la zona donde colocarlo.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Tu oración" }));
    expect(screen.getByTestId("anuncio-tocar-colocar").textContent).toBe(
      "Colocaste Hola en la zona de la oración.",
    );
    expect(origen()).toEqual(["mundo"]);
    fireEvent.click(pieza("Hola"));
    fireEvent.click(screen.getByRole("button", { name: "Palabras disponibles" }));
    expect(origen().sort()).toEqual(["Hola", "mundo"]);
  });

  it("Enter/Espacio sobre la pieza y la zona hacen lo mismo que el clic; Escape cancela", () => {
    render(<Viewer estado={base({ oraciones: [{ texto: "Hola mundo" }] })} config={{}} />);
    modoTocar();
    fireEvent.keyDown(pieza("mundo"), { key: "Enter" });
    expect(pieza("mundo").getAttribute("aria-pressed")).toBe("true");
    fireEvent.keyDown(pieza("mundo"), { key: "Escape" });
    expect(pieza("mundo").getAttribute("aria-pressed")).toBe("false");
    fireEvent.keyDown(pieza("mundo"), { key: " " });
    fireEvent.keyDown(screen.getByRole("button", { name: "Tu oración" }), { key: "Enter" });
    expect(origen()).toEqual(["Hola"]);
  });

  it("después de verificar no se puede colocar nada más", () => {
    render(<Viewer estado={base({ oraciones: [{ texto: "Hola mundo" }] })} config={{}} />);
    modoTocar();
    for (const t of ["Hola", "mundo"]) {
      fireEvent.click(pieza(t));
      fireEvent.click(screen.getByRole("button", { name: "Tu oración" }));
    }
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    fireEvent.click(pieza("Hola"));
    expect(pieza("Hola").getAttribute("aria-pressed")).not.toBe("true");
  });

  it("volver al modo arrastrar apaga el modo tocar", () => {
    render(<Viewer estado={base()} config={{}} />);
    modoTocar();
    expect(screen.getByRole("button", { name: "Modo: tocar y colocar" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Modo: tocar y colocar" }));
    expect(screen.getByRole("button", { name: "Modo: arrastrar" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Tu oración" })).toBeNull();
  });
});

describe("Propiedades de Puzzle de palabras (U9b.1)", () => {
  it("conserva el panel de siempre (oraciones) y suma estilos y ajustes comunes", () => {
    const { container } = render(
      <Propiedades estado={base()} config={{}} onChange={() => undefined} onConfigChange={() => undefined} />,
    );
    expect(screen.getByText("Mostrar pista")).toBeTruthy(); // del panel de siempre
    expect(container.querySelectorAll("[data-preset-id]")).toHaveLength(5);
    expect(container.querySelector("[data-actividad-ajustes]")).toBeTruthy();
    expect(screen.getByLabelText("Límite de tiempo")).toBeTruthy();
    expect(screen.getByLabelText("Mismo orden para todos")).toBeTruthy();
    expect(screen.queryByLabelText("Barajar")).toBeNull(); // barajar es la mecánica
  });

  it("elegir «Examen» guarda solo `ajustes` y deja las oraciones intactas", () => {
    const original = base();
    const onChange = vi.fn();
    const { container } = render(
      <Propiedades estado={original} config={{}} onChange={onChange} onConfigChange={() => undefined} />,
    );
    fireEvent.click(container.querySelector('[data-preset-id="examen"]')!);
    const guardada = onChange.mock.lastCall![0] as PuzzlePalabrasActivity;
    expect(normalizarAjustes(guardada)).toMatchObject({ estilo: "examen", sonido: false, intentos: 1 });
    expect({ ...guardada, ajustes: undefined }).toEqual({ ...original, ajustes: undefined });
  });

  it("la definición declara presets y `apariencia.color`", () => {
    expect(def.presets.map((p) => p.id)).toEqual(["escolar", "examen", "arcade", "minimal", "pizarra"]);
    expect(def.apariencia).toEqual({ color: true, tipografia: false, animacion: false });
  });
});
