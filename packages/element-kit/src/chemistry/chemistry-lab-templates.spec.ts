import { describe, expect, it } from 'vitest';
import { CHEMISTRY_LAB_SLIDE_TEMPLATES } from './chemistry-lab-templates.js';
import { CHEMISTRY_SLIDE_TEMPLATES } from './chemistry-slide-templates.js';

describe('CHEMISTRY_LAB_SLIDE_TEMPLATES (Q7)', () => {
  it('incluye al menos dos laboratorios con variables y gráfico', () => {
    expect(CHEMISTRY_LAB_SLIDE_TEMPLATES.length).toBeGreaterThanOrEqual(2);
    for (const tmpl of CHEMISTRY_LAB_SLIDE_TEMPLATES) {
      expect(tmpl.variablesClase.length).toBeGreaterThan(0);
      const blocks = tmpl.buildBlocks();
      expect(blocks.some((b) => b.tipo === 'ecuacion')).toBe(true);
      expect(blocks.some((b) => b.tipo === 'grafico')).toBe(true);
      const g = blocks.find((b) => b.tipo === 'grafico');
      if (g && g.tipo === 'grafico') {
        expect(g.simulacionQuimica).toBeDefined();
      }
    }
  });

  it('las plantillas lab están en CHEMISTRY_SLIDE_TEMPLATES', () => {
    const ids = CHEMISTRY_SLIDE_TEMPLATES.map((t) => t.id);
    expect(ids).toContain('q7-lab-gas-ideal');
    expect(ids).toContain('q7-lab-dilucion');
  });
});
