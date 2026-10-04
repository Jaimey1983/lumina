import { describe, expect, it } from 'vitest';

import {
  CHEMISTRY_EQUATION_PRESETS,
  CHEMISTRY_SLIDE_TEMPLATES,
  buildExplorePeriodicTableBlocks,
  createChemistryEquationBlock,
  chemistryActivityTemplate,
} from './chemistry-slide-templates.js';

describe('chemistry-slide-templates', () => {
  it('plantillas de slide generan bloques con tabla o ecuación', () => {
    const tabla = CHEMISTRY_SLIDE_TEMPLATES.find((t) => t.id === 'cn7-tabla-periodica');
    expect(tabla?.buildBlocks().some((b) => b.tipo === 'tabla_periodica')).toBe(true);
    const rxn = CHEMISTRY_SLIDE_TEMPLATES.find((t) => t.id === 'cn7-reaccion-ce');
    expect(rxn?.buildBlocks().some((b) => b.tipo === 'ecuacion')).toBe(true);
  });

  it('ecuación química usa \\ce{}', () => {
    const block = createChemistryEquationBlock(CHEMISTRY_EQUATION_PRESETS[0].latex);
    expect(block.tipo).toBe('ecuacion');
    if (block.tipo === 'ecuacion') {
      expect(block.latex).toContain('\\ce{');
    }
  });

  it('exploración tabla incluye texto guía', () => {
    const blocks = buildExplorePeriodicTableBlocks();
    expect(blocks.filter((b) => b.tipo === 'texto').length).toBeGreaterThanOrEqual(2);
  });

  it('actividades rápidas devuelven tipo químico', () => {
    expect(chemistryActivityTemplate('balancear-ecuacion').tipo).toBe('balancear_ecuacion');
    expect(chemistryActivityTemplate('ubicar-elemento').tipo).toBe('ubicar_elemento');
  });
});
