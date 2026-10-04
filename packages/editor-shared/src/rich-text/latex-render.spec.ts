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

  it('renderiza notación química mhchem (\\ce, reacciones y estados)', () => {
    expect(() => renderLatex('\\ce{H2SO4}', { throwOnError: true })).not.toThrow();
    expect(renderLatex('\\ce{H2SO4}')).toContain('katex-html');
    const reaccion = renderLatex('\\ce{2H2 + O2 -> 2H2O}', { throwOnError: true });
    expect(reaccion).not.toContain('katex-error');
    expect(renderLatex('\\ce{NaCl(s)}', { throwOnError: true })).not.toContain('katex-error');
    expect(renderLatex('\\pu{98 g mol-1}', { throwOnError: true })).not.toContain('katex-error');
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

  it('\\ce y \\pu se leen como fórmula química, no como comandos LaTeX', () => {
    expect(speakLatex('\\ce{H2SO4}')).toBe('H 2 S O 4');
    expect(speakLatex('\\ce{2H2 + O2 -> 2H2O}')).toBe(
      '2 H 2 más O 2 reacciona para formar 2 H 2 O',
    );
    expect(speakLatex('\\ce{NaCl(s)}')).toBe('Na Cl en estado s');
    expect(speakLatex('\\pu{18 g mol-1}')).toContain('18');
  });
});

import {
  dividirPasos,
  formatearNumeroLatex,
  latexHastaPaso,
  simbolosDeLatex,
  sustituirVariables,
} from './latex-render.js';

describe('sustituirVariables', () => {
  const vinculos = [
    { simbolo: 'a', variableId: 'va' },
    { simbolo: 'b', variableId: 'vb', decimales: 1 },
    { simbolo: 't', variableId: 'vt' },
  ];

  it('sustituye números, con coma decimal y negativos agrupados', () => {
    expect(sustituirVariables('{{a}}x+{{b}}', vinculos, { va: 3, vb: 2.5 })).toBe('3x+2{,}5');
    expect(sustituirVariables('x+{{a}}', vinculos, { va: -3 })).toBe('x+{-3}');
    expect(sustituirVariables('{{b}}', vinculos, { vb: 2 })).toBe('2{,}0');
  });

  it('un símbolo sin vínculo o sin valor se lee como la propia letra', () => {
    expect(sustituirVariables('{{a}}x^2+{{c}}', vinculos, undefined)).toBe('ax^2+c');
    expect(sustituirVariables('{{a}}', vinculos, {})).toBe('a');
  });

  it('filtra el texto: no se puede inyectar LaTeX', () => {
    expect(sustituirVariables('{{t}}', vinculos, { vt: 'hola\\href{x}{y}$' })).toBe(
      '\\text{holahrefxy}',
    );
    expect(sustituirVariables('{{t}}', vinculos, { vt: '\\{}' })).toBe('t');
  });

  it('booleanos y números no finitos', () => {
    expect(sustituirVariables('{{t}}', vinculos, { vt: true })).toBe('\\text{verdadero}');
    expect(formatearNumeroLatex(Number.NaN)).toBe('0');
  });

  it('ids como __proto__ no existen por herencia', () => {
    expect(sustituirVariables('{{a}}', [{ simbolo: 'a', variableId: '__proto__' }], {})).toBe('a');
  });

  it('simbolosDeLatex lista los únicos en orden', () => {
    expect(simbolosDeLatex('{{a}}{{b}}{{a}}')).toEqual(['a', 'b']);
  });
});

describe('dividirPasos / latexHastaPaso', () => {
  it('parte por \\\\ de nivel 0 y respeta llaves', () => {
    expect(dividirPasos('2x+4=10 \\\\ 2x=6 \\\\ x=3')).toEqual(['2x+4=10', '2x=6', 'x=3']);
    expect(dividirPasos('\\frac{a \\\\ b}{c} \\\\ d')).toEqual(['\\frac{a \\\\ b}{c}', 'd']);
  });

  it('no parte si ya hay un entorno ni descarta una fórmula sin separadores', () => {
    expect(dividirPasos('\\begin{cases} a \\\\ b \\end{cases}')).toHaveLength(1);
    expect(dividirPasos('x+1')).toEqual(['x+1']);
    expect(dividirPasos(' \\\\ ')).toEqual(['\\\\']);
  });

  it('muestra las primeras k líneas', () => {
    const p = ['a=1', 'b=2', 'c=3'];
    expect(latexHastaPaso(p, 1)).toBe('a=1');
    expect(latexHastaPaso(p, 2)).toBe('\\begin{array}{c} a=1 \\\\ b=2 \\end{array}');
    expect(latexHastaPaso(['a&=1', 'b&=2'], 2)).toContain('aligned');
    expect(latexHastaPaso(p, 99)).toContain('c=3');
    expect(() => renderLatex(latexHastaPaso(p, 3), { throwOnError: true })).not.toThrow();
  });
});
