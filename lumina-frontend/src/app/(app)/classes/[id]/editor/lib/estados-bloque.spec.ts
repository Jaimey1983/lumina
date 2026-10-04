import { describe, expect, it } from 'vitest';
import type { Block } from '@lumina/types/slide';
import {
  conAparienciaDePersonalizado,
  conAparienciaDeEstado,
  conEstadoPersonalizado,
  renombrarEstadoPersonalizado,
  sinEstadoPersonalizado,
} from './estados-bloque';

const base = { tipo: 'boton', id: 'b1' } as unknown as Block;

describe('estados de bloque (N6)', () => {
  it('fija y quita la apariencia sin dejar campos vacíos', () => {
    const a = conAparienciaDeEstado(base, 'hover', { fondo: '#ff0000', escala: 1.1 });
    expect(a.apariencias).toEqual({ hover: { fondo: '#ff0000', escala: 1.1 } });
    const b = conAparienciaDeEstado(a, 'hover', {});
    expect('apariencias' in b).toBe(false);
  });
  it('descarta valores fuera de rango o con CSS libre', () => {
    const a = conAparienciaDeEstado(base, 'down', {
      escala: 9,
      fondo: 'red',
      brillo: 0.9,
    } as never);
    expect(a.apariencias).toEqual({ down: { brillo: 0.9 } });
  });
  it('asigna id estable al bloque la primera vez', () => {
    const sinId = { tipo: 'boton' } as unknown as Block;
    const a = conAparienciaDeEstado(sinId, 'normal', { opacidad: 0.8 });
    expect(typeof (a as { id?: string }).id).toBe('string');
  });
  it('crea, renombra y borra estados personalizados con tope y sin duplicados', () => {
    const r = conEstadoPersonalizado(base, 'e1', 'Correcto');
    if ('error' in r && r.error) throw new Error(r.error);
    const b1 = (r as { bloque: Block }).bloque;
    expect(b1.estadosPersonalizados).toEqual([{ id: 'e1', nombre: 'Correcto', apariencia: {} }]);
    expect(conEstadoPersonalizado(b1, 'e2', 'correcto')).toEqual({ error: 'Ya hay un estado con ese nombre.' });
    expect(conEstadoPersonalizado(b1, 'hover', 'Otro')).toEqual({ error: 'Ese identificador ya existe.' });
    expect(conEstadoPersonalizado(b1, 'e3', '  ')).toEqual({ error: 'Ponle un nombre al estado.' });
    const ren = renombrarEstadoPersonalizado(b1, 'e1', 'Acierto') as { bloque: Block };
    expect(ren.bloque.estadosPersonalizados?.[0]?.nombre).toBe('Acierto');
    const ap = conAparienciaDePersonalizado(b1, 'e1', { fondo: '#16a34a' });
    expect(ap.estadosPersonalizados?.[0]?.apariencia).toEqual({ fondo: '#16a34a' });
    expect('estadosPersonalizados' in sinEstadoPersonalizado(ap, 'e1')).toBe(false);
  });
  it('respeta el máximo de 8', () => {
    let b = base;
    for (let i = 0; i < 8; i++) {
      b = (conEstadoPersonalizado(b, `e${i}`, `Estado ${i}`) as { bloque: Block }).bloque;
    }
    expect(conEstadoPersonalizado(b, 'e9', 'Uno más')).toEqual({
      error: 'Máximo 8 estados personalizados por elemento.',
    });
  });
});
