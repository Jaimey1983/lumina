import { describe, expect, it } from 'vitest';
import { cajaDeSeleccion, esquinas } from './geometria.js';
import { ajustarAngulo, mover, redimensionar, rotar, rotarA, ASAS } from './transformar.js';
import { escena, forma, getForma, getLinea, grupo, linea, texto, getTexto } from './util-pruebas.js';

describe('mover', () => {
  it('desplaza formas, textos y líneas', () => {
    const e = escena(forma('a', 10, 10), texto('t', 0, 0), linea('l', [[0, 0], [10, 10]]));
    const r = mover(e, ['a', 't', 'l'], 5, -3);
    expect(getForma(r, 'a').transformacion).toMatchObject({ x: 15, y: 7 });
    expect(getTexto(r, 't').transformacion).toMatchObject({ x: 5, y: -3 });
    expect(getLinea(r, 'l').puntos).toEqual([{ x: 5, y: -3 }, { x: 15, y: 7 }]);
  });

  it('no muta la escena original', () => {
    const e = escena(forma('a', 10, 10));
    const copia = JSON.stringify(e);
    mover(e, ['a'], 5, 5);
    expect(JSON.stringify(e)).toBe(copia);
  });

  it('mover un grupo mueve a todos sus hijos', () => {
    const e = escena(forma('a', 0, 0), forma('b', 200, 0), forma('c', 500, 500), grupo('g', ['a', 'b']));
    const r = mover(e, ['g'], 10, 20);
    expect(getForma(r, 'a').transformacion).toMatchObject({ x: 10, y: 20 });
    expect(getForma(r, 'b').transformacion).toMatchObject({ x: 210, y: 20 });
    expect(getForma(r, 'c')).toBe(getForma(e, 'c'));
  });

  it('mover un grupo y su hijo a la vez no lo mueve dos veces', () => {
    const e = escena(forma('a', 0, 0), forma('b', 200, 0), grupo('g', ['a', 'b']));
    expect(getForma(mover(e, ['g', 'a'], 10, 0), 'a').transformacion.x).toBe(10);
  });

  it('un elemento bloqueado (o de un grupo bloqueado) no se mueve', () => {
    const e = escena(forma('a', 0, 0, 10, 10, { bloqueado: true }), forma('b', 0, 0), forma('c', 0, 0), grupo('g', ['b', 'c'], { bloqueado: true }));
    expect(mover(e, ['a', 'g'], 5, 5)).toBe(e);
  });

  it('sin elementos, con desplazamiento cero o inválido: devuelve la misma escena', () => {
    const e = escena(forma('a', 0, 0));
    expect(mover(e, [], 5, 5)).toBe(e);
    expect(mover(e, ['a'], 0, 0)).toBe(e);
    expect(mover(e, ['a'], Number.NaN, 1)).toBe(e);
    expect(mover(e, ['nada'], 5, 5)).toBe(e);
  });

  it('mover y devolver es la identidad', () => {
    const e = escena(forma('a', 13.5, 7.25), linea('l', [[1, 2], [3, 4]]));
    expect(mover(mover(e, ['a', 'l'], 40, -9), ['a', 'l'], -40, 9)).toEqual(e);
  });

  it('una línea conectada que se mueve sola se despega; si se mueve con su forma, conserva la conexión', () => {
    const e = escena(forma('f', 0, 0), linea('l', [[0, 0], [100, 100]], { origen: { elementoId: 'f', puerto: 1 } }));
    expect(getLinea(mover(e, ['l'], 5, 5), 'l').origen).toBeUndefined();
    expect(getLinea(mover(e, ['l', 'f'], 5, 5), 'l').origen).toEqual({ elementoId: 'f', puerto: 1 });
    // Mover solo la forma no toca la línea (la sigue por la conexión).
    const r = mover(e, ['f'], 5, 5);
    expect(getLinea(r, 'l')).toBe(getLinea(e, 'l'));
  });
});

describe('redimensionar una forma', () => {
  const base = escena(forma('a', 100, 100, 200, 100));

  it('el asa este agranda el ancho y deja fijo el lado oeste', () => {
    const t = getForma(redimensionar(base, ['a'], 'e', 50, 0), 'a').transformacion;
    expect(t).toMatchObject({ x: 100, y: 100, ancho: 250, alto: 100 });
  });

  it('el asa oeste mueve el borde izquierdo y deja fijo el derecho', () => {
    const t = getForma(redimensionar(base, ['a'], 'w', -50, 0), 'a').transformacion;
    expect(t).toMatchObject({ x: 50, ancho: 250, alto: 100 });
    expect(t.x + t.ancho).toBe(300);
  });

  it('una esquina cambia ambos lados y deja fija la opuesta', () => {
    const t = getForma(redimensionar(base, ['a'], 'nw', -20, -10), 'a').transformacion;
    expect(t).toMatchObject({ x: 80, y: 90, ancho: 220, alto: 110 });
  });

  it('proporcional en una esquina conserva la razón ancho/alto', () => {
    const t = getForma(redimensionar(base, ['a'], 'se', 100, 5, { proporcional: true }), 'a').transformacion;
    expect(t.ancho / t.alto).toBeCloseTo(2);
    expect(t.ancho).toBeCloseTo(300);
  });

  it('proporcional en un lado ajusta el otro lado desde su centro', () => {
    const t = getForma(redimensionar(base, ['a'], 'e', 100, 0, { proporcional: true }), 'a').transformacion;
    expect(t.ancho).toBeCloseTo(300);
    expect(t.alto).toBeCloseTo(150);
    expect(t.y + t.alto / 2).toBeCloseTo(150); // el centro vertical no se movió
  });

  it('desde el centro crece parejo hacia ambos lados', () => {
    const t = getForma(redimensionar(base, ['a'], 'e', 30, 0, { desdeCentro: true }), 'a').transformacion;
    expect(t).toMatchObject({ x: 70, ancho: 260 });
  });

  it('no baja del tamaño mínimo ni invierte la forma', () => {
    const t = getForma(redimensionar(base, ['a'], 'e', -10000, 0), 'a').transformacion;
    expect(t.ancho).toBe(8);
    expect(t.x).toBe(100);
    const u = getForma(redimensionar(base, ['a'], 'se', -10000, -10000, { minimo: 20 }), 'a').transformacion;
    expect(u).toMatchObject({ ancho: 20, alto: 20 });
  });

  it('los cuatro lados de una forma rotada: el punto opuesto al asa no se mueve en la escena', () => {
    for (const rotacion of [0, 30, 90, 137, 270]) {
      for (const asa of ASAS) {
        const e = escena(forma('a', 100, 100, 200, 100, { transformacion: { x: 100, y: 100, ancho: 200, alto: 100, rotacion } }));
        const antes = getForma(e, 'a').transformacion;
        const despues = getForma(redimensionar(e, ['a'], asa, 25, 15), 'a').transformacion;
        const sx = asa.includes('e') ? 1 : asa.includes('w') ? -1 : 0;
        const sy = asa.includes('s') ? 1 : asa.includes('n') ? -1 : 0;
        // Esquina/lado opuesto, en coordenadas locales (0,0 = esquina sup-izq.), antes y después.
        const localAntes = { x: sx === 1 ? 0 : sx === -1 ? antes.ancho : antes.ancho / 2, y: sy === 1 ? 0 : sy === -1 ? antes.alto : antes.alto / 2 };
        const localDespues = { x: sx === 1 ? 0 : sx === -1 ? despues.ancho : despues.ancho / 2, y: sy === 1 ? 0 : sy === -1 ? despues.alto : despues.alto / 2 };
        const mundo = (t: typeof antes, p: { x: number; y: number }) => {
          const c = { x: t.x + t.ancho / 2, y: t.y + t.alto / 2 };
          const a = (t.rotacion * Math.PI) / 180;
          const dx = t.x + p.x - c.x;
          const dy = t.y + p.y - c.y;
          return { x: c.x + dx * Math.cos(a) - dy * Math.sin(a), y: c.y + dx * Math.sin(a) + dy * Math.cos(a) };
        };
        const pa = mundo(antes, localAntes);
        const pd = mundo(despues, localDespues);
        expect(pd.x, `${asa} ${rotacion}°`).toBeCloseTo(pa.x, 6);
        expect(pd.y, `${asa} ${rotacion}°`).toBeCloseTo(pa.y, 6);
      }
    }
  });

  it('arrastrar el asa este de una forma rotada 90° cambia el alto visible, no el ancho', () => {
    const e = escena(forma('a', 0, 0, 200, 100, { transformacion: { x: 0, y: 0, ancho: 200, alto: 100, rotacion: 90 } }));
    // Con 90°, el eje local x apunta hacia abajo en la escena: arrastrar 40 hacia abajo agranda el ancho local.
    expect(getForma(redimensionar(e, ['a'], 'e', 0, 40), 'a').transformacion.ancho).toBeCloseTo(240);
    expect(getForma(redimensionar(e, ['a'], 'e', 40, 0), 'a').transformacion.ancho).toBeCloseTo(200);
  });

  it('un elemento bloqueado no cambia de tamaño', () => {
    const e = escena(forma('a', 0, 0, 100, 100, { bloqueado: true }));
    expect(redimensionar(e, ['a'], 'e', 50, 0)).toBe(e);
  });

  it('un arrastre nulo devuelve la misma escena', () => {
    expect(redimensionar(base, ['a'], 'e', 0, 0)).toBe(base);
    expect(redimensionar(base, ['a'], 'n', 30, 0)).toBe(base); // asa norte con arrastre horizontal
  });
});

describe('redimensionar varios elementos', () => {
  it('escala todo respecto de la caja de la selección y deja fijo el lado opuesto', () => {
    const e = escena(forma('a', 0, 0, 100, 100), forma('b', 100, 0, 100, 100));
    const r = redimensionar(e, ['a', 'b'], 'e', 200, 0);
    expect(getForma(r, 'a').transformacion).toMatchObject({ x: 0, ancho: 200 });
    expect(getForma(r, 'b').transformacion).toMatchObject({ x: 200, ancho: 200 });
    expect(cajaDeSeleccion(r, ['a', 'b'])).toEqual({ x: 0, y: 0, ancho: 400, alto: 100 });
  });

  it('un grupo se escala entero', () => {
    const e = escena(forma('a', 0, 0, 100, 100), forma('b', 100, 100, 100, 100), grupo('g', ['a', 'b']));
    const r = redimensionar(e, ['g'], 'se', 200, 200);
    expect(cajaDeSeleccion(r, ['g'])).toEqual({ x: 0, y: 0, ancho: 400, alto: 400 });
  });

  it('una línea se escala por su caja; una horizontal no se puede alargar en vertical', () => {
    const e = escena(linea('l', [[0, 0], [100, 0]]));
    const r = redimensionar(e, ['l'], 'e', 100, 50);
    expect(getLinea(r, 'l').puntos).toEqual([{ x: 0, y: 0 }, { x: 200, y: 0 }]);
  });

  it('los bloqueados quedan igual y no cuentan para la caja', () => {
    const e = escena(forma('a', 0, 0, 100, 100), forma('b', 500, 500, 100, 100, { bloqueado: true }));
    const r = redimensionar(e, ['a', 'b'], 'se', 100, 100);
    expect(getForma(r, 'b')).toBe(getForma(e, 'b'));
    expect(getForma(r, 'a').transformacion).toMatchObject({ ancho: 200, alto: 200 });
  });
});

describe('rotar', () => {
  it('suma grados a la rotación y normaliza a [0, 360)', () => {
    const e = escena(forma('a', 0, 0, 100, 50, { transformacion: { x: 0, y: 0, ancho: 100, alto: 50, rotacion: 350 } }));
    expect(getForma(rotar(e, ['a'], 20), 'a').transformacion.rotacion).toBe(10);
    expect(getForma(rotar(e, ['a'], -400), 'a').transformacion.rotacion).toBe(310);
  });

  it('una sola forma gira sobre su centro (el centro no se mueve)', () => {
    const e = escena(forma('a', 100, 100, 200, 100));
    const t = getForma(rotar(e, ['a'], 33), 'a').transformacion;
    expect(t.x + t.ancho / 2).toBeCloseTo(200);
    expect(t.y + t.alto / 2).toBeCloseTo(150);
  });

  it('rotar a y luego −a es la identidad', () => {
    const e = escena(forma('a', 13, 27, 120, 40), texto('t', 300, 10), linea('l', [[5, 5], [80, 40], [90, 200]]), grupo('g', ['a', 't']));
    for (const grados of [15, 33.3, 90, 179, 271]) {
      const vuelta = rotar(rotar(e, ['g', 'l'], grados), ['g', 'l'], -grados);
      for (const id of ['a', 't']) {
        const antes = getForma(e, id).transformacion;
        const despues = getForma(vuelta, id).transformacion;
        expect(despues.x).toBeCloseTo(antes.x, 6);
        expect(despues.y).toBeCloseTo(antes.y, 6);
        expect(despues.rotacion).toBeCloseTo(antes.rotacion, 6);
      }
      getLinea(vuelta, 'l').puntos.forEach((p, i) => {
        expect(p.x).toBeCloseTo(getLinea(e, 'l').puntos[i]?.x ?? NaN, 6);
        expect(p.y).toBeCloseTo(getLinea(e, 'l').puntos[i]?.y ?? NaN, 6);
      });
    }
  });

  it('varias formas giran juntas alrededor de un centro común: las distancias entre ellas se conservan', () => {
    const e = escena(forma('a', 0, 0, 100, 100), forma('b', 300, 0, 100, 100));
    const r = rotar(e, ['a', 'b'], 90);
    const centro = (id: string) => {
      const t = getForma(r, id).transformacion;
      return { x: t.x + t.ancho / 2, y: t.y + t.alto / 2 };
    };
    const a = centro('a');
    const b = centro('b');
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeCloseTo(300);
    expect(getForma(r, 'a').transformacion.rotacion).toBe(90);
    expect(getForma(r, 'b').transformacion.rotacion).toBe(90);
  });

  it('con un centro explícito gira alrededor de ese punto', () => {
    const e = escena(forma('a', 100, 0, 100, 100));
    const t = getForma(rotar(e, ['a'], 90, { centro: { x: 0, y: 0 } }), 'a').transformacion;
    // El centro (150, 50) pasa a (-50, 150).
    expect(t.x + t.ancho / 2).toBeCloseTo(-50);
    expect(t.y + t.alto / 2).toBeCloseTo(150);
  });

  it('ajusta a múltiplos de 15° si se pide', () => {
    const e = escena(forma('a', 0, 0));
    expect(getForma(rotar(e, ['a'], 22, { ajustar: 15 }), 'a').transformacion.rotacion).toBe(15);
    expect(getForma(rotar(e, ['a'], 23, { ajustar: 15 }), 'a').transformacion.rotacion).toBe(30);
    expect(rotar(e, ['a'], 5, { ajustar: 15 })).toBe(e); // 5° se redondea a 0°
  });

  it('los bloqueados no giran y sin grados válidos no hay cambio', () => {
    const e = escena(forma('a', 0, 0, 10, 10, { bloqueado: true }), forma('b', 0, 0));
    expect(rotar(e, ['a'], 30)).toBe(e);
    expect(rotar(e, ['b'], Number.NaN)).toBe(e);
    expect(rotar(e, ['b'], 0)).toBe(e);
  });

  it('las esquinas de una forma rotada 360° son las de la original', () => {
    const e = escena(forma('a', 10, 20, 100, 50));
    const r = rotar(rotar(e, ['a'], 180), ['a'], 180);
    expect(esquinas(getForma(r, 'a').transformacion)[2]).toEqual({ x: 110, y: 70 });
  });
});

describe('rotarA y ajustarAngulo', () => {
  it('fija la rotación absoluta, por el camino corto', () => {
    const e = escena(forma('a', 0, 0, 100, 100, { transformacion: { x: 0, y: 0, ancho: 100, alto: 100, rotacion: 350 } }));
    expect(getForma(rotarA(e, 'a', 10), 'a').transformacion.rotacion).toBeCloseTo(10);
    expect(getForma(rotarA(e, 'a', 100, { ajustar: 15 }), 'a').transformacion.rotacion).toBeCloseTo(105);
  });

  it('ignora ids que no existen o que no tienen caja', () => {
    const e = escena(linea('l', [[0, 0], [1, 1]]));
    expect(rotarA(e, 'l', 30)).toBe(e);
    expect(rotarA(e, 'nada', 30)).toBe(e);
  });

  it('ajustarAngulo', () => {
    expect(ajustarAngulo(7)).toBe(0);
    expect(ajustarAngulo(8)).toBe(15);
    expect(ajustarAngulo(44, 45)).toBe(45);
    expect(ajustarAngulo(10, 0)).toBe(10);
  });
});
