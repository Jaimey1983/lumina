import { describe, expect, it } from "vitest";
import { agregarGuia, guiaCerca, guiasParaImantar, MAX_GUIAS, marcasDeRegla, moverGuia, PX_ENTRE_NUMEROS, pasoDeRegla, quitarGuia, textoDeMarca, type GuiaUsuario } from "./reglas.js";
import { ZOOM_MAX, ZOOM_MIN } from "./vista.js";

const ZOOMS = [0.1, 0.25, 0.3, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 8];

describe("pasoDeRegla", () => {
  it("es siempre un 1, 2 o 5 por una potencia de diez", () => {
    for (const z of ZOOMS) {
      const p = pasoDeRegla(z);
      const mantisa = p / Math.pow(10, Math.floor(Math.log10(p) + 1e-9));
      expect([1, 2, 5], `zoom ${z} → paso ${p}`).toContain(Math.round(mantisa * 1e6) / 1e6);
    }
  });
  it("deja al menos 60 px entre números, y no más del doble de lo necesario", () => {
    for (const z of ZOOMS) {
      const p = pasoDeRegla(z);
      expect(p * z, `zoom ${z}`).toBeGreaterThanOrEqual(PX_ENTRE_NUMEROS - 1e-6);
      expect(p * z, `zoom ${z}`).toBeLessThanOrEqual(PX_ENTRE_NUMEROS * 2.5 + 1e-6);
    }
  });
  it("valores conocidos", () => {
    expect(pasoDeRegla(1)).toBe(100);
    expect(pasoDeRegla(0.25)).toBe(500);
    expect(pasoDeRegla(4)).toBe(20);
    expect(pasoDeRegla(2)).toBe(50);
    expect(pasoDeRegla(8)).toBe(10);
    expect(pasoDeRegla(0.1)).toBe(1000);
  });
  it("crece al alejar y baja al acercar (monótono)", () => {
    let previo = Infinity;
    for (const z of [...ZOOMS].sort((a, b) => a - b)) {
      const p = pasoDeRegla(z);
      expect(p).toBeLessThanOrEqual(previo);
      previo = p;
    }
  });
  it("un zoom raro no se cuelga ni da cero", () => {
    for (const z of [0, -1, NaN, Infinity]) expect(pasoDeRegla(z)).toBeGreaterThan(0);
  });
  it("cubre el rango real del editor", () => {
    expect(pasoDeRegla(ZOOM_MIN)).toBeGreaterThan(0);
    expect(pasoDeRegla(ZOOM_MAX)).toBeGreaterThan(0);
  });
});

describe("marcasDeRegla", () => {
  it("de 0 a 1000 con zoom 1: números cada 100 y rayitas cada 20", () => {
    const m = marcasDeRegla(1, 0, 1000);
    expect(m.filter((x) => x.mayor).map((x) => x.valor)).toEqual([0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]);
    expect(m.length).toBe(51);
    expect(m.slice(0, 6).map((x) => x.valor)).toEqual([0, 20, 40, 60, 80, 100]);
  });

  it("en todos los zooms: en orden, sin repetir, sin huecos y con rayitas que no se amontonan", () => {
    for (const z of ZOOMS) {
      const marcas = marcasDeRegla(z, -137.3, 1893.7);
      const valores = marcas.map((x) => x.valor);
      expect(valores, `zoom ${z}`).toEqual([...valores].sort((a, b) => a - b));
      expect(new Set(valores).size, `zoom ${z}`).toBe(valores.length);
      // Sin huecos: la distancia entre marcas es siempre la misma.
      const saltos = new Set(valores.slice(1).map((v, i) => Math.round((v - (valores[i] as number)) * 1e6) / 1e6));
      expect(saltos.size, `zoom ${z}`).toBe(1);
      const salto = [...saltos][0] as number;
      // Ni se superponen (≥ 5 px entre rayitas) ni se dispersan.
      expect(salto * z, `zoom ${z}`).toBeGreaterThanOrEqual(5);
      // Cubre todo lo visible.
      expect(valores[0] as number, `zoom ${z}`).toBeLessThanOrEqual(-137.3);
      expect(valores[valores.length - 1] as number, `zoom ${z}`).toBeGreaterThanOrEqual(1893.7);
      // Las que llevan número están separadas por el paso.
      const mayores = marcas.filter((x) => x.mayor).map((x) => x.valor);
      for (let i = 1; i < mayores.length; i++) expect(Math.round(((mayores[i] as number) - (mayores[i - 1] as number)) * 1e6) / 1e6, `zoom ${z}`).toBe(pasoDeRegla(z));
    }
  });

  it("las marcas con número son múltiplos exactos del paso (sin ruido de coma flotante)", () => {
    for (const z of ZOOMS) {
      const p = pasoDeRegla(z);
      for (const m of marcasDeRegla(z, 0, 5000).filter((x) => x.mayor)) expect(Math.round((m.valor / p) * 1e6) / 1e6 % 1, `zoom ${z} valor ${m.valor}`).toBe(0);
    }
  });

  it("con mucho zoom las rayitas caen en valores redondos (0,5; 1; 2…)", () => {
    for (const m of marcasDeRegla(8, 0, 50)) expect(Number.isInteger(m.valor * 10) || Number.isInteger(m.valor), `valor ${m.valor}`).toBe(true);
  });

  it("las rayitas caen siempre en valores redondos: con paso 20 van cada 5, con 200 cada 50, con 50 cada 10", () => {
    const salto = (z: number): number => {
      const v = marcasDeRegla(z, 0, 2000).map((m) => m.valor);
      return (v[1] as number) - (v[0] as number);
    };
    expect([pasoDeRegla(4), salto(4)]).toEqual([20, 5]);
    expect([pasoDeRegla(0.3), salto(0.3)]).toEqual([200, 50]);
    expect([pasoDeRegla(2), salto(2)]).toEqual([50, 10]);
    expect([pasoDeRegla(1), salto(1)]).toEqual([100, 20]);
  });

  it("rangos raros: vacío o al revés no revientan", () => {
    expect(marcasDeRegla(1, 10, 5)).toEqual([]);
    expect(marcasDeRegla(1, NaN, 5)).toEqual([]);
    expect(marcasDeRegla(1, 100, 100).length).toBeGreaterThanOrEqual(1);
  });

  it("negativos incluidos", () => {
    const m = marcasDeRegla(1, -250, 0).filter((x) => x.mayor).map((x) => x.valor);
    expect(m).toEqual([-300, -200, -100, 0].slice(m[0] === -300 ? 0 : 1));
    expect(m).toContain(-200);
  });
});

describe("textoDeMarca", () => {
  it("enteros sin decimales y con coma decimal", () => {
    expect(textoDeMarca(100)).toBe("100");
    expect(textoDeMarca(0.5)).toBe("0,5");
    expect(textoDeMarca(-20)).toBe("-20");
    expect(textoDeMarca(0.30000000000000004)).toBe("0,3");
  });
});

describe("guías", () => {
  it("agregar: ids nuevos y posición redondeada", () => {
    const a = agregarGuia([], "vertical", 100.4) as GuiaUsuario[];
    expect(a).toEqual([{ id: 1, orientacion: "vertical", posicion: 100 }]);
    const b = agregarGuia(a, "horizontal", 50.6) as GuiaUsuario[];
    expect(b.map((g) => [g.id, g.orientacion, g.posicion])).toEqual([[1, "vertical", 100], [2, "horizontal", 51]]);
  });
  it("un id no se reutiliza al quitar la del medio", () => {
    let g = agregarGuia(agregarGuia(agregarGuia([], "vertical", 1) as GuiaUsuario[], "vertical", 2) as GuiaUsuario[], "vertical", 3) as GuiaUsuario[];
    g = quitarGuia(g, 2);
    expect((agregarGuia(g, "vertical", 4) as GuiaUsuario[]).map((x) => x.id)).toEqual([1, 3, 4]);
  });
  it("tope de 50: la guía 50 entra y la 51 no", () => {
    let g: GuiaUsuario[] = [];
    for (let i = 0; i < MAX_GUIAS; i++) g = agregarGuia(g, "vertical", i) as GuiaUsuario[];
    expect(g).toHaveLength(50);
    expect(agregarGuia(g, "vertical", 99)).toBeNull();
  });
  it("una posición que no es un número no crea nada", () => {
    expect(agregarGuia([], "vertical", NaN)).toBeNull();
    expect(moverGuia([{ id: 1, orientacion: "vertical", posicion: 5 }], 1, NaN)).toEqual([{ id: 1, orientacion: "vertical", posicion: 5 }]);
  });
  it("mover cambia solo esa guía; quitar, solo esa", () => {
    const g: GuiaUsuario[] = [{ id: 1, orientacion: "vertical", posicion: 10 }, { id: 2, orientacion: "horizontal", posicion: 20 }];
    expect(moverGuia(g, 2, 33.2)).toEqual([g[0], { id: 2, orientacion: "horizontal", posicion: 33 }]);
    expect(quitarGuia(g, 1)).toEqual([g[1]]);
    expect(quitarGuia(g, 99)).toEqual(g);
    expect(g[1]?.posicion).toBe(20); // inmutable
  });
  it("guiaCerca: la más cercana dentro de la tolerancia, según su orientación", () => {
    const g: GuiaUsuario[] = [{ id: 1, orientacion: "vertical", posicion: 100 }, { id: 2, orientacion: "horizontal", posicion: 200 }, { id: 3, orientacion: "vertical", posicion: 103 }];
    expect(guiaCerca(g, { x: 102, y: 0 }, 4)?.id).toBe(3);
    // Sin importar el orden en que estén (gana la de menor distancia, no la última que entra).
    expect(guiaCerca([g[2] as GuiaUsuario, g[0] as GuiaUsuario], { x: 101, y: 0 }, 4)?.id).toBe(1);
    expect(guiaCerca([g[2] as GuiaUsuario, g[0] as GuiaUsuario], { x: 102.6, y: 0 }, 4)?.id).toBe(3);
    expect(guiaCerca([g[0] as GuiaUsuario, g[2] as GuiaUsuario], { x: 100.4, y: 0 }, 4)?.id).toBe(1);
    expect(guiaCerca(g, { x: 0, y: 198 }, 4)?.id).toBe(2);
    expect(guiaCerca(g, { x: 150, y: 0 }, 4)).toBeNull();
    // Una vertical solo mira x, aunque y coincida con una horizontal.
    expect(guiaCerca(g, { x: 50, y: 200 }, 4)?.id).toBe(2);
    expect(guiaCerca([], { x: 0, y: 0 }, 4)).toBeNull();
  });
  it("guiasParaImantar no lleva el id", () => {
    expect(guiasParaImantar([{ id: 7, orientacion: "vertical", posicion: 5 }])).toEqual([{ orientacion: "vertical", posicion: 5 }]);
  });
});
