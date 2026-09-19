import { describe, expect, it } from 'vitest';
import { isPartialArcChart } from './chart-container.js';

describe('isPartialArcChart', () => {
  it('es true solo para pie/donut/radialBar con angulo: "semicirculo" o "personalizado"', () => {
    expect(isPartialArcChart({ type: 'pie', angulo: 'semicirculo' })).toBe(true);
    expect(isPartialArcChart({ type: 'donut', angulo: 'semicirculo' })).toBe(true);
    expect(isPartialArcChart({ type: 'radialBar', angulo: 'semicirculo' })).toBe(true);
    expect(isPartialArcChart({ type: 'radialBar', angulo: 'personalizado' })).toBe(true);
    expect(isPartialArcChart({ type: 'pie', angulo: 'personalizado' })).toBe(true);
  });

  it('es false para círculo completo (sin angulo, o angulo: "completo")', () => {
    expect(isPartialArcChart({ type: 'radialBar', angulo: undefined })).toBe(false);
    expect(isPartialArcChart({ type: 'donut', angulo: 'completo' })).toBe(false);
  });

  it('es false para "completo" o sin especificar, incluso con "personalizado" en un tipo sin `angulo`', () => {
    expect(isPartialArcChart({ type: 'radialBar', angulo: 'completo' })).toBe(false);
  });

  it('es false para tipos que no soportan `angulo`, aunque llevara semicirculo', () => {
    expect(isPartialArcChart({ type: 'column', angulo: 'semicirculo' })).toBe(false);
    expect(isPartialArcChart({ type: 'polarArea', angulo: 'semicirculo' })).toBe(false);
    expect(isPartialArcChart({ type: 'heatmap', angulo: 'semicirculo' })).toBe(false);
  });
});
