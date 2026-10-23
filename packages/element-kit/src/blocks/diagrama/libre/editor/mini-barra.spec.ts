import { describe, expect, it } from "vitest";
import type { Escena } from "@lumina/drawing";
import { DISTANCIA_ASA_HIJO_PX, RADIO_ASA_HIJO_PX } from "./hijo-rapido.js";
import { DISTANCIA_ASA_ROTAR_PX, posicionesDeAsas, type Marco } from "./asas.js";
import { circulosDeAsasHijo, controlesDeMiniBarra, MARGEN_MINI_BARRA_PX, MITAD_ASA_PX, miniBarraVisible, posicionDeMiniBarra, type EstadoOcultar } from "./mini-barra.js";
import { alternarTexto, hojasDeFormato } from "./propiedades.js";
import { escena, forma, getForma, grupo, linea } from "./util-pruebas.js";
import { escenaAPantalla, type Vista } from "./vista.js";

const marco = (x: number, y: number, ancho: number, alto: number, rotacion = 0): Marco => ({ x, y, ancho, alto, rotacion, editable: true });
const TAMANO = { ancho: 300, alto: 40 };
const VENTANA = { ancho: 1000, alto: 600 };
const AIRE = MITAD_ASA_PX + MARGEN_MINI_BARRA_PX;

/** Caja en pantalla de todas las asas (con su mitad) y del marco: lo que la barra no puede pisar. */
function cajaProhibida(m: Marco, v: Vista): { izq: number; der: number; arr: number; aba: number } {
  const p = Object.values(posicionesDeAsas(m, v.zoom)).map((q) => escenaAPantalla(v, q));
  return {
    izq: Math.min(...p.map((q) => q.x)) - MITAD_ASA_PX,
    der: Math.max(...p.map((q) => q.x)) + MITAD_ASA_PX,
    arr: Math.min(...p.map((q) => q.y)) - MITAD_ASA_PX,
    aba: Math.max(...p.map((q) => q.y)) + MITAD_ASA_PX,
  };
}
const cruza = (pos: { x: number; y: number }, c: ReturnType<typeof cajaProhibida>): boolean =>
  pos.x < c.der && pos.x + TAMANO.ancho > c.izq && pos.y < c.aba && pos.y + TAMANO.alto > c.arr;

describe("posicionDeMiniBarra", () => {
  it("con los «+» de hijo rápido a la vista, queda por encima del de arriba (o por debajo del de abajo), nunca encima", () => {
    const e = escena(forma("a", 400, 300, 100, 60));
    const v = { zoom: 1, x: 0, y: 0 };
    const m = marco(400, 300, 100, 60);
    const circulos = circulosDeAsasHijo(e, ["a"], v, false);
    expect(circulos).toHaveLength(4);
    const arriba = posicionDeMiniBarra(m, v, VENTANA, TAMANO, circulos);
    expect(arriba.lado).toBe("arriba");
    expect(arriba.y + TAMANO.alto).toBeLessThanOrEqual(300 - DISTANCIA_ASA_HIJO_PX - RADIO_ASA_HIJO_PX - MARGEN_MINI_BARRA_PX + 1e-9);
    // sin sitio arriba: va debajo del «+» de abajo
    const abajo = posicionDeMiniBarra(marco(400, 20, 100, 60), v, VENTANA, TAMANO, circulosDeAsasHijo(escena(forma("a", 400, 20, 100, 60)), ["a"], v, false));
    expect(abajo.lado).toBe("abajo");
    expect(abajo.y).toBeGreaterThanOrEqual(80 + DISTANCIA_ASA_HIJO_PX + RADIO_ASA_HIJO_PX + MARGEN_MINI_BARRA_PX - 1e-9);
  });

  it("los «+» solo cuentan con una forma elegida (no con varias, un conector o un grupo) y su radio crece en táctil", () => {
    const e = escena(forma("a", 0, 0), forma("b", 200, 0), linea("l", [[0, 100], [100, 100]]));
    const v = { zoom: 2, x: 10, y: 10 };
    expect(circulosDeAsasHijo(e, ["a", "b"], v, false)).toEqual([]);
    expect(circulosDeAsasHijo(e, ["l"], v, false)).toEqual([]);
    const uno = circulosDeAsasHijo(e, ["a"], v, false);
    const tactil = circulosDeAsasHijo(e, ["a"], v, true);
    expect(uno[0]?.radio).toBe(RADIO_ASA_HIJO_PX);
    expect(tactil[0]?.radio).toBeGreaterThan(RADIO_ASA_HIJO_PX);
    // a 44 px de pantalla del borde de la forma, sea cual sea el zoom
    expect(uno[0]?.y).toBeCloseTo(10 + 0 * 2 - DISTANCIA_ASA_HIJO_PX, 6);
  });

  it("va centrada encima y por encima del asa de rotar", () => {
    const v = { zoom: 1, x: 0, y: 0 };
    const p = posicionDeMiniBarra(marco(400, 300, 100, 60), v, VENTANA, TAMANO);
    expect(p.lado).toBe("arriba");
    expect(p.x).toBe(450 - TAMANO.ancho / 2);
    // el asa de rotar está a DISTANCIA_ASA_ROTAR_PX por encima del borde; la barra queda por encima de ella, con aire
    expect(p.y).toBe(300 - DISTANCIA_ASA_ROTAR_PX - AIRE - TAMANO.alto);
  });

  it("si no cabe arriba, va debajo, a un asa y un margen del borde de abajo", () => {
    const v = { zoom: 1, x: 0, y: 0 };
    const p = posicionDeMiniBarra(marco(400, 20, 100, 60), v, VENTANA, TAMANO);
    expect(p.lado).toBe("abajo");
    expect(p.y).toBe(80 + AIRE);
  });

  it("si no cabe ni arriba ni abajo, se pega al borde de arriba de la ventana", () => {
    const v = { zoom: 1, x: 0, y: 0 };
    const p = posicionDeMiniBarra(marco(10, 10, 980, 580), v, VENTANA, TAMANO);
    expect(p).toMatchObject({ lado: "borde", y: 0 });
  });

  it("se recorta en horizontal: nunca sale de la ventana", () => {
    const v = { zoom: 1, x: 0, y: 0 };
    expect(posicionDeMiniBarra(marco(0, 300, 40, 40), v, VENTANA, TAMANO).x).toBe(0);
    expect(posicionDeMiniBarra(marco(960, 300, 40, 40), v, VENTANA, TAMANO).x).toBe(VENTANA.ancho - TAMANO.ancho);
    expect(posicionDeMiniBarra(marco(400, 300, 40, 40), v, { ancho: 200, alto: 600 }, TAMANO).x).toBe(0);
  });

  it("no cambia de tamaño con el zoom y sigue a la selección al desplazar y al acercar", () => {
    for (const v of [
      { zoom: 0.1, x: 400, y: 250 },
      { zoom: 1, x: -120, y: 90 },
      { zoom: 8, x: -3000, y: -1700 },
    ]) {
      const m = marco(400, 300, 100, 60);
      const caja = cajaProhibida(m, v);
      const p = posicionDeMiniBarra(m, v, VENTANA, TAMANO);
      const centro = (escenaAPantalla(v, { x: 450, y: 330 }).x);
      if (p.lado === "arriba") {
        expect(p.x).toBeCloseTo(Math.max(0, Math.min(centro - TAMANO.ancho / 2, VENTANA.ancho - TAMANO.ancho)), 6);
        expect(p.y + TAMANO.alto).toBeLessThanOrEqual(caja.arr - MARGEN_MINI_BARRA_PX + 1e-6);
      }
      if (p.lado !== "borde") expect(cruza(p, caja)).toBe(false);
    }
  });

  it("nunca cruza el marco ni sus asas (arriba o debajo), con y sin giro, en muchas posiciones", () => {
    for (const rotacion of [0, 30, 90, 215]) {
      for (const zoom of [0.1, 0.5, 1, 3, 8]) {
        for (const [x, y] of [[0, 0], [100, 40], [500, 300], [900, 520], [30, 560]] as const) {
          const v = { zoom, x: 200 - x * zoom * 0.3, y: 100 - y * zoom * 0.3 };
          const m = marco(x, y, 80, 50, rotacion);
          const p = posicionDeMiniBarra(m, v, VENTANA, TAMANO);
          if (p.lado === "borde") continue;
          expect(cruza(p, cajaProhibida(m, v))).toBe(false);
          expect(p.x).toBeGreaterThanOrEqual(0);
          expect(p.x + TAMANO.ancho).toBeLessThanOrEqual(VENTANA.ancho);
        }
      }
    }
  });
});

const ESTADO_QUIETO: EstadoOcultar = { gestoEnCurso: false, edicionDeTexto: false, pincel: false, otraHerramienta: false, menuContextual: false, dialogo: false };

describe("miniBarraVisible", () => {
  it("se ve con algo que formatear y nada en curso", () => {
    expect(miniBarraVisible(true, ESTADO_QUIETO)).toBe(true);
  });
  it("no se ve sin controles", () => {
    expect(miniBarraVisible(false, ESTADO_QUIETO)).toBe(false);
  });
  it.each(Object.keys(ESTADO_QUIETO) as Array<keyof EstadoOcultar>)("se esconde con «%s»", (clave) => {
    expect(miniBarraVisible(true, { ...ESTADO_QUIETO, [clave]: true })).toBe(false);
  });
});

const texto = (id: string, extra: Record<string, unknown> = {}): Record<string, unknown> => ({ id, tipo: "texto", texto: "hola", transformacion: { x: 10, y: 10, ancho: 100, alto: 30, rotacion: 0 }, ...extra });

describe("controlesDeMiniBarra", () => {
  const base = (): Escena =>
    escena(
      forma("a", 0, 0, 100, 60, { estilo: { relleno: { tipo: "solido", color: "#FF0000" }, contorno: { color: "#111111", grosor: 2, patron: "solido" } } }),
      forma("b", 200, 0, 100, 60, { estilo: { relleno: { tipo: "solido", color: "#00FF00" } }, estiloTexto: { negrita: true, tamano: 24 } }),
      texto("t"),
      linea("l", [[0, 100], [100, 100]]),
      forma("c", 0, 300, 100, 60, { bloqueado: true }),
      grupo("g", ["a", "b"]),
    );

  it("una forma: relleno, contorno, grosor, tamaño, formato y alineación, sin «mixto»", () => {
    const c = controlesDeMiniBarra(base(), ["a"]);
    expect(c).toMatchObject({ relleno: { mixto: false, valor: "#FF0000" }, contorno: { mixto: false, valor: "#111111" }, grosor: { mixto: false, valor: 2 }, negrita: { mixto: false, valor: false } });
  });

  it("dos formas distintas: «Mixto» donde difiere y el valor donde coincide", () => {
    const c = controlesDeMiniBarra(base(), ["a", "b"]);
    expect(c?.relleno).toEqual({ mixto: true });
    expect(c?.negrita).toEqual({ mixto: true });
    expect(c?.tamano).toEqual({ mixto: true });
    expect(c?.alineacion).toMatchObject({ mixto: false });
  });

  it("un grupo aporta las hojas que contiene", () => {
    expect(controlesDeMiniBarra(base(), ["g"])?.relleno).toEqual({ mixto: true });
    expect(hojasDeFormato(base(), ["g"]).map((h) => h.id)).toEqual(["a", "b"]);
  });

  it("un texto también se puede rellenar: sin color de relleno por defecto", () => {
    expect(controlesDeMiniBarra(base(), ["t"])?.relleno).toEqual({ mixto: false, valor: "" });
  });

  it("forma y conector juntos: la barra sirve a ambos, pero el relleno solo a la forma", () => {
    const c = controlesDeMiniBarra(base(), ["a", "l"]);
    expect(c?.relleno).toEqual({ mixto: false, valor: "#FF0000" }); // la línea no cuenta para el relleno
    expect(hojasDeFormato(base(), ["a", "l"]).map((h) => h.id)).toEqual(["a", "l"]);
  });

  it("solo conectores, todo bloqueado o nada elegido: no hay barra", () => {
    expect(controlesDeMiniBarra(base(), ["l"])).toBeNull();
    expect(controlesDeMiniBarra(base(), ["c"])).toBeNull();
    expect(controlesDeMiniBarra(base(), [])).toBeNull();
  });

  it("con 500 elementos elegidos calcular los controles y la posición tarda menos de 2 ms (DW9)", () => {
    const muchos = escena(...Array.from({ length: 500 }, (_, i) => forma(`f${i}`, (i % 25) * 30, Math.floor(i / 25) * 30, 20, 20)));
    const sel = muchos.elementos.map((e) => e.id);
    const m = marco(0, 0, 750, 600);
    const una = (): void => {
      controlesDeMiniBarra(muchos, sel);
      posicionDeMiniBarra(m, { zoom: 1, x: 0, y: 0 }, VENTANA, TAMANO);
    };
    for (let i = 0; i < 20; i++) una(); // calentamiento
    const tiempos: number[] = [];
    for (let i = 0; i < 15; i++) {
      const t0 = performance.now();
      una();
      tiempos.push(performance.now() - t0);
    }
    tiempos.sort((a, b) => a - b);
    expect(tiempos[Math.floor(tiempos.length / 2)]).toBeLessThan(2);
  });
});

describe("alternarTexto", () => {
  const e0 = (): Escena => escena(forma("a", 0, 0), forma("b", 200, 0, 100, 60, { estiloTexto: { negrita: true } }), linea("l", [[0, 100], [100, 100]]));

  it("lo pone en todo lo elegido si no lo tiene, y lo quita si todo lo tiene", () => {
    const puesto = alternarTexto(e0(), ["a"], "negrita");
    expect(getForma(puesto, "a").estiloTexto.negrita).toBe(true);
    expect(getForma(alternarTexto(puesto, ["a"], "negrita"), "a").estiloTexto.negrita).toBe(false);
  });

  it("con valores mezclados lo pone en todo (no cuenta como activo)", () => {
    const r = alternarTexto(e0(), ["a", "b"], "negrita");
    expect(getForma(r, "a").estiloTexto.negrita).toBe(true);
    expect(getForma(r, "b").estiloTexto.negrita).toBe(true);
  });

  it("subrayado y cursiva son independientes de la negrita", () => {
    const r = alternarTexto(alternarTexto(e0(), ["a"], "cursiva"), ["a"], "subrayado");
    expect(getForma(r, "a").estiloTexto).toMatchObject({ cursiva: true, subrayado: true, negrita: false });
  });

  it("solo conectores: no cambia nada (devuelve la misma escena)", () => {
    const e = e0();
    expect(alternarTexto(e, ["l"], "negrita")).toBe(e);
  });
});
