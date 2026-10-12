/**
 * U17 — Línea de tiempo (actividad nueva). Viewer: orden inicial barajado y nunca resuelto, mover con
 * botones, comprobar, revisión (eje en orden correcto, fechas), reintento, tiempo; definición:
 * registro, catálogo, por defecto; editor y propiedades; y el cruce viewer → scoring (la respuesta
 * que emite el viewer, evaluada por `@lumina/scoring`, da la nota esperada). El arrastre con ratón
 * lo cubre `@dnd-kit/sortable` (mismo mecanismo que `ordenar_pasos`).
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateActivityResponse } from "@lumina/scoring";
import type { LineaTiempoActivity } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { elementRegistry } from "../../index.js";
import { createDefaultLineaTiempo } from "../../activities/linea-tiempo/linea-tiempo-defaults.js";
import {
  eventosEnOrden,
  normalizarLineaTiempo,
  ordenInicial,
  renumerarEventos,
} from "../../activities/linea-tiempo/linea-tiempo-config.js";
import { validarActividad } from "../../activities/_shared/produccion/validacion.js";
import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { lineaTiempoDefinition as def } from "./linea_tiempo-definition.js";

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

const base = (parche: Partial<LineaTiempoActivity> = {}): LineaTiempoActivity => ({
  tipo: "linea_tiempo",
  instruccion: "Ordena los hechos.",
  eventos: [
    { id: "a", texto: "Independencia", fechaTexto: "1810", orden: 1 },
    { id: "b", texto: "Constitución", fechaTexto: "1886", orden: 2 },
    { id: "c", texto: "Nueva Constitución", fechaTexto: "1991", orden: 3 },
  ],
  mostrarFechasAlFinal: true,
  ...parche,
});

const montar = (a: LineaTiempoActivity = base()) => {
  const onResponse = vi.fn();
  const r = render(<Viewer estado={a} config={{ onResponse }} />);
  return { onResponse, ...r };
};
const ids = () => [...document.querySelectorAll("[data-evento-id]")].map((n) => n.getAttribute("data-evento-id"));
const mover = (texto: string, sentido: "antes" | "después") =>
  fireEvent.click(screen.getByRole("button", { name: `Mover «${texto}» ${sentido}` }));
const textoDe = (id: string) => base().eventos.find((e) => e.id === id)!.texto;
/** Lleva el eje a `objetivo` usando solo los botones de mover. */
const poner = (objetivo: string[]) => {
  objetivo.forEach((id, destino) => {
    let pos = ids().indexOf(id);
    while (pos > destino) { mover(textoDe(id), "antes"); pos -= 1; }
    while (pos < destino) { mover(textoDe(id), "después"); pos += 1; }
  });
};
const comprobar = () => fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
const anuncio = () => screen.getByRole("status", { name: "" }).textContent;

describe("Orden inicial", () => {
  it("nunca llega resuelto, con cualquier semilla ni corrida", () => {
    const eventos = base().eventos;
    const correcto = eventosEnOrden(eventos).map((e) => e.id);
    for (let semilla = 0; semilla < 60; semilla++) {
      for (let corrida = 0; corrida < 3; corrida++) {
        expect(ordenInicial(eventos, semilla, corrida).map((e) => e.id)).not.toEqual(correcto);
      }
    }
  });
  it("con la misma semilla sale igual para todos; con otra corrida, distinto", () => {
    const eventos = base().eventos;
    expect(ordenInicial(eventos, 7, 0)).toEqual(ordenInicial(eventos, 7, 0));
    const cuatro = [...eventos, { id: "d", texto: "D", fechaTexto: "2000", orden: 4 }];
    const distintos = new Set([0, 1, 2, 3, 4].map((c) => ordenInicial(cuatro, 7, c).map((e) => e.id).join()));
    expect(distintos.size).toBeGreaterThan(1);
  });
  it("sin semilla también evita el orden resuelto (aleatorio)", () => {
    const eventos = base().eventos;
    const correcto = eventosEnOrden(eventos).map((e) => e.id);
    for (let i = 0; i < 40; i++) expect(ordenInicial(eventos, undefined, 0).map((e) => e.id)).not.toEqual(correcto);
  });
  it("con dos eventos o menos no rompe", () => {
    expect(ordenInicial([], 1, 0)).toEqual([]);
    expect(ordenInicial(base().eventos.slice(0, 1), 1, 0)).toHaveLength(1);
  });
});

describe("Viewer — ordenar", () => {
  it("muestra instrucción, el eje y una tarjeta por evento (sin fechas todavía)", () => {
    montar();
    expect(screen.getByText("Ordena los hechos.")).toBeTruthy();
    expect(screen.getByRole("list", { name: "Línea de tiempo" })).toBeTruthy();
    expect(ids().sort()).toEqual(["a", "b", "c"]);
    expect(screen.queryByText("1810")).toBeNull();
  });
  it("mover antes/después cambia el orden y lo anuncia; en los extremos el botón se deshabilita", () => {
    montar();
    poner(["a", "b", "c"]);
    expect(ids()).toEqual(["a", "b", "c"]);
    mover("Independencia", "después");
    expect(ids()).toEqual(["b", "a", "c"]);
    expect(screen.getByText("«Independencia» ahora es el número 2 de 3.")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Mover «Constitución» antes" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Mover «Nueva Constitución» después" }) as HTMLButtonElement).disabled).toBe(true);
  });
  it("cada tarjeta tiene su asa de arrastre con nombre", () => {
    montar();
    expect(screen.getByRole("button", { name: "Arrastrar «Independencia»" }).getAttribute("aria-roledescription")).toBe(
      "elemento ordenable",
    );
  });
});

describe("Viewer — comprobar y resultado", () => {
  it("emite string[] con los ids en el orden elegido (la forma de ordenar_pasos), suena y abre el resultado", () => {
    const { onResponse } = montar();
    poner(["a", "b", "c"]);
    comprobar();
    expect(onResponse).toHaveBeenCalledTimes(1);
    expect(onResponse).toHaveBeenCalledWith(["a", "b", "c"]);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByLabelText("Nota 5.0 de 5")).toBeTruthy();
    expect(play).toHaveBeenCalledWith("correct");
  });
  it("al revisar, el eje se acomoda en el orden correcto, muestra las fechas y marca cada tarjeta con palabras", () => {
    montar();
    poner(["b", "a", "c"]);
    comprobar();
    expect(ids()).toEqual(["a", "b", "c"]);
    expect(screen.getByText("1810")).toBeTruthy();
    const marca = (id: string) => document.querySelector(`[data-evento-id="${id}"]`)!.getAttribute("data-estado");
    expect(marca("a")).toBe("incorrecta");
    expect(marca("b")).toBe("incorrecta");
    expect(marca("c")).toBe("correcta");
    expect(screen.getByText("fuera de lugar (la pusiste en 2.º lugar)")).toBeTruthy();
    expect(screen.getByText("en su lugar")).toBeTruthy();
    expect(play).toHaveBeenCalledWith("wrong");
  });
  it("con mostrarFechasAlFinal apagado no revela las fechas", () => {
    montar(base({ mostrarFechasAlFinal: false }));
    poner(["a", "b", "c"]);
    comprobar();
    expect(screen.queryByText("1810")).toBeNull();
  });
  it("tras comprobar ya no hay botones de mover ni «Comprobar»", () => {
    montar();
    comprobar();
    expect(screen.queryByRole("button", { name: /Mover «/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Comprobar" })).toBeNull();
  });
  it("con intentos > 1 permite reintentar: vuelve a mezclar y a dejar mover", () => {
    const { onResponse } = montar(base({ ajustes: { intentos: 2 } }));
    comprobar();
    fireEvent.click(screen.getByRole("button", { name: /Reintentar/ }));
    expect(screen.getByRole("button", { name: "Comprobar" })).toBeTruthy();
    expect(screen.queryByText("1810")).toBeNull();
    comprobar();
    expect(onResponse).toHaveBeenCalledTimes(2);
  });
  it("no emite nada si no se comprueba", () => {
    const { onResponse } = montar();
    poner(["c", "b", "a"]);
    expect(onResponse).not.toHaveBeenCalled();
  });
});

describe("Viewer — tiempo y contenido", () => {
  it("se acaba el tiempo: se envía el orden que había (una vez) y se avisa", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] });
    try {
      const { onResponse } = montar(base({ ajustes: { tiempoLimiteSeg: 5 } }));
      poner(["a", "c", "b"]);
      act(() => void vi.advanceTimersByTime(6000));
      expect(onResponse).toHaveBeenCalledTimes(1);
      expect(onResponse).toHaveBeenCalledWith(["a", "c", "b"]);
      expect(screen.getByText("Se acabó el tiempo.")).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });
  it("editar el contenido reinicia (vuelve a mezclar)", () => {
    const a = base();
    const { rerender } = montar(a);
    poner(["a", "b", "c"]);
    rerender(<Viewer estado={base({ instruccion: "Otra" })} config={{}} />);
    expect(ids()).not.toEqual(["a", "b", "c"]);
  });
  it("cambiar solo un ajuste (estilo) no reinicia lo ordenado", () => {
    const a = base();
    const { rerender } = montar(a);
    poner(["a", "b", "c"]);
    rerender(<Viewer estado={{ ...a, ajustes: { estilo: "arcade" } }} config={{}} />);
    expect(ids()).toEqual(["a", "b", "c"]);
  });
  it("muestra la imagen del evento", () => {
    const a = base();
    a.eventos[0] = { ...a.eventos[0]!, imagen: "x.png" };
    montar(a);
    expect(document.querySelector('img[src="x.png"]')).not.toBeNull();
  });
});

describe("Cruce viewer → scoring", () => {
  const nota = (colocar: string[]) => {
    const { onResponse } = montar();
    poner(colocar);
    comprobar();
    return evaluateActivityResponse("linea_tiempo", base(), onResponse.mock.calls[0]![0]).score;
  };
  it("perfecto → 5.0; un par intercambiado → 1.7; invertido → 1.7", () => {
    expect(nota(["a", "b", "c"])).toBe(5);
    cleanup();
    expect(nota(["a", "c", "b"])).toBe(1.7);
    cleanup();
    expect(nota(["c", "b", "a"])).toBe(1.7); // solo el del medio queda en su sitio
  });
});

describe("Definición", () => {
  it("se registra una sola vez como partial, con catálogo y eventos", () => {
    expect(elementRegistry.obtener("linea_tiempo")).toBe(def);
    expect(elementRegistry.listar().filter((d) => (d as { tipo: string }).tipo === "linea_tiempo")).toHaveLength(1);
    expect(def.catalogo).toMatchObject({ nombre: "Línea de tiempo", familia: "actividad" });
    expect(def.eventos).toEqual(["respuesta_correcta", "respuesta_incorrecta"]);
    expect(def.puntuacion(base(), ["a", "b", "c"])).toBe(5);
  });
  it("lo que se crea por defecto es jugable y no tiene problemas de validación", () => {
    const a = def.crearPorDefecto();
    expect(a.tipo).toBe("linea_tiempo");
    expect(validarActividad(a)).toEqual([]);
    expect(createDefaultLineaTiempo()).toEqual(a);
  });
  it("las capacidades de ajustes son las que el viewer lee", () => {
    expect(CAPACIDADES_AJUSTES.linea_tiempo).toEqual({
      mostrarNota: true, intentos: true, tiempo: true, semilla: true, sonido: true, estilo: true,
    });
  });
  it("normalizar completa lo que falta (orden = posición, fechas visibles) y renumerar arregla huecos y repetidos", () => {
    const n = normalizarLineaTiempo({ tipo: "linea_tiempo", eventos: [{ id: "a" }, { texto: "B", orden: 9 }, { id: "c", orden: 9 }] } as never);
    expect(n.mostrarFechasAlFinal).toBe(true);
    expect(n.eventos.map((e) => e.orden)).toEqual([1, 9, 9]);
    expect(renumerarEventos(n.eventos).map((e) => e.orden)).toEqual([1, 2, 3]);
    expect(normalizarLineaTiempo({} as never)).toMatchObject({ instruccion: "", eventos: [] });
  });
});

describe("Editor y propiedades", () => {
  it("el lienzo del editor muestra los eventos en su orden correcto, con fecha", () => {
    render(<Editor estado={base({ eventos: [...base().eventos].reverse() })} config={{}} onChange={() => {}} />);
    expect(screen.getByText("3 eventos")).toBeTruthy();
    const filas = [...document.querySelectorAll("li")].map((l) => l.textContent);
    expect(filas).toEqual(["1810Independencia", "1886Constitución", "1991Nueva Constitución"]);
  });
  const montarProp = (a = base()) => {
    const onChange = vi.fn();
    render(<Propiedades estado={a} config={{}} onChange={onChange} onConfigChange={() => {}} />);
    return { onChange, ultimo: () => onChange.mock.calls.at(-1)![0] as LineaTiempoActivity };
  };
  it("editar texto, fecha y orden de un evento", () => {
    const { ultimo } = montarProp();
    fireEvent.change(screen.getByLabelText("Texto del evento 1"), { target: { value: "Grito" } });
    expect(ultimo().eventos[0]!.texto).toBe("Grito");
    fireEvent.change(screen.getByLabelText("Fecha del evento 2"), { target: { value: "siglo XIX" } });
    expect(ultimo().eventos[1]!.fechaTexto).toBe("siglo XIX");
    fireEvent.change(screen.getByLabelText("Orden del evento 3"), { target: { value: "7" } });
    expect(ultimo().eventos[2]!.orden).toBe(7);
  });
  it("agregar toma el siguiente orden; quitar y el máximo se respetan", () => {
    const { ultimo } = montarProp();
    fireEvent.click(screen.getByRole("button", { name: /Agregar evento/ }));
    expect(ultimo().eventos).toHaveLength(4);
    expect(ultimo().eventos[3]!.orden).toBe(4);
    fireEvent.click(screen.getByLabelText("Quitar evento 1"));
    expect(ultimo().eventos.map((e) => e.id)).toEqual(["b", "c"]);
    cleanup();
    const lleno = base({ eventos: Array.from({ length: 12 }, (_, i) => ({ id: `e${i}`, texto: `E${i}`, fechaTexto: `${i}`, orden: i + 1 })) });
    montarProp(lleno);
    expect((screen.getByRole("button", { name: /Agregar evento/ }) as HTMLButtonElement).disabled).toBe(true);
  });
  it("«Ordenar por orden» solo se habilita si la lista está desordenada y renumera de 1 a n", () => {
    const ordenada = montarProp();
    expect((screen.getByRole("button", { name: /Ordenar por orden/ }) as HTMLButtonElement).disabled).toBe(true);
    ordenada.onChange.mockClear();
    cleanup();
    const a = base();
    a.eventos = [{ ...a.eventos[0]!, orden: 30 }, { ...a.eventos[1]!, orden: 10 }, { ...a.eventos[2]!, orden: 20 }];
    const { ultimo } = montarProp(a);
    fireEvent.click(screen.getByRole("button", { name: /Ordenar por orden/ }));
    expect(ultimo().eventos.map((e) => [e.id, e.orden])).toEqual([["b", 1], ["c", 2], ["a", 3]]);
  });
  it("instrucción y mostrar fechas", () => {
    const { ultimo } = montarProp();
    fireEvent.change(screen.getByLabelText("Instrucción"), { target: { value: "Nueva" } });
    expect(ultimo().instruccion).toBe("Nueva");
    fireEvent.click(screen.getByLabelText("Mostrar las fechas al comprobar"));
    expect(ultimo().mostrarFechasAlFinal).toBe(false);
  });
  it("el panel suma el panel de producción (revisión) y los ajustes comunes", () => {
    montarProp();
    expect(document.querySelector("[data-panel-produccion]")).not.toBeNull();
    expect(screen.getByText("Revisión")).toBeTruthy();
  });
});
