import { describe, expect, it } from 'vitest';
import { outlineToDiagrama, parseOutlineLines } from './diagrama-outline-parser.js';

describe('diagrama-outline-parser', () => {
  it('parseOutlineLines calcula niveles por espacios y elimina viñetas markdown', () => {
    const raw = `
- Raíz
  - Rama 1
    * Subrama A
  - Rama 2
    `;
    const parsed = parseOutlineLines(raw);
    expect(parsed).toEqual([
      { level: 0, text: 'Raíz' },
      { level: 1, text: 'Rama 1' },
      { level: 2, text: 'Subrama A' },
      { level: 1, text: 'Rama 2' },
    ]);
  });

  it('outlineToDiagrama genera nodos con formas adecuadas y aristas padre-hijo', () => {
    const raw = `
Idea Central
  Concepto 1
  Concepto 2
    Detalle 2.1
    `;
    const { nodos, aristas } = outlineToDiagrama(raw, 'mapa_mental');

    expect(nodos).toHaveLength(4);
    expect(nodos[0].etiqueta).toBe('Idea Central');
    expect(nodos[0].forma).toBe('root');

    // Debe generar 3 aristas:
    // Idea Central -> Concepto 1
    // Idea Central -> Concepto 2
    // Concepto 2 -> Detalle 2.1
    expect(aristas).toHaveLength(3);
    expect(aristas[0].desdeId).toBe(nodos[0].id);
    expect(aristas[0].haciaId).toBe(nodos[1].id);

    expect(aristas[1].desdeId).toBe(nodos[0].id);
    expect(aristas[1].haciaId).toBe(nodos[2].id);

    expect(aristas[2].desdeId).toBe(nodos[2].id);
    expect(aristas[2].haciaId).toBe(nodos[3].id);
  });
});
