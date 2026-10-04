import type { PeriodicElement } from '@lumina/chemistry';

export interface PeriodicGridCell {
  z: number;
  row: number;
  col: number;
  symbol: string;
}

/** Filas del bloque f; la fila 8 se deja vacía (separador visual). */
export const F_BLOCK_ROW_LAN = 9;
export const F_BLOCK_ROW_ACT = 10;
/** Fila de separación entre el cuerpo principal y el bloque f. */
export const PERIODIC_SPACER_ROW = 8;

const POSITIONS = new Map<number, { row: number; col: number }>();

function set(z: number, row: number, col: number): void {
  POSITIONS.set(z, { row, col });
}

function buildPositions(): void {
  if (POSITIONS.size > 0) return;
  set(1, 1, 1);
  set(2, 1, 18);
  set(3, 2, 1);
  set(4, 2, 2);
  for (let z = 5; z <= 10; z++) set(z, 2, z - 5 + 13);
  set(11, 3, 1);
  set(12, 3, 2);
  for (let z = 13; z <= 18; z++) set(z, 3, z - 13 + 13);
  set(19, 4, 1);
  set(20, 4, 2);
  for (let z = 21; z <= 30; z++) set(z, 4, z - 21 + 3);
  for (let z = 31; z <= 36; z++) set(z, 4, z - 31 + 13);
  set(37, 5, 1);
  set(38, 5, 2);
  for (let z = 39; z <= 48; z++) set(z, 5, z - 39 + 3);
  for (let z = 49; z <= 54; z++) set(z, 5, z - 49 + 13);
  set(55, 6, 1);
  set(56, 6, 2);
  set(57, 6, 3); // La: grupo 3 del cuerpo principal
  for (let z = 72; z <= 86; z++) set(z, 6, z - 72 + 4);
  set(87, 7, 1);
  set(88, 7, 2);
  set(89, 7, 3); // Ac: grupo 3 del cuerpo principal
  for (let z = 104; z <= 118; z++) set(z, 7, z - 104 + 4);
  // Bloque f (Ce–Lu, Th–Lr) fuera del cuerpo; la fila 8 queda como separador.
  for (let z = 58; z <= 71; z++) set(z, F_BLOCK_ROW_LAN, z - 58 + 4);
  for (let z = 90; z <= 103; z++) set(z, F_BLOCK_ROW_ACT, z - 90 + 4);
}

buildPositions();

export const PERIODIC_GRID_ROWS = 10;
export const PERIODIC_GRID_COLS = 18;

export function gridPositionForZ(z: number): { row: number; col: number } | undefined {
  return POSITIONS.get(z);
}

export function buildPeriodicGridCells(
  elements: readonly PeriodicElement[],
): PeriodicGridCell[] {
  return elements
    .map((el) => {
      const pos = POSITIONS.get(el.z);
      if (!pos) return null;
      return { z: el.z, row: pos.row, col: pos.col, symbol: el.symbol };
    })
    .filter((c): c is PeriodicGridCell => c !== null);
}
