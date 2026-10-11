/**
 * U4 — lógica PURA del tablero de Memoria (cartas, selección, resolución de pares).
 *
 * Sale del viewer, donde vivía como `useState` + `setTimeout` en cadena. Aquí el tablero es
 * un reducer: voltear una carta es una acción, y resolver el par (esconderlo o darlo por
 * encontrado) es OTRA acción que el viewer dispara tras una espera cancelable. Sin DOM, sin
 * reloj; el único azar es el barajado (`barajar`, con semilla opcional).
 */
import type { MemoriaActivity } from '@lumina/types/slide';

import { barajar } from '../_shared/barajar.js';

export interface Carta {
  readonly id: string;
  readonly parId: string;
  readonly contenido: { readonly texto?: string; readonly imagen?: string };
  readonly volteada: boolean;
  readonly encontrada: boolean;
}

export interface TableroMemoria {
  readonly cartas: readonly Carta[];
  /** Ids de las cartas volteadas del par en curso (0, 1 o 2). */
  readonly seleccion: readonly string[];
  /** Hay un par volteado esperando a resolverse; mientras tanto no se voltea nada. */
  readonly resolviendo: { readonly coincide: boolean } | null;
  /** Pares intentados (cada vez que se voltea la segunda carta). */
  readonly intentos: number;
}

export type AccionTablero =
  | { readonly tipo: 'voltear'; readonly id: string }
  | { readonly tipo: 'resolver' }
  | {
      readonly tipo: 'reiniciar';
      readonly barajar: boolean;
      /** `ajustes.semilla` y el número de reinicio (ver `crearTablero`). */
      readonly semilla?: number | null;
      readonly sal?: number;
    };

/** Espera antes de dar por bueno un par que coincide. */
export const RETARDO_PAR_ENCONTRADO_MS = 400;

export function cartasDePares(pares: MemoriaActivity['pares']): Carta[] {
  return [
    ...pares.map((p) => ({ id: `${p.id}-a`, parId: p.id, contenido: p.lado1, volteada: false, encontrada: false })),
    ...pares.map((p) => ({ id: `${p.id}-b`, parId: p.id, contenido: p.lado2, volteada: false, encontrada: false })),
  ];
}

/**
 * Tablero nuevo. Con `semilla` el mazo es reproducible; `sal` (el número de reinicio) hace
 * que cada «Reintentar» de una misma semilla dé otro orden, también reproducible.
 */
export function crearTablero(
  pares: MemoriaActivity['pares'],
  mezclar: boolean,
  semilla?: number | null,
  sal = 0,
): TableroMemoria {
  const cartas = cartasDePares(pares);
  return { cartas: mezclar ? barajar(cartas, semilla, sal) : cartas, seleccion: [], resolviendo: null, intentos: 0 };
}

/** Ids de los pares encontrados, en el orden en que aparecen en el mazo. */
export function paresEncontrados(cartas: readonly Carta[]): string[] {
  return [...new Set(cartas.filter((c) => c.encontrada).map((c) => c.parId))];
}

export function tableroCompleto(cartas: readonly Carta[]): boolean {
  return cartas.length > 0 && cartas.every((c) => c.encontrada);
}

export function tableroReducer(t: TableroMemoria, a: AccionTablero): TableroMemoria {
  switch (a.tipo) {
    case 'voltear': {
      if (t.resolviendo) return t;
      if (t.seleccion.includes(a.id)) return t;
      const carta = t.cartas.find((c) => c.id === a.id);
      if (!carta || carta.encontrada || carta.volteada) return t;
      const cartas = t.cartas.map((c) => (c.id === a.id ? { ...c, volteada: true } : c));
      const seleccion = [...t.seleccion, a.id];
      if (seleccion.length < 2) return { ...t, cartas, seleccion };
      const [a1, a2] = seleccion.map((id) => cartas.find((c) => c.id === id)!);
      return {
        cartas,
        seleccion,
        resolviendo: { coincide: a1.parId === a2.parId },
        intentos: t.intentos + 1,
      };
    }

    case 'resolver': {
      if (!t.resolviendo) return t;
      const ids = new Set(t.seleccion);
      const cartas = t.cartas.map((c) =>
        ids.has(c.id)
          ? t.resolviendo!.coincide
            ? { ...c, encontrada: true, volteada: true }
            : { ...c, volteada: false }
          : c,
      );
      return { ...t, cartas, seleccion: [], resolviendo: null };
    }

    case 'reiniciar': {
      // Se vuelve a mezclar el mazo ACTUAL (no el original), como siempre.
      const limpias = t.cartas.map((c) => ({ ...c, volteada: false, encontrada: false }));
      return {
        cartas: a.barajar ? barajar(limpias, a.semilla, a.sal) : limpias,
        seleccion: [],
        resolviendo: null,
        intentos: 0,
      };
    }
  }
}
