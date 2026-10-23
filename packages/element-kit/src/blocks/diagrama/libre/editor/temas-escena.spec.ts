import { describe, expect, it } from "vitest";
import type { Escena, Forma, Linea } from "@lumina/drawing";
import type { DiagramaPaletaId } from "@lumina/types/slide";
import { PALETAS_DIAGRAMA } from "../../diagrama-temas.js";
import { TEMAS_COMANDOS, estadoComando, type ContextoComando } from "./comandos-registro.js";
import { ambitoDeTema, aplicarTema } from "./temas-escena.js";
import { escena, forma, grupo, linea } from "./util-pruebas.js";

const f = (e: Escena, id: string): Forma => e.elementos.find((x) => x.id === id) as Forma;
const l = (e: Escena, id: string): Linea => e.elementos.find((x) => x.id === id) as Linea;
const arista = (id: string, de: string, a: string): Record<string, unknown> => linea(id, [[0, 0], [10, 10]], { origen: { elementoId: de, puerto: 1 }, destino: { elementoId: a, puerto: 3 } });
const ctx = (e: Escena, seleccion: string[]): ContextoComando => ({ escena: e, seleccion, herramienta: { tipo: "seleccionar" }, puedeDeshacer: false, puedeRehacer: false, zoom: 1, cuadricula: false, imantar: true });

const mapa = (): Escena =>
  escena(
    forma("R", 0, 0), forma("A", 200, 0), forma("B", 200, 100), forma("C", 200, 200, 100, 60, { bloqueado: true }), forma("S", 600, 400),
    arista("rA", "R", "A"), arista("rB", "R", "B"), arista("rC", "R", "C"),
  );

describe("ambitoDeTema", () => {
  it("sin nada elegido, todo el diagrama (menos lo bloqueado)", () => {
    expect(ambitoDeTema(mapa(), [])).toEqual({ ids: ["R", "A", "B", "S"], deSeleccion: false });
  });
  it("con formas elegidas, solo esas", () => {
    expect(ambitoDeTema(mapa(), ["A", "B"])).toEqual({ ids: ["A", "B"], deSeleccion: true });
  });
  it("un conector elegido solo no cuenta como formas elegidas: va todo el diagrama", () => {
    expect(ambitoDeTema(mapa(), ["rA"]).deSeleccion).toBe(false);
  });
  it("los grupos aportan sus formas", () => {
    const e = escena(forma("a", 0, 0), forma("b", 200, 0), grupo("g", ["a", "b"]), forma("c", 600, 0));
    expect(ambitoDeTema(e, ["g"])).toEqual({ ids: ["a", "b"], deSeleccion: true });
  });
  it("una forma bloqueada elegida no cuenta: si es lo único, va todo el diagrama", () => {
    expect(ambitoDeTema(mapa(), ["C"]).deSeleccion).toBe(false);
  });
});

describe("aplicarTema", () => {
  it("cada una de las 10 paletas colorea la raíz con su acento y a los hijos con sus colores", () => {
    for (const id of Object.keys(PALETAS_DIAGRAMA) as DiagramaPaletaId[]) {
      const p = PALETAS_DIAGRAMA[id];
      const r = aplicarTema(mapa(), [], id);
      expect(f(r, "R").estilo.contorno.color, id).toBe(p.acentoPrincipal);
      expect(f(r, "A").estilo.contorno.color, id).toBe(p.colores[0]);
      expect(f(r, "B").estilo.contorno.color, id).toBe(p.colores[1]);
      expect(f(r, "S").estilo.contorno.color, `${id}: la suelta es raíz`).toBe(p.acentoPrincipal);
      expect(l(r, "rB").estilo.contorno.color, id).toBe(p.colores[1]);
    }
  });
  it("con una selección solo cambia lo elegido", () => {
    const e = mapa();
    const r = aplicarTema(e, ["A", "B"], "oceano");
    expect(f(r, "R").estilo).toEqual(f(e, "R").estilo);
    expect(f(r, "A").estilo.contorno.color).toBe(PALETAS_DIAGRAMA.oceano.acentoPrincipal); // raíz del alcance
  });
  it("lo bloqueado no se toca aunque se elija todo", () => {
    const e = mapa();
    expect(f(aplicarTema(e, [], "pastel"), "C").estilo).toEqual(f(e, "C").estilo);
  });
  it("misma escena si ya está coloreado así, y si no hay formas", () => {
    const r = aplicarTema(mapa(), [], "menta");
    expect(aplicarTema(r, [], "menta")).toBe(r);
    const vacia = escena(linea("l", [[0, 0], [5, 5]]));
    expect(aplicarTema(vacia, [], "menta")).toBe(vacia);
  });
  it("cambiar de tema vuelve a colorear (el diagrama no recuerda cuál tenía)", () => {
    const uno = aplicarTema(mapa(), [], "menta");
    const dos = aplicarTema(uno, [], "calido");
    expect(f(dos, "R").estilo.contorno.color).toBe(PALETAS_DIAGRAMA.calido.acentoPrincipal);
    expect(JSON.stringify(dos)).not.toContain("menta");
  });
  it("un id de paleta desconocido no cambia nada", () => {
    const e = mapa();
    expect(aplicarTema(e, [], "no-existe" as DiagramaPaletaId)).toBe(e);
  });
});

describe("los comandos «Tema: …»", () => {
  it("hay uno por paleta, en el grupo «formato», sin atajo y sin menú contextual", () => {
    expect(TEMAS_COMANDOS).toHaveLength(10);
    for (const c of TEMAS_COMANDOS) {
      const p = PALETAS_DIAGRAMA[c.id.slice(5) as DiagramaPaletaId];
      expect(c.etiqueta).toBe(`Tema: ${p.nombre}`);
      expect(c.grupo).toBe("formato");
      expect(c.atajos).toBeUndefined();
      expect(c.sinMenu).toBe(true);
    }
  });
  it("habilitados con formas en el alcance; con el motivo si no hay formas", () => {
    const c = TEMAS_COMANDOS[0]!;
    expect(estadoComando(c, ctx(mapa(), [])).habilitado).toBe(true);
    const sinFormas = escena(linea("l", [[0, 0], [5, 5]]));
    expect(estadoComando(c, ctx(sinFormas, []))).toMatchObject({ habilitado: false, motivo: "No hay formas que colorear" });
  });
});
