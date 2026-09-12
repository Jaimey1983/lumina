import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LUMINA_PALETTE_ID,
  LUMINA_CHART_PALETTES,
  LUMINA_SEMANTIC_PALETTE,
  getSeriesColor,
} from './palettes.js';

describe('getSeriesColor', () => {
  it('devuelve el color explícito de la serie si viene informado', () => {
    expect(getSeriesColor(0, 'lumina', '#123456')).toBe('#123456');
  });

  it('ignora un color explícito vacío y cae a la paleta', () => {
    expect(getSeriesColor(0, 'lumina', '  ')).toBe(LUMINA_CHART_PALETTES.lumina.colores[0]);
  });

  it('resuelve por índice dentro de la paleta pedida', () => {
    expect(getSeriesColor(2, 'oceano')).toBe(LUMINA_CHART_PALETTES.oceano.colores[2]);
  });

  it('rota (módulo) cuando el índice excede el largo de la paleta', () => {
    const paleta = LUMINA_CHART_PALETTES.lumina;
    expect(getSeriesColor(paleta.colores.length, 'lumina')).toBe(paleta.colores[0]);
  });

  it('cae a la paleta por defecto si el id no existe', () => {
    expect(getSeriesColor(0, 'no-existe')).toBe(LUMINA_CHART_PALETTES[DEFAULT_LUMINA_PALETTE_ID].colores[0]);
  });

  it('cae a la paleta por defecto si no se pasa paletaId', () => {
    expect(getSeriesColor(1)).toBe(LUMINA_CHART_PALETTES[DEFAULT_LUMINA_PALETTE_ID].colores[1]);
  });
});

describe('LUMINA_CHART_PALETTES', () => {
  it('cada paleta trae 8 colores hex válidos', () => {
    for (const paleta of Object.values(LUMINA_CHART_PALETTES)) {
      expect(paleta.colores).toHaveLength(8);
      for (const color of paleta.colores) {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    }
  });

  it('DEFAULT_LUMINA_PALETTE_ID apunta a una paleta real', () => {
    expect(LUMINA_CHART_PALETTES[DEFAULT_LUMINA_PALETTE_ID]).toBeDefined();
  });
});

describe('LUMINA_SEMANTIC_PALETTE', () => {
  it('define los 4 roles esperados con hex válido', () => {
    const roles = ['positivo', 'alerta', 'riesgo', 'neutro'] as const;
    for (const role of roles) {
      expect(LUMINA_SEMANTIC_PALETTE[role]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
