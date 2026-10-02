import { describe, expect, it } from 'vitest';
import { renderLatex, speakLatex, LATEX_MAX_SIZE } from './latex-render.js';

describe('renderLatex', () => {
  it('dibuja una fórmula con MathML y HTML', () => {
    const html = renderLatex('x^2+1');
    expect(html).toContain('katex-html');
    expect(html).toContain('<math');
  });

  it('con throwOnError:false marca el error en vez de lanzar', () => {
    expect(() => renderLatex('\\frac{1')).not.toThrow();
    expect(renderLatex('\\frac{1')).toContain('katex-error');
  });

  it('con throwOnError:true lanza ante LaTeX inválido', () => {
    expect(() => renderLatex('\\frac{1', { throwOnError: true })).toThrow();
  });

  it('expande los macros compartidos y no se contaminan entre llamadas', () => {
    expect(renderLatex('x \\in \\R')).toContain('mathbb');
    expect(renderLatex('\\R', { throwOnError: true })).toContain('katex');
  });

  it('rechaza tamaños por encima del tope', () => {
    const grande = renderLatex(`\\rule{${LATEX_MAX_SIZE + 1}em}{1em}`, { throwOnError: true });
    // strict:'ignore' no relaja maxSize: KaTeX recorta al máximo.
    expect(grande).toContain(`${LATEX_MAX_SIZE}em`);
  });

  it('corta la expansión infinita de macros', () => {
    expect(() =>
      renderLatex('\\def\\a{\\a\\a}\\a', { throwOnError: true }),
    ).toThrow();
  });

  it('no habilita comandos con trust (\\href queda sin enlace)', () => {
    expect(renderLatex('\\href{javascript:alert(1)}{x}')).not.toContain('href="');
  });
});

describe('speakLatex', () => {
  it.each([
    ['\\frac{a}{b}', 'a sobre b'],
    ['x^{2}', 'x al cuadrado'],
    ['x^3', 'x al cubo'],
    ['x^{n}', 'x elevado a n'],
    ['\\sqrt{x}', 'raíz cuadrada de x'],
    ['\\sqrt[3]{x}', 'raíz de índice 3 de x'],
    ['a \\times b', 'a por b'],
    ['a \\leq b', 'a menor o igual que b'],
    ['ax^{2} + bx + c = 0', 'ax al cuadrado más bx más c igual a 0'],
    ['\\frac{x^{2}}{3}', 'x al cuadrado sobre 3'],
    ['30^{\\circ}', '30 grados'],
    ['-x', 'menos x'],
    ['a - b', 'a menos b'],
  ])('%s → %s', (latex, esperado) => {
    expect(speakLatex(latex)).toBe(esperado);
  });

  it('lo desconocido se lee sin barra invertida', () => {
    expect(speakLatex('\\alpha + \\beta')).toBe('alpha más beta');
  });
});
