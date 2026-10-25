import { describe, expect, it } from 'vitest';
import { LIMITES } from '../normalizar.js';
import { escena, forma, grupo, linea, texto } from './util-pruebas.js';
import { fijarPagina, fueraDePagina, girarPagina } from './pagina.js';

describe('fijarPagina (Y25)', () => {
  const base = escena(forma('a', 10, 10));

  it('cambia solo lo pedido', () => {
    const e = fijarPagina(base, { ancho: 800 });
    expect(e.ancho).toBe(800);
    expect(e.alto).toBe(base.alto);
    expect(e.fondo).toBe(base.fondo);
    const f = fijarPagina(base, { fondo: '#112233' });
    expect(f.fondo).toBe('#112233');
    expect(f.ancho).toBe(base.ancho);
  });

  it('acota por abajo y por arriba, y redondea', () => {
    expect(fijarPagina(base, { ancho: 5 }).ancho).toBe(LIMITES.escenaAncho.min);
    expect(fijarPagina(base, { ancho: 99999 }).ancho).toBe(LIMITES.escenaAncho.max);
    expect(fijarPagina(base, { alto: 5 }).alto).toBe(LIMITES.escenaAlto.min);
    expect(fijarPagina(base, { alto: 99999 }).alto).toBe(LIMITES.escenaAlto.max);
    expect(fijarPagina(base, { ancho: 800.6 }).ancho).toBe(801);
    expect(fijarPagina(base, { alto: 100 }).alto).toBe(100);
    expect(fijarPagina(base, { alto: 10000 }).alto).toBe(10000);
  });

  it('un número que no es finito se ignora', () => {
    expect(fijarPagina(base, { ancho: Number.NaN })).toBe(base);
    expect(fijarPagina(base, { ancho: Infinity })).toBe(base);
    expect(fijarPagina(base, { alto: -Infinity })).toBe(base);
  });

  it('un número negativo se acota al mínimo (es un número, solo que chico)', () => {
    expect(fijarPagina(base, { ancho: -50 }).ancho).toBe(LIMITES.escenaAncho.min);
  });

  it('el fondo acepta un token, un hex y null (transparente); un color inválido se ignora', () => {
    expect(fijarPagina(base, { fondo: 'var(--background)' }).fondo).toBe('var(--background)');
    const conFondo = fijarPagina(base, { fondo: '#ABCDEF' });
    expect(fijarPagina(conFondo, { fondo: null }).fondo).toBeNull();
    expect(fijarPagina(conFondo, { fondo: 'rojo' })).toBe(conFondo);
    expect(fijarPagina(conFondo, { fondo: 'url(javascript:alert(1))' })).toBe(conFondo);
  });

  it('misma referencia si nada cambia', () => {
    expect(fijarPagina(base, {})).toBe(base);
    expect(fijarPagina(base, { ancho: base.ancho, alto: base.alto, fondo: base.fondo })).toBe(base);
    expect(fijarPagina(base, { ancho: base.ancho + 0.2 })).toBe(base); // redondea al mismo entero
  });

  it('no toca los elementos', () => {
    const e = fijarPagina(base, { ancho: 300, alto: 200, fondo: '#000000' });
    expect(e.elementos).toBe(base.elementos);
  });

  it('no cambia la escena de entrada', () => {
    const copia = JSON.stringify(base);
    fijarPagina(base, { ancho: 300, fondo: '#000000' });
    expect(JSON.stringify(base)).toBe(copia);
  });
});

describe('girarPagina (Y25)', () => {
  it('intercambia ancho y alto', () => {
    const e = girarPagina(escena(forma('a', 0, 0)));
    expect([e.ancho, e.alto]).toEqual([600, 1000]);
  });
  it('en una página cuadrada devuelve la misma escena', () => {
    const cuadrada = fijarPagina(escena(), { ancho: 500, alto: 500 });
    expect(girarPagina(cuadrada)).toBe(cuadrada);
  });
  it('girar dos veces vuelve a lo de antes', () => {
    const e = escena(forma('a', 0, 0));
    const dos = girarPagina(girarPagina(e));
    expect([dos.ancho, dos.alto]).toEqual([e.ancho, e.alto]);
  });
  it('con los límites no se sale de ellos', () => {
    const e = fijarPagina(escena(), { ancho: 10000, alto: 100 });
    const g = girarPagina(e);
    expect([g.ancho, g.alto]).toEqual([100, 10000]);
  });
  it('no toca los elementos ni el fondo', () => {
    const e = fijarPagina(escena(forma('a', 0, 0)), { fondo: '#123456' });
    const g = girarPagina(e);
    expect(g.elementos).toBe(e.elementos);
    expect(g.fondo).toBe('#123456');
  });
});

describe('fueraDePagina (Y25)', () => {
  const pagina = (...els: Array<Record<string, unknown>>) => fijarPagina(escena(...els), { ancho: 1000, alto: 600 });

  it('todo entero adentro: nada', () => {
    expect(fueraDePagina(pagina(forma('a', 0, 0, 100, 60), forma('b', 900, 540, 100, 60)))).toEqual([]);
  });
  it('cortado por cada uno de los cuatro bordes', () => {
    expect(fueraDePagina(pagina(forma('izq', -1, 100, 100, 60)))).toEqual(['izq']);
    expect(fueraDePagina(pagina(forma('arr', 100, -1, 100, 60)))).toEqual(['arr']);
    expect(fueraDePagina(pagina(forma('der', 901, 100, 100, 60)))).toEqual(['der']);
    expect(fueraDePagina(pagina(forma('aba', 100, 541, 100, 60)))).toEqual(['aba']);
  });
  it('tocar el borde exacto es estar dentro', () => {
    expect(fueraDePagina(pagina(forma('a', 0, 0, 1000, 600)))).toEqual([]);
  });
  it('del todo afuera también cuenta', () => {
    expect(fueraDePagina(pagina(forma('lejos', 5000, 5000, 100, 60)))).toEqual(['lejos']);
  });
  it('en el orden de la escena', () => {
    expect(fueraDePagina(pagina(forma('b', 2000, 0), forma('a', 100, 100), forma('c', -500, 0)))).toEqual(['b', 'c']);
  });
  it('un grupo no cuenta, sus hojas sí', () => {
    const e = pagina(forma('a', 950, 100, 100, 60), forma('b', 100, 100, 100, 60), grupo('g', ['a', 'b']));
    expect(fueraDePagina(e)).toEqual(['a']);
  });
  it('lo oculto y lo bloqueado también cuentan', () => {
    const e = pagina(forma('o', 2000, 0, 100, 60, { oculto: true }), forma('l', 2000, 100, 100, 60, { bloqueado: true }));
    expect(fueraDePagina(e)).toEqual(['o', 'l']);
  });
  it('una línea que sale cuenta; un texto también', () => {
    const e = pagina(linea('l', [[100, 100], [1200, 100]]), texto('t', 990, 10, { transformacion: { x: 990, y: 10, ancho: 200, alto: 40, rotacion: 0 } }));
    expect(fueraDePagina(e)).toEqual(['l', 't']);
  });
  it('con la rotación aplicada: una forma girada puede salirse aunque su caja sin girar entre', () => {
    const e = pagina(forma('r', 400, 0, 200, 100, { transformacion: { x: 400, y: 0, ancho: 200, alto: 100, rotacion: 45 } }));
    expect(fueraDePagina(e)).toEqual(['r']);
  });
  it('achicar la página deja fuera lo que antes entraba', () => {
    const e = pagina(forma('a', 800, 400, 100, 60));
    expect(fueraDePagina(e)).toEqual([]);
    expect(fueraDePagina(fijarPagina(e, { ancho: 850 }))).toEqual(['a']);
  });
  it('con 500 elementos tarda poco en proporción a un recorrido simple', () => {
    const e = pagina(...Array.from({ length: 500 }, (_v, i) => forma(`f${i}`, (i % 25) * 40, Math.floor(i / 25) * 25, 30, 20)));
    const medir = (g: () => void): number => {
      for (let i = 0; i < 3; i++) g();
      const m: number[] = [];
      for (let i = 0; i < 7; i++) {
        const a = performance.now();
        g();
        m.push(performance.now() - a);
      }
      return [...m].sort((x, y) => x - y)[3] as number;
    };
    const t = medir(() => void fueraDePagina(e));
    expect(t).toBeLessThan(50);
  });
});
