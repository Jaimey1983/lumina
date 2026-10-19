import { describe, expect, it } from "vitest";
import { normalizarEscena, FORMAS, TIPOS_FORMA } from "@lumina/drawing";
import {
  TAMANO_MINIMO,
  areaDeTexto,
  cajaArrastrada,
  cajaPorDefecto,
  conMinimo,
  entradaForma,
  entradaLinea,
  entradaTexto,
  esClic,
  esMismaHerramienta,
  restringirAngulo,
} from "./herramientas.js";
import { escena, forma, get, linea } from "./util-pruebas.js";

describe("cajaArrastrada", () => {
  it("es la misma caja sin importar en qué dirección se arrastre", () => {
    const a = { x: 100, y: 100 };
    const b = { x: 40, y: 30 };
    expect(cajaArrastrada(a, b)).toEqual({ x: 40, y: 30, ancho: 60, alto: 70 });
    expect(cajaArrastrada(b, a)).toEqual({ x: 40, y: 30, ancho: 60, alto: 70 });
    expect(cajaArrastrada({ x: 0, y: 100 }, { x: 50, y: 20 })).toEqual({ x: 0, y: 20, ancho: 50, alto: 80 });
  });
  it("Mayús: cuadrado con el lado mayor, hacia donde se arrastra", () => {
    expect(cajaArrastrada({ x: 100, y: 100 }, { x: 160, y: 120 }, { proporcional: true })).toEqual({ x: 100, y: 100, ancho: 60, alto: 60 });
    expect(cajaArrastrada({ x: 100, y: 100 }, { x: 70, y: 40 }, { proporcional: true })).toEqual({ x: 40, y: 40, ancho: 60, alto: 60 });
  });
  it("Alt: el punto de partida es el centro", () => {
    expect(cajaArrastrada({ x: 100, y: 100 }, { x: 130, y: 120 }, { desdeCentro: true })).toEqual({ x: 70, y: 80, ancho: 60, alto: 40 });
  });
  it("sin movimiento: caja vacía; con Mayús tampoco explota", () => {
    expect(cajaArrastrada({ x: 5, y: 5 }, { x: 5, y: 5 })).toEqual({ x: 5, y: 5, ancho: 0, alto: 0 });
    expect(cajaArrastrada({ x: 5, y: 5 }, { x: 5, y: 5 }, { proporcional: true }).ancho).toBe(0);
  });
});

describe("clic o arrastre", () => {
  it("esClic: menos de 4 en ambos lados", () => {
    expect(esClic({ ancho: 0, alto: 0 })).toBe(true);
    expect(esClic({ ancho: 3, alto: 3.9 })).toBe(true);
    expect(esClic({ ancho: 4, alto: 0 })).toBe(false);
    expect(esClic({ ancho: 0, alto: 10 })).toBe(false);
  });
  it("cajaPorDefecto: el tamaño de la forma, centrada en el punto", () => {
    for (const f of TIPOS_FORMA) {
      const c = cajaPorDefecto(f, { x: 500, y: 300 });
      expect(c.ancho).toBe(FORMAS[f].tamano.ancho);
      expect(c.alto).toBe(FORMAS[f].tamano.alto);
      expect(c.x + c.ancho / 2).toBe(500);
      expect(c.y + c.alto / 2).toBe(300);
    }
  });
  it("conMinimo: lo dibujado nunca queda más chico que el mínimo", () => {
    expect(conMinimo({ x: 1, y: 2, ancho: 3, alto: 100 })).toEqual({ x: 1, y: 2, ancho: TAMANO_MINIMO, alto: 100 });
    expect(conMinimo({ x: 1, y: 2, ancho: 50, alto: 5 }, 24)).toEqual({ x: 1, y: 2, ancho: 50, alto: 24 });
  });
});

describe("restringirAngulo", () => {
  it("lleva el tramo al múltiplo de 15° más cercano conservando el largo", () => {
    const r = restringirAngulo({ x: 0, y: 0 }, { x: 100, y: 10 });
    expect(r.y).toBeCloseTo(Math.hypot(100, 10) * Math.sin((0 * Math.PI) / 180), 6); // 5,7° → 0°
    expect(r.x).toBeCloseTo(Math.hypot(100, 10), 6);
    const d = restringirAngulo({ x: 0, y: 0 }, { x: 70, y: 72 }); // ≈ 45,8° → 45°
    expect(d.x).toBeCloseTo(d.y, 6);
    expect(Math.hypot(d.x, d.y)).toBeCloseTo(Math.hypot(70, 72), 6);
    const v = restringirAngulo({ x: 10, y: 10 }, { x: 12, y: 200 });
    expect(v.x).toBeCloseTo(10, 6);
  });
  it("sin largo no hace nada", () => {
    expect(restringirAngulo({ x: 3, y: 3 }, { x: 3, y: 3 })).toEqual({ x: 3, y: 3 });
  });
});

describe("entradas", () => {
  it("entradaForma y entradaTexto llevan la caja a la transformación, sin giro", () => {
    const c = { x: 10, y: 20, ancho: 30, alto: 40 };
    expect(entradaForma("rombo", c)).toEqual({ tipo: "forma", forma: "rombo", transformacion: { ...c, rotacion: 0 } });
    expect(entradaTexto(c, "Hola")).toEqual({ tipo: "texto", texto: "Hola", transformacion: { ...c, rotacion: 0 } });
  });
  it("entradaLinea: recta, con o sin flecha, copiando los puntos", () => {
    const puntos = [{ x: 0, y: 0 }, { x: 10, y: 10 }];
    const a = entradaLinea(puntos, true);
    expect(a).toMatchObject({ tipo: "linea", trazado: "recto", fin: "flecha", inicio: "ninguno" });
    expect(entradaLinea(puntos, false)).toMatchObject({ fin: "ninguno" });
    expect(a.puntos).not.toBe(puntos);
  });
  it("esMismaHerramienta distingue forma, línea y flecha", () => {
    expect(esMismaHerramienta({ tipo: "texto" }, { tipo: "texto" })).toBe(true);
    expect(esMismaHerramienta({ tipo: "forma", forma: "rombo" }, { tipo: "forma", forma: "rombo" })).toBe(true);
    expect(esMismaHerramienta({ tipo: "forma", forma: "rombo" }, { tipo: "forma", forma: "elipse" })).toBe(false);
    expect(esMismaHerramienta({ tipo: "linea", flecha: true }, { tipo: "linea", flecha: false })).toBe(false);
    expect(esMismaHerramienta({ tipo: "seleccionar" }, { tipo: "texto" })).toBe(false);
  });
});

describe("areaDeTexto", () => {
  it("forma: la zona de texto de la forma (no toda la caja), con el giro de la forma", () => {
    const e = escena(forma("r", 100, 100, 200, 100, { forma: "rombo", texto: "Hola", transformacion: { x: 100, y: 100, ancho: 200, alto: 100, rotacion: 30 } }));
    const a = areaDeTexto(e, get(e, "r"));
    expect(a?.texto).toBe("Hola");
    expect(a?.rotacion).toBe(30);
    expect(a?.centro).toEqual({ x: 200, y: 150 });
    // El rombo escribe en su rectángulo interior: más chico que la caja y centrado.
    expect(a?.caja.ancho).toBeLessThan(200);
    expect(a?.caja.alto).toBeLessThan(100);
    expect((a?.caja.x ?? 0) + (a?.caja.ancho ?? 0) / 2).toBeCloseTo(200, 6);
  });
  it("texto: toda su caja", () => {
    const e = normalizarEscena({ elementos: [{ id: "t", tipo: "texto", texto: "Hola", transformacion: { x: 10, y: 20, ancho: 80, alto: 30, rotacion: 0 } }] });
    expect(areaDeTexto(e, get(e, "t"))?.caja).toEqual({ x: 10, y: 20, ancho: 80, alto: 30 });
  });
  it("línea: el rótulo va en el punto medio del recorrido, también con varios puntos y con extremos conectados", () => {
    const e = escena(linea("l", [[0, 0], [100, 0]]));
    expect(areaDeTexto(e, get(e, "l"))?.centro).toEqual({ x: 50, y: 0 });
    const poli = escena(linea("p", [[0, 0], [100, 0], [100, 100]]));
    expect(areaDeTexto(poli, get(poli, "p"))?.centro).toEqual({ x: 100, y: 0 });
    const c = escena(forma("f", 0, 0, 100, 100), linea("c", [[500, 500], [300, 50]], { origen: { elementoId: "f", puerto: 1 } }));
    // El origen se pega al puerto derecho de la forma (100, 50); el destino queda en (300, 50): el medio es (200, 50).
    expect(areaDeTexto(c, get(c, "c"))?.centro).toEqual({ x: 200, y: 50 });
  });
  it("un grupo no tiene texto", () => {
    const e = escena(forma("a", 0, 0), forma("b", 0, 0), { id: "g", tipo: "grupo", hijos: ["a", "b"] });
    expect(areaDeTexto(e, get(e, "g"))).toBeNull();
  });
});
