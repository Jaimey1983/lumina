import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { getAllElements } from '@lumina/chemistry';
import { describe, expect, it } from 'vitest';

import { CATEGORIAS_ORDEN, etiquetaCategoria } from './periodic-metadata.js';

describe('tabla periódica — categorías (Q11)', () => {
  const categoriasDelDataset = [...new Set(getAllElements().map((e) => e.category))];

  it('la leyenda cubre exactamente las categorías del dataset', () => {
    expect([...CATEGORIAS_ORDEN].sort()).toEqual([...categoriasDelDataset].sort());
    expect(new Set(CATEGORIAS_ORDEN).size).toBe(CATEGORIAS_ORDEN.length);
  });

  it('cada categoría tiene etiqueta y color definido en el CSS', () => {
    const css = readFileSync(
      resolve(process.cwd(), 'src/widgets/tabla_periodica/tabla-periodica.module.css'),
      'utf8',
    );
    for (const cat of CATEGORIAS_ORDEN) {
      expect(etiquetaCategoria(cat), cat).toBeTruthy();
      expect(css, cat).toContain(`[data-cat="${cat}"]`);
    }
  });
});
