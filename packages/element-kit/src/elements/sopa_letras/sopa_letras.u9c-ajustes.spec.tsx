/**
 * U9c.4 — lo NUEVO de Sopa de letras tras migrar al shell: lee `ajustes` (estilo, sonido, nota,
 * tiempo, semilla), se juega con el teclado y con el dedo, anuncia cada hallazgo; su panel suma
 * estilos y ajustes comunes sin ofrecer «Intentos».
 */
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SopaLetrasActivity } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { generarGrid } from "../../activities/sopa-letras/sopa-letras-config.js";
import { normalizarAjustes } from "../../activities/_shared/activity-settings.js";
import { sopaLetrasDefinition as def } from "./sopa_letras-definition.js";

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

const PALABRAS = ["SOL", "LUZ", "MAR"];
const base = (parche: Partial<SopaLetrasActivity> = {}): SopaLetrasActivity => ({
  tipo: "sopa_letras",
  configuracion: { filas: 10, columnas: 10, direcciones: ["horizontal", "vertical", "diagonal"], tema: "general", mostrarLista: true },
  palabras: PALABRAS.map((texto) => ({ texto })) as SopaLetrasActivity["palabras"],
  ...parche,
});
const celdas = () => [...document.querySelectorAll("button[data-fila]")] as HTMLButtonElement[];
const anuncio = () => document.querySelector('[role="status"][aria-live="polite"]')!.textContent;
const letrasRejilla = () => celdas().map((c) => c.textContent).join("");
const pasar = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

describe("generarGrid con semilla (U9c.4)", () => {
  it("la misma semilla da la misma sopa; otra semilla o `sal`, otra", () => {
    const g = (semilla: number | undefined, sal = 0) =>
      JSON.stringify(generarGrid(10, 10, PALABRAS, ["horizontal", "vertical", "diagonal"], semilla, sal));
    expect(g(7)).toBe(g(7));
    expect(g(7)).not.toBe(g(8));
    expect(g(7)).not.toBe(g(7, 1));
  });

  it("sin semilla sigue siendo aleatoria y coloca todas las palabras", () => {
    const { colocadas } = generarGrid(10, 10, PALABRAS, ["horizontal", "vertical", "diagonal"]);
    expect(colocadas.map((c) => c.texto).sort()).toEqual([...PALABRAS].sort());
  });
});

describe("Sopa de letras — `ajustes` (U9c.4)", () => {
  it("`ajustes.semilla` da la misma sopa en dos montajes (para toda la clase)", () => {
    const a = render(<Viewer estado={base({ ajustes: { semilla: 42 } })} config={{}} />);
    const primera = letrasRejilla();
    a.unmount();
    render(<Viewer estado={base({ ajustes: { semilla: 42 } })} config={{}} />);
    expect(letrasRejilla()).toBe(primera);
  });

  it("cambiar un ajuste visual a mitad de partida NO rehace la sopa", () => {
    const { rerender } = render(<Viewer estado={base({ ajustes: { semilla: 1 } })} config={{}} />);
    const antes = letrasRejilla();
    rerender(<Viewer estado={base({ ajustes: { semilla: 1, estilo: "arcade" } })} config={{}} />);
    expect(letrasRejilla()).toBe(antes);
  });

  it("`ajustes.estilo` llega al shell (`data-estilo`)", () => {
    const { container } = render(<Viewer estado={base({ ajustes: { estilo: "pizarra" } })} config={{}} />);
    expect(container.querySelector('[data-estilo="pizarra"]')).toBeTruthy();
  });

  it("el shell NO ofrece «Reintentar» ni «Intento 1 de …»", () => {
    render(<Viewer estado={base({ ajustes: { intentos: 3 } })} config={{}} />);
    expect(screen.queryByText(/Intento \d/)).toBeNull();
  });

  it("tiempo agotado: emite UNA respuesta con lo hallado y bloquea la selección", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={base({ ajustes: { tiempoLimiteSeg: 3 } })} config={{ onResponse }} />);
    pasar(3000);
    expect(onResponse.mock.calls).toEqual([[{ encontradas: [] }]]);
    expect(screen.getAllByText("Se acabó el tiempo.").length).toBeGreaterThan(0);
    pasar(5000);
    expect(onResponse).toHaveBeenCalledTimes(1);
  });

  it("acepta el alias `onComplete` y prefiere `onResponse`", () => {
    // Una sopa mínima con una sola palabra colocada para terminar con el teclado.
    const onResponse = vi.fn();
    const onComplete = vi.fn();
    const e = base({
      configuracion: { filas: 4, columnas: 4, direcciones: ["horizontal"], tema: "general", mostrarLista: true },
      palabras: [{ texto: "SOL" }] as SopaLetrasActivity["palabras"],
      ajustes: { semilla: 3 },
    });
    render(<Viewer estado={e} config={{ onResponse, onComplete }} />);
    const { colocadas } = generarGrid(4, 4, ["SOL"], ["horizontal"], 3);
    const [a, , z] = colocadas[0]!.celdas as [{ fila: number; columna: number }, unknown, { fila: number; columna: number }];
    const en = (c: { fila: number; columna: number }) =>
      celdas().find((b) => b.dataset.fila === String(c.fila) && b.dataset.columna === String(c.columna))!;
    fireEvent.mouseDown(en(a));
    fireEvent.mouseEnter(en(z));
    fireEvent.mouseUp(en(z));
    expect(onResponse).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
  });
});

describe("Sopa de letras — teclado, dedo y anuncios (U9c.4, DU8)", () => {
  const sopaFija = () =>
    base({
      configuracion: { filas: 4, columnas: 4, direcciones: ["horizontal"], tema: "general", mostrarLista: true },
      palabras: [{ texto: "SOL" }, { texto: "MAR" }] as SopaLetrasActivity["palabras"],
      ajustes: { semilla: 5 },
    });
  const posiciones = () => generarGrid(4, 4, ["SOL", "MAR"], ["horizontal"], 5).colocadas;
  const en = (f: number, c: number) =>
    celdas().find((b) => b.dataset.fila === String(f) && b.dataset.columna === String(c))!;

  it("una sola celda entra al orden de tabulación y cada una tiene nombre", () => {
    render(<Viewer estado={sopaFija()} config={{}} />);
    expect(celdas().filter((c) => c.tabIndex === 0)).toHaveLength(1);
    expect(celdas()[0]!.getAttribute("aria-label")).toMatch(/^Fila 1, columna 1, letra [A-Z]$/);
  });

  it("con el teclado: Enter fija el inicio, las flechas estiran, Enter confirma y se anuncia", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={sopaFija()} config={{ onResponse }} />);
    const [primera] = posiciones();
    const { fila, columna } = primera!.celdas[0]!;
    const ultima = primera!.celdas[primera!.celdas.length - 1]!;
    const inicio = en(fila, columna);
    inicio.focus();
    fireEvent.keyDown(inicio, { key: "Enter" });
    expect(anuncio()).toMatch(/^Inicio en fila/);
    let actual = inicio;
    for (let c = columna; c < ultima.columna; c++) {
      fireEvent.keyDown(actual, { key: "ArrowRight" });
      actual = en(fila, c + 1);
    }
    expect(actual.getAttribute("aria-label")).toMatch(/seleccionada$/);
    fireEvent.keyDown(actual, { key: "Enter" });
    expect(anuncio()).toContain(`Encontraste ${primera!.texto}`);
    expect(onResponse).not.toHaveBeenCalled(); // falta la otra palabra
  });

  it("Escape cancela la selección y una línea que no es palabra suena como error", () => {
    render(<Viewer estado={sopaFija()} config={{}} />);
    const a = en(3, 0);
    a.focus();
    fireEvent.keyDown(a, { key: "Enter" });
    fireEvent.keyDown(a, { key: "Escape" });
    expect(anuncio()).toBe("Selección cancelada.");
    expect(a.getAttribute("aria-label")).not.toMatch(/seleccionada/);
    // Arrastre sin palabra: error (un clic suelto NO).
    fireEvent.mouseDown(en(3, 0));
    fireEvent.mouseUp(en(3, 0));
    expect(play).not.toHaveBeenCalled();
    fireEvent.mouseDown(en(3, 0));
    fireEvent.mouseEnter(en(3, 1));
    fireEvent.mouseUp(en(3, 1));
    expect(play).toHaveBeenCalledWith("wrong");
    expect(anuncio()).toBe("Esa selección no es una palabra de la lista.");
  });

  it("`ajustes.sonido = false` silencia los hallazgos", () => {
    render(<Viewer estado={{ ...sopaFija(), ajustes: { semilla: 5, sonido: false } }} config={{}} />);
    fireEvent.mouseDown(en(3, 0));
    fireEvent.mouseEnter(en(3, 1));
    fireEvent.mouseUp(en(3, 1));
    expect(play).not.toHaveBeenCalled();
  });

  it("con el dedo: touchstart en una celda y touchmove sobre otras selecciona la línea", () => {
    render(<Viewer estado={sopaFija()} config={{}} />);
    const [primera] = posiciones();
    const [a, , z] = [primera!.celdas[0]!, 0, primera!.celdas[2]!];
    const destino = en(z.fila, z.columna);
    const original = document.elementFromPoint;
    document.elementFromPoint = () => destino;
    try {
      fireEvent.touchStart(en(a.fila, a.columna), { touches: [{ clientX: 1, clientY: 1 }] });
      fireEvent.touchMove(en(a.fila, a.columna).parentElement!, { touches: [{ clientX: 2, clientY: 2 }] });
      expect(destino.getAttribute("aria-label")).toMatch(/seleccionada$/);
      fireEvent.touchEnd(en(a.fila, a.columna).parentElement!, { changedTouches: [{ clientX: 2, clientY: 2 }] });
    } finally {
      document.elementFromPoint = original;
    }
    expect(anuncio()).toContain("Encontraste");
  });

  it("la lista marca las palabras halladas para el lector de pantalla", () => {
    render(<Viewer estado={sopaFija()} config={{}} />);
    const [primera] = posiciones();
    const a = primera!.celdas[0]!;
    const z = primera!.celdas[2]!;
    fireEvent.mouseDown(en(a.fila, a.columna));
    fireEvent.mouseEnter(en(z.fila, z.columna));
    fireEvent.mouseUp(en(z.fila, z.columna));
    const lista = screen.getByRole("list", { name: "Palabras para encontrar" });
    expect(within(lista).getByText("(encontrada)", { exact: false })).toBeTruthy();
  });
});

describe("Propiedades de Sopa de letras (U9c.4)", () => {
  it("conserva el panel de siempre y suma estilos y ajustes comunes (sin «Intentos» común)", () => {
    const { container } = render(
      <Propiedades estado={base()} config={{}} onChange={() => undefined} onConfigChange={() => undefined} />,
    );
    expect(container.querySelectorAll("[data-preset-id]")).toHaveLength(5);
    expect(container.querySelector("[data-actividad-ajustes]")).toBeTruthy();
    expect(screen.getByLabelText("Límite de tiempo")).toBeTruthy();
    expect(screen.getByLabelText("Mismo orden para todos")).toBeTruthy();
    expect(screen.queryByLabelText("Intentos")).toBeNull();
  });

  it("elegir «Examen» guarda solo `ajustes`", () => {
    const original = base();
    const onChange = vi.fn();
    const { container } = render(
      <Propiedades estado={original} config={{}} onChange={onChange} onConfigChange={() => undefined} />,
    );
    fireEvent.click(container.querySelector('[data-preset-id="examen"]')!);
    const guardada = onChange.mock.lastCall![0] as SopaLetrasActivity;
    expect(normalizarAjustes(guardada)).toMatchObject({ estilo: "examen", sonido: false });
    expect(guardada.palabras).toEqual(original.palabras);
  });

  it("la definición declara presets y `apariencia.color`", () => {
    expect(def.presets.map((p) => p.id)).toEqual(["escolar", "examen", "arcade", "minimal", "pizarra"]);
    expect(def.apariencia).toEqual({ color: true, tipografia: false, animacion: false });
  });
});
