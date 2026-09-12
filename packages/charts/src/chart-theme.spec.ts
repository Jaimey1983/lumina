import { describe, expect, it } from 'vitest';
import { resolveChartTheme } from './chart-theme.js';

// El entorno de test es "node" (sin DOM) a propósito — ejercita el camino
// SSR-safe. El camino real (lectura de `getComputedStyle`) se verifica en el
// build del frontend, donde sí hay `document` (mismo criterio que E5.7 para
// el render real de gráficos: jsdom/node no alcanza, se verifica en navegador).
describe('resolveChartTheme (sin document)', () => {
  it('devuelve el fallback claro y marca resolvedFromDom: false', () => {
    const theme = resolveChartTheme();
    expect(theme.resolvedFromDom).toBe(false);
    expect(theme.foreColor).toMatch(/^#[0-9a-f]{6}$/);
    expect(theme.mutedColor).toMatch(/^#[0-9a-f]{6}$/);
    expect(theme.borderColor).toMatch(/^#[0-9a-f]{6}$/);
    expect(theme.surfaceColor).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('es determinístico entre llamadas', () => {
    expect(resolveChartTheme()).toEqual(resolveChartTheme());
  });
});
