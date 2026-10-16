import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { DiagramaVennBlock } from '@lumina/types/slide';

import { createDefaultVennBlock } from './diagrama-defaults.js';
import { coloresVenn, PALETAS_DIAGRAMA } from './diagrama-temas.js';
import { nombreConjunto, VennSvg } from './venn-svg.js';

function html(over: Partial<DiagramaVennBlock> = {}): string {
  const block = { ...(createDefaultVennBlock({ id: 'v' }) as DiagramaVennBlock), ...over };
  return renderToStaticMarkup(createElement(VennSvg, { block }));
}

describe('VennSvg — tema y nombres (V2.3)', () => {
  it('sin paleta usa la por defecto: azul, verde y ámbar de siempre, derivados de la paleta (sin rgba fijo)', () => {
    const out = html();
    expect(out).not.toContain('rgba(');
    expect(coloresVenn(undefined)).toEqual(['#2563EB', '#10B981', '#F59E0B']);
    for (const c of coloresVenn(undefined).slice(0, 2)) expect(out).toContain(`color-mix(in srgb, ${c} 22%, transparent)`);
  });

  it('con `opciones.paleta` los círculos toman los colores de esa paleta', () => {
    const out = html({ opciones: { paleta: 'editorial' } });
    const [a, b] = coloresVenn('editorial');
    expect(a).toBe(PALETAS_DIAGRAMA.editorial.acentoPrincipal);
    expect(out).toContain(`color-mix(in srgb, ${a} 22%, transparent)`);
    expect(out).toContain(`color-mix(in srgb, ${b} 22%, transparent)`);
    expect(out).not.toContain('#2563EB');
  });

  it('con 3 conjuntos se pintan los tres colores', () => {
    const out = html({ conjuntos: 3 });
    for (const c of coloresVenn(undefined)) expect(out).toContain(`color-mix(in srgb, ${c} 22%, transparent)`);
  });

  it('las etiquetas son A/B por defecto y los nombres del docente cuando existen', () => {
    expect(html()).toMatch(/>A<\/text>[\s\S]*>B<\/text>/);
    const out = html({ nombresConjuntos: ['Mamíferos', ''] });
    expect(out).toContain('>Mamíferos</text>');
    expect(out).toContain('>B</text>'); // el vacío cae a la letra
  });

  it('nombreConjunto', () => {
    expect(nombreConjunto({}, 2)).toBe('C');
    expect(nombreConjunto({ nombresConjuntos: ['  ', 'Aves'] }, 0)).toBe('A');
    expect(nombreConjunto({ nombresConjuntos: ['  ', 'Aves'] }, 1)).toBe('Aves');
  });
});
