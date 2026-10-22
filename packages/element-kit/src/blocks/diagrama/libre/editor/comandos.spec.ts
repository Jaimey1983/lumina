import { describe, expect, it } from "vitest";
import { ATAJOS_DE_NAVEGACION, depurarSeleccion, ejecutarComando, elegibles, ordenDeTecla, type TeclaEvento } from "./comandos.js";
import { escena, forma, getForma, getLinea, grupo, ids, linea } from "./util-pruebas.js";

const tecla = (key: string, extra: Partial<TeclaEvento> = {}): TeclaEvento => ({ key, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, ...extra });

describe("ordenDeTecla", () => {
  it("atajos con Ctrl o ⌘", () => {
    expect(ordenDeTecla(tecla("z", { ctrlKey: true }))).toEqual({ tipo: "deshacer" });
    expect(ordenDeTecla(tecla("Z", { ctrlKey: true, shiftKey: true }))).toEqual({ tipo: "rehacer" });
    expect(ordenDeTecla(tecla("y", { metaKey: true }))).toEqual({ tipo: "rehacer" });
    expect(ordenDeTecla(tecla("d", { ctrlKey: true }))).toEqual({ tipo: "duplicar" });
    expect(ordenDeTecla(tecla("a", { ctrlKey: true }))).toEqual({ tipo: "seleccionar-todo" });
    expect(ordenDeTecla(tecla("g", { ctrlKey: true }))).toEqual({ tipo: "agrupar" });
    expect(ordenDeTecla(tecla("g", { ctrlKey: true, shiftKey: true }))).toEqual({ tipo: "desagrupar" });
    expect(ordenDeTecla(tecla("]", { ctrlKey: true }))).toEqual({ tipo: "orden", modo: "subir" });
    expect(ordenDeTecla(tecla("[", { ctrlKey: true, shiftKey: true }))).toEqual({ tipo: "orden", modo: "fondo" });
  });
  it("Supr y Retroceso eliminan; Escape cierra; Tab recorre", () => {
    expect(ordenDeTecla(tecla("Delete"))).toEqual({ tipo: "eliminar" });
    expect(ordenDeTecla(tecla("Backspace"))).toEqual({ tipo: "eliminar" });
    expect(ordenDeTecla(tecla("Escape"))).toEqual({ tipo: "cerrar" });
    expect(ordenDeTecla(tecla("Tab"))).toEqual({ tipo: "siguiente", atras: false });
    expect(ordenDeTecla(tecla("Tab", { shiftKey: true }))).toEqual({ tipo: "siguiente", atras: true });
  });
  it("las flechas mueven 1 unidad, o 10 con Mayús", () => {
    expect(ordenDeTecla(tecla("ArrowLeft"))).toEqual({ tipo: "mover", dx: -1, dy: 0 });
    expect(ordenDeTecla(tecla("ArrowDown", { shiftKey: true }))).toEqual({ tipo: "mover", dx: 0, dy: 10 });
  });
  it("lo demás no significa nada", () => {
    expect(ordenDeTecla(tecla("x"))).toBeNull();
    expect(ordenDeTecla(tecla("c", { ctrlKey: true }))).toBeNull();
    expect(ordenDeTecla(tecla("q"))).toBeNull();
  });
});

describe("teclas de herramienta (W6)", () => {
  it("V, L, A y T eligen herramienta, con mayúsculas o minúsculas, y Enter acepta", () => {
    expect(ordenDeTecla(tecla("v"))).toEqual({ tipo: "herramienta", herramienta: "seleccionar" });
    expect(ordenDeTecla(tecla("l"))).toEqual({ tipo: "herramienta", herramienta: "linea" });
    expect(ordenDeTecla(tecla("a"))).toEqual({ tipo: "herramienta", herramienta: "flecha" });
    expect(ordenDeTecla(tecla("t"))).toEqual({ tipo: "herramienta", herramienta: "texto" });
    expect(ordenDeTecla(tecla("Enter"))).toEqual({ tipo: "aceptar" });
  });
  it("con Mayús o Alt no son herramientas, y Ctrl+A sigue siendo seleccionar todo", () => {
    expect(ordenDeTecla(tecla("L", { shiftKey: true }))).toBeNull();
    expect(ordenDeTecla(tecla("l", { altKey: true }))).toBeNull();
    expect(ordenDeTecla(tecla("a", { ctrlKey: true }))).toEqual({ tipo: "seleccionar-todo" });
  });
});

describe("elegibles", () => {
  it("de primer nivel, visibles y desbloqueados, en orden de apilado", () => {
    const e = escena(forma("a", 0, 0), forma("b", 0, 0), forma("c", 0, 0), forma("oculta", 0, 0, 10, 10, { oculto: true }), forma("fija", 0, 0, 10, 10, { bloqueado: true }), grupo("g", ["b", "c"]));
    expect(elegibles(e)).toEqual(["a", "g"]);
  });
});

describe("ejecutarComando", () => {
  const base = escena(forma("a", 0, 0), forma("b", 200, 0), forma("c", 400, 0));
  const est = (seleccion: string[]) => ({ escena: base, seleccion });

  it("seleccionar todo y deseleccionar", () => {
    expect(ejecutarComando(est([]), { tipo: "seleccionar-todo" })?.seleccion).toEqual(["a", "b", "c"]);
    expect(ejecutarComando({ escena: escena(), seleccion: [] }, { tipo: "seleccionar-todo" })).toBeNull();
    expect(ejecutarComando(est(["a"]), { tipo: "deseleccionar" })?.seleccion).toEqual([]);
    expect(ejecutarComando(est([]), { tipo: "deseleccionar" })).toBeNull();
  });

  it("Tab recorre en ciclo, hacia adelante y hacia atrás", () => {
    expect(ejecutarComando(est([]), { tipo: "siguiente", atras: false })?.seleccion).toEqual(["a"]);
    expect(ejecutarComando(est([]), { tipo: "siguiente", atras: true })?.seleccion).toEqual(["c"]);
    expect(ejecutarComando(est(["a"]), { tipo: "siguiente", atras: false })?.seleccion).toEqual(["b"]);
    expect(ejecutarComando(est(["c"]), { tipo: "siguiente", atras: false })?.seleccion).toEqual(["a"]);
    expect(ejecutarComando(est(["a"]), { tipo: "siguiente", atras: true })?.seleccion).toEqual(["c"]);
    expect(ejecutarComando({ escena: escena(), seleccion: [] }, { tipo: "siguiente", atras: false })).toBeNull();
  });

  it("eliminar quita y depura la selección; sin selección no hace nada", () => {
    const r = ejecutarComando(est(["a", "b"]), { tipo: "eliminar" });
    expect(ids(r!.escena)).toEqual(["c"]);
    expect(r!.seleccion).toEqual([]);
    expect(ejecutarComando(est([]), { tipo: "eliminar" })).toBeNull();
  });

  it("duplicar deja seleccionadas las copias", () => {
    const r = ejecutarComando(est(["a"]), { tipo: "duplicar" });
    expect(r!.seleccion).toEqual(["a-copia"]);
    expect(ids(r!.escena)).toContain("a-copia");
  });

  it("agrupar selecciona el grupo; desagrupar selecciona a los hijos", () => {
    const g = ejecutarComando(est(["a", "b"]), { tipo: "agrupar" });
    expect(g!.seleccion).toEqual(["grupo-1"]);
    const d = ejecutarComando(g!, { tipo: "desagrupar" });
    expect(d!.seleccion).toEqual(["a", "b"]);
    expect(ejecutarComando(est(["a"]), { tipo: "agrupar" })).toBeNull();
    expect(ejecutarComando(est(["a"]), { tipo: "desagrupar" })).toBeNull();
  });

  it("mover con flechas desplaza la selección y no cambia lo demás", () => {
    const r = ejecutarComando(est(["a", "b"]), { tipo: "mover", dx: 10, dy: 0 });
    expect(getForma(r!.escena, "a").transformacion.x).toBe(10);
    expect(getForma(r!.escena, "c")).toBe(getForma(base, "c"));
    expect(ejecutarComando(est([]), { tipo: "mover", dx: 1, dy: 0 })).toBeNull();
  });

  it("orden, alinear y distribuir", () => {
    expect(ids(ejecutarComando(est(["a"]), { tipo: "orden", modo: "frente" })!.escena)).toEqual(["b", "c", "a"]);
    expect(ejecutarComando(est(["c"]), { tipo: "orden", modo: "frente" })).toBeNull();
    const al = ejecutarComando(est(["a", "b", "c"]), { tipo: "alinear", modo: "abajo" });
    expect(al).toBeNull(); // ya estaban a la misma altura
    const desigual = { escena: escena(forma("a", 0, 0, 50, 50), forma("b", 100, 100, 50, 50)), seleccion: ["a", "b"] };
    expect(getForma(ejecutarComando(desigual, { tipo: "alinear", modo: "abajo" })!.escena, "a").transformacion.y).toBe(100);
    const tres = { escena: escena(forma("a", 0, 0, 50, 50), forma("b", 60, 0, 50, 50), forma("c", 400, 0, 50, 50)), seleccion: ["a", "b", "c"] };
    expect(getForma(ejecutarComando(tres, { tipo: "distribuir", eje: "horizontal" })!.escena, "b").transformacion.x).toBe(200);
  });

  it("un solo elemento se alinea respecto de la escena", () => {
    const solo = { escena: escena(forma("a", 10, 10, 100, 100)), seleccion: ["a"] };
    expect(getForma(ejecutarComando(solo, { tipo: "alinear", modo: "centro" })!.escena, "a").transformacion.x).toBe(450);
  });

  it("pegar al más cercano une el extremo libre y no hace nada si ya está pegado", () => {
    const e = escena(forma("a", 0, 0), forma("b", 200, 0), linea("L", [[100, 30], [110, 30]], { origen: { elementoId: "a", puerto: 1 } }));
    const r = ejecutarComando({ escena: e, seleccion: ["L"] }, { tipo: "pegar-al-mas-cercano" });
    expect(getLinea(r!.escena, "L").destino).toEqual({ elementoId: "a", puerto: 1 });
    expect(ejecutarComando(r!, { tipo: "pegar-al-mas-cercano" })).toBeNull();
    expect(ejecutarComando({ escena: e, seleccion: ["a"] }, { tipo: "pegar-al-mas-cercano" })).toBeNull();
  });

  it("depurarSeleccion descarta ids que ya no existen", () => {
    expect(depurarSeleccion(base, ["a", "zzz", "c"])).toEqual(["a", "c"]);
  });

  it("ATAJOS_DE_NAVEGACION coincide con ordenDeTecla en las teclas que aplica", () => {
    for (const fila of ATAJOS_DE_NAVEGACION) {
      if (!fila.tecla || !fila.tipoOrden) continue;
      const orden = ordenDeTecla(fila.tecla);
      expect(orden?.tipo).toBe(fila.tipoOrden);
      if (orden?.tipo === "mover" && fila.ordenExtra && "dx" in fila.ordenExtra) {
        if (fila.ordenExtra.dx !== undefined) expect(orden.dx).toBe(fila.ordenExtra.dx);
        if (fila.ordenExtra.dy !== undefined) expect(orden.dy).toBe(fila.ordenExtra.dy);
      }
      if (orden?.tipo === "siguiente" && fila.ordenExtra && "atras" in fila.ordenExtra) {
        expect(orden.atras).toBe(fila.ordenExtra.atras);
      }
    }
  });
});
