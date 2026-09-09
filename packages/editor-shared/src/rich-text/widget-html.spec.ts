// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { looksLikeRichHtml, sanitizeWidgetHtml } from './widget-html.js';

describe('looksLikeRichHtml', () => {
  it('detecta etiquetas', () => {
    expect(looksLikeRichHtml('<b>x</b>')).toBe(true);
    expect(looksLikeRichHtml('texto plano')).toBe(false);
    expect(looksLikeRichHtml('2 < 3 y 4 > 1')).toBe(false);
  });
});

describe('sanitizeWidgetHtml', () => {
  it('conserva etiquetas y estilos permitidos', () => {
    const out = sanitizeWidgetHtml(
      '<p><b>Hola</b> <span style="color:#f00;font-size:20px">mundo</span></p>',
    );
    expect(out).toContain('<b>Hola</b>');
    expect(out).toContain('color:#f00');
    expect(out).toContain('font-size:20px');
  });

  it('quita script, handlers, clases e ids', () => {
    const out = sanitizeWidgetHtml(
      '<div class="x" id="y" onclick="evil()"><script>evil()</script><b>ok</b></div>',
    );
    expect(out).not.toContain('script');
    expect(out).not.toContain('onclick');
    expect(out).not.toContain('class');
    expect(out).not.toContain('id="y"');
    expect(out).toContain('<b>ok</b>');
  });

  it('desenrolla etiquetas no permitidas conservando el texto', () => {
    const out = sanitizeWidgetHtml('<article><b>negrita</b> <img src=x> texto</article>');
    expect(out).not.toContain('article');
    expect(out).not.toContain('img');
    expect(out).toContain('<b>negrita</b>');
    expect(out).toContain('texto');
  });

  it('enlace seguro → href + target + rel; inseguro → se desenrolla', () => {
    expect(sanitizeWidgetHtml('<a href="https://ok.dev">x</a>')).toBe(
      '<a href="https://ok.dev" target="_blank" rel="noopener noreferrer">x</a>',
    );
    const bad = sanitizeWidgetHtml('<a href="javascript:alert(1)">x</a>');
    expect(bad).not.toContain('<a ');
    expect(bad).toContain('x');
  });

  it('filtra propiedades CSS peligrosas', () => {
    const out = sanitizeWidgetHtml(
      '<span style="color:#000;position:fixed;behavior:url(x)">t</span>',
    );
    expect(out).toContain('color:#000');
    expect(out).not.toContain('position');
    expect(out).not.toContain('behavior');
  });
});
