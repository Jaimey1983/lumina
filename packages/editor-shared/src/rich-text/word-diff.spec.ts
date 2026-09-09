import { describe, expect, it } from 'vitest';
import { wordDiff } from './word-diff.js';

const flat = (a: string, b: string) =>
  wordDiff(a, b)
    .map((o) => `${o.type[0]}:${o.text}`)
    .join('|');

describe('wordDiff', () => {
  it('texto idéntico = todo "same"', () => {
    expect(wordDiff('hola mundo', 'hola mundo')).toEqual([
      { type: 'same', text: 'hola mundo' },
    ]);
  });

  it('sustitución de una palabra', () => {
    expect(flat('el gato negro', 'el perro negro')).toBe(
      's:el |d:gato|a:perro|s: negro',
    );
  });

  it('inserción y borrado', () => {
    expect(wordDiff('a b', 'a b c').at(-1)).toEqual({ type: 'add', text: ' c' });
    expect(wordDiff('a b c', 'a c').some((o) => o.type === 'del')).toBe(true);
  });

  it('reconstruye el original con same+del y el nuevo con same+add', () => {
    const before = 'Este texto tiene errores de ortografia hoy';
    const after = 'Este texto no tiene errores de ortografía hoy';
    const ops = wordDiff(before, after);
    const rebuiltBefore = ops.filter((o) => o.type !== 'add').map((o) => o.text).join('');
    const rebuiltAfter = ops.filter((o) => o.type !== 'del').map((o) => o.text).join('');
    expect(rebuiltBefore).toBe(before);
    expect(rebuiltAfter).toBe(after);
  });
});
