// Ayudas solo para las pruebas de la disposición (no se publican: ver tsconfig.build.json).
import type { NodoDisposicion, Posiciones } from './grafo.js';

/** Generador pseudoaleatorio con semilla (mulberry32): las pruebas «de azar» son siempre las mismas. */
export function azar(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Un árbol al azar de `n` nodos de tamaños distintos: el nodo i cuelga de uno anterior. */
export function arbolAlAzar(n: number, semilla: number): { nodos: NodoDisposicion[]; aristas: Array<{ desde: string; hasta: string }> } {
  const r = azar(semilla);
  const nodos: NodoDisposicion[] = Array.from({ length: n }, (_, i) => ({ id: `n${i}`, x: 0, y: 0, ancho: 30 + Math.floor(r() * 200), alto: 20 + Math.floor(r() * 120) }));
  const aristas: Array<{ desde: string; hasta: string }> = [];
  for (let i = 1; i < n; i++) aristas.push({ desde: `n${Math.floor(r() * i)}`, hasta: `n${i}` });
  return { nodos, aristas };
}

/** Parejas de nodos cuyos rectángulos se pisan (se aceptan los que solo se tocan por el borde). */
export function solapes(nodos: readonly NodoDisposicion[], posiciones: Posiciones): Array<[string, string]> {
  const malos: Array<[string, string]> = [];
  for (let i = 0; i < nodos.length; i++) {
    for (let j = i + 1; j < nodos.length; j++) {
      const a = nodos[i] as NodoDisposicion;
      const b = nodos[j] as NodoDisposicion;
      const pa = posiciones.get(a.id);
      const pb = posiciones.get(b.id);
      if (!pa || !pb) continue;
      const pisa = pa.x < pb.x + b.ancho - 1e-6 && pb.x < pa.x + a.ancho - 1e-6 && pa.y < pb.y + b.alto - 1e-6 && pb.y < pa.y + a.alto - 1e-6;
      if (pisa) malos.push([a.id, b.id]);
    }
  }
  return malos;
}
