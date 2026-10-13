/**
 * U18 — Cloze con banco (actividad nueva). Viewer: «tocar y colocar» (una palabra por hueco, devolver al
 * banco), comprobar, resultado, reintento, tiempo, huecos con la misma respuesta; definición: registro,
 * catálogo, por defecto; editor y propiedades; y el cruce viewer → scoring (la respuesta que emite el
 * viewer, evaluada por `@lumina/scoring`, da la nota esperada). El arrastre con ratón lo cubre el motor
 * común (`ubicar-elementos`, U10.4).
 */
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateActivityResponse } from "@lumina/scoring";
import type { ClozeBancoActivity } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { elementRegistry } from "../../index.js";
import { createDefaultClozeBanco } from "../../activities/cloze-banco/cloze-banco-defaults.js";
import {
  fichasDelBanco,
  idsEnTexto,
  normalizarClozeBanco,
  segmentarTexto,
} from "../../activities/cloze-banco/cloze-banco-config.js";
import { validarActividad } from "../../activities/_shared/produccion/validacion.js";
import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { clozeBancoDefinition as def } from "./cloze_banco-definition.js";

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

const base = (parche: Partial<ClozeBancoActivity> = {}): ClozeBancoActivity => ({
  tipo: "cloze_banco",
  texto: "El {{blank:a}} sale por el este y se oculta por el {{blank:b}}.",
  blancos: [
    { id: "a", respuesta: "sol" },
    { id: "b", respuesta: "oeste" },
  ],
  distractores: ["luna"],
  ...parche,
});

/** Monta el viewer ya en modo «tocar y colocar» (el arrastre no se simula en jsdom). */
const montar = (a: ClozeBancoActivity = base()) => {
  const onResponse = vi.fn();
  const r = render(<Viewer estado={a} config={{ onResponse }} />);
  fireEvent.click(screen.getByRole("button", { name: "Modo: arrastrar" }));
  return { onResponse, ...r };
};
const hueco = (id: string) => document.querySelector(`[data-hueco-id="${id}"]`) as HTMLElement;
const banco = () => screen.getByRole("group", { name: "Banco de palabras" });
const enBanco = () => [...banco().querySelectorAll("[aria-roledescription]")].map((n) => n.textContent);
const palabra = (texto: string) => within(banco()).getByText(texto);
const colocar = (texto: string, h: string) => {
  fireEvent.click(palabra(texto));
  fireEvent.click(hueco(h));
};
const comprobar = () => fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
const anuncio = () => screen.getByTestId("anuncio-tocar-colocar").textContent;

describe("Texto y fichas (puro)", () => {
  it("segmenta el texto y solo la primera aparición de un id es hueco", () => {
    expect(segmentarTexto("A {{blank:x}} B {{blank:x}} C")).toEqual([
      { tipo: "texto", texto: "A " },
      { tipo: "hueco", id: "x" },
      { tipo: "texto", texto: " B " },
      { tipo: "texto", texto: "___" },
      { tipo: "texto", texto: " C" },
    ]);
    expect(idsEnTexto("{{blank:b}} {{blank:a}} {{blank:b}}")).toEqual(["b", "a"]);
  });
  it("el banco = respuestas + distractores no vacíos, con ids posicionales (respuestas repetidas dan dos fichas)", () => {
    const a = normalizarClozeBanco(
      base({ texto: "{{blank:a}} y {{blank:b}}", blancos: [{ id: "a", respuesta: "de" }, { id: "b", respuesta: "de" }], distractores: ["en", " "] }),
    );
    expect(fichasDelBanco(a)).toEqual([
      { id: "ficha-0", texto: "de" },
      { id: "ficha-1", texto: "de" },
      { id: "ficha-2", texto: "en" },
    ]);
  });
  it("normalizar (para jugar) deja los huecos con respuesta que están en el texto, en orden de lectura", () => {
    const crudo = {
      tipo: "cloze_banco",
      texto: "{{blank:b}} luego {{blank:a}} y {{blank:z}}",
      blancos: [{ id: "a", respuesta: "A" }, { id: "b", respuesta: "B" }, { id: "huerfano", respuesta: "H" }, { id: "z", respuesta: " " }],
    } as never;
    expect(normalizarClozeBanco(crudo).blancos.map((b) => b.id)).toEqual(["b", "a"]);
    expect(normalizarClozeBanco(crudo, false).blancos).toHaveLength(4);
    expect(normalizarClozeBanco({} as never)).toMatchObject({ texto: "", blancos: [], distractores: [] });
  });
});

describe("Viewer — colocar palabras", () => {
  it("muestra el texto con huecos numerados y el banco con respuestas y distractores", () => {
    montar();
    expect(hueco("a").textContent).toBe("1");
    expect(hueco("b").textContent).toBe("2");
    expect(enBanco().sort()).toEqual(["luna", "oeste", "sol"]);
    expect(screen.getByText(/sale por el este/)).toBeTruthy();
  });
  it("elegir una palabra y luego un hueco la coloca, la saca del banco y lo anuncia", () => {
    montar();
    fireEvent.click(palabra("sol"));
    expect(anuncio()).toContain("Elegiste sol");
    fireEvent.click(hueco("a"));
    expect(anuncio()).toBe("Colocaste sol en el hueco 1.");
    expect(enBanco()).not.toContain("sol");
    expect(hueco("a").getAttribute("aria-label")).toBe("Hueco 1: sol. Pulsa para devolverla al banco.");
  });
  it("un hueco admite UNA palabra: colocar otra devuelve la anterior al banco", () => {
    montar();
    colocar("sol", "a");
    colocar("luna", "a");
    expect(enBanco().sort()).toEqual(["oeste", "sol"]);
    expect(hueco("a").textContent).toContain("luna");
  });
  it("tocar un hueco ocupado, sin nada elegido, devuelve su palabra al banco; con Enter también", () => {
    montar();
    colocar("oeste", "b");
    fireEvent.click(hueco("b"));
    expect(enBanco()).toContain("oeste");
    colocar("oeste", "b");
    fireEvent.keyDown(hueco("b"), { key: "Enter" });
    expect(enBanco()).toContain("oeste");
    expect(hueco("b").getAttribute("aria-label")).toBe("Hueco 2, vacío");
  });
  it("Escape cancela la elección", () => {
    montar();
    fireEvent.click(palabra("sol"));
    fireEvent.keyDown(palabra("sol"), { key: "Escape" });
    expect(palabra("sol").getAttribute("aria-pressed")).toBe("false");
    expect(anuncio()).toContain("Cancelaste");
  });
  it("«Comprobar» está deshabilitado hasta que haya una palabra colocada", () => {
    montar();
    expect((screen.getByRole("button", { name: "Comprobar" }) as HTMLButtonElement).disabled).toBe(true);
    colocar("sol", "a");
    expect((screen.getByRole("button", { name: "Comprobar" }) as HTMLButtonElement).disabled).toBe(false);
  });
  it("dos huecos con la misma respuesta tienen dos fichas distintas", () => {
    montar(base({ texto: "{{blank:a}} y {{blank:b}}", blancos: [{ id: "a", respuesta: "de" }, { id: "b", respuesta: "de" }], distractores: [] }));
    expect(enBanco()).toEqual(["de", "de"]);
    fireEvent.click(banco().querySelectorAll("[aria-roledescription]")[0]!);
    fireEvent.click(hueco("a"));
    expect(enBanco()).toEqual(["de"]);
  });
  it("en modo arrastrar las palabras se anuncian como arrastrables", () => {
    render(<Viewer estado={base()} config={{}} />);
    expect(within(banco()).getByText("sol").getAttribute("aria-roledescription")).toBe("elemento arrastrable");
  });
});

describe("Viewer — comprobar y resultado", () => {
  it("emite Record<idHueco, palabra> (la forma de completar_blancos), suena y abre el resultado", () => {
    const { onResponse } = montar();
    colocar("oeste", "b");
    colocar("sol", "a");
    comprobar();
    expect(onResponse).toHaveBeenCalledTimes(1);
    expect(onResponse).toHaveBeenCalledWith({ a: "sol", b: "oeste" });
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByLabelText("Nota 5.0 de 5")).toBeTruthy();
    expect(play).toHaveBeenCalledWith("correct");
  });
  it("marca cada hueco correcto/incorrecto con palabras, no solo con color", () => {
    montar();
    colocar("sol", "a");
    colocar("luna", "b");
    comprobar();
    expect(screen.getByLabelText("sol, correcto")).toBeTruthy();
    expect(screen.getByLabelText("luna, incorrecto")).toBeTruthy();
    expect(play).toHaveBeenCalledWith("wrong");
    expect(screen.getByLabelText("Nota 2.5 de 5")).toBeTruthy();
  });
  it("tras comprobar ya no se puede cambiar nada", () => {
    montar();
    colocar("sol", "a");
    comprobar();
    expect(screen.queryByRole("button", { name: "Comprobar" })).toBeNull();
    expect(screen.getByText("Respuesta enviada.")).toBeTruthy();
  });
  it("con intentos > 1 permite reintentar y vuelve a empezar con todas las palabras en el banco", () => {
    const { onResponse } = montar(base({ ajustes: { intentos: 2 } }));
    colocar("sol", "a");
    comprobar();
    fireEvent.click(screen.getByRole("button", { name: /Reintentar/ }));
    expect(enBanco()).toHaveLength(3);
    colocar("sol", "a");
    colocar("oeste", "b");
    comprobar();
    expect(onResponse).toHaveBeenCalledTimes(2);
  });
  it("con la misma semilla el banco sale en el mismo orden para todos", () => {
    const a = base({ ajustes: { semilla: 42 } });
    montar(a);
    const uno = enBanco();
    cleanup();
    montar(a);
    expect(enBanco()).toEqual(uno);
  });
  it("no emite nada si no se comprueba", () => {
    const { onResponse } = montar();
    colocar("sol", "a");
    expect(onResponse).not.toHaveBeenCalled();
  });
});

describe("Viewer — tiempo y contenido", () => {
  it("se acaba el tiempo: se envía lo colocado hasta ahí (una vez) y se avisa", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] });
    try {
      const { onResponse } = montar(base({ ajustes: { tiempoLimiteSeg: 5 } }));
      colocar("sol", "a");
      act(() => void vi.advanceTimersByTime(6000));
      expect(onResponse).toHaveBeenCalledTimes(1);
      expect(onResponse).toHaveBeenCalledWith({ a: "sol" });
      expect(screen.getByText("Se acabó el tiempo.")).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });
  it("editar el contenido reinicia lo colocado", () => {
    const { rerender } = montar(base());
    colocar("sol", "a");
    rerender(<Viewer estado={base({ distractores: ["luna", "estrella"] })} config={{}} />);
    expect(enBanco()).toHaveLength(4);
  });
  it("cambiar solo un ajuste (estilo) no reinicia lo colocado", () => {
    const a = base();
    const { rerender } = montar(a);
    colocar("sol", "a");
    rerender(<Viewer estado={{ ...a, ajustes: { estilo: "arcade" } }} config={{}} />);
    expect(enBanco()).not.toContain("sol");
  });
  it("un marcador repetido o sin definir se ve como «___» y no es un hueco", () => {
    montar(base({ texto: "{{blank:a}} {{blank:a}} {{blank:nada}} {{blank:b}}" }));
    expect(document.querySelectorAll("[data-hueco-id]")).toHaveLength(2);
    expect(document.body.textContent).toContain("___ ___");
  });
});

describe("Cruce viewer → scoring", () => {
  const nota = (colocadas: [string, string][]) => {
    const { onResponse } = montar();
    for (const [texto, h] of colocadas) colocar(texto, h);
    comprobar();
    return evaluateActivityResponse("cloze_banco", base(), onResponse.mock.calls[0]![0]).score;
  };
  it("perfecto → 5.0; uno de dos → 2.5; distractor en un hueco → 2.5; solo uno colocado y bien → 2.5", () => {
    expect(nota([["sol", "a"], ["oeste", "b"]])).toBe(5);
    cleanup();
    expect(nota([["sol", "a"], ["luna", "b"]])).toBe(2.5);
    cleanup();
    expect(nota([["luna", "a"], ["oeste", "b"]])).toBe(2.5);
    cleanup();
    expect(nota([["sol", "a"]])).toBe(2.5);
  });
});

describe("Definición", () => {
  it("se registra una sola vez como partial, con catálogo y eventos", () => {
    expect(elementRegistry.obtener("cloze_banco")).toBe(def);
    expect(elementRegistry.listar().filter((d) => (d as { tipo: string }).tipo === "cloze_banco")).toHaveLength(1);
    expect(def.catalogo).toMatchObject({ nombre: "Cloze con banco", familia: "actividad" });
    expect(def.eventos).toEqual(["respuesta_correcta", "respuesta_incorrecta"]);
    expect(def.puntuacion(base(), { a: "sol", b: "oeste" })).toBe(5);
  });
  it("lo que se crea por defecto es jugable, sin problemas de validación y trae distractores", () => {
    const a = def.crearPorDefecto();
    expect(a.tipo).toBe("cloze_banco");
    expect(validarActividad(a)).toEqual([]);
    expect(a.distractores.length).toBeGreaterThan(0);
    expect(createDefaultClozeBanco()).toEqual(a);
  });
  it("la actividad por defecto se juega completa en el viewer", () => {
    const a = def.crearPorDefecto();
    const { onResponse } = montar(a);
    colocar("fotosíntesis", "h1");
    colocar("sol", "h2");
    colocar("raíces", "h3");
    colocar("oxígeno", "h4");
    comprobar();
    expect(evaluateActivityResponse("cloze_banco", a, onResponse.mock.calls[0]![0]).score).toBe(5);
  });
  it("las capacidades de ajustes son las que el viewer lee", () => {
    expect(CAPACIDADES_AJUSTES.cloze_banco).toEqual({
      mostrarNota: true, intentos: true, tiempo: true, semilla: true, sonido: true, estilo: true,
    });
  });
});

describe("Editor y propiedades", () => {
  it("el lienzo del editor muestra el texto con la respuesta de cada hueco resaltada", () => {
    render(<Editor estado={base()} config={{}} onChange={() => {}} />);
    expect(screen.getByText(/2 huecos · 1 distractor/)).toBeTruthy();
    expect(screen.getByText("sol")).toBeTruthy();
    expect(screen.getByText("oeste")).toBeTruthy();
  });
  const montarProp = (a = base()) => {
    const onChange = vi.fn();
    render(<Propiedades estado={a} config={{}} onChange={onChange} onConfigChange={() => {}} />);
    return { onChange, ultimo: () => onChange.mock.calls.at(-1)![0] as ClozeBancoActivity };
  };
  it("editar el texto y la respuesta de un hueco", () => {
    const { ultimo } = montarProp();
    fireEvent.change(screen.getByLabelText("Texto"), { target: { value: "Nuevo {{blank:a}}" } });
    expect(ultimo().texto).toBe("Nuevo {{blank:a}}");
    fireEvent.change(screen.getByLabelText("Respuesta del hueco 2"), { target: { value: "poniente" } });
    expect(ultimo().blancos[1]!.respuesta).toBe("poniente");
  });
  it("«Agregar hueco» inserta el marcador en el cursor y crea su respuesta vacía", () => {
    const { ultimo } = montarProp();
    const area = screen.getByLabelText("Texto") as HTMLTextAreaElement;
    area.setSelectionRange(3, 3);
    fireEvent.click(screen.getByRole("button", { name: /Agregar hueco/ }));
    const nuevo = ultimo().blancos.at(-1)!;
    expect(ultimo().blancos).toHaveLength(3);
    expect(nuevo.respuesta).toBe("");
    expect(ultimo().texto.slice(3, 3 + `{{blank:${nuevo.id}}}`.length)).toBe(`{{blank:${nuevo.id}}}`);
  });
  it("quitar un hueco lo borra de la lista y deja «___» en el texto", () => {
    const { ultimo } = montarProp();
    fireEvent.click(screen.getByLabelText("Quitar hueco 1"));
    expect(ultimo().blancos.map((b) => b.id)).toEqual(["b"]);
    expect(ultimo().texto).toBe("El ___ sale por el este y se oculta por el {{blank:b}}.");
  });
  it("avisa de los huecos que no están en el texto y respeta el máximo", () => {
    montarProp(base({ blancos: [...base().blancos, { id: "suelto", respuesta: "x" }] }));
    expect(screen.getByText("Este hueco no aparece en el texto: no se jugará.")).toBeTruthy();
    cleanup();
    const lleno = base({ blancos: Array.from({ length: 12 }, (_, i) => ({ id: `h${i}`, respuesta: `r${i}` })) });
    montarProp(lleno);
    expect((screen.getByRole("button", { name: /Agregar hueco/ }) as HTMLButtonElement).disabled).toBe(true);
  });
  it("agregar, editar y quitar distractores", () => {
    const { ultimo } = montarProp();
    fireEvent.click(screen.getByRole("button", { name: /Agregar distractor/ }));
    expect(ultimo().distractores).toEqual(["luna", ""]);
    fireEvent.change(screen.getByLabelText("Distractor 1"), { target: { value: "estrella" } });
    expect(ultimo().distractores[0]).toBe("estrella");
    fireEvent.click(screen.getByLabelText("Quitar distractor 1"));
    expect(ultimo().distractores).toEqual([]);
  });
  it("el panel suma el panel de producción (revisión e importar) y los ajustes comunes", () => {
    montarProp();
    expect(document.querySelector("[data-panel-produccion]")).not.toBeNull();
    expect(screen.getByText("Revisión")).toBeTruthy();
  });
});
