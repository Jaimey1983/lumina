import { describe, expect, it } from "vitest";
import { FORMAS, TIPOS_FORMA, type Escena } from "@lumina/drawing";
import { CAMBIAR_FORMA, COMANDOS, estadoComando, menuDe, textoDeAtajo, type ContextoComando } from "./comandos-registro.js";
import { buscarComandos } from "./buscar-comandos.js";
import { escena, forma, grupo, linea } from "./util-pruebas.js";

const ctx = (e: Escena, seleccion: string[]): ContextoComando => ({ escena: e, seleccion, herramienta: { tipo: "seleccionar" }, puedeDeshacer: false, puedeRehacer: false, zoom: 1, cuadricula: false, imantar: true });
const def = (id: string) => CAMBIAR_FORMA.find((c) => c.id === id)!;

const base = (): Escena =>
  escena(forma("a", 0, 0), forma("b", 200, 0, 100, 60, { forma: "rombo" }), forma("c", 400, 0, 100, 60, { bloqueado: true }), linea("l", [[0, 200], [100, 200]]), grupo("g", ["a", "b"]));

describe("Y19 — los comandos «Cambiar a …»", () => {
  it("hay uno por cada forma del catálogo, con su etiqueta, sin atajo y en el grupo «formas»", () => {
    expect(CAMBIAR_FORMA.map((c) => c.id)).toEqual(TIPOS_FORMA.map((t) => `cambiar-forma-${t}`));
    for (const t of TIPOS_FORMA) {
      const c = def(`cambiar-forma-${t}`);
      expect(c.etiqueta).toBe(`Cambiar a ${FORMAS[t].nombre}`);
      expect(c.grupo).toBe("formas");
      expect(c.atajos).toBeUndefined();
      expect(textoDeAtajo(c)).toBeUndefined();
      expect(c.orden).toEqual({ tipo: "cambiar-forma", forma: t });
    }
  });

  it("están en el registro único, sin etiquetas repetidas", () => {
    const etiquetas = COMANDOS.map((c) => c.etiqueta);
    expect(new Set(etiquetas).size).toBe(etiquetas.length);
  });

  it("habilitados con una forma editable elegida; con el motivo si no se puede", () => {
    const e = base();
    expect(estadoComando(def("cambiar-forma-elipse"), ctx(e, ["a"])).habilitado).toBe(true);
    expect(estadoComando(def("cambiar-forma-elipse"), ctx(e, [])).motivo).toBe("Elige una forma");
    expect(estadoComando(def("cambiar-forma-elipse"), ctx(e, ["l"])).motivo).toBe("Elige una forma");
    expect(estadoComando(def("cambiar-forma-elipse"), ctx(e, ["c"])).motivo).toBe("Elige una forma"); // bloqueada
    expect(estadoComando(def("cambiar-forma-elipse"), ctx(e, ["g"])).habilitado).toBe(true); // un grupo aporta sus formas
  });

  it("no se puede si todas las elegidas ya tienen esa forma, y entonces están activas", () => {
    const e = base();
    const s = estadoComando(def("cambiar-forma-rectangulo"), ctx(e, ["a"]));
    expect(s).toMatchObject({ habilitado: false, motivo: "Ya tiene esa forma", activo: true });
    expect(estadoComando(def("cambiar-forma-rectangulo"), ctx(e, ["a", "b"]))).toMatchObject({ habilitado: true, activo: false }); // una es rombo
  });
});

describe("Y19 — el submenú «Cambiar forma ▸» del menú contextual", () => {
  const submenu = (e: Escena, sel: string[], en: "forma" | "conector" | "vacio" = "forma") => menuDe(en, ctx(e, sel)).find((x) => x.clase === "submenu" && x.etiqueta === "Cambiar forma");

  it("sale con una forma editable elegida, con las 22 formas", () => {
    const s = submenu(base(), ["a"]);
    expect(s?.clase === "submenu" && s.items.map((i) => i.def.etiqueta)).toEqual(TIPOS_FORMA.map((t) => `Cambiar a ${FORMAS[t].nombre}`));
  });
  it("sale también con un grupo, y con una forma y un conector", () => {
    expect(submenu(base(), ["g"])).toBeTruthy();
    expect(submenu(base(), ["a", "l"])).toBeTruthy();
  });
  it("no sale con solo un conector, con una forma bloqueada ni sobre un vacío", () => {
    expect(submenu(base(), ["l"], "conector")).toBeUndefined();
    expect(submenu(base(), ["c"])).toBeUndefined();
    expect(submenu(base(), [], "vacio")).toBeUndefined();
  });
});

describe("Y19 — el buscador de comandos", () => {
  it("«cambiar a rombo» y «convertir» encuentran el comando", () => {
    expect(buscarComandos("cambiar a rombo", COMANDOS)[0]?.comando.id).toBe("cambiar-forma-rombo");
    expect(buscarComandos("convertir", COMANDOS).some((r) => r.comando.id === "cambiar-forma-elipse")).toBe(true);
  });
});
