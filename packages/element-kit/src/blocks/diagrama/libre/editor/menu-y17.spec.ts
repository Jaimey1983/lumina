import { describe, expect, it } from "vitest";
import { conectarFormas, type Escena } from "@lumina/drawing";
import { CAMBIAR_FORMA, COMANDOS, ORDEN_GRUPOS_MENU, contextoDeMenu, menuDe, textoDeAtajo, type ContextoComando, type ContextoMenu, type ElementoDeMenu } from "./comandos-registro.js";
import { ejecutarComando } from "./comandos.js";
import { escena, forma, grupo, linea } from "./util-pruebas.js";

const ctx = (e: Escena, seleccion: string[], extra: Partial<ContextoComando> = {}): ContextoComando => ({
  escena: e,
  seleccion,
  herramienta: { tipo: "seleccionar" },
  puedeDeshacer: false,
  puedeRehacer: false,
  zoom: 1,
  cuadricula: false,
  imantar: true,
  ...extra,
});

/** El submenú «Cambiar forma» (Y19): las 22 formas del registro, en orden. */
const CAMBIAR_FORMA_MENU = `Cambiar forma ▸ ${CAMBIAR_FORMA.map((c) => c.etiqueta).join(" | ")}`;

/** El menú como texto: «Etiqueta», «Submenú ▸ a | b | c» y «—» entre grupos. */
const texto = (m: ElementoDeMenu[]): string[] => m.map((x) => (x.clase === "separador" ? "—" : x.clase === "comando" ? x.item.def.etiqueta : `${x.etiqueta} ▸ ${x.items.map((i) => i.def.etiqueta).join(" | ")}`));

const dosFormas = (): Escena => escena(forma("a", 0, 0), forma("b", 300, 0));
const ORDEN = "Orden ▸ Traer al frente | Subir un nivel | Bajar un nivel | Enviar al fondo";
const ALINEAR = "Alinear ▸ Alinear a la izquierda | Centrar horizontalmente | Alinear a la derecha | Alinear arriba | Centrar verticalmente | Alinear abajo";

describe("Y17 — el menú sale del registro", () => {
  it("ningún comando queda sin decidir: todos declaran `menu` o `sinMenu` a propósito, y nunca las dos cosas", () => {
    const sinDecidir = COMANDOS.filter((c) => !c.menu && !c.sinMenu).map((c) => c.id);
    expect(sinDecidir).toEqual([]);
    expect(COMANDOS.filter((c) => c.menu && c.sinMenu).map((c) => c.id)).toEqual([]);
    // Y los que no van en ningún menú son los que no tienen sentido sobre un clic: historial, herramientas, insertar formas, organizar…
    const sin = COMANDOS.filter((c) => c.sinMenu).map((c) => c.id);
    for (const esperado of ["deshacer", "rehacer", "seleccionar", "linea", "forma-rectangulo", "organizar-auto", "alejar", "acercar", "listo"]) expect(sin).toContain(esperado);
    for (const enMenu of ["cortar", "copiar", "pegar", "duplicar", "eliminar", "agrupar", "bloquear", "reglas"]) expect(sin).not.toContain(enMenu);
  });

  it("todo comando que está en un menú declara un grupo que ese menú conoce", () => {
    for (const c of COMANDOS) {
      for (const [en, entrada] of Object.entries(c.menu ?? {})) {
        expect(ORDEN_GRUPOS_MENU[en as ContextoMenu], `${c.id} en ${en}`).toContain(entrada?.grupo);
      }
    }
  });

  it("DY3: dentro de un menú no se repite ni una etiqueta ni un comando, y todos piden una orden real", () => {
    for (const en of ["forma", "conector", "vacio"] as const) {
      const lista = COMANDOS.filter((c) => c.menu?.[en]);
      expect(new Set(lista.map((c) => c.id)).size).toBe(lista.length);
      expect(new Set(lista.map((c) => c.etiqueta)).size).toBe(lista.length);
      for (const c of lista) expect(c.orden.tipo, c.id).toBeTruthy();
    }
  });
});

describe("Y17 — la lista exacta de cada contexto", () => {
  it("sobre una forma", () => {
    expect(texto(menuDe("forma", ctx(dosFormas(), ["a"])))).toEqual([
      "Cortar", "Copiar", "Pegar",
      "—", "Duplicar", "Eliminar", CAMBIAR_FORMA_MENU,
      "—", "Agregar hijo", "Agregar hermano",
      "—", ORDEN,
      "—", "Agrupar", "Desagrupar",
      "—", "Bloquear", "Ocultar",
    ]);
  });

  it("sobre varias formas suma «Alinear ▸» (solo si hay varias)", () => {
    expect(texto(menuDe("forma", ctx(dosFormas(), ["a", "b"])))).toEqual([
      "Cortar", "Copiar", "Pegar",
      "—", "Duplicar", "Eliminar", CAMBIAR_FORMA_MENU,
      "—", "Agregar hijo", "Agregar hermano",
      "—", ORDEN, ALINEAR,
      "—", "Agrupar", "Desagrupar",
      "—", "Bloquear", "Ocultar",
    ]);
  });

  it("sobre un conector con un extremo libre", () => {
    const e = escena(forma("a", 0, 0), linea("l", [[100, 30], [300, 30]], { origen: { elementoId: "a", puerto: 1 } }));
    expect(texto(menuDe("conector", ctx(e, ["l"])))).toEqual(["Pegar al más cercano", "—", "Eliminar", "—", ORDEN]);
  });

  it("sobre un conector sin extremos libres no ofrece «Pegar al más cercano» (y no deja una línea de más)", () => {
    const e = conectarFormas(dosFormas(), "a", "b");
    const l = e.elementos.find((x) => x.tipo === "linea")!.id;
    expect(texto(menuDe("conector", ctx(e, [l])))).toEqual(["Eliminar", "—", ORDEN]);
  });

  it("sobre un vacío", () => {
    expect(texto(menuDe("vacio", ctx(dosFormas(), [])))).toEqual(["Pegar", "—", "Seleccionar todo", "—", "Cuadrícula", "Imantar a otros elementos", "Reglas"]);
  });
});

describe("Y17 — lo que dice cada entrada", () => {
  const entradas = (m: ElementoDeMenu[]) => m.flatMap((x) => (x.clase === "comando" ? [x.item] : x.clase === "submenu" ? x.items : []));
  const por = (m: ElementoDeMenu[], id: string) => entradas(m).find((i) => i.def.id === id)!;

  it("los deshabilitados se ven y dicen el motivo del registro", () => {
    const m = menuDe("forma", ctx(dosFormas(), ["a"]));
    expect(por(m, "agrupar").estado).toMatchObject({ habilitado: false, motivo: "Elige 2 o más elementos" });
    expect(por(m, "desagrupar").estado).toMatchObject({ habilitado: false, motivo: "Elige un grupo" });
    expect(por(m, "crear-hermano").estado.habilitado).toBe(false);
    expect(por(m, "crear-hermano").estado.motivo).toMatch(/padre/);
    expect(por(m, "duplicar").estado).toMatchObject({ habilitado: true, motivo: "" });
  });

  it("con un grupo elegido, «Desagrupar» se habilita; con varias, «Agrupar»", () => {
    const e = escena(forma("a", 0, 0), forma("b", 300, 0), forma("c", 600, 0), grupo("g", ["a", "b"]));
    expect(por(menuDe("forma", ctx(e, ["g"])), "desagrupar").estado.habilitado).toBe(true);
    expect(por(menuDe("forma", ctx(e, ["g", "c"])), "agrupar").estado.habilitado).toBe(true);
  });

  it("muestran el atajo del registro (el mismo texto que la cinta)", () => {
    const m = menuDe("forma", ctx(dosFormas(), ["a"]));
    expect(textoDeAtajo(por(m, "duplicar").def)).toBe("Ctrl+D");
    expect(textoDeAtajo(por(m, "eliminar").def)).toBe("Supr");
    expect(textoDeAtajo(por(m, "copiar").def)).toBe("Ctrl+C");
    expect(textoDeAtajo(por(menuDe("vacio", ctx(dosFormas(), [])), "seleccionar-todo").def)).toBe("Ctrl+A");
  });

  it("«Pegar», «Cuadrícula», «Imán» y «Reglas» muestran su estado del registro", () => {
    const m = menuDe("vacio", ctx(dosFormas(), [], { cuadricula: true, reglas: true, imantar: false }));
    expect(por(m, "cuadricula").estado.activo).toBe(true);
    expect(por(m, "reglas").estado.activo).toBe(true);
    expect(por(m, "imantar").estado.activo).toBe(false);
  });

  it("cada entrada pide la misma orden que su botón de la cinta", () => {
    const m = menuDe("forma", ctx(dosFormas(), ["a"]));
    for (const i of entradas(m)) expect(i.def.orden).toBe(COMANDOS.find((c) => c.id === i.def.id)!.orden);
  });
});

describe("Y17 — qué menú toca", () => {
  const mixta = escena(forma("a", 0, 0), forma("b", 300, 0), linea("l", [[0, 200], [100, 200]]));
  it("sin nada elegido, vacío; solo conectores, conector; cualquier otra cosa, forma", () => {
    expect(contextoDeMenu(mixta, [])).toBe("vacio");
    expect(contextoDeMenu(mixta, ["l"])).toBe("conector");
    expect(contextoDeMenu(mixta, ["a"])).toBe("forma");
    expect(contextoDeMenu(mixta, ["a", "l"])).toBe("forma");
    expect(contextoDeMenu(mixta, ["no-existe"])).toBe("vacio");
  });
});

describe("Y17 — Bloquear y Ocultar", () => {
  it("bloquean u ocultan lo elegido y dejan la selección vacía (lo bloqueado y lo oculto no se pueden elegir)", () => {
    const e = dosFormas();
    const b = ejecutarComando({ escena: e, seleccion: ["a"] }, { tipo: "bloquear" })!;
    expect(b.escena.elementos.find((x) => x.id === "a")?.bloqueado).toBe(true);
    expect(b.escena.elementos.find((x) => x.id === "b")?.bloqueado).toBeFalsy();
    expect(b.seleccion).toEqual([]);
    const o = ejecutarComando({ escena: e, seleccion: ["a", "b"] }, { tipo: "ocultar" })!;
    expect(o.escena.elementos.every((x) => x.oculto === true)).toBe(true);
    expect(o.seleccion).toEqual([]);
  });
  it("sin nada elegido no hacen nada", () => {
    expect(ejecutarComando({ escena: dosFormas(), seleccion: [] }, { tipo: "bloquear" })).toBeNull();
    expect(ejecutarComando({ escena: dosFormas(), seleccion: [] }, { tipo: "ocultar" })).toBeNull();
  });
  it("no se pueden pedir sobre un vacío ni están en la cinta (solo en el menú)", () => {
    const b = COMANDOS.find((c) => c.id === "bloquear")!;
    const o = COMANDOS.find((c) => c.id === "ocultar")!;
    expect(b.soloMenu).toBe(true);
    expect(o.soloMenu).toBe(true);
    expect(b.habilitado?.(ctx(dosFormas(), []))).toBe("Elige un elemento");
  });
});
