/**
 * U7 — barajado uniforme y, si se pide, reproducible (etapa U / DU3, `ajustes.semilla`).
 *
 * Reemplaza al `sort` con comparador aleatorio que había repetido en siete
 * actividades: ese comparador aleatorio NO baraja de forma uniforme (algunos órdenes salen
 * bastante más que otros y depende del motor de `sort`) y tampoco se puede reproducir.
 *
 *  - Sin semilla (`undefined`/`null`/no finita): Fisher–Yates con `Math.random`. Cada alumno
 *    ve un orden distinto, como siempre.
 *  - Con semilla: Fisher–Yates con un PRNG de 32 bits sembrado (`crearAzar`). La misma
 *    semilla da el mismo orden en cualquier navegador: sirve para revisar una partida, para
 *    que toda la clase vea el mismo mazo o para escribir pruebas.
 *  - `sal` distingue corridas de una misma semilla (p. ej. el número de reintento): misma
 *    semilla y distinta `sal` ⇒ otro orden, pero reproducible.
 *
 * Es PURO: devuelve una copia y no muta la entrada. Sin dependencias.
 */

export type Azar = () => number;

/** PRNG mulberry32: números en [0, 1) a partir de una semilla entera de 32 bits. */
export function crearAzar(semilla: number): Azar {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Mezcla `semilla` y `sal` en una sola semilla de 32 bits (sin colisiones triviales). */
export function combinarSemilla(semilla: number, sal = 0): number {
  return (Math.trunc(semilla) ^ Math.imul(Math.trunc(sal) + 1, 0x9e3779b1)) >>> 0;
}

/** Fisher–Yates con el generador dado. Devuelve una copia. */
export function barajarCon<T>(arr: readonly T[], azar: Azar): T[] {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Baraja `arr`; con `semilla` finita el resultado es reproducible (ver el encabezado). */
export function barajar<T>(arr: readonly T[], semilla?: number | null, sal = 0): T[] {
  const sembrada = typeof semilla === 'number' && Number.isFinite(semilla);
  return barajarCon(arr, sembrada ? crearAzar(combinarSemilla(semilla, sal)) : Math.random);
}
