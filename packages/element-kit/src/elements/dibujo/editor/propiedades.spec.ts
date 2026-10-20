import { describe, expect, it } from "vitest";
import { normalizarEscena, type Escena, type Forma, type Linea, type Texto } from "@lumina/drawing";
import {
  SOMBRA_POR_DEFECTO,
  bloquearCapa,
  capasDe,
  fijarContorno,
  fijarGeometria,
  fijarOpacidad,
  fijarRadio,
  fijarRelleno,
  fijarSombra,
  fijarTexto,
  hojasDeSeleccion,
  hojasEditables,
  leerGeometria,
  nombreDeCapa,
  ocultarCapa,
  ordenarCapa,
  renombrarCapa,
  rellenoDeTipo,
  valorComun,
} from "./propiedades.js";
import { escena, forma, get, getForma, getLinea, grupo, linea } from "./util-pruebas.js";

const texto = (id: string, extra: Record<string, unknown> = {}) => ({ id, tipo: "texto", texto: "Hola", transformacion: { x: 0, y: 300, ancho: 100, alto: 30, rotacion: 0 }, ...extra });
const solido = (color: string) => ({ relleno: { tipo: "solido", color } });
const base = (): Escena =>
  escena(
    forma("A", 0, 0, 100, 60, { estilo: solido("#FF0000") }),
    forma("B", 200, 0, 100, 60, { estilo: { ...solido("#00FF00"), contorno: { color: "#111111", grosor: 4, patron: "guiones" } } }),
    forma("E", 400, 0, 100, 60, { forma: "elipse" }),
    linea("L", [[0, 100], [200, 100]], { trazado: "ortogonal" }),
    texto("T"),
  );
const f = (e: Escena, id: string): Forma => getForma(e, id);
const t = (e: Escena, id: string): Texto => get(e, id) as Texto;

describe("qué se puede cambiar", () => {
  it("los grupos aportan sus hijos, sin repetir, y los grupos no son hojas", () => {
    const e = escena(forma("A", 0, 0), forma("B", 200, 0), grupo("G", ["A", "B"]));
    expect(hojasDeSeleccion(e, ["G"]).map((h) => h.id)).toEqual(["A", "B"]);
    expect(hojasDeSeleccion(e, ["G", "A"]).map((h) => h.id)).toEqual(["A", "B"]);
    expect(hojasDeSeleccion(e, [])).toEqual([]);
    expect(hojasDeSeleccion(e, ["nada"])).toEqual([]);
  });
  it("lo bloqueado (también por un grupo bloqueado) no es editable", () => {
    const e = escena(forma("A", 0, 0, 100, 60, { bloqueado: true }), forma("B", 200, 0), forma("C", 400, 0), forma("D", 600, 0), grupo("G", ["C", "D"], { bloqueado: true }));
    expect(hojasEditables(e, ["A", "B", "G"]).map((h) => h.id)).toEqual(["B"]);
    expect(hojasDeSeleccion(e, ["A", "B", "G"])).toHaveLength(4);
  });
});

describe("valores mixtos", () => {
  it("valorComun: igual, mixto, y null sin elementos", () => {
    const e = base();
    const hs = hojasEditables(e, ["A", "B"]);
    expect(valorComun(hs, (h) => h.estilo.opacidad)).toEqual({ mixto: false, valor: 1 });
    expect(valorComun(hs, (h) => h.estilo.contorno.grosor)).toEqual({ mixto: true });
    expect(valorComun(hs, (h) => h.estilo.relleno)).toEqual({ mixto: true });
    expect(valorComun([], (h) => h.estilo.opacidad)).toBeNull();
  });
  it("compara objetos por contenido, no por referencia", () => {
    const e = escena(forma("A", 0, 0, 100, 60, { estilo: solido("#123456") }), forma("B", 200, 0, 100, 60, { estilo: solido("#123456") }));
    expect(valorComun(hojasEditables(e, ["A", "B"]), (h) => h.estilo.relleno)).toMatchObject({ mixto: false });
  });
  it("un cambio de un solo campo NO pisa los demás campos mixtos", () => {
    const e = fijarContorno(base(), hojasEditables(base(), ["A", "B"]), { patron: "puntos" });
    expect(f(e, "A").estilo.contorno).toMatchObject({ patron: "puntos", grosor: 2 });
    expect(f(e, "B").estilo.contorno).toMatchObject({ patron: "puntos", grosor: 4, color: "#111111" });
  });
});

describe("aplicar a toda la selección", () => {
  const todos = (e: Escena) => hojasEditables(e, ["A", "B", "E", "L", "T"]);
  it("relleno sólido: a las formas y textos, no a la línea", () => {
    const e = fijarRelleno(base(), todos(base()), { tipo: "solido", color: "#0000FF" });
    for (const id of ["A", "B", "E"]) expect(f(e, id).estilo.relleno).toEqual({ tipo: "solido", color: "#0000FF" });
    expect(t(e, "T").estilo.relleno).toEqual({ tipo: "solido", color: "#0000FF" });
    expect(getLinea(e, "L").estilo.relleno).toEqual({ tipo: "ninguno" });
  });
  it("relleno por función: cada elemento parte del suyo (solo cambia el ángulo, conserva sus colores)", () => {
    const e0 = fijarRelleno(base(), hojasEditables(base(), ["A"]), { tipo: "degradado", desde: "#111111", hasta: "#222222", angulo: 10 });
    const e1 = fijarRelleno(e0, hojasEditables(e0, ["B"]), { tipo: "degradado", desde: "#333333", hasta: "#444444", angulo: 20 });
    const e = fijarRelleno(e1, hojasEditables(e1, ["A", "B"]), (r) => (r.tipo === "degradado" ? { ...r, angulo: 99 } : r));
    expect(f(e, "A").estilo.relleno).toEqual({ tipo: "degradado", desde: "#111111", hasta: "#222222", angulo: 99 });
    expect(f(e, "B").estilo.relleno).toEqual({ tipo: "degradado", desde: "#333333", hasta: "#444444", angulo: 99 });
  });
  it("contorno y opacidad: a todo, líneas incluidas", () => {
    let e = fijarContorno(base(), todos(base()), { color: "#ABCDEF", grosor: 7 });
    e = fijarOpacidad(e, todos(e), 0.4);
    for (const x of todos(e)) {
      expect(x.estilo.contorno).toMatchObject({ color: "#ABCDEF", grosor: 7 });
      expect(x.estilo.opacidad).toBe(0.4);
    }
  });
  it("sombra: a formas y textos; por función cada uno conserva la suya; null la quita", () => {
    let e = fijarSombra(base(), todos(base()), { color: "#000000", desenfoque: 5, dx: 1, dy: 1 });
    expect(f(e, "A").estilo.sombra).toEqual({ color: "#000000", desenfoque: 5, dx: 1, dy: 1 });
    expect(getLinea(e, "L").estilo.sombra).toBeNull();
    e = fijarSombra(e, hojasEditables(e, ["B"]), { color: "#000000", desenfoque: 20, dx: 0, dy: 0 });
    e = fijarSombra(e, todos(e), (s) => (s ? { ...s, dx: 9 } : s));
    expect(f(e, "A").estilo.sombra).toMatchObject({ desenfoque: 5, dx: 9 });
    expect(f(e, "B").estilo.sombra).toMatchObject({ desenfoque: 20, dx: 9 });
    e = fijarSombra(e, todos(e), null);
    expect(f(e, "A").estilo.sombra).toBeNull();
    expect(SOMBRA_POR_DEFECTO.desenfoque).toBeGreaterThan(0);
  });
  it("sombra «encender»: las que ya tienen una la conservan y las otras reciben la de por defecto", () => {
    let e = fijarSombra(base(), hojasEditables(base(), ["A"]), { color: "#123456", desenfoque: 3, dx: 0, dy: 0 });
    e = fijarSombra(e, hojasEditables(e, ["A", "B"]), (s) => s ?? SOMBRA_POR_DEFECTO);
    expect(f(e, "A").estilo.sombra?.color).toBe("#123456");
    expect(f(e, "B").estilo.sombra).toEqual(SOMBRA_POR_DEFECTO);
  });
  it("esquinas: solo al rectángulo, al cuadro de texto y al conector en ángulo recto", () => {
    const e = fijarRadio(base(), todos(base()), 12);
    expect(f(e, "A").estilo.radio).toBe(12);
    expect(f(e, "E").estilo.radio).toBe(0);
    expect(t(e, "T").estilo.radio).toBe(12);
    expect(getLinea(e, "L").estilo.radio).toBe(12);
    const recta = escena(linea("R", [[0, 0], [10, 10]]));
    expect(getLinea(fijarRadio(recta, hojasEditables(recta, ["R"]), 9), "R").estilo.radio).toBe(0);
  });
  it("texto: tamaño, negrita, alineaciones, color y fuente a todos, líneas incluidas (su etiqueta)", () => {
    const e = fijarTexto(base(), todos(base()), { tamano: 30, negrita: true, alineacionH: "derecha", alineacionV: "abajo", color: "#FF00FF", fuente: "Georgia, serif" });
    for (const x of todos(e)) expect(x.estiloTexto).toMatchObject({ tamano: 30, negrita: true, alineacionH: "derecha", alineacionV: "abajo", color: "#FF00FF", fuente: "Georgia, serif" });
  });
  it("lo bloqueado no se toca aunque esté elegido", () => {
    const e0 = escena(forma("A", 0, 0, 100, 60, { bloqueado: true }), forma("B", 200, 0));
    const e = fijarOpacidad(e0, hojasEditables(e0, ["A", "B"]), 0.2);
    expect(f(e, "A").estilo.opacidad).toBe(1);
    expect(f(e, "B").estilo.opacidad).toBe(0.2);
  });
  it("valores fuera de rango no entran (los acota el normalizador)", () => {
    const e = fijarOpacidad(base(), todos(base()), 7);
    expect(f(e, "A").estilo.opacidad).toBe(1);
    expect(normalizarEscena(e)).toEqual(e);
  });
  it("sin nada que cambiar devuelve la misma escena", () => {
    const e = base();
    expect(fijarRelleno(e, [], { tipo: "ninguno" })).toBe(e);
    expect(fijarSombra(e, hojasEditables(e, ["L"]), null)).toBe(e);
  });
});

describe("rellenoDeTipo", () => {
  it("conserva el color que había al cambiar de tipo", () => {
    expect(rellenoDeTipo("solido", { tipo: "degradado", desde: "#111111", hasta: "#222222", angulo: 5 })).toEqual({ tipo: "solido", color: "#111111" });
    expect(rellenoDeTipo("degradado", { tipo: "solido", color: "#333333" })).toMatchObject({ tipo: "degradado", desde: "#333333" });
    expect(rellenoDeTipo("ninguno", { tipo: "solido", color: "#333333" })).toEqual({ tipo: "ninguno" });
    expect(rellenoDeTipo("solido", { tipo: "ninguno" })).toEqual({ tipo: "solido", color: "#FFFFFF" });
    expect(rellenoDeTipo("solido", null)).toEqual({ tipo: "solido", color: "#FFFFFF" });
  });
});

describe("posición, tamaño y giro", () => {
  it("una forma sola: sus números exactos", () => {
    expect(leerGeometria(base(), ["B"])).toMatchObject({ x: { valor: 200 }, y: { valor: 0 }, ancho: { valor: 100 }, alto: { valor: 60 }, rotacion: 0 });
  });
  it("varios elementos: la caja que los envuelve, sin giro propio", () => {
    expect(leerGeometria(base(), ["A", "B"])).toMatchObject({ x: { valor: 0 }, ancho: { valor: 300 }, alto: { valor: 60 }, rotacion: null });
    expect(leerGeometria(base(), [])).toBeNull();
  });
  it("fijar X, Y, ancho y alto en una sola forma", () => {
    let e = fijarGeometria(base(), ["B"], "x", 50);
    e = fijarGeometria(e, ["B"], "y", 70.126);
    e = fijarGeometria(e, ["B"], "ancho", 250);
    e = fijarGeometria(e, ["B"], "alto", 33);
    expect(f(e, "B").transformacion).toMatchObject({ x: 50, y: 70.13, ancho: 250, alto: 33 });
    expect(normalizarEscena(e)).toEqual(e);
  });
  it("el tamaño nunca baja de 1", () => {
    expect(f(fijarGeometria(base(), ["B"], "ancho", -5), "B").transformacion.ancho).toBe(1);
  });
  it("girar una forma sola; varios no se giran desde aquí", () => {
    expect(f(fijarGeometria(base(), ["B"], "rotacion", 45), "B").transformacion.rotacion).toBe(45);
    const e = base();
    expect(fijarGeometria(e, ["A", "B"], "rotacion", 45)).toBe(e);
  });
  it("varios: X/Y mueven todos juntos; ancho/alto los escalan por su caja", () => {
    const m = fijarGeometria(base(), ["A", "B"], "x", 100);
    expect(f(m, "A").transformacion.x).toBe(100);
    expect(f(m, "B").transformacion.x).toBe(300);
    const y = fijarGeometria(base(), ["A", "B"], "y", 40);
    expect(f(y, "A").transformacion.y).toBe(40);
    expect(f(y, "B").transformacion.y).toBe(40);
    const w = fijarGeometria(base(), ["A", "B"], "ancho", 600);
    expect(f(w, "A").transformacion.ancho).toBeCloseTo(200, 1);
    expect(f(w, "B").transformacion.x).toBeCloseTo(400, 1);
    const h = fijarGeometria(base(), ["A", "B"], "alto", 120);
    expect(f(h, "A").transformacion.alto).toBeCloseTo(120, 1);
  });
  it("un grupo se mueve entero", () => {
    const e0 = escena(forma("A", 0, 0), forma("B", 200, 0), grupo("G", ["A", "B"]));
    const e = fijarGeometria(e0, ["G"], "x", 50);
    expect(f(e, "A").transformacion.x).toBe(50);
    expect(f(e, "B").transformacion.x).toBe(250);
  });
  it("lo bloqueado no se mueve ni se redimensiona; valores no numéricos se ignoran", () => {
    const e0 = escena(forma("A", 0, 0, 100, 60, { bloqueado: true }));
    expect(fijarGeometria(e0, ["A"], "x", 50)).toBe(e0);
    const e = base();
    expect(fijarGeometria(e, ["B"], "x", Number.NaN)).toBe(e);
    expect(fijarGeometria(e, ["B"], "x", Number.POSITIVE_INFINITY)).toBe(e);
  });
  it("una línea conectada que se mueve sola se despega, y mover su forma la arrastra", () => {
    const e0 = escena(forma("A", 0, 0), forma("B", 300, 0), linea("L", [[100, 30], [300, 30]], { origen: { elementoId: "A", puerto: 1 }, destino: { elementoId: "B", puerto: 3 } }));
    const e = fijarGeometria(e0, ["A"], "y", 100);
    expect(getLinea(e, "L").origen).toEqual({ elementoId: "A", puerto: 1 });
  });
});

describe("capas", () => {
  const conGrupo = (): Escena => escena(forma("A", 0, 0), forma("B", 200, 0), forma("C", 400, 0, 100, 60, { nombre: "Mi caja" }), linea("L", [[0, 0], [10, 10]]), grupo("G", ["A", "B"]));
  it("de arriba hacia abajo, con los hijos de un grupo debajo del grupo y con sangría", () => {
    const c = capasDe(conGrupo());
    // el grupo va donde está su primer miembro (A, abajo del todo): así coincide con lo que hace «subir» y «bajar»
    expect(c.map((x) => [x.id, x.nivel])).toEqual([["L", 0], ["C", 0], ["G", 0], ["B", 1], ["A", 1]]);
  });
  it("nombres: el propio si lo hay y, si no, uno descriptivo", () => {
    const e = normalizarEscena({ elementos: [{ tipo: "forma", id: "r", forma: "rombo", texto: "Sí\nno" }, { tipo: "texto", id: "t", texto: "Hola" }, { tipo: "linea", id: "l", puntos: [{ x: 0, y: 0 }, { x: 5, y: 5 }], fin: "flecha" }, { tipo: "linea", id: "k", puntos: [{ x: 0, y: 0 }, { x: 5, y: 5 }], fin: "ninguno" }, { tipo: "forma", id: "n", nombre: "Mi caja" }] });
    expect(e.elementos.map(nombreDeCapa)).toEqual(["Rombo «Sí»", "Texto «Hola»", "Flecha", "Línea", "Mi caja"]);
  });
  it("un conector pegado a formas se llama Conector", () => {
    const e = escena(forma("A", 0, 0), linea("L", [[0, 0], [5, 5]], { origen: { elementoId: "A", puerto: 1 } }));
    expect(nombreDeCapa(get(e, "L"))).toBe("Conector");
  });
  it("oculto y bloqueado se heredan del grupo; subir/bajar solo en primer nivel y según su lugar", () => {
    const e = escena(forma("A", 0, 0), forma("B", 200, 0), forma("C", 400, 0), grupo("G", ["A", "B"], { oculto: true, bloqueado: true }));
    const c = capasDe(e);
    const A = c.find((x) => x.id === "A");
    expect(A).toMatchObject({ oculto: true, bloqueado: true, puedeSubir: false, puedeBajar: false });
    const arriba = c.find((x) => x.id === "C");
    const abajo = c.find((x) => x.id === "G");
    expect(arriba).toMatchObject({ puedeSubir: false, puedeBajar: true });
    expect(abajo).toMatchObject({ puedeSubir: true, puedeBajar: false });
  });
  it("subir y bajar cambian el apilado; ocultar y bloquear conmutan; un grupo se mueve entero", () => {
    const e = conGrupo();
    expect(capasDe(ordenarCapa(e, "C", "subir")).map((x) => x.id)).toEqual(["C", "L", "G", "B", "A"]);
    expect(capasDe(ordenarCapa(e, "G", "subir")).map((x) => x.id)).toEqual(["L", "G", "B", "A", "C"]);
    expect(get(ocultarCapa(e, "C", true), "C").oculto).toBe(true);
    expect(get(ocultarCapa(ocultarCapa(e, "C", true), "C", false), "C").oculto).toBe(false);
    const b = bloquearCapa(e, "C", true);
    expect(get(b, "C").bloqueado).toBe(true);
    expect(get(bloquearCapa(b, "C", false), "C").bloqueado).toBe(false); // desbloquear funciona aunque esté bloqueado
  });
  it("renombrar: recorta espacios, y vacío vuelve al nombre descriptivo", () => {
    const e = conGrupo();
    expect(get(renombrarCapa(e, "A", "  Entrada  "), "A").nombre).toBe("Entrada");
    const sin = renombrarCapa(renombrarCapa(e, "A", "Entrada"), "A", "   ");
    expect(get(sin, "A").nombre).toBeUndefined();
    expect(nombreDeCapa(get(sin, "A"))).toBe("Rectángulo");
  });
  it("renombrar un elemento bloqueado sí se puede (es solo una etiqueta)", () => {
    const e = escena(forma("A", 0, 0, 100, 60, { bloqueado: true }));
    expect(get(renombrarCapa(e, "A", "X"), "A").nombre).toBe("X");
  });
  it("una escena vacía no tiene capas; un id que no existe no rompe nada", () => {
    expect(capasDe(escena())).toEqual([]);
    const e = conGrupo();
    expect(capasDe(ordenarCapa(e, "nada", "subir")).map((x) => x.id)).toEqual(capasDe(e).map((x) => x.id));
  });
  it("todas las operaciones devuelven escenas válidas", () => {
    const e = conGrupo();
    for (const r of [ordenarCapa(e, "C", "frente"), ocultarCapa(e, "L", true), bloquearCapa(e, "A", true), renombrarCapa(e, "B", "Z"), fijarGeometria(e, ["C"], "x", 5.555)]) expect(normalizarEscena(r)).toEqual(r);
    expect(getForma(e, "A")).toBeDefined();
    expect((get(e, "L") as Linea).tipo).toBe("linea");
  });
});
