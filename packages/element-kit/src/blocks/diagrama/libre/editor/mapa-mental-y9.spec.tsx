import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Escena, Forma } from "@lumina/drawing";
import { conectarFormas, existeConector } from "@lumina/drawing";
import { EditorLibre } from "./editor-libre.js";
import { ejecutarComando } from "./comandos.js";
import { comando, comandoDeTecla, estadoComando } from "./comandos-registro.js";
import { botonCinta, escena, forma, ids, irAPestana } from "./util-pruebas.js";
import { SELECCIONAR } from "./herramientas.js";

afterEach(cleanup);

function montar(e: Escena) {
  const onCambio = vi.fn<(s: Escena) => void>();
  render(<EditorLibre escena={e} onCambio={onCambio} onCerrar={() => {}} />);
  const lienzo = screen.getByRole("application", { name: "Lienzo de dibujo" }) as unknown as SVGSVGElement;
  fireEvent.click(botonCinta("Imantar a otros elementos"));
  const vista = () => {
    const g = document.querySelector("[data-dibujo-pagina]")?.parentElement?.getAttribute("transform") ?? "";
    const m = /translate\(([-\d.e]+) ([-\d.e]+)\) scale\(([-\d.e]+)\)/.exec(g);
    return { x: Number(m?.[1]), y: Number(m?.[2]), z: Number(m?.[3]) };
  };
  const evento = (tipo: string, x: number, y: number, extra: Record<string, unknown> = {}): void => {
    const v = vista();
    const ev = new MouseEvent(tipo, { bubbles: true, cancelable: true, button: 0, clientX: v.x + x * v.z, clientY: v.y + y * v.z, ...extra });
    fireEvent(lienzo, ev);
  };
  return {
    lienzo,
    onCambio,
    elegir: (id: string, esc: Escena, shift = false) => {
      const f = esc.elementos.find((x) => x.id === id && x.tipo === "forma") as Forma;
      const cx = f.transformacion.x + f.transformacion.ancho / 2;
      const cy = f.transformacion.y + f.transformacion.alto / 2;
      evento("pointerdown", cx, cy, shift ? { shiftKey: true } : {});
      evento("pointerup", cx, cy, shift ? { shiftKey: true } : {});
    },
    ultima: () => onCambio.mock.calls.at(-1)?.[0] as Escena,
    historial: () => onCambio.mock.calls.length,
    anuncio: () => document.querySelector("[data-dibujo-anuncio]")?.textContent ?? "",
  };
}

function cadena(e: Escena, orden: string[]): Escena {
  let a = e;
  for (let i = 0; i < orden.length - 1; i++) a = conectarFormas(a, orden[i]!, orden[i + 1]!);
  return a;
}

describe("Y9 mapa mental y cadena", () => {
  it("Ctrl+Enter crea hijo con conector, estilo copiado y un paso de historial", () => {
    const estiloP = { relleno: { tipo: "color", color: "#aabbcc" }, contorno: { color: "#112233", grosor: 2 }, opacidad: 1, radio: 0, sombra: null };
    const e0 = escena(forma("P", 100, 100, 100, 60, { forma: "rombo", texto: "X", estilo: estiloP }));
    const m = montar(e0);
    m.elegir("P", e0);
    fireEvent.keyDown(m.lienzo, { key: "Enter", ctrlKey: true });
    expect(m.historial()).toBe(1);
    const e1 = m.ultima();
    const hijos = e1.elementos.filter((x) => x.tipo === "forma" && x.id !== "P");
    expect(hijos).toHaveLength(1);
    const h = hijos[0]!;
    expect(h.forma).toBe("rombo");
    expect(existeConector(e1, "P", h.id)).toBe(true);
    const l = e1.elementos.find((x) => x.tipo === "linea");
    expect(l?.origen).toEqual({ elementoId: "P", puerto: 1 });
    expect(screen.getByLabelText("Texto del elemento")).toBeTruthy();
  });

  it("Ctrl+Mayús+Enter crea hermano del mismo padre", () => {
    const e0 = cadena(escena(forma("P", 0, 0), forma("H", 200, 0)), ["P", "H"]);
    const m = montar(e0);
    m.elegir("H", e0);
    fireEvent.keyDown(m.lienzo, { key: "Enter", ctrlKey: true, shiftKey: true });
    const e1 = m.ultima();
    const nuevas = e1.elementos.filter((x) => x.tipo === "forma" && x.id !== "P" && x.id !== "H");
    expect(nuevas).toHaveLength(1);
    expect(existeConector(e1, "P", nuevas[0]!.id)).toBe(true);
  });

  it("hermano sin padre anuncia y no cambia la escena", () => {
    const e0 = escena(forma("S", 0, 0));
    const m = montar(e0);
    m.elegir("S", e0);
    fireEvent.keyDown(m.lienzo, { key: "Enter", ctrlKey: true, shiftKey: true });
    expect(m.onCambio).not.toHaveBeenCalled();
    expect(m.anuncio()).toMatch(/padre/i);
  });

  it("Ctrl+Supr borra rama sin hermanos y deshace en un paso", () => {
    const e0 = cadena(escena(forma("P", 0, 0), forma("B", 200, 0), forma("S", 0, 120)), ["P", "B"]);
    const e1 = conectarFormas(e0, "P", "S");
    const m = montar(e1);
    m.elegir("B", e1);
    fireEvent.keyDown(m.lienzo, { key: "Delete", ctrlKey: true });
    expect(m.ultima().elementos.some((x) => x.id === "B")).toBe(false);
    expect(m.ultima().elementos.some((x) => x.id === "S")).toBe(true);
    fireEvent.keyDown(m.lienzo, { key: "z", ctrlKey: true });
    expect(ids(m.ultima())).toEqual(ids(e1));
  });

  it("Ctrl+L conecta en cadena por orden de selección", () => {
    const e0 = escena(forma("a", 0, 0), forma("b", 0, 200), forma("c", 0, 400));
    const m = montar(e0);
    m.elegir("a", e0);
    m.elegir("b", e0, true);
    m.elegir("c", e0, true);
    fireEvent.keyDown(m.lienzo, { key: "l", ctrlKey: true });
    const e1 = m.ultima();
    expect(existeConector(e1, "a", "b")).toBe(true);
    expect(existeConector(e1, "b", "c")).toBe(true);
  });

  it("conectar en cadena con orden espacial (comando puro)", () => {
    const e0 = escena(forma("c", 400, 0), forma("a", 0, 0), forma("b", 200, 0));
    const r = ejecutarComando({ escena: e0, seleccion: ["c", "a", "b"] }, { tipo: "conectar-cadena", orden: "espacial" });
    expect(r).not.toBeNull();
    expect(existeConector(r!.escena, "a", "b")).toBe(true);
    expect(existeConector(r!.escena, "b", "c")).toBe(true);
  });

  it("los comandos nuevos están en el registro con atajos únicos y habilitado según selección", () => {
    const ctx = {
      escena: escena(forma("a", 0, 0), forma("b", 200, 0)),
      seleccion: ["a"],
      herramienta: SELECCIONAR,
      puedeDeshacer: false,
      puedeRehacer: false,
      zoom: 1,
      cuadricula: false,
      imantar: false,
    };
    expect(comandoDeTecla({ key: "Enter", ctrlKey: true, metaKey: false, shiftKey: false, altKey: false })?.id).toBe("crear-hijo");
    expect(comandoDeTecla({ key: "Enter", ctrlKey: true, metaKey: false, shiftKey: true, altKey: false })?.id).toBe("crear-hermano");
    expect(comandoDeTecla({ key: "Delete", ctrlKey: true, metaKey: false, shiftKey: false, altKey: false })?.id).toBe("eliminar-rama");
    expect(comandoDeTecla({ key: "l", ctrlKey: true, metaKey: false, shiftKey: false, altKey: false })?.id).toBe("conectar-cadena");
    expect(estadoComando(comando("conectar-cadena"), { ...ctx, seleccion: ["a"] }).habilitado).toBe(false);
    expect(estadoComando(comando("conectar-cadena"), { ...ctx, seleccion: ["a", "b"] }).habilitado).toBe(true);
  });

  it("botón Conectar en cadena en Insertar ejecuta igual que Ctrl+L", () => {
    const e0 = escena(forma("a", 0, 0), forma("b", 200, 0));
    const m = montar(e0);
    m.elegir("a", e0);
    m.elegir("b", e0, true);
    irAPestana("Insertar");
    fireEvent.click(botonCinta("Conectar en cadena"));
    expect(existeConector(m.ultima(), "a", "b")).toBe(true);
  });
});
