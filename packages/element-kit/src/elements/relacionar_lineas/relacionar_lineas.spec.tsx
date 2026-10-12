/**
 * U14 — Relacionar con líneas (actividad nueva). Viewer: trazar por toque/teclado y por arrastre,
 * quitar, comprobar, resultado, reintento, tiempo; definición: registro, catálogo, por defecto;
 * editor y propiedades; y el cruce viewer → scoring (la respuesta que emite el viewer, evaluada por
 * `@lumina/scoring`, da la nota esperada).
 */
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateActivityResponse } from "@lumina/scoring";
import type { RelacionarLineasActivity } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { elementRegistry } from "../../index.js";
import { createDefaultRelacionarLineas } from "../../activities/relacionar-lineas/relacionar-lineas-defaults.js";
import { normalizarRelacionarLineas } from "../../activities/relacionar-lineas/relacionar-lineas-config.js";
import { validarActividad } from "../../activities/_shared/produccion/validacion.js";
import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { relacionarLineasDefinition as def } from "./relacionar_lineas-definition.js";

type PropsViewer = { estado: unknown; config: Record<string, unknown> };
const Viewer = def.Viewer as unknown as (p: PropsViewer) => React.ReactElement;
const Editor = def.Editor as unknown as (p: { estado: unknown; config: object; onChange(e: unknown): void }) => React.ReactElement;
const Propiedades = def.Propiedades as unknown as (p: {
  estado: unknown;
  config: object;
  onChange(e: unknown): void;
  onConfigChange(c: object): void;
}) => React.ReactElement;

beforeEach(() => play.mockClear());
afterEach(cleanup);

const base = (parche: Partial<RelacionarLineasActivity> = {}): RelacionarLineasActivity => ({
  tipo: "relacionar_lineas",
  instruccion: "Une cada animal con su sonido.",
  izquierda: [
    { id: "a", texto: "Perro" },
    { id: "b", texto: "Gato" },
  ],
  derecha: [
    { id: "x", texto: "Guau" },
    { id: "y", texto: "Miau" },
    { id: "z", texto: "Muu" },
  ],
  relaciones: [
    { izquierdaId: "a", derechaId: "x" },
    { izquierdaId: "b", derechaId: "y" },
  ],
  ...parche,
});

const montar = (a: RelacionarLineasActivity = base()) => {
  const onResponse = vi.fn();
  const r = render(<Viewer estado={a} config={{ onResponse }} />);
  return { onResponse, ...r };
};
const izq = (n: string) => document.querySelector(`[data-izquierda-id="${n}"]`) as HTMLButtonElement;
const der = (n: string) => document.querySelector(`[data-derecha-id="${n}"]`) as HTMLButtonElement;
const unir = (i: string, d: string) => {
  fireEvent.click(izq(i));
  fireEvent.click(der(d));
};
const comprobar = () => fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
const anuncio = () => screen.getByTestId("anuncio-tocar-colocar").textContent;
const lineas = () => [...document.querySelectorAll("[data-linea]")].map((g) => g.getAttribute("data-linea"));

describe("Viewer — trazar por toque o teclado", () => {
  it("muestra la instrucción y las dos columnas con todos sus elementos", () => {
    montar();
    expect(screen.getByText("Une cada animal con su sonido.")).toBeTruthy();
    expect(within(screen.getByRole("group", { name: "Columna izquierda" })).getAllByRole("button")).toHaveLength(2);
    expect(within(screen.getByRole("group", { name: "Columna derecha" })).getAllByRole("button")).toHaveLength(3);
  });
  it("elegir una izquierda y luego una derecha traza la línea y lo anuncia", () => {
    montar();
    fireEvent.click(izq("a"));
    expect(izq("a").getAttribute("aria-pressed")).toBe("true");
    expect(anuncio()).toContain("Elegiste Perro");
    fireEvent.click(der("x"));
    expect(lineas()).toEqual(["a"]);
    expect(anuncio()).toBe("Uniste Perro con Guau.");
    expect(izq("a").getAttribute("aria-label")).toContain("unido con Guau");
  });
  it("tocar una derecha sin haber elegido una izquierda no hace nada", () => {
    montar();
    fireEvent.click(der("x"));
    expect(lineas()).toEqual([]);
  });
  it("volver a tocar la misma izquierda cancela la elección; Escape también", () => {
    montar();
    fireEvent.click(izq("a"));
    fireEvent.click(izq("a"));
    expect(izq("a").getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(izq("a"));
    fireEvent.keyDown(izq("a"), { key: "Escape" });
    expect(izq("a").getAttribute("aria-pressed")).toBe("false");
    expect(anuncio()).toContain("Cancelaste");
  });
  it("tocar una izquierda ya conectada quita su línea", () => {
    montar();
    unir("a", "x");
    fireEvent.click(izq("a"));
    expect(lineas()).toEqual([]);
    expect(anuncio()).toBe("Quitaste la línea de Perro.");
  });
  it("cada izquierda tiene una sola línea: unir de nuevo la cambia de destino", () => {
    montar();
    unir("a", "x");
    fireEvent.click(izq("a")); // la quita
    unir("a", "z");
    expect(lineas()).toEqual(["a"]);
    expect(izq("a").getAttribute("aria-label")).toContain("unido con Muu");
  });
  it("varias izquierdas pueden ir a la misma derecha", () => {
    montar();
    unir("a", "x");
    unir("b", "x");
    expect(lineas()).toEqual(["a", "b"]);
  });
  it("«Comprobar» está deshabilitado hasta que haya una línea", () => {
    montar();
    expect((screen.getByRole("button", { name: "Comprobar" }) as HTMLButtonElement).disabled).toBe(true);
    unir("a", "x");
    expect((screen.getByRole("button", { name: "Comprobar" }) as HTMLButtonElement).disabled).toBe(false);
  });
});

describe("Viewer — trazar arrastrando", () => {
  const ev = (tipo: string, x: number, y = 0) => new MouseEvent(tipo, { clientX: x, clientY: y, bubbles: true });
  it("arrastrar desde la izquierda y soltar sobre una derecha traza la línea", () => {
    montar();
    const original = document.elementFromPoint;
    document.elementFromPoint = vi.fn(() => der("y"));
    fireEvent.pointerDown(izq("b"), { clientX: 0, clientY: 0, button: 0 });
    act(() => void window.dispatchEvent(ev("pointermove", 80)));
    expect(document.querySelector("[data-arrastre]")).not.toBeNull();
    act(() => void window.dispatchEvent(ev("pointerup", 80)));
    expect(document.querySelector("[data-arrastre]")).toBeNull();
    expect(lineas()).toEqual(["b"]);
    document.elementFromPoint = original;
  });
  it("soltar fuera de una derecha no traza nada, y un movimiento mínimo es un toque", () => {
    montar();
    const original = document.elementFromPoint;
    document.elementFromPoint = vi.fn(() => document.body);
    fireEvent.pointerDown(izq("a"), { clientX: 0, clientY: 0, button: 0 });
    act(() => void window.dispatchEvent(ev("pointermove", 80)));
    act(() => void window.dispatchEvent(ev("pointerup", 80)));
    expect(lineas()).toEqual([]);
    fireEvent.pointerDown(izq("a"), { clientX: 0, clientY: 0, button: 0 });
    act(() => void window.dispatchEvent(ev("pointerup", 2)));
    fireEvent.click(izq("a"));
    expect(izq("a").getAttribute("aria-pressed")).toBe("true");
    document.elementFromPoint = original;
  });
});

describe("Viewer — comprobar y resultado", () => {
  it("emite la respuesta de emparejar [{ leftId, rightId }] en el orden trazado, suena y abre el resultado", () => {
    const { onResponse } = montar();
    unir("b", "y");
    unir("a", "x");
    comprobar();
    expect(onResponse).toHaveBeenCalledTimes(1);
    expect(onResponse).toHaveBeenCalledWith([
      { leftId: "b", rightId: "y" },
      { leftId: "a", rightId: "x" },
    ]);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByLabelText("Nota 5.0 de 5")).toBeTruthy();
    expect(play).toHaveBeenCalledWith("correct");
  });
  it("las líneas se marcan correcta/incorrecta y el color no es lo único: la errónea va a trazos", () => {
    montar();
    unir("a", "x");
    unir("b", "z");
    comprobar();
    expect(document.querySelector('[data-linea="a"]')!.getAttribute("data-estado")).toBe("correcta");
    expect(document.querySelector('[data-linea="b"]')!.getAttribute("data-estado")).toBe("incorrecta");
    expect(izq("b").getAttribute("aria-label")).toContain("incorrecto");
    expect(izq("a").getAttribute("aria-label")).toContain("correcto");
    expect(play).toHaveBeenCalledWith("wrong");
    expect(screen.getByLabelText("Nota 2.5 de 5")).toBeTruthy();
  });
  it("tras comprobar ya no se puede cambiar nada", () => {
    montar();
    unir("a", "x");
    comprobar();
    expect(izq("a").disabled).toBe(true);
    expect(der("x").disabled).toBe(true);
  });
  it("con intentos > 1 permite reintentar y vuelve a empezar sin líneas", () => {
    const a = base({ ajustes: { intentos: 2 } });
    const { onResponse } = montar(a);
    unir("a", "x");
    comprobar();
    fireEvent.click(screen.getByRole("button", { name: /Reintentar/ }));
    expect(lineas()).toEqual([]);
    expect(izq("a").disabled).toBe(false);
    unir("a", "x");
    unir("b", "y");
    comprobar();
    expect(onResponse).toHaveBeenCalledTimes(2);
  });
  it("la respuesta usa los ids reales aunque las columnas estén mezcladas", () => {
    const a = base({ ajustes: { semilla: 7 } });
    const { onResponse } = montar(a);
    unir("a", "x");
    comprobar();
    expect(onResponse).toHaveBeenCalledWith([{ leftId: "a", rightId: "x" }]);
  });
  it("con la misma semilla las dos columnas salen en el mismo orden para todos", () => {
    const orden = () => [...document.querySelectorAll("[data-derecha-id]")].map((n) => n.getAttribute("data-derecha-id"));
    const a = base({ ajustes: { semilla: 42 } });
    montar(a);
    const uno = orden();
    cleanup();
    montar(a);
    expect(orden()).toEqual(uno);
  });
  it("no emite nada si no se comprueba", () => {
    const { onResponse } = montar();
    unir("a", "x");
    expect(onResponse).not.toHaveBeenCalled();
  });
});

describe("Viewer — tiempo y contenido", () => {
  it("se acaba el tiempo: se corta la actividad y se avisa", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] });
    try {
      const a = base({ ajustes: { tiempoLimiteSeg: 5 } });
      montar(a);
      unir("a", "x");
      act(() => void vi.advanceTimersByTime(6000));
      expect(izq("a").disabled).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
  it("editar el contenido reinicia las líneas", () => {
    const a = base();
    const { rerender } = montar(a);
    unir("a", "x");
    rerender(<Viewer estado={base({ instruccion: "Otra" })} config={{}} />);
    expect(lineas()).toEqual([]);
  });
  it("muestra imágenes con su texto alternativo", () => {
    montar(base({ izquierda: [{ id: "a", texto: "Perro", imagen: "perro.png" }, { id: "b", texto: "Gato" }] }));
    expect(screen.getByAltText("Perro").getAttribute("src")).toBe("perro.png");
  });
  it("cambiar solo un ajuste (estilo) no reinicia lo trazado", () => {
    const a = base();
    const { rerender } = montar(a);
    unir("a", "x");
    rerender(<Viewer estado={{ ...a, ajustes: { estilo: "arcade" } }} config={{}} />);
    expect(lineas()).toEqual(["a"]);
  });
});

describe("Cruce viewer → scoring", () => {
  const trazar = (pares: [string, string][]) => {
    const a = base();
    const { onResponse } = montar(a);
    for (const [i, d] of pares) unir(i, d);
    comprobar();
    const respuesta = onResponse.mock.calls[0]![0];
    cleanup();
    return evaluateActivityResponse("relacionar_lineas", a, respuesta);
  };
  it("perfecto → 5.0; uno de dos → 2.5; distractor elegido → 2.5", () => {
    expect(trazar([["a", "x"], ["b", "y"]]).score).toBe(5);
    expect(trazar([["a", "x"], ["b", "z"]]).score).toBe(2.5);
    expect(trazar([["a", "z"], ["b", "y"]])).toMatchObject({ score: 2.5, correct: false });
  });
  it("solo una línea (la correcta) deja la otra izquierda sin responder → 2.5", () => {
    expect(trazar([["a", "x"]]).score).toBe(2.5);
  });
});

describe("Definición", () => {
  it("se registra una sola vez como partial, con catálogo y eventos", () => {
    expect(elementRegistry.obtener("relacionar_lineas")).toBe(def);
    expect(elementRegistry.listar().filter((d) => (d as { tipo: string }).tipo === "relacionar_lineas")).toHaveLength(1);
    expect(def.catalogo).toMatchObject({ nombre: "Relacionar con líneas", familia: "actividad" });
    expect(def.eventos).toEqual(["respuesta_correcta", "respuesta_incorrecta"]);
    expect(def.puntuacion(base(), [{ leftId: "a", rightId: "x" }, { leftId: "b", rightId: "y" }])).toBe(5);
  });
  it("lo que se crea por defecto es jugable y no tiene errores de validación", () => {
    const a = def.crearPorDefecto();
    expect(a.tipo).toBe("relacionar_lineas");
    expect(validarActividad(a).filter((p) => p.nivel === "error")).toEqual([]);
    expect(a.derecha.length).toBeGreaterThan(a.izquierda.length); // trae un distractor
    expect(createDefaultRelacionarLineas()).toEqual(a);
  });
  it("las capacidades de ajustes son las que el viewer lee", () => {
    expect(CAPACIDADES_AJUSTES.relacionar_lineas).toEqual({
      mostrarNota: true, intentos: true, tiempo: true, semilla: true, sonido: true, estilo: true,
    });
  });
  it("normalizar descarta relaciones rotas y repetidas, y completa lo que falta", () => {
    const n = normalizarRelacionarLineas({
      tipo: "relacionar_lineas",
      izquierda: [{ id: "a", texto: "A" }, { id: "b" }],
      derecha: [{ id: "x", texto: "X" }],
      relaciones: [
        { izquierdaId: "a", derechaId: "x" },
        { izquierdaId: "a", derechaId: "x" },
        { izquierdaId: "zzz", derechaId: "x" },
        { izquierdaId: "b", derechaId: "nada" },
      ],
    } as never);
    expect(n.relaciones).toEqual([{ izquierdaId: "a", derechaId: "x" }]);
    expect(n.instruccion).toBe("");
    expect(normalizarRelacionarLineas({} as never)).toMatchObject({ izquierda: [], derecha: [], relaciones: [] });
  });
});

describe("Editor y propiedades", () => {
  it("el lienzo del editor muestra las columnas y el número de relaciones", () => {
    render(<Editor estado={base()} config={{}} onChange={() => {}} />);
    expect(screen.getByText("2 relaciones")).toBeTruthy();
    expect(screen.getByText("Guau")).toBeTruthy();
  });
  const montarProp = (a = base()) => {
    const onChange = vi.fn();
    render(<Propiedades estado={a} config={{}} onChange={onChange} onConfigChange={() => {}} />);
    return { onChange, ultimo: () => onChange.mock.calls.at(-1)![0] as RelacionarLineasActivity };
  };
  it("cambiar la pareja de una izquierda actualiza las relaciones; «sin relación» la quita", () => {
    const { ultimo } = montarProp();
    fireEvent.change(screen.getByLabelText("Pareja de izquierda 1"), { target: { value: "z" } });
    expect(ultimo().relaciones).toContainEqual({ izquierdaId: "a", derechaId: "z" });
    expect(ultimo().relaciones.filter((r) => r.izquierdaId === "a")).toHaveLength(1);
    fireEvent.change(screen.getByLabelText("Pareja de izquierda 1"), { target: { value: "" } });
    expect(ultimo().relaciones.some((r) => r.izquierdaId === "a")).toBe(false);
  });
  it("quitar un elemento borra también sus relaciones", () => {
    const { ultimo } = montarProp();
    fireEvent.click(screen.getByLabelText("Quitar derecha 1"));
    expect(ultimo().derecha.map((d) => d.id)).toEqual(["y", "z"]);
    expect(ultimo().relaciones).toEqual([{ izquierdaId: "b", derechaId: "y" }]);
    cleanup();
    const otra = montarProp();
    fireEvent.click(screen.getByLabelText("Quitar izquierda 2"));
    expect(otra.ultimo().relaciones).toEqual([{ izquierdaId: "a", derechaId: "x" }]);
  });
  it("agregar a cada columna respeta los máximos y marca los distractores", () => {
    const { ultimo } = montarProp();
    expect(screen.getByText(/Distractor/)).toBeTruthy(); // «Muu» no se usa
    fireEvent.click(screen.getByRole("button", { name: /Agregar a la derecha/ }));
    expect(ultimo().derecha).toHaveLength(4);
    cleanup();
    const lleno = base({ izquierda: Array.from({ length: 8 }, (_, i) => ({ id: `i${i}`, texto: `I${i}` })) });
    montarProp(lleno);
    expect((screen.getByRole("button", { name: /Agregar a la izquierda/ }) as HTMLButtonElement).disabled).toBe(true);
  });
  it("editar el texto de un elemento y la instrucción", () => {
    const { ultimo } = montarProp();
    fireEvent.change(screen.getByLabelText("Izquierda 1: texto"), { target: { value: "Can" } });
    expect(ultimo().izquierda[0]!.texto).toBe("Can");
    fireEvent.change(screen.getByLabelText("Instrucción"), { target: { value: "Nueva" } });
    expect(ultimo().instruccion).toBe("Nueva");
  });
  it("el panel suma el panel de producción (revisión) y los ajustes comunes", () => {
    montarProp();
    expect(document.querySelector("[data-panel-produccion]")).not.toBeNull();
    expect(screen.getByText("Revisión")).toBeTruthy();
  });
});
