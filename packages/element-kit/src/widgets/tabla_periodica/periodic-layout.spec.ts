import { getAllElements } from '@lumina/chemistry';
import { describe, expect, it } from 'vitest';

import {
  gridPositionForZ,
  PERIODIC_GRID_COLS,
  PERIODIC_GRID_ROWS,
  PERIODIC_SPACER_ROW,
} from './periodic-layout.js';

describe('tabla periódica — layout (Q10)', () => {
  it('ubica los 118 elementos sin colisiones y dentro de la rejilla', () => {
    const vistos = new Set<string>();
    for (const el of getAllElements()) {
      const pos = gridPositionForZ(el.z);
      expect(pos, `Z=${el.z}`).toBeDefined();
      expect(pos!.row).toBeGreaterThanOrEqual(1);
      expect(pos!.row).toBeLessThanOrEqual(PERIODIC_GRID_ROWS);
      expect(pos!.col).toBeGreaterThanOrEqual(1);
      expect(pos!.col).toBeLessThanOrEqual(PERIODIC_GRID_COLS);
      const key = `${pos!.row}:${pos!.col}`;
      expect(vistos.has(key), `colisión en ${key}`).toBe(false);
      vistos.add(key);
    }
    expect(vistos.size).toBe(118);
  });

  it('pone La y Ac en el grupo 3 del cuerpo principal', () => {
    expect(gridPositionForZ(57)).toEqual({ row: 6, col: 3 });
    expect(gridPositionForZ(89)).toEqual({ row: 7, col: 3 });
    expect(gridPositionForZ(21)?.col).toBe(3); // Sc
    expect(gridPositionForZ(39)?.col).toBe(3); // Y
  });

  it('separa el bloque f del cuerpo con una fila vacía', () => {
    expect(gridPositionForZ(58)).toEqual({ row: 9, col: 4 }); // Ce
    expect(gridPositionForZ(71)).toEqual({ row: 9, col: 17 }); // Lu
    expect(gridPositionForZ(90)).toEqual({ row: 10, col: 4 }); // Th
    expect(gridPositionForZ(103)).toEqual({ row: 10, col: 17 }); // Lr
    const filas = new Set(getAllElements().map((e) => gridPositionForZ(e.z)!.row));
    expect(filas.has(PERIODIC_SPACER_ROW)).toBe(false);
  });

  it('coincide con el grupo del dataset en el cuerpo principal', () => {
    for (const el of getAllElements()) {
      if (el.group === null) continue;
      expect(gridPositionForZ(el.z)!.col, el.symbol).toBe(el.group);
      expect(gridPositionForZ(el.z)!.row, el.symbol).toBe(el.period);
    }
  });
});
