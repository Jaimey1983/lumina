import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ElementosPanel } from './elementos-panel';

// Entorno node (sin DOM): se prueba el render inicial en servidor. Los
// colapsables cerrados no montan su contenido (Radix Presence), así que la
// presencia/ausencia de textos refleja qué secciones arrancan abiertas.

function html(slideHasActivity = false) {
  return renderToStaticMarkup(
    createElement(ElementosPanel, {
      apiSlide: null,
      onCommitContent: () => {},
      disabled: false,
      slideHasActivity,
    }),
  );
}

/** `aria-expanded` del botón de encabezado cuyo contenido incluye `titulo`. */
function estado(out: string, titulo: string): string | null {
  const botones = out.match(/<button[^>]*aria-expanded="(?:true|false)"[^>]*>[\s\S]*?<\/button>/g) ?? [];
  const b = botones.find((x) => x.includes(`>${titulo}<`));
  return b ? (/aria-expanded="(true|false)"/.exec(b)?.[1] ?? null) : null;
}

describe('ElementosPanel (S3: secciones plegables)', () => {
  const out = html();

  it('arrancan abiertas: Imágenes, Gráficos, Multimedia y Estructura', () => {
    expect(out).toContain('URL de imagen');
    expect(out).toContain('Comparación');
    expect(out).toContain('Video (YouTube)');
    expect(out).toContain('Separador');
  });

  it('arrancan cerradas: Diagramas, Química y Máscaras (contenido fuera del DOM)', () => {
    expect(out).not.toContain('Mapa Mental');
    expect(out).not.toContain('Tabla periódica');
    expect(out).not.toContain('Forma libre');
  });

  it('los encabezados de las secciones cerradas siguen visibles', () => {
    expect(out).toContain('Diagramas');
    expect(out).toContain('Química');
    expect(out).toContain('Máscaras de recorte');
    expect(estado(out, 'Diagramas')).toBe('false');
    expect(estado(out, 'Química')).toBe('false');
  });

  it('Plantillas Pedagógicas es una sub-sección cerrada dentro de Gráficos', () => {
    expect(out).toContain('Plantillas Pedagógicas');
    expect(estado(out, 'Plantillas Pedagógicas')).toBe('false');
  });

  it('Diagramas muestra el conteo de 17 en el encabezado', () => {
    expect(out).toMatch(/Diagramas<\/span><span[^>]*>17</);
  });

  it('el aviso de actividad sigue visible', () => {
    expect(html(true)).toContain('Solo puedes agregar texto');
  });
});
