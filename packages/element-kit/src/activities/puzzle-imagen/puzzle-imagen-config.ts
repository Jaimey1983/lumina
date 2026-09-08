export const PUZZLE_IMAGEN_MIN_FILAS = 3;
export const PUZZLE_IMAGEN_MAX_FILAS = 5;
export const PUZZLE_IMAGEN_MIN_COLUMNAS = 3;
export const PUZZLE_IMAGEN_MAX_COLUMNAS = 5;

export const PUZZLE_IMAGEN_GAP_PX = 4;

export function totalPiezas(filas: number, columnas: number): number {
  return filas * columnas;
}

/** Tamaño cuadrado de cada pieza para que quepa el tablero completo en el espacio disponible. */
export function calcularTamanoCeldaPuzzle(
  anchoDisponible: number,
  altoDisponible: number,
  filas: number,
  columnas: number,
  gapPx = PUZZLE_IMAGEN_GAP_PX,
): number {
  if (anchoDisponible <= 0 || altoDisponible <= 0 || filas <= 0 || columnas <= 0) {
    return 0;
  }
  const gapTotalW = gapPx * Math.max(columnas - 1, 0);
  const gapTotalH = gapPx * Math.max(filas - 1, 0);
  const maxW = (anchoDisponible - gapTotalW) / columnas;
  const maxH = (altoDisponible - gapTotalH) / filas;
  return Math.max(0, Math.floor(Math.min(maxW, maxH)));
}

export function generarOrdenCorrecto(filas: number, columnas: number): number[] {
  return Array.from({ length: filas * columnas }, (_, i) => i);
}

export function generarOrdenMezclado(filas: number, columnas: number): number[] {
  const total = filas * columnas;
  const orden = Array.from({ length: total }, (_, i) => i);
  for (let i = orden.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [orden[i], orden[j]] = [orden[j], orden[i]];
  }
  return orden;
}
