import { describe, expect, it } from "vitest";
import { normalizarEscena, type Escena, type Punto } from "@lumina/drawing";
import {
  RADIO_ESQUINA,
  RADIO_PUERTO_PX,
  TOLERANCIA_AGARRE_PX,
  agarreEn,
  agarresDeConector,
  avanzarConector,
  cambiarEsquinas,
  cambiarExtremo,
  cambiarTrazado,
  extremosLibres,
  hayConectorConExtremoLibre,
  hayExtremoLibre,
  iniciarConector,
  lineaUnica,
  lineasElegidas,
  pegarAlMasCercano,
  puertoMasCercanoElegible,
  quitarPuntoIntermedio,
  resolverPuntoDeLinea,
  sinConectoresQueSiguen,
  valorComun,
} from "./conectores.js";
import { escena, forma, getLinea, linea } from "./util-pruebas.js";

// Puertos de un rectángulo: 0 arriba, 1 derecha, 2 abajo, 3 izquierda.
const base = (extra: Record<string, unknown> = {}, id = "L"): Escena =>
  normalizarEscena(
    escena(
      forma("A", 100, 100),
      forma("B", 400, 260),
      linea(id, [[200, 130], [400, 290]], { trazado: "ortogonal", origen: { elementoId: "A", puerto: 1 }, destino: { elementoId: "B", puerto: 3 }, ...extra }),
    ),
  );
const entrada = (p: Punto, extra: Partial<{ imantado: Punto; zoom: number; sinImanDePuertos: boolean }> = {}) => ({ puntero: p, imantado: extra.imantado ?? p, zoom: extra.zoom ?? 1, sinImanDePuertos: extra.sinImanDePuertos ?? false });

describe("lineaUnica y lineasElegidas", () => {
  it("solo con exactamente una línea editable elegida", () => {
    const e = base();
    expect(lineaUnica(e, ["L"])?.id).toBe("L");
    expect(lineaUnica(e, [])).toBeNull();
    expect(lineaUnica(e, ["A"])).toBeNull();
    expect(lineaUnica(e, ["L", "A"])).toBeNull();
    expect(lineaUnica(e, ["nada"])).toBeNull();
  });
  it("una línea bloqueada (o en un grupo bloqueado) no ofrece asas", () => {
    const bloqueada = normalizarEscena(escena(linea("L", [[0, 0], [10, 10]], { bloqueado: true })));
    expect(lineaUnica(bloqueada, ["L"])).toBeNull();
    expect(lineasElegidas(bloqueada, ["L"])).toEqual([]);
  });
  it("la barra aparece si lo elegido son solo líneas", () => {
    const e = normalizarEscena(escena(forma("A", 0, 0), linea("L1", [[0, 0], [10, 10]]), linea("L2", [[0, 0], [20, 20]])));
    expect(lineasElegidas(e, ["L1", "L2"]).map((l) => l.id)).toEqual(["L1", "L2"]);
    expect(lineasElegidas(e, ["L1", "A"])).toEqual([]);
    expect(lineasElegidas(e, [])).toEqual([]);
  });
});

describe("asas de una línea", () => {
  it("dos extremos y una asa para crear un punto por tramo; con un punto intermedio, tres tramos menos uno", () => {
    const e = base();
    const l = getLinea(e, "L");
    expect(agarresDeConector(e, l).map((a) => a.tipo)).toEqual(["extremo", "extremo", "insertar"]);
    const con = normalizarEscena({ ...e, elementos: e.elementos.map((x) => (x.id === "L" && x.tipo === "linea" ? { ...x, puntos: [x.puntos[0], { x: 300, y: 50 }, x.puntos[1]] } : x)) as Escena["elementos"] });
    expect(agarresDeConector(con, getLinea(con, "L")).map((a) => a.tipo)).toEqual(["extremo", "extremo", "via", "insertar", "insertar"]);
  });
  it("los extremos están en los puertos y el de crear queda a mitad del recorrido real", () => {
    const e = base();
    const [origen, destino, insertar] = agarresDeConector(e, getLinea(e, "L"));
    expect(origen?.punto).toEqual({ x: 200, y: 130 });
    expect(destino?.punto).toEqual({ x: 400, y: 290 });
    // La «Z» tiene su mitad en el tramo vertical, no en la recta entre los extremos.
    expect(insertar?.punto).toEqual({ x: 300, y: 210 });
  });
  it("si un punto de crear cae sobre un extremo o un punto intermedio, gana el extremo o el punto", () => {
    const corta = normalizarEscena(escena(linea("L", [[100, 100], [110, 100]])));
    expect(agarreEn(corta, getLinea(corta, "L"), { x: 105, y: 100 }, 1)?.tipo).toBe("extremo");
    const conVia = normalizarEscena(escena(linea("L", [[0, 0], [10, 0], [20, 0]])));
    expect(agarreEn(conVia, getLinea(conVia, "L"), { x: 10, y: 0 }, 1)).toMatchObject({ tipo: "via", indice: 1 });
  });
  it("agarreEn respeta la tolerancia en píxeles de pantalla y da prioridad a extremos y puntos sobre los de crear", () => {
    const e = base();
    const l = getLinea(e, "L");
    const tol = TOLERANCIA_AGARRE_PX;
    expect(agarreEn(e, l, { x: 200 + tol - 1, y: 130 }, 1)).toMatchObject({ tipo: "extremo", cual: "origen" });
    expect(agarreEn(e, l, { x: 200 + tol + 1, y: 130 }, 1)).toBeNull();
    // con zoom 2 la tolerancia en la escena es la mitad
    expect(agarreEn(e, l, { x: 200 + tol - 1, y: 130 }, 2)).toBeNull();
    expect(agarreEn(e, l, { x: 400, y: 290 }, 1)).toMatchObject({ tipo: "extremo", cual: "destino" });
    expect(agarreEn(e, l, { x: 300, y: 212 }, 1)).toMatchObject({ tipo: "insertar", tramo: 0 });
    expect(agarreEn(e, l, { x: 500, y: 500 }, 1)).toBeNull();
  });
});

describe("arrastrar un extremo", () => {
  it("cerca de un puerto se pega y avisa de cuál; lejos queda libre; Ctrl no pega", () => {
    const e = base();
    const g = iniciarConector(e, "L", { tipo: "extremo", cual: "destino", punto: { x: 400, y: 290 } });
    const cerca = avanzarConector(g, entrada({ x: 152, y: 98 })); // puerto de arriba de A
    expect(cerca.puerto).toMatchObject({ elementoId: "A", puerto: 0 });
    expect(getLinea(cerca.escena, "L").destino).toEqual({ elementoId: "A", puerto: 0 });
    expect(getLinea(cerca.escena, "L").puntos[1]).toEqual({ x: 150, y: 100 });
    const lejos = avanzarConector(g, entrada({ x: 700, y: 500 }));
    expect(lejos.puerto).toBeNull();
    expect(getLinea(lejos.escena, "L").destino).toBeUndefined();
    expect(getLinea(lejos.escena, "L").puntos[1]).toEqual({ x: 700, y: 500 });
    const sinIman = avanzarConector(g, entrada({ x: 152, y: 98 }, { sinImanDePuertos: true }));
    expect(sinIman.puerto).toBeNull();
    expect(getLinea(sinIman.escena, "L").destino).toBeUndefined();
    expect(getLinea(sinIman.escena, "L").origen).toEqual({ elementoId: "A", puerto: 1 });
  });
  it("deja al día el otro extremo aunque la escena llegara con los puntos viejos", () => {
    const vieja = normalizarEscena(escena(forma("A", 100, 100), forma("B", 400, 260), linea("L", [[0, 0], [1, 1]], { origen: { elementoId: "A", puerto: 1 }, destino: { elementoId: "B", puerto: 3 } })));
    const g = iniciarConector(vieja, "L", { tipo: "extremo", cual: "destino", punto: { x: 400, y: 290 } });
    const r = avanzarConector(g, entrada({ x: 700, y: 500 }));
    expect(getLinea(r.escena, "L").puntos).toEqual([{ x: 200, y: 130 }, { x: 700, y: 500 }]);
    const v = avanzarConector(iniciarConector(vieja, "L", { tipo: "insertar", tramo: 0, punto: { x: 300, y: 210 } }), entrada({ x: 310, y: 60 }));
    expect(getLinea(v.escena, "L").puntos).toEqual([{ x: 200, y: 130 }, { x: 310, y: 60 }, { x: 400, y: 290 }]);
  });
  it("el radio del imán son píxeles de pantalla: con más zoom hay que acercarse más", () => {
    const e = base();
    const g = iniciarConector(e, "L", { tipo: "extremo", cual: "destino", punto: { x: 400, y: 290 } });
    const a = RADIO_PUERTO_PX - 2;
    expect(avanzarConector(g, entrada({ x: 150 + a, y: 100 }, { zoom: 1 })).puerto).not.toBeNull();
    expect(avanzarConector(g, entrada({ x: 150 + a, y: 100 }, { zoom: 4 })).puerto).toBeNull();
  });
  it("lo que queda libre usa el punto imantado, no el del puntero", () => {
    const e = base();
    const g = iniciarConector(e, "L", { tipo: "extremo", cual: "destino", punto: { x: 400, y: 290 } });
    const r = avanzarConector(g, entrada({ x: 703, y: 497 }, { imantado: { x: 700, y: 500 } }));
    expect(getLinea(r.escena, "L").puntos[1]).toEqual({ x: 700, y: 500 });
  });
  it("cada fotograma parte de la escena inicial: no acumula nada", () => {
    const e = base();
    const g = iniciarConector(e, "L", { tipo: "extremo", cual: "destino", punto: { x: 400, y: 290 } });
    avanzarConector(g, entrada({ x: 700, y: 500 }));
    const vuelta = avanzarConector(g, entrada({ x: 400, y: 290 }));
    expect(getLinea(vuelta.escena, "L")).toEqual(getLinea(e, "L"));
    expect(g.base).toBe(e);
  });
});

describe("puntos intermedios", () => {
  it("arrastrar el asa de crear agrega un punto que sigue al puntero; arrastrar un punto lo mueve; doble clic lo quita", () => {
    const e = base();
    const insertar = iniciarConector(e, "L", { tipo: "insertar", tramo: 0, punto: { x: 300, y: 210 } });
    const a = avanzarConector(insertar, entrada({ x: 310, y: 60 })).escena;
    expect(getLinea(a, "L").puntos).toEqual([{ x: 200, y: 130 }, { x: 310, y: 60 }, { x: 400, y: 290 }]);
    const b = avanzarConector(iniciarConector(a, "L", { tipo: "via", indice: 1, punto: { x: 310, y: 60 } }), entrada({ x: 320, y: 70 })).escena;
    expect(getLinea(b, "L").puntos[1]).toEqual({ x: 320, y: 70 });
    const c = quitarPuntoIntermedio(b, "L", 1);
    expect(getLinea(c, "L").puntos).toEqual([{ x: 200, y: 130 }, { x: 400, y: 290 }]);
  });
  it("los extremos pegados no se mueven al mover un punto intermedio", () => {
    const e = base();
    const a = avanzarConector(iniciarConector(e, "L", { tipo: "insertar", tramo: 0, punto: { x: 300, y: 210 } }), entrada({ x: 310, y: 60 })).escena;
    expect(getLinea(a, "L").origen).toEqual({ elementoId: "A", puerto: 1 });
    expect(getLinea(a, "L").destino).toEqual({ elementoId: "B", puerto: 3 });
  });
});

describe("al dibujar una línea", () => {
  const e = base();
  it("el punto cae en el puerto cercano; si no, imantado; Mayús restringe solo lo que no está pegado", () => {
    const sobre = resolverPuntoDeLinea(e, { x: 203, y: 128 }, { x: 203, y: 128 }, { zoom: 1, sinImanDePuertos: false });
    expect(sobre.puerto).toMatchObject({ elementoId: "A", puerto: 1 });
    expect(sobre.punto).toEqual({ x: 200, y: 130 });
    const libre = resolverPuntoDeLinea(e, { x: 700, y: 500 }, { x: 700, y: 500 }, { zoom: 1, sinImanDePuertos: false, restringir: (p) => ({ x: p.x, y: 0 }) });
    expect(libre.puerto).toBeNull();
    expect(libre.punto).toEqual({ x: 700, y: 0 });
    const pegado = resolverPuntoDeLinea(e, { x: 203, y: 128 }, { x: 203, y: 128 }, { zoom: 1, sinImanDePuertos: false, restringir: (p) => ({ x: p.x, y: 0 }) });
    expect(pegado.punto).toEqual({ x: 200, y: 130 });
    const ctrl = resolverPuntoDeLinea(e, { x: 203, y: 128 }, { x: 203, y: 128 }, { zoom: 1, sinImanDePuertos: true });
    expect(ctrl.puerto).toBeNull();
    expect(ctrl.punto).toEqual({ x: 203, y: 128 });
  });
});

describe("barra del conector", () => {
  const e = base();
  it("cambiar el trazado, los extremos y las esquinas actúa sobre todas las líneas elegidas", () => {
    const dos = normalizarEscena({ ...e, elementos: [...e.elementos, { ...getLinea(e, "L"), id: "M" }] });
    const t = cambiarTrazado(dos, ["L", "M"], "curvo");
    expect(getLinea(t, "L").trazado).toBe("curvo");
    expect(getLinea(t, "M").trazado).toBe("curvo");
    const x = cambiarExtremo(dos, ["L", "M"], "fin", "circulo");
    expect(getLinea(x, "M").fin).toBe("circulo");
    expect(getLinea(x, "M").inicio).toBe("ninguno");
    const r = cambiarEsquinas(dos, ["L", "M"], true);
    expect(getLinea(r, "L").estilo.radio).toBe(RADIO_ESQUINA);
    expect(getLinea(cambiarEsquinas(r, ["L"], false), "L").estilo.radio).toBe(0);
    expect(getLinea(cambiarEsquinas(r, ["L"], false), "M").estilo.radio).toBe(RADIO_ESQUINA);
  });
  it("poner lo que ya está así no cambia la escena (el historial lo descarta)", () => {
    expect(cambiarTrazado(e, ["L"], "ortogonal")).toEqual(e);
    expect(cambiarExtremo(e, ["L"], "fin", getLinea(e, "L").fin)).toEqual(e);
  });
  it("valorComun devuelve el valor compartido o null si hay mezcla", () => {
    const dos = normalizarEscena({ ...e, elementos: [...e.elementos, { ...getLinea(e, "L"), id: "M", trazado: "curvo" }] });
    const ls = [getLinea(dos, "L"), getLinea(dos, "M")];
    expect(valorComun(ls, (l) => l.fin)).toBe("flecha");
    expect(valorComun(ls, (l) => l.trazado)).toBeNull();
    expect(valorComun([], (l) => l.fin)).toBeNull();
  });
});

describe("extremo libre y pegar al más cercano (Y10)", () => {
  it("el estado libre solo cuenta extremos sin conexión", () => {
    const e = base();
    expect(hayExtremoLibre(getLinea(e, "L"))).toBe(false);
    expect(extremosLibres(getLinea(e, "L"))).toEqual([]);
    expect(hayConectorConExtremoLibre(e, ["L"])).toBe(false);
    const suelta = normalizarEscena(escena(forma("A", 100, 100), linea("L", [[200, 130], [400, 290]], { origen: { elementoId: "A", puerto: 1 } })));
    expect(extremosLibres(getLinea(suelta, "L"))).toEqual(["destino"]);
    expect(hayConectorConExtremoLibre(suelta, ["L"])).toBe(true);
    expect(hayConectorConExtremoLibre(suelta, ["A"])).toBe(false);
  });

  it("pega el extremo libre al puerto más cercano, no al más lejano", () => {
    // Destino libre en (210, 130): a 10 px del puerto derecho de A (200,130) y a 190 del izquierdo de B (400,290).
    const e = normalizarEscena(
      escena(forma("A", 100, 100), forma("B", 400, 260), linea("L", [[200, 130], [210, 130]], { origen: { elementoId: "A", puerto: 1 } })),
    );
    const r = pegarAlMasCercano(e, ["L"]);
    expect(getLinea(r, "L").destino).toEqual({ elementoId: "A", puerto: 1 });
    expect(getLinea(r, "L").origen).toEqual({ elementoId: "A", puerto: 1 });
  });

  it("no pega a una forma bloqueada ni oculta; elige la siguiente más cercana", () => {
    // Extremo libre en (350, 130): más cerca de B (400,130 izq) que de A (200,130 der).
    const e = normalizarEscena(
      escena(
        forma("A", 100, 100),
        forma("B", 400, 100, 100, 60, { bloqueado: true }),
        linea("L", [[200, 130], [350, 130]], { origen: { elementoId: "A", puerto: 1 } }),
      ),
    );
    expect(pegarAlMasCercano(e, ["L"]).elementos.find((x) => x.id === "L")).toMatchObject({ destino: { elementoId: "A", puerto: 1 } });
    const oculta = normalizarEscena(
      escena(
        forma("A", 100, 100),
        forma("B", 400, 100, 100, 60, { oculto: true }),
        linea("L", [[200, 130], [350, 130]], { origen: { elementoId: "A", puerto: 1 } }),
      ),
    );
    expect(getLinea(pegarAlMasCercano(oculta, ["L"]), "L").destino).toEqual({ elementoId: "A", puerto: 1 });
  });

  it("sin formas elegibles no cambia la escena; tampoco pega a la propia línea", () => {
    const sola = normalizarEscena(escena(linea("L", [[10, 10], [80, 80]])));
    expect(pegarAlMasCercano(sola, ["L"])).toBe(sola);
    expect(puertoMasCercanoElegible(sola, { x: 10, y: 10 }, "L")).toBeNull();
    const e = base();
    expect(pegarAlMasCercano(e, ["L"])).toBe(e);
  });

  it("pega los dos extremos libres en un solo paso", () => {
    const e = normalizarEscena(escena(forma("A", 100, 100), forma("B", 400, 260), linea("L", [[205, 130], [395, 290]])));
    const r = pegarAlMasCercano(e, ["L"]);
    expect(getLinea(r, "L").origen).toEqual({ elementoId: "A", puerto: 1 });
    expect(getLinea(r, "L").destino).toEqual({ elementoId: "B", puerto: 3 });
  });
});

describe("sinConectoresQueSiguen", () => {
  const e = base();
  it("quita las líneas pegadas a una forma elegida y deja lo demás en su orden", () => {
    expect(sinConectoresQueSiguen(e, ["A", "B", "L"])).toEqual(["A", "B"]);
    expect(sinConectoresQueSiguen(e, ["L", "A"])).toEqual(["A"]);
  });
  it("una línea pegada solo a formas que no están elegidas se queda (se mueve sola)", () => {
    expect(sinConectoresQueSiguen(e, ["L"])).toEqual(["L"]);
    const libre = normalizarEscena(escena(forma("A", 0, 0), linea("M", [[0, 0], [10, 10]])));
    expect(sinConectoresQueSiguen(libre, ["A", "M"])).toEqual(["A", "M"]);
  });
  it("cuenta las formas que van dentro de un grupo elegido", () => {
    const g = normalizarEscena({ ...e, elementos: [...e.elementos, { id: "G", tipo: "grupo", hijos: ["A", "B"] }] });
    expect(sinConectoresQueSiguen(g, ["G", "L"])).toEqual(["G"]);
  });
});
