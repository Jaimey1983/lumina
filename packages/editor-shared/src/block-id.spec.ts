import { describe, expect, it } from 'vitest';
import type { Block } from '@lumina/types/slide';
import { asegurarIdBloque, idDeBloque } from './block-id.js';

const texto = { tipo: 'texto', contenido: 'hola' } as unknown as Block;

describe('asegurarIdBloque', () => {
  it('asigna un id a un bloque que no lo tiene, sin mutar el original', () => {
    const r = asegurarIdBloque(texto);
    expect(idDeBloque(r)).toMatch(/.{8,}/);
    expect(r).not.toBe(texto);
    expect(idDeBloque(texto)).toBeUndefined();
    expect((r as { contenido?: string }).contenido).toBe('hola');
  });
  it('devuelve el mismo objeto si ya tiene id', () => {
    const conId = { ...texto, id: 'abc' } as unknown as Block;
    expect(asegurarIdBloque(conId)).toBe(conId);
  });
  it('trata un id vacío como ausente', () => {
    const vacio = { ...texto, id: '' } as unknown as Block;
    expect(idDeBloque(asegurarIdBloque(vacio))).not.toBe('');
  });
  it('dos bloques reciben ids distintos', () => {
    expect(idDeBloque(asegurarIdBloque(texto))).not.toBe(idDeBloque(asegurarIdBloque(texto)));
  });
});
