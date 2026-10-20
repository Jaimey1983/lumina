import { describe, expect, it } from "vitest";
import { TIPOS_FORMA } from "@lumina/drawing";
import { COMANDOS, comando, comandoDeTecla, estadoComando, textoDeAtajo, type ContextoComando } from "./comandos-registro.js";
import type { TeclaEvento } from "./comandos.js";
import { SELECCIONAR } from "./herramientas.js";
import { escena, forma, grupo } from "./util-pruebas.js";

const tecla = (key: string, extra: Partial<TeclaEvento> = {}): TeclaEvento => ({ key, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, ...extra });

const ctx = (extra: Partial<ContextoComando> = {}): ContextoComando => ({
  escena: escena(forma("a", 0, 0), forma("b", 200, 0), forma("c", 400, 0)),
  seleccion: [],
  herramienta: SELECCIONAR,
  puedeDeshacer: false,
  puedeRehacer: false,
  zoom: 1,
  cuadricula: false,
  imantar: true,
  ...extra,
});

describe("registro de comandos (DY3)", () => {
  it("cada comando tiene un id único y una etiqueta, y no hay dos con el mismo atajo", () => {
    const ids = COMANDOS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(COMANDOS.every((c) => c.etiqueta.trim() !== "")).toBe(true);
    const atajos = COMANDOS.flatMap((c) => (c.atajos ?? []).map((a) => `${a.ctrl ? "C" : ""}${a.shift === undefined ? "?" : a.shift ? "S" : "s"}${a.alt === undefined ? "?" : a.alt ? "A" : "a"}:${a.tecla}`));
    expect(new Set(atajos).size).toBe(atajos.length);
  });

  it("hay un comando de insertar por cada forma del catálogo", () => {
    for (const f of TIPOS_FORMA) expect(COMANDOS.some((c) => c.orden.tipo === "herramienta-forma" && c.orden.forma === f)).toBe(true);
    expect(COMANDOS.filter((c) => c.grupo === "formas")).toHaveLength(TIPOS_FORMA.length);
  });

  it("un id que no existe es un error de programación", () => {
    expect(() => comando("no-existe")).toThrow(/desconocido/i);
  });

  it("el atajo se escribe en texto desde el mismo dato con el que se detecta", () => {
    const texto = (id: string) => textoDeAtajo(comando(id));
    expect(texto("deshacer")).toBe("Ctrl+Z");
    expect(texto("rehacer")).toBe("Ctrl+Y");
    expect(texto("duplicar")).toBe("Ctrl+D");
    expect(texto("eliminar")).toBe("Supr");
    expect(texto("agrupar")).toBe("Ctrl+G");
    expect(texto("desagrupar")).toBe("Ctrl+Mayús+G");
    expect(texto("orden-frente")).toBe("Ctrl+Mayús+]");
    expect(texto("orden-subir")).toBe("Ctrl+]");
    expect(texto("orden-fondo")).toBe("Ctrl+Mayús+[");
    expect(texto("linea")).toBe("L");
    expect(texto("alinear-arriba")).toBeUndefined();
  });

  it("todo lo que anuncia el texto de un atajo lo ejecuta el teclado (y al revés)", () => {
    const casos: Array<[string, TeclaEvento]> = [
      ["deshacer", tecla("z", { ctrlKey: true })],
      ["rehacer", tecla("y", { metaKey: true })],
      ["rehacer", tecla("Z", { ctrlKey: true, shiftKey: true })],
      ["duplicar", tecla("d", { ctrlKey: true })],
      ["seleccionar-todo", tecla("a", { ctrlKey: true })],
      ["agrupar", tecla("g", { ctrlKey: true })],
      ["desagrupar", tecla("G", { ctrlKey: true, shiftKey: true })],
      ["orden-subir", tecla("]", { ctrlKey: true })],
      ["orden-frente", tecla("]", { ctrlKey: true, shiftKey: true })],
      ["orden-bajar", tecla("[", { ctrlKey: true })],
      ["orden-fondo", tecla("[", { ctrlKey: true, shiftKey: true })],
      ["eliminar", tecla("Delete")],
      ["eliminar", tecla("Backspace")],
      ["seleccionar", tecla("v")],
      ["linea", tecla("L")],
      ["flecha", tecla("a")],
      ["texto", tecla("t")],
    ];
    for (const [id, t] of casos) expect(comandoDeTecla(t)?.id, `${id} ← ${t.key}`).toBe(id);
  });

  it("las letras de herramienta no valen con Mayús, Alt ni Ctrl; Ctrl+A sigue siendo seleccionar todo", () => {
    expect(comandoDeTecla(tecla("L", { shiftKey: true }))).toBeNull();
    expect(comandoDeTecla(tecla("l", { altKey: true }))).toBeNull();
    expect(comandoDeTecla(tecla("l", { ctrlKey: true }))).toBeNull();
    expect(comandoDeTecla(tecla("a", { ctrlKey: true }))?.id).toBe("seleccionar-todo");
    expect(comandoDeTecla(tecla("Delete", { ctrlKey: true }))).toBeNull();
  });

  it("solo las letras de herramienta están limitadas al lienzo", () => {
    expect(COMANDOS.filter((c) => c.soloLienzo).map((c) => c.id)).toEqual(["seleccionar", "linea", "flecha", "texto"]);
  });
});

describe("estado de los comandos", () => {
  const estado = (id: string, extra: Partial<ContextoComando> = {}) => estadoComando(comando(id), ctx(extra));

  it("sin selección no se puede duplicar, eliminar, ordenar ni alinear, y se dice por qué", () => {
    for (const id of ["duplicar", "eliminar", "orden-frente", "orden-fondo", "alinear-izquierda", "alinear-medio"]) {
      const e = estado(id);
      expect(e.habilitado, id).toBe(false);
      expect(e.motivo, id).toBe("Elige un elemento");
    }
    expect(estado("duplicar", { seleccion: ["a"] })).toMatchObject({ habilitado: true, motivo: "" });
  });

  it("agrupar pide 2 o más, desagrupar un grupo y distribuir 3 o más", () => {
    expect(estado("agrupar", { seleccion: ["a"] })).toMatchObject({ habilitado: false, motivo: "Elige 2 o más elementos" });
    expect(estado("agrupar", { seleccion: ["a", "b"] }).habilitado).toBe(true);
    const conGrupo = ctx({ escena: escena(forma("a", 0, 0), forma("b", 0, 0), grupo("g", ["a", "b"])), seleccion: ["g"] });
    expect(estadoComando(comando("desagrupar"), conGrupo).habilitado).toBe(true);
    expect(estado("desagrupar", { seleccion: ["a"] })).toMatchObject({ habilitado: false, motivo: "Elige un grupo" });
    expect(estado("distribuir-horizontal", { seleccion: ["a", "b"] })).toMatchObject({ habilitado: false, motivo: "Elige 3 o más elementos" });
    expect(estado("distribuir-vertical", { seleccion: ["a", "b", "c"] }).habilitado).toBe(true);
  });

  it("deshacer y rehacer dependen del historial", () => {
    expect(estado("deshacer")).toMatchObject({ habilitado: false, motivo: "No hay nada que deshacer" });
    expect(estado("deshacer", { puedeDeshacer: true }).habilitado).toBe(true);
    expect(estado("rehacer")).toMatchObject({ habilitado: false, motivo: "No hay nada que rehacer" });
    expect(estado("rehacer", { puedeRehacer: true }).habilitado).toBe(true);
  });

  it("el zoom se deshabilita en sus límites", () => {
    expect(estado("alejar", { zoom: 0.1 }).habilitado).toBe(false);
    expect(estado("alejar", { zoom: 1 }).habilitado).toBe(true);
    expect(estado("acercar", { zoom: 8 }).habilitado).toBe(false);
    expect(estado("acercar", { zoom: 1 }).habilitado).toBe(true);
  });

  it("los interruptores y la herramienta elegida están «activos»", () => {
    expect(estado("cuadricula").activo).toBe(false);
    expect(estado("cuadricula", { cuadricula: true }).activo).toBe(true);
    expect(estado("imantar").activo).toBe(true);
    expect(estado("seleccionar").activo).toBe(true);
    expect(estado("linea").activo).toBe(false);
    expect(estado("linea", { herramienta: { tipo: "linea", flecha: false } }).activo).toBe(true);
    expect(estado("flecha", { herramienta: { tipo: "linea", flecha: false } }).activo).toBe(false);
    expect(estado("forma-rombo", { herramienta: { tipo: "forma", forma: "rombo" } }).activo).toBe(true);
    expect(estado("duplicar").activo).toBeUndefined();
  });
});
