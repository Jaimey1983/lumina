import { describe, expect, it } from "vitest";
import { analizarEsquema, MAX_NODOS_ESQUEMA } from "./esquema-a-escena.js";

const padres = (t: string, o?: { primeraLineaEsTema?: boolean }): Array<number | null> => analizarEsquema(t, o).nodos.map((n) => n.padre);

describe("analizarEsquema: la jerarquía de Y36", () => {
  it("encabezados: árbol con una raíz", () => {
    expect(padres("# Tema\n## Idea 1\n### Detalle\n## Idea 2")).toEqual([null, 0, 1, 0]);
  });
  it("numeración sin sangría: árbol con una raíz por cada «1.»", () => {
    expect(padres("1. Tema\n1.1 Idea\n1.1.1 Detalle\n1.2 Otra")).toEqual([null, 0, 1, 0]);
    expect(padres("1. A\n1.1 B\n2. C\n2.1 D")).toEqual([null, 0, null, 2]);
  });
  it("el nivel real es la profundidad, aunque el marcador salte", () => {
    const e = analizarEsquema("# A\n### B");
    expect(e.nodos.map((n) => n.nivel)).toEqual([0, 1]);
  });
  it("lo ya escrito con sangría y numeración se lee como antes", () => {
    expect(padres("1. Uno\n  2) Dos\n    1.1. Tres")).toEqual([null, 0, 1]);
  });
});

describe("analizarEsquema: sinJerarquia", () => {
  it("3 o más líneas sin ninguna señal → sin jerarquía", () => {
    expect(analizarEsquema("A\nB\nC").sinJerarquia).toBe(true);
    expect(analizarEsquema("- A\n- B\n- C\n- D").sinJerarquia).toBe(true);
  });
  it("2 líneas no avisan (umbral de 3)", () => {
    expect(analizarEsquema("A\nB").sinJerarquia).toBe(false);
  });
  it("una sola señal basta para no avisar", () => {
    expect(analizarEsquema("A\n  B\nC").sinJerarquia).toBe(false);
    expect(analizarEsquema("# A\nB\nC").sinJerarquia).toBe(false);
    expect(analizarEsquema("1. A\n1.1 B\n2. C").sinJerarquia).toBe(false);
  });
  it("un bosque con jerarquía no avisa", () => {
    expect(analizarEsquema("A\n  a\nB\n  b").sinJerarquia).toBe(false);
  });
  it("vacío no avisa", () => {
    expect(analizarEsquema("").sinJerarquia).toBe(false);
  });
});

describe("analizarEsquema: primeraLineaEsTema", () => {
  const plano = "La célula\nMembrana\nNúcleo\nCitoplasma";
  it("la primera es la única raíz y las demás cuelgan de ella", () => {
    const e = analizarEsquema(plano, { primeraLineaEsTema: true });
    expect(e.nodos.map((n) => n.padre)).toEqual([null, 0, 0, 0]);
    expect(e.raices).toBe(1);
    expect(e.niveles).toBe(2);
  });
  it("las ramas son una por hijo y la raíz no tiene rama", () => {
    const e = analizarEsquema("Tema\nA\n  a1\nB", { primeraLineaEsTema: true });
    expect(e.nodos.map((n) => n.rama)).toEqual([null, 0, 0, 1]);
    expect(e.nodos.map((n) => n.padre)).toEqual([null, 0, 1, 0]);
  });
  it("conserva la estructura que ya tenían las demás líneas (solo las sube un nivel)", () => {
    const e = analizarEsquema("Tema\nA\n  a1\n  a2\nB", { primeraLineaEsTema: true });
    expect(e.nodos.map((n) => n.nivel)).toEqual([0, 1, 2, 2, 1]);
  });
  it("con la opción el resultado ya no marca «sin jerarquía»", () => {
    expect(analizarEsquema(plano, { primeraLineaEsTema: true }).sinJerarquia).toBe(false);
  });
  it("sin la opción (o en falso) el análisis es el de siempre", () => {
    expect(analizarEsquema(plano)).toEqual(analizarEsquema(plano, { primeraLineaEsTema: false }));
    expect(padres(plano)).toEqual([null, null, null, null]);
  });
  it("vacío sigue vacío", () => {
    expect(analizarEsquema("", { primeraLineaEsTema: true }).nodos).toEqual([]);
  });
  it("respeta el tope de nodos y cuenta los sobrantes", () => {
    const texto = Array.from({ length: MAX_NODOS_ESQUEMA + 5 }, (_v, i) => `N${i}`).join("\n");
    const e = analizarEsquema(texto, { primeraLineaEsTema: true });
    expect(e.nodos).toHaveLength(MAX_NODOS_ESQUEMA);
    expect(e.sobrantes).toBe(5);
  });
});

describe("rendimiento (DW9)", () => {
  it("200 líneas con encabezados, numeración y sangría mezclados se analizan sin diferencia con 20", () => {
    const linea = (i: number): string => (i % 4 === 0 ? `# Tema ${i}` : i % 4 === 1 ? `${i}. Punto\n${i}.1 Subpunto` : i % 4 === 2 ? `  - detalle ${i}` : `- suelto ${i}`);
    const armar = (n: number): string => Array.from({ length: n }, (_v, i) => linea(i)).join("\n");
    const medir = (t: string): number => {
      for (let i = 0; i < 3; i++) analizarEsquema(t);
      const m: number[] = [];
      for (let i = 0; i < 7; i++) {
        const a = performance.now();
        analizarEsquema(t);
        m.push(performance.now() - a);
      }
      return [...m].sort((x, y) => x - y)[3] as number;
    };
    const chico = medir(armar(20));
    const grande = medir(armar(200));
    expect(grande).toBeLessThan(Math.max(chico, 0.05) * 30); // 10× las líneas: lineal ≈10×, cuadrático ≈100×
    expect(grande).toBeLessThan(100);
  });
});
