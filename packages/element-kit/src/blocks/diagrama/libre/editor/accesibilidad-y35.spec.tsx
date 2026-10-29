import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Escena } from "@lumina/drawing";
import { conectarFormas } from "@lumina/drawing";
import { buscarComandos } from "./buscar-comandos.js";
import { COMANDOS, comando, comandoDeTecla, estadoComando, textosDeAtajos, TRANSFORMAR_COMANDOS, type ContextoComando } from "./comandos-registro.js";
import { ejecutarComando } from "./comandos.js";
import { EditorLibre } from "./editor-libre.js";
import { ListaAccesible, elementosAccesibles } from "../accesibilidad.js";
import { escena, forma, getForma } from "./util-pruebas.js";

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  localStorage.clear();
});

const AREA = { left: 0, top: 0, right: 1000, bottom: 600, width: 1000, height: 600, x: 0, y: 0 };
const dos = (): Escena => conectarFormas(escena(forma("a", 100, 100, 100, 60, { texto: "uno" }), forma("b", 400, 100, 100, 60, { texto: "dos" }), forma("c", 700, 100, 100, 60, { texto: "tres" })), "a", "b");

function montar(e: Escena = dos()) {
  const onCambio = vi.fn<(e: Escena) => void>();
  render(<EditorLibre escena={e} titulo="Prueba" onCambio={onCambio} onCerrar={vi.fn()} />);
  const lienzo = screen.getByRole("application", { name: "Lienzo de dibujo" }) as unknown as SVGSVGElement;
  lienzo.getBoundingClientRect = () => ({ ...AREA, toJSON: () => AREA }) as DOMRect;
  return {
    onCambio,
    lienzo,
    tecla: (key: string, extra: KeyboardEventInit = {}) => fireEvent.keyDown(lienzo, { key, ...extra }),
    anuncio: () => document.querySelector("[data-dibujo-anuncio]")?.textContent ?? "",
    ultima: () => onCambio.mock.calls.at(-1)?.[0] as Escena,
  };
}
const t = (e: Escena, id: string) => getForma(e, id).transformacion;

const ctx = (e: Escena, seleccion: string[]): ContextoComando => ({ escena: e, seleccion, herramienta: { tipo: "seleccionar" }, zoom: 1, cuadricula: false, imantar: false } as unknown as ContextoComando);

describe("Y35 — los comandos de transformar", () => {
  it("son seis, con atajo único, sin botón ni menú, solo del lienzo, y salen en Ctrl+K", () => {
    expect(TRANSFORMAR_COMANDOS.map((c) => c.id)).toEqual(["agrandar-ancho", "achicar-ancho", "agrandar-alto", "achicar-alto", "girar-izquierda", "girar-derecha"]);
    const atajos = COMANDOS.flatMap((c) => textosDeAtajos(c));
    for (const c of TRANSFORMAR_COMANDOS) {
      const [a] = textosDeAtajos(c);
      expect(atajos.filter((x) => x === a), `el atajo ${a} se repite`).toHaveLength(1);
      expect(c.soloLienzo).toBe(true);
      expect(c.sinMenu).toBe(true);
      expect(buscarComandos(c.etiqueta, COMANDOS, ctx(dos(), ["a"]))[0]?.comando.id).toBe(c.id);
    }
    expect(textosDeAtajos(comando("agrandar-ancho"))).toEqual(["Ctrl+Mayús+ArrowRight"]);
    expect(textosDeAtajos(comando("girar-derecha"))).toEqual(["PageDown"]);
  });

  it("están deshabilitados sin nada elegido y dicen por qué", () => {
    const e = estadoComando(comando("agrandar-ancho"), ctx(dos(), []));
    expect(e.habilitado).toBe(false);
    expect(e.motivo).toBe("Elige un elemento");
    expect(estadoComando(comando("agrandar-ancho"), ctx(dos(), ["a"])).habilitado).toBe(true);
  });

  it("cada tecla pide el comando y el paso que dice (el signo, el eje y el paso)", () => {
    const pide = (key: string, extra: Partial<KeyboardEvent> = {}) => comandoDeTecla({ key, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, ...extra })?.orden;
    expect(pide("ArrowRight", { ctrlKey: true, shiftKey: true })).toEqual({ tipo: "transformar", operacion: "tamano", dx: 10, dy: 0 });
    expect(pide("ArrowLeft", { ctrlKey: true, shiftKey: true })).toEqual({ tipo: "transformar", operacion: "tamano", dx: -10, dy: 0 });
    expect(pide("ArrowDown", { ctrlKey: true, shiftKey: true })).toEqual({ tipo: "transformar", operacion: "tamano", dx: 0, dy: 10 });
    expect(pide("ArrowUp", { ctrlKey: true, shiftKey: true })).toEqual({ tipo: "transformar", operacion: "tamano", dx: 0, dy: -10 });
    expect(pide("PageUp")).toEqual({ tipo: "transformar", operacion: "girar", grados: -15 });
    expect(pide("PageDown")).toEqual({ tipo: "transformar", operacion: "girar", grados: 15 });
    // Las flechas de siempre (sin Ctrl+Mayús) no se tocan.
    expect(pide("ArrowRight")).toBeUndefined();
    expect(pide("ArrowRight", { shiftKey: true })).toBeUndefined();
    expect(pide("ArrowRight", { ctrlKey: true })).toBeUndefined();
  });

  it("ejecutarComando cambia el tamaño desde la esquina superior izquierda y gira; sin selección o con lo bloqueado no hace nada", () => {
    const e = dos();
    const mas = ejecutarComando({ escena: e, seleccion: ["a"] }, { tipo: "transformar", operacion: "tamano", dx: 10, dy: 0 });
    expect(t(mas!.escena, "a")).toMatchObject({ x: 100, y: 100, ancho: 110, alto: 60 });
    const menos = ejecutarComando({ escena: e, seleccion: ["a"] }, { tipo: "transformar", operacion: "tamano", dx: 0, dy: -10 });
    expect(t(menos!.escena, "a")).toMatchObject({ x: 100, y: 100, ancho: 100, alto: 50 });
    const gira = ejecutarComando({ escena: e, seleccion: ["a"] }, { tipo: "transformar", operacion: "girar", grados: 15 });
    expect(t(gira!.escena, "a").rotacion).toBe(15);
    expect(ejecutarComando({ escena: e, seleccion: [] }, { tipo: "transformar", operacion: "girar", grados: 15 })).toBeNull();
    const bloqueada = escena(forma("a", 100, 100, 100, 60, { bloqueado: true }));
    expect(ejecutarComando({ escena: bloqueada, seleccion: ["a"] }, { tipo: "transformar", operacion: "tamano", dx: 10, dy: 0 })).toBeNull();
  });

  it("achicar respeta el tamaño mínimo y no deja una forma de tamaño cero", () => {
    const chica = escena(forma("a", 100, 100, 10, 10));
    const r = ejecutarComando({ escena: chica, seleccion: ["a"] }, { tipo: "transformar", operacion: "tamano", dx: -10, dy: -10 });
    expect(t(r!.escena, "a").ancho).toBeGreaterThan(0);
    expect(t(r!.escena, "a").alto).toBeGreaterThan(0);
  });
});

describe("Y35 — con el editor entero", () => {
  it("Ctrl+Mayús+→ agranda una vez, anuncia el tamaño y confirma una sola vez; Deshacer lo revierte", () => {
    const m = montar();
    m.tecla("Tab");
    m.tecla("ArrowRight", { ctrlKey: true, shiftKey: true });
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    expect(t(m.ultima(), "a")).toMatchObject({ ancho: 110, alto: 60, x: 100, y: 100 });
    expect(m.anuncio()).toBe("Rectángulo «uno», 110 por 60.");
    m.tecla("z", { ctrlKey: true });
    expect(t(m.ultima(), "a").ancho).toBe(100);
  });

  it("Re Pág y Av Pág giran y anuncian el ángulo", () => {
    const m = montar();
    m.tecla("Tab");
    m.tecla("PageDown");
    expect(t(m.ultima(), "a").rotacion).toBe(15);
    expect(m.anuncio()).toBe("Rectángulo «uno», girado a 15°.");
    m.tecla("PageUp");
    m.tecla("PageUp");
    expect(t(m.ultima(), "a").rotacion).toBe(345);
    expect(m.onCambio).toHaveBeenCalledTimes(3);
  });

  it("las flechas anuncian dónde quedó la forma, no solo que sigue elegida", () => {
    const m = montar();
    m.tecla("Tab");
    m.tecla("ArrowRight");
    expect(m.anuncio()).toBe("Rectángulo «uno», en X 101, Y 100.");
    m.tecla("ArrowDown", { shiftKey: true });
    expect(m.anuncio()).toBe("Rectángulo «uno», en X 101, Y 110.");
    m.tecla("a", { ctrlKey: true });
    m.tecla("ArrowLeft");
    expect(m.anuncio()).toBe("4 elementos movidos 1 a la izquierda.");
  });

  it("Tab dice cuál es de cuántos (el conector también cuenta), de ida y de vuelta", () => {
    const m = montar();
    const vistos: string[] = [];
    for (let i = 0; i < 4; i++) {
      m.tecla("Tab");
      vistos.push(m.anuncio());
    }
    expect(vistos.map((v) => v.replace(/^.*, seleccionado, /, ""))).toEqual(["1 de 4.", "2 de 4.", "3 de 4.", "4 de 4."]);
    expect(vistos[0]).toBe("Rectángulo «uno», seleccionado, 1 de 4.");
    // Después del último vuelve al primero, y Mayús+Tab recorre hacia atrás.
    m.tecla("Tab");
    expect(m.anuncio()).toBe("Rectángulo «uno», seleccionado, 1 de 4.");
    m.tecla("Tab", { shiftKey: true });
    expect(m.anuncio()).toMatch(/, seleccionado, 4 de 4\.$/);
  });

  it("I describe el dibujo entero, sin tocar la escena ni el historial", () => {
    const m = montar();
    m.tecla("i");
    expect(m.anuncio()).toContain("3 formas y 1 conector");
    expect(m.anuncio()).toContain("Rectángulo «uno» conecta con Rectángulo «dos».");
    expect(m.onCambio).not.toHaveBeenCalled();
  });

  it("con el foco en un campo de texto, ni I ni Re Pág ni Ctrl+Mayús+flechas hacen nada", () => {
    const m = montar();
    m.tecla("Tab");
    const antes = m.anuncio();
    const campo = document.createElement("input");
    document.querySelector("[data-dibujo-editor]")!.appendChild(campo);
    for (const [key, extra] of [["i", {}], ["PageDown", {}], ["ArrowRight", { ctrlKey: true, shiftKey: true }]] as const) fireEvent.keyDown(campo, { key, ...extra });
    expect(m.onCambio).not.toHaveBeenCalled();
    expect(m.anuncio()).toBe(antes);
  });

  it("sin nada elegido, Re Pág no hace nada ni anuncia nada", () => {
    const m = montar();
    m.tecla("PageDown");
    expect(m.onCambio).not.toHaveBeenCalled();
  });

  it("la ayuda del lienzo dice las teclas nuevas", () => {
    montar();
    const ayuda = document.querySelector("p.sr-only")?.textContent ?? "";
    expect(ayuda).toContain("Re Pág y Av Pág");
    expect(ayuda).toContain("tecla I describe el dibujo");
  });
});

describe("Y35 — la lista accesible dice a qué se conecta cada forma", () => {
  it("agrega «conecta con …» solo donde hay conectores, sin cambiar la etiqueta", () => {
    const e = conectarFormas(dos(), "a", "c");
    const lista = elementosAccesibles(e);
    expect(lista.find((x) => x.id === "a")?.conexiones).toEqual(["Rectángulo «dos»", "Rectángulo «tres»"]);
    expect(lista.find((x) => x.id === "c")?.conexiones).toBeUndefined();
    expect(lista.find((x) => x.id === "a")?.etiqueta).toBe("Rectángulo «uno»");
    render(<ListaAccesible escena={e} />);
    expect(document.querySelector('[data-conexiones-lista="a"]')?.textContent).toBe("conecta con Rectángulo «dos» y Rectángulo «tres»");
    expect(document.querySelector('[data-conexiones-lista="c"]')).toBeNull();
  });
});
