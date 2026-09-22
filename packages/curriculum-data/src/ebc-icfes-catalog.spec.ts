import { describe, it, expect } from 'vitest';
import { EBC_COMPONENTES, ICFES_COMPETENCIAS } from './ebc-icfes-catalog.js';

const AREAS = ['ciencias-naturales', 'ciencias-sociales', 'ingles', 'lenguaje', 'matematicas'] as const;

function assertSinDuplicados(items: { codigo: string }[], etiqueta: string) {
  const codigos = items.map((i) => i.codigo);
  expect(new Set(codigos).size, `${etiqueta}: códigos duplicados`).toBe(codigos.length);
}

describe('EBC_COMPONENTES', () => {
  it('cubre las 5 áreas curriculares', () => {
    expect(Object.keys(EBC_COMPONENTES).sort()).toEqual([...AREAS].sort());
  });

  it.each(AREAS)('%s tiene al menos 1 componente, sin códigos duplicados', (area) => {
    const items = EBC_COMPONENTES[area];
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.codigo.trim()).not.toBe('');
      expect(item.label.trim()).not.toBe('');
    }
    assertSinDuplicados(items, `EBC_COMPONENTES.${area}`);
  });
});

describe('ICFES_COMPETENCIAS', () => {
  it('cubre las 5 áreas curriculares', () => {
    expect(Object.keys(ICFES_COMPETENCIAS).sort()).toEqual([...AREAS].sort());
  });

  it.each(AREAS)('%s tiene al menos 1 competencia, sin códigos duplicados', (area) => {
    const items = ICFES_COMPETENCIAS[area];
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.codigo.trim()).not.toBe('');
      expect(item.label.trim()).not.toBe('');
    }
    assertSinDuplicados(items, `ICFES_COMPETENCIAS.${area}`);
  });
});

describe('paridad con el dataset real (ciencias-naturales)', () => {
  it('los 3 componentes coinciden con los ebc_factor reales de ciencias-naturales-1..5', async () => {
    const { loadCurriculum } = await import('./index.js');
    const factoresReales = new Set<string>();
    for (const grado of ['1', '2', '3', '4', '5'] as const) {
      const data = await loadCurriculum('ciencias-naturales', grado);
      for (const u of data?.unidades ?? []) {
        if (u.ebc_factor) factoresReales.add(u.ebc_factor);
      }
    }
    const labelsCatalogo = new Set(EBC_COMPONENTES['ciencias-naturales'].map((c) => c.label));
    for (const factor of factoresReales) {
      expect(labelsCatalogo.has(factor), `"${factor}" del dataset real no está en el catálogo`).toBe(
        true,
      );
    }
  });
});
