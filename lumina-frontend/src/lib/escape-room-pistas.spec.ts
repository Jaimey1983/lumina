import { describe, expect, it } from 'vitest';

import {
  normalizeIntentosMaximos,
  normalizeSala,
} from '@/components/editor/activities/escape-room-editor';
import { pistasDeSala, pistasReveladasPorIntentos } from '@/lib/escape-room-logic';

const base = {
  id: 'sala-1',
  nombre: 'Sala',
  descripcion: '',
  desafio: '',
  tipoRespuesta: 'texto' as const,
  respuestaCorrecta: 'H2O',
  ignorarMayusculas: true,
  intentosMaximos: 3,
};

describe('normalizeSala — pistas', () => {
  it('migra el legado `pista` a `pistas`', () => {
    const sala = normalizeSala({ ...base, pista: 'abc' });

    expect(sala.pistas).toEqual(['abc']);
    expect(sala.pista).toBeUndefined();
  });

  it('conserva un array de pistas y su orden', () => {
    const sala = normalizeSala({ ...base, pistas: ['a', 'b'] });

    expect(sala.pistas).toEqual(['a', 'b']);
  });

  it('`pistas` gana sobre el legado `pista`', () => {
    const sala = normalizeSala({ ...base, pistas: ['nueva'], pista: 'vieja' });

    expect(sala.pistas).toEqual(['nueva']);
  });

  it('sin pistas no escribe la clave', () => {
    expect(normalizeSala(base).pistas).toBeUndefined();
    expect(normalizeSala({ ...base, pista: '   ' }).pistas).toBeUndefined();
  });

  it('mantiene entradas vacías del array para que el editor pueda renderizarlas', () => {
    const sala = normalizeSala({ ...base, pistas: ['a', ''] });

    expect(sala.pistas).toEqual(['a', '']);
    // Quien lee descarta los blancos.
    expect(pistasDeSala(sala)).toEqual(['a']);
  });

  it('normalizar dos veces es idempotente', () => {
    const once = normalizeSala({ ...base, pista: 'abc' });

    expect(normalizeSala(once)).toEqual(once);
  });
});

describe('normalizeSala — intentos flexibles', () => {
  it('acepta cualquier entero >= 1', () => {
    expect(normalizeSala({ ...base, intentosMaximos: 5 }).intentosMaximos).toBe(5);
    expect(normalizeSala({ ...base, intentosMaximos: 1 }).intentosMaximos).toBe(1);
    expect(normalizeSala({ ...base, intentosMaximos: 42 }).intentosMaximos).toBe(42);
  });

  it('-1 sigue significando ilimitado', () => {
    expect(normalizeSala({ ...base, intentosMaximos: -1 }).intentosMaximos).toBe(-1);
  });

  it('0, negativos distintos de -1 y no números caen al default 3', () => {
    expect(normalizeSala({ ...base, intentosMaximos: 0 }).intentosMaximos).toBe(3);
    expect(normalizeSala({ ...base, intentosMaximos: -7 }).intentosMaximos).toBe(3);
    expect(normalizeSala({ ...base, intentosMaximos: undefined }).intentosMaximos).toBe(3);
    expect(normalizeIntentosMaximos(Number.NaN)).toBe(3);
  });

  it('trunca decimales', () => {
    expect(normalizeSala({ ...base, intentosMaximos: 4.7 }).intentosMaximos).toBe(4);
  });
});

describe('revelado progresivo de pistas', () => {
  const sala = normalizeSala({ ...base, pistas: ['p1', 'p2'] });

  it('sin fallos no revela nada', () => {
    expect(pistasReveladasPorIntentos(sala, 0)).toBe(0);
  });

  it('revela la n-ésima pista tras el n-ésimo fallo', () => {
    expect(pistasReveladasPorIntentos(sala, 1)).toBe(1);
    expect(pistasReveladasPorIntentos(sala, 2)).toBe(2);
  });

  it('nunca supera el total de pistas', () => {
    expect(pistasReveladasPorIntentos(sala, 9)).toBe(2);
  });

  it('una sola pista se comporta como el flujo actual', () => {
    const unaPista = normalizeSala({ ...base, pista: 'única' });

    expect(pistasReveladasPorIntentos(unaPista, 1)).toBe(1);
    expect(pistasReveladasPorIntentos(unaPista, 3)).toBe(1);
  });
});
