import { describe, expect, it } from 'vitest';
import {
  createTextBlock,
  createDefaultTextBlock,
  TEXT_INSERT_PRESETS,
} from './texto-defaults.js';

describe('createTextBlock (Fase 0.2)', () => {
  it('sin opciones = bloque vacío con posición de fallback', () => {
    const b = createTextBlock();
    expect(b.tipo).toBe('texto');
    expect(b.contenido).toBe('');
    expect(typeof b.x).toBe('number');
    expect(typeof b.ancho).toBe('number');
  });

  it('createDefaultTextBlock delega en createTextBlock', () => {
    expect(createDefaultTextBlock()).toEqual(createTextBlock());
  });

  it('aplica el preset y deja que extra gane', () => {
    const b = createTextBlock({
      preset: 'titulo',
      extra: { contenido: 'Portada', tamanoFuente: '48px' },
    });
    expect(b).toMatchObject({
      contenido: 'Portada',
      nivel: 1,
      negrita: true,
      tamanoFuente: '48px', // extra gana sobre el preset (40px)
    });
  });

  it('omitPosition deja el bloque sin x/y/ancho/alto', () => {
    const b = createTextBlock({
      preset: 'cuerpo',
      omitPosition: true,
      extra: { contenido: 'Columna' },
    });
    expect(b.x).toBeUndefined();
    expect(b.ancho).toBeUndefined();
    expect(b.tamanoFuente).toBe('18px');
  });

  it('los presets son solo estilo, sin posición', () => {
    for (const p of Object.values(TEXT_INSERT_PRESETS)) {
      expect(p).not.toHaveProperty('x');
      expect(p).not.toHaveProperty('contenido');
    }
  });
});
