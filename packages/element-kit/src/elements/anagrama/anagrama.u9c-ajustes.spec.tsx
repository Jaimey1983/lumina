/**
 * U9c.2 — lo NUEVO de Anagrama tras migrar al shell: «tocar y colocar» con casillas nombradas,
 * el «Reintentar» final que ya no deja la actividad sin letras, `ajustes` (tiempo, semilla,
 * sonido, nota, estilo) y su panel. Aquí el arrastre es el real (sin simular).
 */
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AnagramaActivity } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { normalizarAjustes } from "../../activities/_shared/activity-settings.js";
import { anagramaDefinition as def } from "./anagrama-definition.js";

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

const base = (parche: Partial<AnagramaActivity> = {}): AnagramaActivity => ({
  tipo: "anagrama",
  configuracion: { mostrarPista: true, intentos: 3 },
  palabras: [{ texto: "SOL" }],
  ...parche,
});
const modoTocar = () => fireEvent.click(screen.getByRole("button", { name: /^Modo:/ }));
const anuncio = () => screen.getByTestId("anuncio-tocar-colocar").textContent;
const letrasSueltas = () => {
  const zona = screen.getByText("Letras disponibles:").parentElement!;
  return within(zona).queryAllByRole("button").map((b) => b.textContent!);
};
const hueco = (n: number) => screen.getByRole("button", { name: new RegExp(`^Casilla ${n},`) });
/** Toca una letra suelta y luego la casilla indicada. */
function poner(letra: string, casilla: number) {
  const zona = screen.getByText("Letras disponibles:").parentElement!;
  fireEvent.click(within(zona).getByRole("button", { name: letra }));
  fireEvent.click(hueco(casilla));
}
const armarSol = () => {
  modoTocar();
  poner("S", 1);
  poner("O", 2);
  poner("L", 3);
};

describe("Anagrama — tocar y colocar (U9c.2, DU8)", () => {
  it("elegir una letra y tocar una casilla la coloca, con anuncios; las casillas están nombradas", () => {
    render(<Viewer estado={base()} config={{}} />);
    modoTocar();
    expect(screen.getByRole("button", { name: "Casilla 1, vacía" })).toBeTruthy();
    const zona = screen.getByText("Letras disponibles:").parentElement!;
    fireEvent.click(within(zona).getByRole("button", { name: "S" }));
    expect(anuncio()).toBe("Elegiste la letra S. Ahora elige la zona donde colocarlo.");
    fireEvent.click(hueco(1));
    expect(anuncio()).toBe("Colocaste la letra S en la casilla 1.");
    expect(screen.getByRole("button", { name: "Casilla 1, con S" })).toBeTruthy();
    expect(letrasSueltas()).not.toContain("S");
  });

  it("una casilla ocupada no recibe otra letra", () => {
    render(<Viewer estado={base()} config={{}} />);
    modoTocar();
    poner("S", 1);
    const zona = screen.getByText("Letras disponibles:").parentElement!;
    fireEvent.click(within(zona).getAllByRole("button")[0]!);
    fireEvent.click(hueco(1));
    expect(screen.getByRole("button", { name: "Casilla 1, con S" })).toBeTruthy();
    expect(letrasSueltas()).toHaveLength(2);
  });

  it("al llenar la palabra se verifica sola; suena y el encabezado del shell cuenta la palabra", () => {
    render(<Viewer estado={base()} config={{}} />);
    armarSol();
    expect(screen.getByText("✓ ¡Correcto!")).toBeTruthy();
    expect(play).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("1");
  });
});

describe("Anagrama — el «Reintentar» final ya no deja la actividad vacía (U9c.2)", () => {
  it("tras el resultado, «Reintentar» devuelve letras nuevas y huecos vacíos y se puede volver a jugar", () => {
    render(<Viewer estado={base()} config={{}} />);
    armarSol();
    fireEvent.click(screen.getByRole("button", { name: "Finalizar" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Reintentar" }));
    expect(screen.getByText("Palabra 1 de 1")).toBeTruthy();
    // El modo «tocar y colocar» sigue activo tras reintentar.
    expect([...letrasSueltas()].sort()).toEqual(["L", "O", "S"]);
    expect(screen.getByRole("button", { name: "Casilla 1, vacía" })).toBeTruthy();
    poner("S", 1);
    expect(letrasSueltas()).toHaveLength(2);
  });
});

describe("Anagrama — ajustes comunes (U9c.2)", () => {
  it("el `intentos` por palabra del editor NO se lee como intentos de la actividad: el encabezado no dice «Intento 1 de 3»", () => {
    render(<Viewer estado={base()} config={{}} />);
    expect(screen.queryByText(/Intento 1 de/)).toBeNull();
    expect(screen.getByText("Intentos restantes: 3")).toBeTruthy();
  });

  it("si el docente fija `ajustes.intentos = 1`, el resultado final no ofrece «Reintentar»", () => {
    render(<Viewer estado={base({ ajustes: { intentos: 1 } })} config={{}} />);
    armarSol();
    fireEvent.click(screen.getByRole("button", { name: "Finalizar" }));
    expect(within(screen.getByRole("dialog")).queryByRole("button", { name: "Reintentar" })).toBeNull();
  });

  it("con semilla las letras salen en el MISMO orden aunque cambie el azar; sin semilla, no", () => {
    const larga = base({ palabras: [{ texto: "ESCUELA" }] });
    const orden = (a: AnagramaActivity, v: number) => {
      vi.spyOn(Math, "random").mockReturnValue(v);
      const r = render(<Viewer estado={a} config={{}} />);
      const o = letrasSueltas();
      r.unmount();
      vi.restoreAllMocks();
      return o;
    };
    expect(orden(larga, 0.1)).not.toEqual(orden(larga, 0.9));
    const fija = { ...larga, ajustes: { semilla: 9 } };
    expect(orden(fija, 0.1)).toEqual(orden(fija, 0.9));
  });

  it("`ajustes.sonido = false` silencia la verificación", () => {
    render(<Viewer estado={base({ ajustes: { sonido: false } })} config={{}} />);
    armarSol();
    expect(play).not.toHaveBeenCalled();
  });

  it("al agotarse `ajustes.tiempoLimiteSeg`: avisa y bloquea las letras", () => {
    vi.useFakeTimers();
    try {
      render(<Viewer estado={base({ ajustes: { tiempoLimiteSeg: 3 } })} config={{}} />);
      act(() => void vi.advanceTimersByTime(3000));
      expect(screen.getByText("Se acabó el tiempo.")).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it("`ajustes.estilo` llega al shell (`data-estilo`)", () => {
    const { container } = render(<Viewer estado={base({ ajustes: { estilo: "pizarra" } })} config={{}} />);
    expect(container.querySelector('[data-estilo="pizarra"]')).toBeTruthy();
  });

  it("`ajustes.mostrarNota = false` oculta la nota del resultado", () => {
    render(<Viewer estado={base({ ajustes: { mostrarNota: false } })} config={{}} />);
    armarSol();
    fireEvent.click(screen.getByRole("button", { name: "Finalizar" }));
    expect(within(screen.getByRole("dialog")).queryByText(/5\.0/)).toBeNull();
  });
});

describe("Propiedades de Anagrama (U9c.2)", () => {
  it("conserva el panel de siempre y suma estilos y ajustes comunes (sin «Intentos» común)", () => {
    const { container } = render(
      <Propiedades estado={base()} config={{}} onChange={() => undefined} onConfigChange={() => undefined} />,
    );
    expect(container.querySelectorAll("[data-preset-id]")).toHaveLength(5);
    expect(container.querySelector("[data-actividad-ajustes]")).toBeTruthy();
    expect(screen.getByLabelText("Límite de tiempo")).toBeTruthy();
    expect(screen.getByLabelText("Mismo orden para todos")).toBeTruthy();
    expect(screen.queryByLabelText("Intentos")).toBeNull();
    expect(screen.queryByLabelText("Barajar")).toBeNull();
  });

  it("elegir «Examen» guarda solo `ajustes` y deja las palabras intactas", () => {
    const original = base();
    const onChange = vi.fn();
    const { container } = render(
      <Propiedades estado={original} config={{}} onChange={onChange} onConfigChange={() => undefined} />,
    );
    fireEvent.click(container.querySelector('[data-preset-id="examen"]')!);
    const guardada = onChange.mock.lastCall![0] as AnagramaActivity;
    expect(normalizarAjustes(guardada)).toMatchObject({ estilo: "examen", sonido: false });
    expect({ ...guardada, ajustes: undefined }).toEqual({ ...original, ajustes: undefined });
  });

  it("la definición declara presets y `apariencia.color`", () => {
    expect(def.presets.map((p) => p.id)).toEqual(["escolar", "examen", "arcade", "minimal", "pizarra"]);
    expect(def.apariencia).toEqual({ color: true, tipografia: false, animacion: false });
  });
});
