// ─── Disposición radial (Y13) ─────────────────────────────────────────────────
// Puro. La raíz al centro y cada nivel en un anillo; el ángulo de cada rama es proporcional a sus hojas.

import { bosqueDe, type AristaDisposicion, type NodoDisposicion, type Posiciones } from './grafo.js';

export interface OpcionesRadial {
  /** Hueco mínimo entre dos nodos (se mide entre los círculos que envuelven a cada uno). */
  separacion?: number;
}

const DOS_PI = Math.PI * 2;

interface Punto {
  x: number;
  y: number;
}

/**
 * Cada árbol del bosque con su raíz al centro; los árboles van uno al lado del otro. Los nodos se tratan como círculos
 * (el que envuelve al rectángulo), así que dos nodos que no se tocan como círculos tampoco se tocan como rectángulos.
 */
export function disponerRadial(nodos: readonly NodoDisposicion[], aristas: readonly AristaDisposicion[], opciones: OpcionesRadial = {}): Posiciones {
  const hueco = opciones.separacion ?? 40;
  const porId = new Map(nodos.map((n) => [n.id, n]));
  const radioDe = (id: string): number => {
    const n = porId.get(id) as NodoDisposicion;
    return Math.hypot(n.ancho, n.alto) / 2;
  };
  const { raices, hijos } = bosqueDe(nodos, aristas);

  const posiciones: Posiciones = new Map();
  let origenX = 0;
  for (const raiz of raices) {
    const centros = disponerUnArbol(raiz, hijos, radioDe, hueco);
    // Caja del árbol (con el tamaño real de cada nodo) para ponerlo al lado del anterior.
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    for (const [id, c] of centros) {
      const n = porId.get(id) as NodoDisposicion;
      minX = Math.min(minX, c.x - n.ancho / 2);
      maxX = Math.max(maxX, c.x + n.ancho / 2);
      minY = Math.min(minY, c.y - n.alto / 2);
    }
    const dx = origenX - minX;
    const dy = -minY;
    for (const [id, c] of centros) {
      const n = porId.get(id) as NodoDisposicion;
      posiciones.set(id, { x: c.x + dx - n.ancho / 2, y: c.y + dy - n.alto / 2 });
    }
    origenX += maxX - minX + hueco * 3;
  }
  return posiciones;
}

/** Los centros de un árbol con su raíz en (0, 0). */
function disponerUnArbol(raiz: string, hijos: ReadonlyMap<string, string[]>, radioDe: (id: string) => number, hueco: number): Map<string, Punto> {
  // Hojas de cada subárbol: reparten el ángulo.
  const hojas = new Map<string, number>();
  const contar = (id: string): number => {
    const hs = hijos.get(id) ?? [];
    const n = hs.length === 0 ? 1 : hs.reduce((suma, h) => suma + contar(h), 0);
    hojas.set(id, n);
    return n;
  };
  contar(raiz);

  // Ángulo de cada nodo y su nivel.
  const angulo = new Map<string, number>();
  const niveles: string[][] = [];
  const repartir = (id: string, desde: number, hasta: number, nivel: number): void => {
    angulo.set(id, (desde + hasta) / 2);
    (niveles[nivel] ??= []).push(id);
    const hs = hijos.get(id) ?? [];
    const total = hojas.get(id) ?? 1;
    let cursor = desde;
    for (const h of hs) {
      const parte = ((hojas.get(h) ?? 1) / total) * (hasta - desde);
      repartir(h, cursor, cursor + parte, nivel + 1);
      cursor += parte;
    }
  };
  repartir(raiz, 0, DOS_PI, 0);

  const radio: number[] = [0];
  for (let k = 1; k < niveles.length; k++) {
    const anillo = [...(niveles[k] as string[])].sort((a, b) => (angulo.get(a) as number) - (angulo.get(b) as number));
    const maxActual = Math.max(...anillo.map(radioDe));
    const maxAnterior = Math.max(...(niveles[k - 1] as string[]).map(radioDe));
    let r = (radio[k - 1] as number) + maxAnterior + maxActual + hueco;
    // Lo bastante grande para que ningún par del anillo se toque; se agranda hasta lograrlo.
    const choca = (rr: number): boolean => {
      for (let i = 0; i < anillo.length; i++) {
        for (let j = i + 1; j < anillo.length; j++) {
          const a = angulo.get(anillo[i] as string) as number;
          const b = angulo.get(anillo[j] as string) as number;
          const d = 2 * rr * Math.abs(Math.sin((a - b) / 2));
          if (d < radioDe(anillo[i] as string) + radioDe(anillo[j] as string) + hueco - 1e-9) return true;
        }
      }
      return false;
    };
    for (let intentos = 0; choca(r) && intentos < 400; intentos++) r *= 1.05;
    radio[k] = r;
  }

  const centros = new Map<string, Punto>();
  niveles.forEach((nivel, k) => {
    for (const id of nivel) {
      const a = angulo.get(id) as number;
      centros.set(id, { x: Math.cos(a) * (radio[k] as number), y: Math.sin(a) * (radio[k] as number) });
    }
  });
  return centros;
}
