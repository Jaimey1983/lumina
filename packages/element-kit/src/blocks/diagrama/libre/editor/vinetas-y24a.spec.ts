import { describe, expect, it } from "vitest";
import { COMANDOS, estadoComando, type ContextoComando } from "./comandos-registro.js";
import { areaDeTexto } from "./herramientas.js";
import { alternarVinetas, fijarVinetas, listaDeSeleccion } from "./propiedades.js";
import { escena, forma, getForma, getLinea, linea } from "./util-pruebas.js";

const base = () =>
  escena(
    forma("A", 0, 0, 100, 60, { texto: "Uno\nDos" }),
    forma("B", 200, 0, 100, 60, { texto: "Uno\nDos", estiloTexto: { vinetas: "puntos" } }),
    forma("N", 400, 0, 100, 60, { texto: "Uno\nDos", estiloTexto: { vinetas: "numeros" } }),
    forma("X", 600, 0, 100, 60, { texto: "Uno", bloqueado: true }),
    { id: "T", tipo: "texto", texto: "Hola", transformacion: { x: 0, y: 200, ancho: 100, alto: 30, rotacion: 0 } },
    linea("L", [[0, 400], [100, 400]], { texto: "rótulo" }),
  );
const claves = (o: object): string[] => Object.keys(o);

describe("listaDeSeleccion", () => {
  it("sin lista es «ninguna» (null), con una es su modo y con varias distintas es «mixto»", () => {
    const e = base();
    expect(listaDeSeleccion(e, ["A"])).toEqual({ mixto: false, valor: null });
    expect(listaDeSeleccion(e, ["B"])).toEqual({ mixto: false, valor: "puntos" });
    expect(listaDeSeleccion(e, ["B", "N"])).toEqual({ mixto: true });
    expect(listaDeSeleccion(e, ["A", "B"])).toEqual({ mixto: true });
    expect(listaDeSeleccion(e, ["B", "B"])).toEqual({ mixto: false, valor: "puntos" });
  });

  it("las líneas no cuentan, lo bloqueado tampoco, y sin nada elegible es null", () => {
    const e = base();
    expect(listaDeSeleccion(e, ["B", "L"])).toEqual({ mixto: false, valor: "puntos" });
    expect(listaDeSeleccion(e, ["L"])).toBeNull();
    expect(listaDeSeleccion(e, ["X"])).toBeNull();
    expect(listaDeSeleccion(e, [])).toBeNull();
  });
});

describe("fijarVinetas", () => {
  it("la pone en las formas y los textos editables, y no toca una línea ni lo bloqueado", () => {
    const e = fijarVinetas(base(), ["A", "T", "L", "X"], "numeros");
    expect(getForma(e, "A").estiloTexto.vinetas).toBe("numeros");
    expect((e.elementos.find((x) => x.id === "T") as { estiloTexto: { vinetas?: string } }).estiloTexto.vinetas).toBe("numeros");
    expect("vinetas" in getLinea(e, "L").estiloTexto).toBe(false);
    expect("vinetas" in getForma(e, "X").estiloTexto).toBe(false);
  });

  it("no cambia el texto, el resto del estilo ni la geometría", () => {
    const antes = base();
    const e = fijarVinetas(antes, ["A"], "puntos");
    expect(getForma(e, "A").texto).toBe("Uno\nDos");
    expect(getForma(e, "A").transformacion).toEqual(getForma(antes, "A").transformacion);
    expect({ ...getForma(e, "A").estiloTexto, vinetas: undefined }).toEqual({ ...getForma(antes, "A").estiloTexto, vinetas: undefined });
  });

  it("quitarla no deja la clave", () => {
    const e = fijarVinetas(base(), ["B", "N"], null);
    expect(claves(getForma(e, "B").estiloTexto)).not.toContain("vinetas");
    expect(claves(getForma(e, "N").estiloTexto)).not.toContain("vinetas");
  });

  it("devuelve la misma escena si no hay nada que cambiar", () => {
    const e = base();
    expect(fijarVinetas(e, ["B"], "puntos")).toBe(e);
    expect(fijarVinetas(e, ["A"], null)).toBe(e);
    expect(fijarVinetas(e, ["L"], "puntos")).toBe(e);
    expect(fijarVinetas(e, ["X"], "puntos")).toBe(e);
    expect(fijarVinetas(e, [], "puntos")).toBe(e);
  });
});

describe("alternarVinetas", () => {
  it("sin lista la pone; con la misma la quita; con la otra la cambia", () => {
    const e = base();
    expect(getForma(alternarVinetas(e, ["A"], "puntos"), "A").estiloTexto.vinetas).toBe("puntos");
    expect(claves(getForma(alternarVinetas(e, ["B"], "puntos"), "B").estiloTexto)).not.toContain("vinetas");
    expect(getForma(alternarVinetas(e, ["B"], "numeros"), "B").estiloTexto.vinetas).toBe("numeros");
  });

  it("con valores mezclados la pone en todo (no la quita)", () => {
    const e = alternarVinetas(base(), ["A", "B"], "puntos");
    expect(getForma(e, "A").estiloTexto.vinetas).toBe("puntos");
    expect(getForma(e, "B").estiloTexto.vinetas).toBe("puntos");
    const f = alternarVinetas(base(), ["B", "N"], "puntos");
    expect(getForma(f, "N").estiloTexto.vinetas).toBe("puntos");
  });

  it("si todo lo elegido ya la tiene, la quita de todo", () => {
    const e = alternarVinetas(fijarVinetas(base(), ["A", "B"], "puntos"), ["A", "B"], "puntos");
    expect(claves(getForma(e, "A").estiloTexto)).not.toContain("vinetas");
    expect(claves(getForma(e, "B").estiloTexto)).not.toContain("vinetas");
  });

  it("sin nada elegible devuelve la misma escena", () => {
    const e = base();
    expect(alternarVinetas(e, ["L"], "puntos")).toBe(e);
    expect(alternarVinetas(e, ["X"], "puntos")).toBe(e);
  });
});

describe("la zona de edición con lista", () => {
  it("una forma y un texto la llevan, un rótulo de conector no", () => {
    const e = base();
    expect(areaDeTexto(e, e.elementos.find((x) => x.id === "B") as never)?.vinetas).toBe("puntos");
    expect(areaDeTexto(e, e.elementos.find((x) => x.id === "N") as never)?.vinetas).toBe("numeros");
    const t = fijarVinetas(e, ["T"], "puntos");
    expect(areaDeTexto(t, t.elementos.find((x) => x.id === "T") as never)?.vinetas).toBe("puntos");
    const rotulo = linea("R", [[0, 400], [100, 400]], { texto: "x", estiloTexto: { vinetas: "puntos" } });
    const conRotulo = escena(rotulo);
    expect(areaDeTexto(conRotulo, conRotulo.elementos[0] as never)).not.toHaveProperty("vinetas");
  });

  it("sin lista la zona es la de siempre, sin el campo", () => {
    const e = base();
    expect(areaDeTexto(e, e.elementos[0] as never)).not.toHaveProperty("vinetas");
  });
});

describe("los comandos de lista", () => {
  const ctx = (e: ReturnType<typeof base>, seleccion: string[]): ContextoComando => ({ escena: e, seleccion, herramienta: { tipo: "seleccionar" } as never, pincel: false, hayPincel: false, vista: { x: 0, y: 0, zoom: 1 } as never, edicionAbierta: false, historial: { puedeDeshacer: false, puedeRehacer: false } } as never);
  const def = (id: string) => COMANDOS.find((c) => c.id === id);

  it("existen, son del grupo «formato» y no tienen atajo ni botón suelto", () => {
    for (const id of ["vinetas-puntos", "vinetas-numeros"]) {
      expect(def(id)?.grupo).toBe("formato");
      expect(def(id)?.atajos).toBeUndefined();
      expect(def(id)?.sinMenu).toBe(true);
    }
    expect(def("vinetas-puntos")?.etiqueta).toBe("Lista con viñetas");
    expect(def("vinetas-numeros")?.etiqueta).toBe("Lista numerada");
    expect(def("vinetas-puntos")?.orden).toEqual({ tipo: "lista", modo: "puntos" });
    expect(def("vinetas-numeros")?.orden).toEqual({ tipo: "lista", modo: "numeros" });
  });

  it("habilitados con una forma o texto editable; con un conector o nada, con motivo", () => {
    const e = base();
    expect(estadoComando(def("vinetas-puntos") as never, ctx(e, ["A"])).habilitado).toBe(true);
    expect(estadoComando(def("vinetas-puntos") as never, ctx(e, ["T"])).habilitado).toBe(true);
    for (const sel of [["L"], ["X"], []]) {
      const est = estadoComando(def("vinetas-puntos") as never, ctx(e, sel));
      expect(est.habilitado).toBe(false);
      expect(est.motivo).toBe("Elige una forma o un texto");
    }
  });

  it("activo solo si todo lo elegido tiene esa lista", () => {
    const e = base();
    expect(estadoComando(def("vinetas-puntos") as never, ctx(e, ["B"])).activo).toBe(true);
    expect(estadoComando(def("vinetas-numeros") as never, ctx(e, ["B"])).activo).toBe(false);
    expect(estadoComando(def("vinetas-numeros") as never, ctx(e, ["N"])).activo).toBe(true);
    expect(estadoComando(def("vinetas-puntos") as never, ctx(e, ["A"])).activo).toBe(false);
    expect(estadoComando(def("vinetas-puntos") as never, ctx(e, ["A", "B"])).activo).toBe(false);
  });
});
