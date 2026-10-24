import { describe, expect, it } from 'vitest';

import { normalizarEscena } from '../normalizar.js';
import type { Escena } from '../tipos.js';
import { ajustarComposicion, ajustarTexto, componerTexto, lineasDeTexto } from './texto.js';
import { escenaANodos, escenaASvg, type NodoSvg } from './render.js';

// Valores escritos como literales (no con las constantes del código): una mutación de una constante tiene que romper una prueba.

describe('componerTexto sin lista', () => {
  it('devuelve exactamente las líneas de lineasDeTexto, sin marcas ni sangría', () => {
    for (const texto of ['', 'Hola', 'Uno\nDos\n\nTres', 'una frase bastante larga que se parte en varias líneas', 'Supercalifragilisticoespialidoso']) {
      for (const partir of [true, false]) {
        const c = componerTexto(texto, 100, 12, false, undefined, partir);
        expect(c.lineas.map((l) => l.texto)).toEqual(lineasDeTexto(texto, 100, 12, false, partir));
        expect(c.lineas.every((l) => !('marca' in l))).toBe(true);
        expect(c.sangria).toBe(0);
      }
    }
  });

  it('ajustarTexto devuelve lo de antes', () => {
    expect(ajustarTexto('Este texto largo no cabe en una zona pequeña', 80, 40, 20, false)).toEqual({ tamano: 10, lineas: ['Este texto largo', 'no cabe en una', 'zona pequeña'] });
  });
});

describe('componerTexto con puntos', () => {
  it('una marca por párrafo, en su primera línea; la sangría es la de la marca más un espacio', () => {
    const c = componerTexto('Uno\nDos', 200, 10, false, 'puntos');
    expect(c.lineas).toEqual([{ texto: 'Uno', marca: '•' }, { texto: 'Dos', marca: '•' }]);
    expect(c.sangria).toBe(10); // (1 + 1) × 10 × 0,5
  });

  it('con negrita la sangría es más ancha (0,55)', () => {
    expect(componerTexto('Uno', 200, 10, true, 'puntos').sangria).toBeCloseTo(11, 10);
  });

  it('una línea en blanco separa párrafos pero no lleva marca', () => {
    const c = componerTexto('Uno\n\nDos', 200, 10, false, 'puntos');
    expect(c.lineas).toEqual([{ texto: 'Uno', marca: '•' }, { texto: '' }, { texto: 'Dos', marca: '•' }]);
  });

  it('un párrafo largo se parte en varias líneas y solo la primera lleva la marca', () => {
    // ancho 100 − sangría 10 = 90 → 18 caracteres por línea con letra 10
    const c = componerTexto('uno dos tres cuatro cinco seis siete', 100, 10, false, 'puntos');
    expect(c.lineas.map((l) => l.texto)).toEqual(['uno dos tres', 'cuatro cinco seis', 'siete']);
    expect(c.lineas.map((l) => l.marca)).toEqual(['•', undefined, undefined]);
  });

  it('texto vacío, solo espacios o solo saltos: sin marcas y sin sangría', () => {
    for (const t of ['', '   ', '\n\n', ' \n  \n']) {
      const c = componerTexto(t, 100, 10, false, 'puntos');
      expect(c.lineas.some((l) => l.marca)).toBe(false);
      expect(c.sangria).toBe(0);
    }
  });
});

describe('componerTexto con números', () => {
  it('numera solo los párrafos con texto y sigue contando después de un hueco', () => {
    const c = componerTexto('Uno\nDos\n\nTres', 200, 10, false, 'numeros');
    expect(c.lineas).toEqual([{ texto: 'Uno', marca: '1.' }, { texto: 'Dos', marca: '2.' }, { texto: '' }, { texto: 'Tres', marca: '3.' }]);
    expect(c.sangria).toBe(15); // (2 + 1) × 10 × 0,5
  });

  it('con diez o más párrafos «10.» ensancha la sangría de TODOS', () => {
    const texto = Array.from({ length: 10 }, (_v, i) => `p${i + 1}`).join('\n');
    const c = componerTexto(texto, 200, 10, false, 'numeros');
    expect(c.lineas[9]?.marca).toBe('10.');
    expect(c.sangria).toBe(20); // (3 + 1) × 10 × 0,5
    const nueve = componerTexto(texto.split('\n').slice(0, 9).join('\n'), 200, 10, false, 'numeros');
    expect(nueve.sangria).toBe(15);
  });

  it('el ancho disponible baja en la sangría: la misma frase ocupa más líneas con lista', () => {
    const frase = 'aaaa bbbb cccc dddd eeee ffff gggg';
    expect(lineasDeTexto(frase, 100, 10, false)).toEqual(['aaaa bbbb cccc dddd', 'eeee ffff gggg']); // 20 caracteres por línea
    expect(componerTexto(frase, 100, 10, false, 'numeros').lineas.map((l) => l.texto)).toEqual(['aaaa bbbb cccc', 'dddd eeee ffff', 'gggg']); // (100 − 15) / 5 = 17
  });
});

describe('autoajuste con lista', () => {
  it('la sangría de cada tamaño cuenta: baja más la letra que sin lista', () => {
    const texto = 'uno dos tres cuatro cinco seis siete ocho nueve diez';
    expect(ajustarComposicion(texto, 200, 50, 20, false).tamano).toBe(15);
    const con = ajustarComposicion(texto, 200, 50, 20, false, 'numeros');
    expect(con.tamano).toBe(13.5);
    expect(con.sangria).toBe(20.25); // (2 + 1) × 13,5 × 0,5
  });

  it('sin lista, ajustarComposicion da el mismo tamaño que ajustarTexto', () => {
    const texto = 'uno dos tres cuatro cinco seis siete ocho nueve diez';
    expect(ajustarComposicion(texto, 120, 40, 20, false).tamano).toBe(ajustarTexto(texto, 120, 40, 20, false).tamano);
  });
});

// ─── Render ───────────────────────────────────────────────────────────────────

const escena = (elementos: unknown[]): Escena => normalizarEscena({ ancho: 800, alto: 600, fondo: null, elementos });
const forma = (estiloTexto: unknown, texto: string, extra: Record<string, unknown> = {}) => ({
  tipo: 'forma',
  id: 'f',
  forma: 'rectangulo',
  transformacion: { x: 0, y: 0, ancho: 200, alto: 100, rotacion: 0 },
  texto,
  estiloTexto,
  ...extra,
});
const textos = (e: Escena, opciones = {}): NodoSvg[] => {
  const g = escenaANodos(e, opciones).nodos[0] as NodoSvg;
  return (g.hijos ?? []).filter((n) => n.tag === 'text');
};

describe('render con lista', () => {
  const e = escena([forma({ vinetas: 'puntos', tamano: 16, alineacionH: 'centro' }, 'Uno\nDos')]);

  it('dibuja la marca de cada párrafo en el borde izquierdo y el texto a la derecha de la sangría, siempre a la izquierda', () => {
    const t = textos(e);
    expect(t.map((n) => [n.texto, n.attrs.x, n.attrs.y, n.attrs['text-anchor']])).toEqual([
      ['•', 4, 46, 'start'],
      ['Uno', 20, 46, 'start'],
      ['•', 4, 66, 'start'],
      ['Dos', 20, 66, 'start'],
    ]);
  });

  it('las marcas no se leen como texto (aria-hidden) y el texto sí', () => {
    const t = textos(e);
    expect(t.map((n) => n.attrs['aria-hidden'])).toEqual(['true', undefined, 'true', undefined]);
  });

  it('la marca lleva el mismo tamaño, color, negrita y cursiva, pero no el subrayado', () => {
    const c = escena([forma({ vinetas: 'numeros', tamano: 16, negrita: true, cursiva: true, subrayado: true, color: '#112233' }, 'Uno')]);
    const [marca, texto] = textos(c);
    expect(marca?.attrs).toMatchObject({ 'font-size': 16, 'font-weight': 700, 'font-style': 'italic', fill: '#112233' });
    expect(marca?.attrs['text-decoration']).toBeUndefined();
    expect(texto?.attrs['text-decoration']).toBe('underline');
    expect(marca?.texto).toBe('1.');
  });

  it('con alineación a la derecha o al centro el texto sigue a la izquierda', () => {
    for (const alineacionH of ['centro', 'derecha', 'izquierda']) {
      const t = textos(escena([forma({ vinetas: 'puntos', alineacionH }, 'Uno')]));
      expect(t.every((n) => n.attrs['text-anchor'] === 'start')).toBe(true);
    }
  });

  it('la alineación vertical cuenta con todas las líneas', () => {
    const arriba = textos(escena([forma({ vinetas: 'puntos', tamano: 16, alineacionV: 'arriba' }, 'Uno\nDos')]));
    expect(arriba.map((n) => n.attrs.y)).toEqual([20, 20, 40, 40]);
    const abajo = textos(escena([forma({ vinetas: 'puntos', tamano: 16, alineacionV: 'abajo' }, 'Uno\nDos')]));
    expect(abajo.map((n) => n.attrs.y)).toEqual([72, 72, 92, 92]);
  });

  it('la marca sigue al tema: un color con token se resuelve en un archivo', () => {
    const c = escena([forma({ vinetas: 'puntos', color: 'var(--primary)' }, 'Uno')]);
    expect(textos(c, { modo: 'claro' })[0]?.attrs.fill).toBe('#2563EB');
    expect(textos(c, { modo: 'oscuro' })[0]?.attrs.fill).toBe('#60A5FA');
    expect(textos(c, { modo: 'css' })[0]?.attrs.fill).toBe('var(--primary)');
  });

  it('un cuadro de texto libre también lleva lista', () => {
    const c = escena([{ tipo: 'texto', id: 't', texto: 'Uno\nDos', transformacion: { x: 0, y: 0, ancho: 200, alto: 100, rotacion: 0 }, estiloTexto: { vinetas: 'numeros', alineacionH: 'izquierda', alineacionV: 'arriba' } }]);
    expect(textos(c).map((n) => n.texto)).toEqual(['1.', 'Uno', '2.', 'Dos']);
  });

  it('el rótulo de un conector ignora la lista', () => {
    const c = escena([{ tipo: 'linea', id: 'l', puntos: [{ x: 0, y: 0 }, { x: 300, y: 0 }], texto: 'Rótulo', estiloTexto: { vinetas: 'puntos' } }]);
    const g = escenaANodos(c).nodos[0] as NodoSvg;
    const t = (g.hijos ?? []).flatMap((n) => [n, ...(n.hijos ?? [])]).filter((n) => n.tag === 'text');
    expect(t.map((n) => n.texto)).toEqual(['Rótulo']);
    expect(t[0]?.attrs['text-anchor']).toBe('middle');
  });

  it('sin lista, el texto sale como siempre: sin marcas y con la alineación elegida', () => {
    const t = textos(escena([forma({ tamano: 16, alineacionH: 'derecha' }, 'Uno\nDos')]));
    expect(t.map((n) => [n.texto, n.attrs['text-anchor']])).toEqual([['Uno', 'end'], ['Dos', 'end']]);
  });

  it('en el archivo SVG no queda ningún «var(» sin resolver y el XML está bien formado', () => {
    const c = escena([forma({ vinetas: 'numeros', color: 'var(--foreground)' }, 'Uno\nDos <b> & "tres"')]);
    for (const modo of ['claro', 'oscuro'] as const) {
      const { svg } = escenaASvg(c, { modo });
      expect(svg).not.toContain('var(');
      expect(svg).toContain('&lt;b&gt; &amp;');
      const abiertas = (svg.match(/<text /g) ?? []).length;
      expect((svg.match(/<\/text>/g) ?? []).length).toBe(abiertas);
    }
  });

  it('con lista el autoajuste reduce la letra de las formas', () => {
    const texto = 'uno dos tres cuatro cinco seis siete ocho nueve diez once doce';
    const tam = (e: Escena) => (textos(e)[0]?.attrs['font-size'] as number) ?? 0;
    const sin = escena([forma({ tamano: 20, alineacionH: 'izquierda' }, texto, { transformacion: { x: 0, y: 0, ancho: 160, alto: 60, rotacion: 0 } })]);
    const con = escena([forma({ tamano: 20, alineacionH: 'izquierda', vinetas: 'numeros' }, texto, { transformacion: { x: 0, y: 0, ancho: 160, alto: 60, rotacion: 0 } })]);
    expect(tam(con)).toBeLessThan(tam(sin));
  });
});

describe('rendimiento (DW9)', () => {
  const mediana = (f: () => void): number => {
    for (let i = 0; i < 3; i++) f();
    const t: number[] = [];
    for (let i = 0; i < 7; i++) {
      const a = performance.now();
      f();
      t.push(performance.now() - a);
    }
    return [...t].sort((x, y) => x - y)[3] as number;
  };
  const grande = (vinetas?: string): Escena =>
    escena(
      Array.from({ length: 500 }, (_v, i) => ({
        ...forma({ tamano: 14, ...(vinetas ? { vinetas } : {}) }, 'Primera idea del tema\nSegunda idea algo más larga que se parte\nTercera'),
        id: `f${i}`,
        transformacion: { x: (i % 25) * 40, y: Math.floor(i / 25) * 40, ancho: 120, alto: 60, rotacion: 0 },
      })),
    );

  it('500 formas con lista y autoajuste tardan a lo sumo el triple que sin lista', () => {
    const sin = grande();
    const con = grande('numeros');
    const tSin = mediana(() => void escenaANodos(sin));
    const tCon = mediana(() => void escenaANodos(con));
    expect(tCon).toBeLessThanOrEqual(Math.max(tSin * 3, 5));
  });
});
