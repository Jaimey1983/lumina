import { describe, expect, it } from 'vitest';
import { variableToken } from '@lumina/editor-shared/rich-text';
import { slidesPorVariableEnTexto } from './variables-en-texto';

describe('slidesPorVariableEnTexto (N4)', () => {
  it('encuentra variables en texto plano, texto enriquecido, columnas y capas', () => {
    const t = (c: string) => ({ tipo: 'texto', contenido: c });
    const rich = {
      tipo: 'texto',
      contenido: '',
      contenidoRich: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: `x ${variableToken('b')}` }] }] },
    };
    const mapa = slidesPorVariableEnTexto([
      { id: 's1', bloques: [t(`Van ${variableToken('a')}`), rich] },
      { id: 's2', bloques: [{ tipo: 'columnas', hijos: [t(variableToken('a'))] }] },
      { id: 's3', bloques: [t('sin variables {{fecha}}')], capas: [{ bloques: [t(variableToken('c'))] }] },
    ]);
    expect([...(mapa.get('a') ?? [])]).toEqual(['s1', 's2']);
    expect([...(mapa.get('b') ?? [])]).toEqual(['s1']);
    expect([...(mapa.get('c') ?? [])]).toEqual(['s3']);
    expect(mapa.has('fecha')).toBe(false);
  });
});
