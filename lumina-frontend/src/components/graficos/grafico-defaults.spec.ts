import { describe, expect, it } from 'vitest';
import {
  createDefaultGraficoBlock,
  normalizeGraficoBlock,
  VALID_GRAFICO_CHART_TYPES,
} from './grafico-defaults';
import { BLOCK_FALLBACKS } from '@/types/slide.types';

describe('grafico-defaults', () => {
  it('crea un bloque grafico por defecto con contratos v1 correctos', () => {
    const block = createDefaultGraficoBlock();

    expect(block.tipo).toBe('grafico');
    expect(block.modo).toBe('contenido');
    expect(block.soloLecturaEnViewer).toBe(true);
    expect(block.chartType).toBe('column');
    expect(block.categorias.length).toBeGreaterThan(0);
    expect(block.series.length).toBeGreaterThan(0);
    expect(block.series[0].valores.length).toBe(block.categorias.length);
    expect(block.mostrarLeyenda).toBe(true);
    expect(block.x).toBe(BLOCK_FALLBACKS.grafico.x);
    expect(block.y).toBe(BLOCK_FALLBACKS.grafico.y);
    expect(block.ancho).toBe(BLOCK_FALLBACKS.grafico.ancho);
    expect(block.alto).toBe(BLOCK_FALLBACKS.grafico.alto);
  });

  it('permite sobrescribir propiedades con partial y marco', () => {
    const block = createDefaultGraficoBlock(
      {
        chartType: 'pie',
        titulo: 'Distribución de Notas',
        categorias: ['Aprobado', 'Reprobado'],
        series: [{ nombre: 'Alumnos', valores: [25, 5] }],
      },
      {
        izquierdaPct: 10,
        arribaPct: 20,
        anchoPct: 50,
        altoPct: 40,
      },
    );

    expect(block.chartType).toBe('pie');
    expect(block.titulo).toBe('Distribución de Notas');
    expect(block.categorias).toEqual(['Aprobado', 'Reprobado']);
    expect(block.series[0].valores).toEqual([25, 5]);
    expect(block.x).toBe(10);
    expect(block.y).toBe(20);
    expect(block.ancho).toBe(50);
    expect(block.alto).toBe(40);
  });

  it('normalizeGraficoBlock sanitiza datos corruptos y fuerza modo contenido y soloLectura', () => {
    const corruptInput = {
      tipo: 'grafico',
      modo: 'otro_modo_invalido',
      soloLecturaEnViewer: false,
      chartType: 'invalido_xxx',
      categorias: [null, undefined, 123, '  '],
      series: [
        { nombre: '', valores: ['10', 'not_a_number', null] },
        null,
      ],
      x: 'not_a_number',
      y: null,
      ancho: NaN,
      alto: -10,
    };

    const normalized = normalizeGraficoBlock(corruptInput);

    expect(normalized.tipo).toBe('grafico');
    expect(normalized.modo).toBe('contenido');
    expect(normalized.soloLecturaEnViewer).toBe(true);
    expect(normalized.chartType).toBe('column');
    expect(normalized.categorias.length).toBeGreaterThan(0);
    expect(normalized.series.length).toBeGreaterThan(0);
    expect(typeof normalized.series[0].valores[0]).toBe('number');
    expect(normalized.x).toBe(BLOCK_FALLBACKS.grafico.x);
    expect(normalized.y).toBe(BLOCK_FALLBACKS.grafico.y);
  });

  it('soporta todos los tipos de gráfico válidos', () => {
    for (const type of VALID_GRAFICO_CHART_TYPES) {
      const b = normalizeGraficoBlock({ tipo: 'grafico', chartType: type });
      expect(b.chartType).toBe(type);
    }
  });

  it('alinea la longitud de valores de las series con la cantidad de categorías', () => {
    const normalized = normalizeGraficoBlock({
      tipo: 'grafico',
      categorias: ['A', 'B', 'C', 'D'],
      series: [
        { nombre: 'S1', valores: [10, 20] }, // Faltan 2 valores
      ],
    });

    expect(normalized.series[0].valores).toEqual([10, 20, 0, 0]);
  });
});
