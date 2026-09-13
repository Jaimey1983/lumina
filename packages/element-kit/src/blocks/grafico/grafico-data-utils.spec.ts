import { describe, it, expect } from 'vitest';
import {
  parseClipboardTable,
  transposeChartData,
  sortChartDataBySeries,
} from './grafico-data-utils.js';
import { createDefaultGraficoBlock } from './grafico-defaults.js';
import type { GraficoDatosBlock } from '@lumina/types/slide';

describe('grafico-data-utils', () => {
  describe('parseClipboardTable', () => {
    it('parsea TSV copiado desde Excel/Sheets correctamente', () => {
      const tsv = `Categoría\tGrupo 1\tGrupo 2\nEne\t100\t150\nFeb\t200\t250\nMar\t300\t350`;
      const res = parseClipboardTable(tsv);
      expect(res).not.toBeNull();
      expect(res?.categorias).toEqual(['Ene', 'Feb', 'Mar']);
      expect(res?.series).toHaveLength(2);
      expect(res?.series[0]).toEqual({
        nombre: 'Grupo 1',
        valores: [100, 200, 300],
      });
      expect(res?.series[1]).toEqual({
        nombre: 'Grupo 2',
        valores: [150, 250, 350],
      });
    });

    it('parsea CSV con coma o punto y coma y números con formato latino', () => {
      const csv = `Mes;Meta;Real\nEnero;1.500,50;1.200\nFebrero;2.000;1.850,25`;
      const res = parseClipboardTable(csv);
      expect(res).not.toBeNull();
      expect(res?.categorias).toEqual(['Enero', 'Febrero']);
      expect(res?.series[0].valores).toEqual([1500.5, 2000]);
      expect(res?.series[1].valores).toEqual([1200, 1850.25]);
    });

    it('retorna null para entradas vacías o insuficientes', () => {
      expect(parseClipboardTable('')).toBeNull();
      expect(parseClipboardTable('Una sola fila')).toBeNull();
    });
  });

  describe('transposeChartData', () => {
    it('invierte categorías y series correctamente', () => {
      const mockBlock: GraficoDatosBlock = createDefaultGraficoBlock({
        chartType: 'column',
        categorias: ['Q1', 'Q2', 'Q3'],
        series: [
          { nombre: 'Producto A', valores: [10, 20, 30] },
          { nombre: 'Producto B', valores: [40, 50, 60] },
        ],
      });

      const transposed = transposeChartData(mockBlock);
      expect(transposed.categorias).toEqual(['Producto A', 'Producto B']);
      expect(transposed.series).toHaveLength(3);
      expect(transposed.series[0]).toEqual({
        nombre: 'Q1',
        valores: [10, 40],
      });
      expect(transposed.series[1]).toEqual({
        nombre: 'Q2',
        valores: [20, 50],
      });
      expect(transposed.series[2]).toEqual({
        nombre: 'Q3',
        valores: [30, 60],
      });
    });
  });

  describe('sortChartDataBySeries', () => {
    it('ordena las categorías y todas las series según los valores de la serie objetivo', () => {
      const mockBlock: GraficoDatosBlock = createDefaultGraficoBlock({
        chartType: 'bar',
        categorias: ['Ene', 'Feb', 'Mar'],
        series: [
          { nombre: 'Ventas', valores: [50, 10, 30] },
          { nombre: 'Costos', valores: [20, 5, 15] },
        ],
      });

      // Ascendente por Ventas
      const asc = sortChartDataBySeries(mockBlock, 0, 'asc');
      expect(asc.categorias).toEqual(['Feb', 'Mar', 'Ene']);
      expect(asc.series[0].valores).toEqual([10, 30, 50]);
      expect(asc.series[1].valores).toEqual([5, 15, 20]);

      // Descendente por Ventas
      const desc = sortChartDataBySeries(mockBlock, 0, 'desc');
      expect(desc.categorias).toEqual(['Ene', 'Mar', 'Feb']);
      expect(desc.series[0].valores).toEqual([50, 30, 10]);
      expect(desc.series[1].valores).toEqual([20, 15, 5]);
    });
  });
});
