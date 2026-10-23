import { describe, expect, it } from "vitest";
import { FORMAS, TIPOS_FORMA, asasDeAjuste, type Escena, type Forma, type TipoForma } from "@lumina/drawing";
import { posicionesDeAsas } from "./asas.js";
import {
  DESPLAZAMIENTO_ASA_AJUSTE_PX,
  TOLERANCIA_ASA_AJUSTE_PX,
  asaAjusteEn,
  asasAjusteEnPantalla,
  formaConAsasAjuste,
  textoDeValor,
  type ContextoAsasAjuste,
} from "./asas-ajuste.js";
import { SELECCIONAR } from "./herramientas.js";
import { escena, forma, grupo, linea } from "./util-pruebas.js";
import { escenaAPantalla } from "./vista.js";

const CON_ASAS = TIPOS_FORMA.filter((t) => (FORMAS[t].asasAjuste?.length ?? 0) > 0);
const una = (tipo: TipoForma, extra: Record<string, unknown> = {}, rotacion = 0, ancho = 160, alto = 100): Forma =>
  escena(forma("a", 100, 100, ancho, alto, { forma: tipo, ...extra, transformacion: { x: 100, y: 100, ancho, alto, rotacion } })).elementos[0] as Forma;

const ctx = (e: Escena, seleccion: string[], extra: Partial<ContextoAsasAjuste> = {}): ContextoAsasAjuste => ({
  escena: e,
  herramienta: SELECCIONAR,
  seleccion,
  gestoEnCurso: false,
  edicionAbierta: false,
  menuAbierto: false,
  pincel: false,
  ...extra,
});

describe("formaConAsasAjuste: cuándo se ven", () => {
  const e = escena(
    forma("t", 0, 0, 160, 100, { forma: "trapecio" }),
    forma("r", 300, 0, 160, 100, { forma: "rombo" }),
    forma("b", 600, 0, 160, 100, { forma: "trapecio", bloqueado: true }),
    forma("o", 0, 300, 160, 100, { forma: "trapecio", oculto: true }),
    forma("g1", 0, 500, 100, 60, { forma: "trapecio" }),
    forma("g2", 200, 500, 100, 60),
    grupo("g", ["g1", "g2"]),
    linea("l", [[0, 700], [100, 700]]),
  );
  it("con una sola forma editable con asas", () => {
    expect(formaConAsasAjuste(ctx(e, ["t"]))?.id).toBe("t");
  });
  it.each([
    ["una forma sin asas (rombo)", ["r"]],
    ["una forma bloqueada", ["b"]],
    ["una forma oculta", ["o"]],
    ["un grupo", ["g"]],
    ["un conector", ["l"]],
    ["varias formas", ["t", "r"]],
    ["nada elegido", []],
  ])("no con %s", (_n, sel) => {
    expect(formaConAsasAjuste(ctx(e, sel))).toBeNull();
  });
  it.each(["gestoEnCurso", "edicionAbierta", "menuAbierto", "pincel"] as const)("no con «%s»", (clave) => {
    expect(formaConAsasAjuste(ctx(e, ["t"], { [clave]: true }))).toBeNull();
  });
  it("no con otra herramienta", () => {
    expect(formaConAsasAjuste(ctx(e, ["t"], { herramienta: { tipo: "linea", flecha: false } }))).toBeNull();
  });
});

describe("asasAjusteEnPantalla", () => {
  it("el asa se mete 14 px hacia dentro de su borde, sea cual sea el zoom", () => {
    for (const zoom of [0.5, 1, 4]) {
      const f = una("trapecio");
      const v = { zoom, x: 20, y: 30 };
      const [asa] = asasAjusteEnPantalla(f, v);
      const borde = escenaAPantalla(v, asasDeAjuste(f)[0]!.borde);
      expect(asa?.centro.x).toBeCloseTo(borde.x, 6);
      expect(asa?.centro.y).toBeCloseTo(borde.y + DESPLAZAMIENTO_ASA_AJUSTE_PX, 6); // «arriba»: hacia abajo
    }
  });
  it("en una forma pequeña no pasa del centro", () => {
    const f = una("trapecio", {}, 0, 160, 10);
    const [asa] = asasAjusteEnPantalla(f, { zoom: 1, x: 0, y: 0 });
    expect(asa?.centro.y).toBeCloseTo(100 + 5, 6); // la mitad del alto, no 14
  });
  it("sigue el giro de la forma", () => {
    const sin = asasAjusteEnPantalla(una("trapecio"), { zoom: 1, x: 0, y: 0 })[0]!;
    const g = asasAjusteEnPantalla(una("trapecio", {}, 90), { zoom: 1, x: 0, y: 0 })[0]!;
    const c = { x: 180, y: 150 };
    // girar 90° el vector (centro − centro_forma) da la posición del asa de la forma girada
    const v = { x: sin.centro.x - c.x, y: sin.centro.y - c.y };
    expect(g.centro.x).toBeCloseTo(c.x - v.y, 6);
    expect(g.centro.y).toBeCloseTo(c.y + v.x, 6);
  });
});

describe("asaAjusteEn", () => {
  it("agarra el asa dentro de la tolerancia y no fuera de ella", () => {
    const f = una("trapecio");
    const v = { zoom: 2, x: 0, y: 0 };
    const centro = asasAjusteEnPantalla(f, v)[0]!.centro;
    const aEscena = (dx: number, dy: number) => ({ x: (centro.x + dx) / 2, y: (centro.y + dy) / 2 });
    expect(asaAjusteEn(f, aEscena(0, 0), v, false)?.clave).toBe("inclinacion");
    expect(asaAjusteEn(f, aEscena(TOLERANCIA_ASA_AJUSTE_PX - 0.5, 0), v, false)).not.toBeNull();
    expect(asaAjusteEn(f, aEscena(TOLERANCIA_ASA_AJUSTE_PX + 2, 0), v, false)).toBeNull();
    expect(asaAjusteEn(f, aEscena(TOLERANCIA_ASA_AJUSTE_PX + 2, 0), v, true)).not.toBeNull(); // con el dedo, más tolerancia
  });
  it("con dos asas cercanas gana la más cercana", () => {
    const f = una("flecha-derecha");
    const v = { zoom: 1, x: 0, y: 0 };
    const [cabeza, cuerpo] = asasAjusteEnPantalla(f, v) as [ReturnType<typeof asasAjusteEnPantalla>[0], ReturnType<typeof asasAjusteEnPantalla>[0]];
    expect(asaAjusteEn(f, cabeza.centro, v, false)?.clave).toBe("cabeza");
    expect(asaAjusteEn(f, cuerpo.centro, v, false)?.clave).toBe("cuerpo");
  });
});

describe("el asa no coincide con las asas de redimensionar ni de girar", () => {
  it("en las 14 formas, con el valor en su mínimo y en su máximo, con giro y con zoom", () => {
    let comprobados = 0;
    for (const t of CON_ASAS) {
      for (const rotacion of [0, 33, 90, 180]) {
        for (const zoom of [0.5, 1, 4]) {
          for (const extremo of ["min", "max"] as const) {
            const valores: Record<string, number> = {};
            for (const p of FORMAS[t].parametros) valores[p.clave] = extremo === "min" ? p.min : p.max;
            const extra = t === "rectangulo" ? { estilo: { radio: extremo === "min" ? 0 : 50 } } : { parametros: valores };
            const f = una(t, extra, rotacion);
            const v = { zoom, x: 10, y: 10 };
            const marco = { x: 100, y: 100, ancho: 160, alto: 100, rotacion, editable: true };
            const asas = Object.values(posicionesDeAsas(marco, zoom)).map((p) => escenaAPantalla(v, p));
            for (const a of asasAjusteEnPantalla(f, v)) {
              for (const p of asas) {
                expect(Math.hypot(a.centro.x - p.x, a.centro.y - p.y), `${t} ${a.clave} ${extremo} ${rotacion}° zoom ${zoom}`).toBeGreaterThanOrEqual(10);
              }
              comprobados++;
            }
          }
        }
      }
    }
    expect(comprobados).toBeGreaterThan(14 * 4 * 3 * 2);
  });
});

describe("textoDeValor", () => {
  it("hasta dos decimales con coma", () => {
    expect(textoDeValor(0.25)).toBe("0,25");
    expect(textoDeValor(0.333333)).toBe("0,33");
    expect(textoDeValor(12)).toBe("12");
  });
});
