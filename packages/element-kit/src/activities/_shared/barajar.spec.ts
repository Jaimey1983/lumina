/**
 * U7 — `barajar`: uniformidad, reproducibilidad con semilla, pureza y casos límite.
 * Más una guarda: el `sort` con comparador aleatorio no puede volver a `activities/`.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

import { barajar, barajarCon, combinarSemilla, crearAzar } from "./barajar.js";

afterEach(() => vi.restoreAllMocks());

/** Cuántas veces sale cada permutación de `base` en `n` barajados con `azar`. */
function frecuencias(base: number[], n: number, azar: () => number): Map<string, number> {
  const cuenta = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    const k = barajarCon(base, azar).join(",");
    cuenta.set(k, (cuenta.get(k) ?? 0) + 1);
  }
  return cuenta;
}

/** Estadístico chi² de una distribución uniforme sobre `categorias` resultados. */
function chi2(cuenta: Map<string, number>, categorias: number, n: number): number {
  const esperado = n / categorias;
  let total = 0;
  for (const v of cuenta.values()) total += (v - esperado) ** 2 / esperado;
  total += (categorias - cuenta.size) * esperado; // categorías que nunca salieron
  return total;
}

describe("crearAzar", () => {
  it("es determinista por semilla y queda en [0, 1)", () => {
    const a = crearAzar(42);
    const b = crearAzar(42);
    const xs = Array.from({ length: 1000 }, () => a());
    expect(xs).toEqual(Array.from({ length: 1000 }, () => b()));
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
    expect(crearAzar(43)()).not.toBe(crearAzar(42)());
  });
  it("tiene media cercana a 0,5", () => {
    const a = crearAzar(7);
    const media = Array.from({ length: 20_000 }, () => a()).reduce((s, x) => s + x, 0) / 20_000;
    expect(media).toBeGreaterThan(0.49);
    expect(media).toBeLessThan(0.51);
  });
});

describe("barajar — uniformidad", () => {
  // Con 3 y 4 elementos hay 6 y 24 órdenes. chi² con g.l. 5 y 23: valores críticos (p = 0,001) 20,5 y 49,7.
  it("3 elementos: los 6 órdenes salen con la misma frecuencia", () => {
    const n = 60_000;
    const cuenta = frecuencias([0, 1, 2], n, crearAzar(2026));
    expect(cuenta.size).toBe(6);
    expect(chi2(cuenta, 6, n)).toBeLessThan(20.5);
  });
  it("4 elementos: los 24 órdenes salen con la misma frecuencia", () => {
    const n = 120_000;
    const cuenta = frecuencias([0, 1, 2, 3], n, crearAzar(99));
    expect(cuenta.size).toBe(24);
    expect(chi2(cuenta, 24, n)).toBeLessThan(49.7);
  });
  it("cada elemento cae en cada posición con la misma probabilidad (5 elementos)", () => {
    const n = 50_000;
    const azar = crearAzar(5);
    const pos = Array.from({ length: 5 }, () => new Array(5).fill(0));
    for (let i = 0; i < n; i++) barajarCon([0, 1, 2, 3, 4], azar).forEach((v, p) => pos[v][p]++);
    for (const fila of pos) for (const c of fila) expect(Math.abs(c / (n / 5) - 1)).toBeLessThan(0.05);
  });
  it("con `Math.random` (sin semilla) también es uniforme", () => {
    vi.spyOn(Math, "random").mockImplementation(crearAzar(1234));
    const n = 60_000;
    const cuenta = new Map<string, number>();
    for (let i = 0; i < n; i++) {
      const k = barajar([0, 1, 2]).join(",");
      cuenta.set(k, (cuenta.get(k) ?? 0) + 1);
    }
    expect(chi2(cuenta, 6, n)).toBeLessThan(20.5);
  });
});

describe("barajar — semilla", () => {
  const mazo = Array.from({ length: 12 }, (_, i) => i);

  it("misma semilla ⇒ mismo orden, siempre", () => {
    expect(barajar(mazo, 123)).toEqual(barajar(mazo, 123));
    expect(barajar(mazo, 123, 4)).toEqual(barajar(mazo, 123, 4));
  });
  it("otra semilla o otra `sal` ⇒ otro orden", () => {
    const base = barajar(mazo, 123);
    expect(barajar(mazo, 124)).not.toEqual(base);
    expect(barajar(mazo, 123, 1)).not.toEqual(base);
    // y distintas `sal` dan órdenes distintos entre sí
    const ordenes = new Set(Array.from({ length: 10 }, (_, sal) => barajar(mazo, 123, sal).join()));
    expect(ordenes.size).toBe(10);
  });
  it("valor fijo conocido: el orden no cambia entre versiones ni navegadores", () => {
    // Valores medidos y congelados: si cambia el algoritmo, TODAS las partidas sembradas cambian.
    expect(barajar([1, 2, 3, 4, 5, 6, 7, 8], 7)).toEqual([8, 3, 5, 2, 7, 4, 1, 6]);
    expect(barajar(["a", "b", "c", "d", "e"], 1)).toEqual(["e", "b", "d", "a", "c"]);
  });
  it("la semilla 0, negativa o decimal es válida; no finita = sin semilla", () => {
    expect(barajar(mazo, 0)).toEqual(barajar(mazo, 0));
    expect(barajar(mazo, -5)).toEqual(barajar(mazo, -5));
    expect(barajar(mazo, 3.9)).toEqual(barajar(mazo, 3));
    vi.spyOn(Math, "random").mockImplementation(crearAzar(1));
    const sin = barajar(mazo);
    for (const raro of [null, undefined, NaN, Infinity]) {
      vi.spyOn(Math, "random").mockImplementation(crearAzar(1));
      expect(barajar(mazo, raro as never), String(raro)).toEqual(sin);
    }
  });
  it("sin semilla usa `Math.random`: dos llamadas dan órdenes distintos", () => {
    const original = [...mazo];
    const a = barajar(mazo);
    const b = barajar(mazo);
    expect(a).not.toEqual(b);
    expect(mazo).toEqual(original);
  });
  it("`combinarSemilla` separa semilla y sal", () => {
    expect(combinarSemilla(1, 0)).not.toBe(combinarSemilla(1, 1));
    expect(combinarSemilla(1, 2)).not.toBe(combinarSemilla(2, 1));
    expect(combinarSemilla(5)).toBe(combinarSemilla(5, 0));
  });
});

describe("barajar — pureza y límites", () => {
  it("devuelve una copia con los mismos elementos y no muta la entrada", () => {
    const entrada = Object.freeze([3, 1, 2, 5, 4]);
    const salida = barajar(entrada, 9);
    expect(salida).not.toBe(entrada);
    expect([...salida].sort()).toEqual([1, 2, 3, 4, 5]);
    expect(entrada).toEqual([3, 1, 2, 5, 4]);
  });
  it("vacío y de un elemento", () => {
    expect(barajar([], 1)).toEqual([]);
    expect(barajar(["x"], 1)).toEqual(["x"]);
    expect(barajar([], undefined)).toEqual([]);
  });
  it("conserva los elementos repetidos y los objetos por referencia", () => {
    const o1 = { id: 1 };
    const o2 = { id: 2 };
    const r = barajar([o1, o2, o1], 3);
    expect(r.filter((x) => x === o1)).toHaveLength(2);
    expect(r).toContain(o2);
  });
});

describe("guarda: el barajado sesgado no vuelve a `activities/`", () => {
  const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
  function archivos(dir: string): string[] {
    return readdirSync(dir).flatMap((n) => {
      const r = join(dir, n);
      return statSync(r).isDirectory() ? archivos(r) : /\.tsx?$/.test(n) && !/\.(spec|test)\./.test(n) ? [r] : [];
    });
  }
  it("ningún archivo baraja con un comparador aleatorio en `sort`", () => {
    const sucios = archivos(RAIZ)
      .filter((f) => /Math\.random\(\)\s*-\s*0\.5/.test(readFileSync(f, "utf-8")))
      .map((f) => relative(RAIZ, f));
    expect(sucios, "usar `barajar()` de _shared/barajar.ts").toEqual([]);
  });
});
