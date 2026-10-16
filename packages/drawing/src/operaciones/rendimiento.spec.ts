import { describe, expect, it } from 'vitest';
import { diferencia } from '../historial/historial.js';
import { ajustarCaja } from './ajuste.js';
import { elementoEn, elementosEn } from './geometria.js';
import { alinear, reordenar } from './organizar.js';
import { mover, redimensionar, rotar } from './transformar.js';
import { escena, forma } from './util-pruebas.js';

// DW9: fluido con ~500 elementos. Los topes son holgados (máquinas lentas de CI); el objetivo real es < 16 ms por fotograma.
describe('rendimiento con 500 elementos', () => {
  const grande = escena(...Array.from({ length: 500 }, (_, i) => forma(`f${i}`, (i % 25) * 40, Math.floor(i / 25) * 30, 36, 26)));
  const todos = grande.elementos.map((e) => e.id);

  const medir = (nombre: string, f: () => unknown, tope: number): void => {
    it(`${nombre} < ${tope} ms`, () => {
      f(); // calentamiento
      const t0 = performance.now();
      for (let i = 0; i < 5; i++) f();
      const ms = (performance.now() - t0) / 5;
      expect(ms).toBeLessThan(tope);
    });
  };

  medir('mover los 500', () => mover(grande, todos, 3, 4), 100);
  medir('rotar los 500', () => rotar(grande, todos, 10), 100);
  medir('redimensionar los 500', () => redimensionar(grande, todos, 'se', 30, 20), 100);
  medir('elementoEn', () => elementoEn(grande, { x: 500, y: 300 }), 100);
  medir('elementosEn (caja de selección)', () => elementosEn(grande, { x: 0, y: 0, ancho: 500, alto: 300 }), 100);
  medir('ajustarCaja contra 500 elementos', () => ajustarCaja({ x: 503, y: 303, ancho: 40, alto: 30 }, grande), 100);
  medir('alinear 100', () => alinear(grande, todos.slice(0, 100), 'izquierda'), 300);
  medir('reordenar', () => reordenar(grande, ['f3'], 'frente'), 100);
  medir('diferencia tras un movimiento', () => diferencia(grande, mover(grande, ['f10'], 1, 1)), 100);
});
