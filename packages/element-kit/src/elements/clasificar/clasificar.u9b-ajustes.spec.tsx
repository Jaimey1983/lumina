/**
 * U9b.2 — lo NUEVO de Clasificar tras migrar al shell: lee `ajustes` (tiempo, semilla, sonido,
 * estilo, intentos), se puede jugar con «tocar y colocar», el estado de cada pieza se dice con
 * palabras y su panel suma estilos y ajustes comunes. El arrastre es el real.
 */
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ClasificarActivity } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { normalizarAjustes } from "../../activities/_shared/activity-settings.js";
import { clasificarDefinition as def } from "./clasificar-definition.js";

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

const base = (parche: Partial<ClasificarActivity> = {}): ClasificarActivity => ({
  tipo: "clasificar",
  configuracion: { columnas: 2, colorCategorias: ["#2563EB", "#16A34A"], permitirReintento: true },
  categorias: [
    { id: "c1", nombre: "Animales" },
    { id: "c2", nombre: "Plantas" },
  ],
  items: [
    { id: "a", texto: "Perro", categoriaId: "c1" },
    { id: "b", texto: "Gato", categoriaId: "c1" },
    { id: "c", texto: "Rosa", categoriaId: "c2" },
    { id: "d", texto: "Pino", categoriaId: "c2" },
  ],
  ...parche,
});

const modoTocar = () => fireEvent.click(screen.getByRole("button", { name: /^Modo:/ }));
const pieza = (t: string) => screen.getByRole("button", { name: new RegExp(`^${t}`) });
const zona = (n: string) => screen.getByRole("button", { name: n });
function colocar(texto: string, nombreZona: string) {
  fireEvent.click(pieza(texto));
  fireEvent.click(zona(nombreZona));
}
const BIEN: [string, string][] = [["Perro", "Animales"], ["Gato", "Animales"], ["Rosa", "Plantas"], ["Pino", "Plantas"]];
function jugarBien() {
  modoTocar();
  for (const [t, z] of BIEN) colocar(t, z);
  fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
}
/** Orden en que aparecen las piezas sin clasificar. */
const origen = () => {
  const col = screen.getByText("Elementos para clasificar").parentElement!;
  return [...col.querySelectorAll("div")].filter((d) => d.children.length === 0 && d.textContent).map((d) => d.textContent!.trim());
};

describe("Clasificar — ajustes comunes (U9b.2)", () => {
  it("con semilla el orden es el MISMO aunque cambie el azar; sin semilla, no", () => {
    const orden = (a: ClasificarActivity, v: number) => {
      vi.spyOn(Math, "random").mockReturnValue(v);
      const r = render(<Viewer estado={a} config={{}} />);
      const o = origen();
      r.unmount();
      vi.restoreAllMocks();
      return o;
    };
    const grande = base({ items: Array.from({ length: 8 }, (_, i) => ({ id: `i${i}`, texto: `Pieza${i}`, categoriaId: "c1" })) });
    expect(orden(grande, 0.1)).not.toEqual(orden(grande, 0.9));
    const fija = { ...grande, ajustes: { semilla: 99 } };
    expect(orden(fija, 0.1)).toEqual(orden(fija, 0.9));
  });

  it("`ajustes.sonido`: suena acierto al verificar y se silencia con `false`", () => {
    const r = render(<Viewer estado={base()} config={{}} />);
    jugarBien();
    expect(play).toHaveBeenCalledTimes(1);
    r.unmount();
    play.mockClear();
    render(<Viewer estado={base({ ajustes: { sonido: false } })} config={{}} />);
    jugarBien();
    expect(play).not.toHaveBeenCalled();
  });

  it("al agotarse `ajustes.tiempoLimiteSeg`: avisa, bloquea y no deja verificar", () => {
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

  it("el resultado es un diálogo; «Reintentar» respeta `permitirReintento` y `ajustes.intentos`", () => {
    const terminar = (a: ClasificarActivity) => {
      const r = render(<Viewer estado={a} config={{}} />);
      jugarBien();
      const dialogo = screen.getByRole("dialog");
      const hay = within(dialogo).queryByRole("button", { name: "Reintentar" }) !== null;
      r.unmount();
      return hay;
    };
    expect(terminar(base())).toBe(true);
    expect(terminar(base({ configuracion: { columnas: 2, colorCategorias: [], permitirReintento: false } }))).toBe(false);
    expect(terminar(base({ ajustes: { intentos: 1 } }))).toBe(false);
  });

  it("el estado de cada pieza se dice con palabras tras verificar (no solo con el color)", () => {
    render(<Viewer estado={base()} config={{}} />);
    modoTocar();
    for (const [t, z] of [["Perro", "Plantas"], ["Gato", "Animales"], ["Rosa", "Plantas"], ["Pino", "Plantas"]] as const) colocar(t, z);
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    // El diálogo es modal: el fondo está inerte pero sigue en el documento.
    const nombres = [...document.querySelectorAll("[aria-label]")].map((e) => e.getAttribute("aria-label"));
    expect(nombres).toEqual(expect.arrayContaining(["Perro, incorrecto", "Gato, correcto", "Rosa, correcto", "Pino, correcto"]));
  });
});

describe("Clasificar — tocar y colocar (U9b.2, DU8)", () => {
  it("elegir una pieza y tocar una categoría la coloca, con anuncios; se puede devolver al origen", () => {
    render(<Viewer estado={base()} config={{}} />);
    modoTocar();
    fireEvent.click(pieza("Perro"));
    expect(screen.getByTestId("anuncio-tocar-colocar").textContent).toBe(
      "Elegiste Perro. Ahora elige la zona donde colocarlo.",
    );
    fireEvent.click(zona("Animales"));
    expect(screen.getByTestId("anuncio-tocar-colocar").textContent).toBe("Colocaste Perro en Animales.");
    expect(origen()).not.toContain("Perro");
    fireEvent.click(pieza("Perro"));
    fireEvent.click(zona("Elementos para clasificar"));
    expect(origen()).toContain("Perro");
  });

  it("con Enter y Escape: elige, cancela y coloca con el teclado", () => {
    render(<Viewer estado={base()} config={{}} />);
    modoTocar();
    fireEvent.keyDown(pieza("Gato"), { key: "Enter" });
    expect(pieza("Gato").getAttribute("aria-pressed")).toBe("true");
    fireEvent.keyDown(pieza("Gato"), { key: "Escape" });
    expect(pieza("Gato").getAttribute("aria-pressed")).toBe("false");
    fireEvent.keyDown(pieza("Gato"), { key: " " });
    fireEvent.keyDown(zona("Animales"), { key: "Enter" });
    expect(origen()).not.toContain("Gato");
  });

  it("el encabezado del shell cuenta las piezas colocadas", () => {
    render(<Viewer estado={base()} config={{}} />);
    modoTocar();
    colocar("Perro", "Animales");
    colocar("Gato", "Animales");
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("2");
  });
});

describe("Propiedades de Clasificar (U9b.2)", () => {
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

  it("elegir «Examen» guarda solo `ajustes` y deja categorías y piezas intactas", () => {
    const original = base();
    const onChange = vi.fn();
    const { container } = render(
      <Propiedades estado={original} config={{}} onChange={onChange} onConfigChange={() => undefined} />,
    );
    fireEvent.click(container.querySelector('[data-preset-id="examen"]')!);
    const guardada = onChange.mock.lastCall![0] as ClasificarActivity;
    expect(normalizarAjustes(guardada)).toMatchObject({ estilo: "examen", sonido: false, intentos: 1 });
    expect({ ...guardada, ajustes: undefined }).toEqual({ ...original, ajustes: undefined });
  });

  it("la definición declara presets y `apariencia.color`", () => {
    expect(def.presets.map((p) => p.id)).toEqual(["escolar", "examen", "arcade", "minimal", "pizarra"]);
    expect(def.apariencia).toEqual({ color: true, tipografia: false, animacion: false });
  });
});
