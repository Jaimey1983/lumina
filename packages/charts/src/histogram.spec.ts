import { describe, expect, it } from 'vitest';
import {
  computeHistogramBins,
  sanitizeHistogramBinCount,
  DEFAULT_HISTOGRAM_BINS,
  MIN_HISTOGRAM_BINS,
  MAX_HISTOGRAM_BINS,
} from './histogram.js';

describe('sanitizeHistogramBinCount', () => {
  it('usa el default cuando no se especifica un número finito', () => {
    expect(sanitizeHistogramBinCount(undefined)).toBe(DEFAULT_HISTOGRAM_BINS);
    expect(sanitizeHistogramBinCount(Number.NaN)).toBe(DEFAULT_HISTOGRAM_BINS);
  });

  it('acota por debajo al mínimo', () => {
    expect(sanitizeHistogramBinCount(0)).toBe(MIN_HISTOGRAM_BINS);
    expect(sanitizeHistogramBinCount(-5)).toBe(MIN_HISTOGRAM_BINS);
    expect(sanitizeHistogramBinCount(1)).toBe(MIN_HISTOGRAM_BINS);
  });

  it('acota por arriba al máximo', () => {
    expect(sanitizeHistogramBinCount(100)).toBe(MAX_HISTOGRAM_BINS);
  });

  it('redondea valores no enteros', () => {
    expect(sanitizeHistogramBinCount(7.6)).toBe(8);
  });
});

describe('computeHistogramBins', () => {
  it('sin valores: bins vacíos con conteo 0 en cada uno', () => {
    const result = computeHistogramBins([], 4);
    expect(result.labels).toHaveLength(4);
    expect(result.counts).toEqual([0, 0, 0, 0]);
  });

  it('min === max: un único bin con todos los valores', () => {
    const result = computeHistogramBins([5, 5, 5], 4);
    expect(result.labels).toHaveLength(1);
    expect(result.counts).toEqual([3]);
  });

  it('descarta valores no finitos (NaN/Infinity)', () => {
    const result = computeHistogramBins([1, Number.NaN, 2, Number.POSITIVE_INFINITY, 3], 2);
    expect(result.counts.reduce((a, b) => a + b, 0)).toBe(3);
  });

  it('reparte valores en intervalos de igual ancho, el último cerrado (incluye el máximo)', () => {
    const result = computeHistogramBins([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5);
    // ancho = (10-0)/5 = 2 → [0,2) [2,4) [4,6) [6,8) [8,10]
    expect(result.counts).toEqual([2, 2, 2, 2, 3]);
    expect(result.counts.reduce((a, b) => a + b, 0)).toBe(11);
    expect(result.labels).toHaveLength(5);
  });

  it('respeta el número de bins pedido (acotado y redondeado)', () => {
    const result = computeHistogramBins([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3);
    expect(result.counts).toHaveLength(3);
    expect(result.labels).toHaveLength(3);
  });

  it('usa el default (8 bins) si no se especifica binCount', () => {
    const result = computeHistogramBins([1, 2, 3, 4, 5], undefined);
    expect(result.counts).toHaveLength(DEFAULT_HISTOGRAM_BINS);
  });

  it('las etiquetas describen el rango de cada intervalo', () => {
    const result = computeHistogramBins([0, 10], 2);
    expect(result.labels).toEqual(['0–5', '5–10']);
  });
});
