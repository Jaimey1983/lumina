import { describe, expect, it } from 'vitest';
import {
  LUMINA_CHART_FAMILIES,
  LUMINA_CHART_TYPES,
  LUMINA_CHART_TYPE_META,
  getChartFamily,
  getChartTypesByFamily,
  type LuminaChartFamily,
} from './index.js';

describe('Lumina Chart Families (Etapa I)', () => {
  it('contiene las 7 familias definidas', () => {
    const expectedFamilies: LuminaChartFamily[] = [
      'comparar',
      'evolucion',
      'proporcion',
      'relacion',
      'estadistica',
      'kpi',
      'especiales',
    ];
    expect(LUMINA_CHART_FAMILIES.map((f) => f.id)).toEqual(expectedFamilies);
  });

  it('cada uno de los 14 tipos está mapeado en LUMINA_CHART_TYPE_META con metadata válida', () => {
    expect(LUMINA_CHART_TYPES).toHaveLength(14);
    for (const type of LUMINA_CHART_TYPES) {
      const meta = LUMINA_CHART_TYPE_META[type];
      expect(meta).toBeDefined();
      expect(meta.type).toBe(type);
      expect(meta.label).toBeTruthy();
      expect(meta.descripcion).toBeTruthy();
      expect(meta.familia).toBeTruthy();
    }
  });

  it('getChartFamily devuelve la familia correcta para cada tipo', () => {
    expect(getChartFamily('column')).toBe('comparar');
    expect(getChartFamily('bar')).toBe('comparar');
    expect(getChartFamily('combo')).toBe('comparar');
    expect(getChartFamily('line')).toBe('evolucion');
    expect(getChartFamily('area')).toBe('evolucion');
    expect(getChartFamily('donut')).toBe('proporcion');
    expect(getChartFamily('pie')).toBe('proporcion');
    expect(getChartFamily('treemap')).toBe('proporcion');
    expect(getChartFamily('funnel')).toBe('proporcion');
    expect(getChartFamily('scatter')).toBe('relacion');
    expect(getChartFamily('bubble')).toBe('relacion');
    expect(getChartFamily('radialBar')).toBe('kpi');
    expect(getChartFamily('heatmap')).toBe('especiales');
    expect(getChartFamily('radar')).toBe('especiales');
  });

  it('getChartTypesByFamily devuelve las variantes de cada familia', () => {
    expect(getChartTypesByFamily('comparar')).toEqual(['column', 'bar', 'combo']);
    expect(getChartTypesByFamily('evolucion')).toEqual(['line', 'area']);
    expect(getChartTypesByFamily('proporcion')).toEqual(['donut', 'pie', 'radialBar', 'treemap', 'funnel']);
    expect(getChartTypesByFamily('relacion')).toEqual(['scatter', 'bubble']);
    expect(getChartTypesByFamily('estadistica')).toEqual(['column', 'bar']);
    expect(getChartTypesByFamily('kpi')).toEqual(['radialBar']);
    expect(getChartTypesByFamily('especiales')).toEqual(['heatmap', 'radar']);
  });

  it('cada familia tiene un defaultType que pertenece a sus types', () => {
    for (const fam of LUMINA_CHART_FAMILIES) {
      expect(fam.types).toContain(fam.defaultType);
      expect(fam.label).toBeTruthy();
      expect(fam.descripcion).toBeTruthy();
    }
  });
});
