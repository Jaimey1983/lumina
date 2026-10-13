/**
 * U15 — red de seguridad de la extracción de la regla de comparación matemática: `respuesta_matematica`
 * debe comportarse EXACTAMENTE como antes (incluidos los casos «no evaluable»), y un paso de
 * `problema_pasos` debe dar el mismo veredicto que `respuesta_matematica` para la misma definición.
 */
import { describe, expect, it } from 'vitest';

import { evaluateActivityResponse } from './index.js';

const casos: { nombre: string; def: Record<string, unknown>; resp: unknown }[] = [
  { nombre: 'entero exacto', def: { respuesta: '12' }, resp: '12' },
  { nombre: 'entero erróneo', def: { respuesta: '12' }, resp: '13' },
  { nombre: 'decimal con coma', def: { respuesta: '3,14' }, resp: '3.14' },
  { nombre: 'decimal con ±0,01 por defecto', def: { respuesta: '3.14' }, resp: '3.149' },
  { nombre: 'fuera de ±0,01', def: { respuesta: '3.14' }, resp: '3.16' },
  { nombre: 'fracción', def: { respuesta: '3/4' }, resp: '0,75' },
  { nombre: 'tolerancia porcentual', def: { respuesta: '100', tolerancia: 5, toleranciaTipo: 'porcentual' }, resp: '104' },
  { nombre: 'miles con punto', def: { respuesta: '1500' }, resp: '1.500' },
  { nombre: 'algebraico equivalente', def: { modo: 'algebraico', respuesta: '2x+2' }, resp: '2(x+1)' },
  { nombre: 'algebraico distinto', def: { modo: 'algebraico', respuesta: '2x+2' }, resp: '2x+3' },
  { nombre: 'respuesta en blanco', def: { respuesta: '12' }, resp: '   ' },
  { nombre: 'sin respuesta', def: { respuesta: '12' }, resp: null },
  { nombre: 'definición no numérica', def: { respuesta: 'doce' }, resp: '12' },
  { nombre: 'definición algebraica ilegible', def: { modo: 'algebraico', respuesta: '2(x+' }, resp: '2x' },
  { nombre: 'algebraico con respuesta ilegible', def: { modo: 'algebraico', respuesta: '2x' }, resp: '2(x+' },
  { nombre: 'algebraico con respuesta numérica (no texto)', def: { modo: 'algebraico', respuesta: '2x' }, resp: 5 },
];

describe('respuesta_matematica — sin regresión tras compartir la regla', () => {
  it.each(casos)('$nombre', ({ def, resp }) => {
    const r = evaluateActivityResponse('respuesta_matematica', def, resp);
    const esperadoNulo = r.correct === null;
    // El veredicto de un paso de problema_pasos coincide con el de respuesta_matematica
    // (salvo que en un problema, no responder un paso cuenta como error y no como «no evaluable»).
    const p = evaluateActivityResponse(
      'problema_pasos',
      { pasos: [{ id: 'p', ...def }] },
      [{ pasoId: 'p', respuesta: resp, pistasUsadas: 0 }],
    );
    const defValida = r.correct !== null || resp === null || (typeof resp === 'string' && resp.trim() === '');
    if (!defValida) return;
    if (esperadoNulo) {
      // definición legible + respuesta ausente/en blanco → en el problema es un paso incorrecto
      expect(p.details[0]?.correct ?? false).toBe(false);
    } else {
      expect(p.details[0]!.correct).toBe(r.correct);
      expect(p.score).toBe(r.score);
    }
  });

  it('valores concretos de respuesta_matematica que no deben cambiar', () => {
    const e = (def: Record<string, unknown>, resp: unknown) => evaluateActivityResponse('respuesta_matematica', def, resp);
    expect(e({ respuesta: '12' }, '12')).toEqual({ correct: true, details: [{ index: 0, correct: true, label: 'Respuesta' }], score: 5 });
    expect(e({ respuesta: '12' }, '13')).toEqual({ correct: false, details: [{ index: 0, correct: false, label: 'Respuesta' }], score: 1 });
    expect(e({ respuesta: '12' }, '')).toEqual({ correct: null, details: [], score: null });
    expect(e({ respuesta: 'doce' }, '12')).toEqual({ correct: null, details: [], score: null });
    expect(e({ modo: 'algebraico', respuesta: '2x+2' }, '2(x+1)').correct).toBe(true);
    expect(e({ modo: 'algebraico', respuesta: '2(x+' }, '2x').correct).toBeNull();
  });
});
