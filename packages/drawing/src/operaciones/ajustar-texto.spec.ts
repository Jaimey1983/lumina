import { describe, expect, it } from 'vitest';
import { conectarFormas } from '../conectores/enlazar.js';
import { puntoDePuerto } from '../render/index.js';
import { altoDeTexto } from '../render/texto.js';
import { TIPOS_FORMA, type Escena, type Forma, type Linea, type Texto } from '../tipos.js';
import { ajustarAlTexto, ALTO_MINIMO_AJUSTE, CRECIMIENTO_MAXIMO, estadoDelTexto, MARGEN_VECINAS } from './ajustar-texto.js';
import { esquinas } from './geometria.js';
import { escena, forma, getForma, getLinea, grupo, linea, texto } from './util-pruebas.js';

// Valores escritos como literales (no con las constantes del código): una mutación de una constante tiene que romper una prueba.

const CINCO = 'Uno\nDos\nTres\nCuatro\nCinco'; // 5 líneas a letra 16 → 5 × 20 = 100, más 8 de relleno = 108 en un rectángulo
const f = (id: string, x: number, y: number, ancho: number, alto: number, extra: Record<string, unknown> = {}) => forma(id, x, y, ancho, alto, { texto: CINCO, ...extra });
const altoDe = (e: Escena, id: string): number => getForma(e, id).transformacion.alto;

describe('altoDeTexto', () => {
  it('cuenta las líneas, sin reducir la letra: líneas × tamaño × 1,25', () => {
    expect(altoDeTexto('Uno\nDos', 100, { tamano: 16, negrita: false })).toBe(40);
    expect(altoDeTexto('Uno', 100, { tamano: 20, negrita: false })).toBe(25);
    expect(altoDeTexto(CINCO, 100, { tamano: 16, negrita: false })).toBe(100);
  });

  it('un texto vacío ocupa una línea', () => {
    expect(altoDeTexto('', 100, { tamano: 16, negrita: false })).toBe(20);
  });

  it('una frase larga se parte con el ancho: más estrecho, más alto', () => {
    const frase = 'uno dos tres cuatro cinco seis siete ocho';
    expect(altoDeTexto(frase, 400, { tamano: 10, negrita: false })).toBe(12.5); // 1 línea
    expect(altoDeTexto(frase, 100, { tamano: 10, negrita: false })).toBe(37.5); // 3 líneas (20 caracteres por línea)
    expect(altoDeTexto(frase, 60, { tamano: 10, negrita: false })).toBe(50); // 4 líneas
  });

  it('las viñetas estrechan el ancho y por eso pueden pedir más alto', () => {
    const frase = 'aaaa bbbb cccc dddd eeee ffff gggg';
    expect(altoDeTexto(frase, 100, { tamano: 10, negrita: false })).toBe(25);
    expect(altoDeTexto(frase, 100, { tamano: 10, negrita: false, vinetas: 'numeros' })).toBe(37.5);
  });
});

describe('ajustarAlTexto: el alto justo', () => {
  it('un rectángulo crece hasta que el texto cabe: 5 líneas × 20 + 8 de relleno = 108', () => {
    const e = escena(f('A', 10, 20, 200, 60));
    const r = ajustarAlTexto(e, ['A']);
    expect(altoDe(r.escena, 'A')).toBe(108);
    expect(r.cambios).toEqual([{ id: 'A', altoAntes: 60, altoDespues: 108, frenadoPorVecina: false, noCabe: false }]);
  });

  it('es lo justo: con un alto menos ya no cabe (el render reduciría la letra)', () => {
    const r = ajustarAlTexto(escena(f('A', 0, 0, 200, 60)), ['A']);
    expect(estadoDelTexto(getForma(r.escena, 'A'))).toEqual({ tipo: 'cabe' });
    const uno = { ...getForma(r.escena, 'A'), transformacion: { ...getForma(r.escena, 'A').transformacion, alto: 107 } } as Forma;
    expect(estadoDelTexto(uno).tipo).toBe('reduce');
  });

  it('solo cambia el alto: ancho, giro, texto, posición y estilo quedan', () => {
    const e = escena(f('A', 10, 20, 200, 60, { estiloTexto: { negrita: true }, estilo: { opacidad: 0.5 } }));
    const antes = getForma(e, 'A');
    const despues = getForma(ajustarAlTexto(e, ['A']).escena, 'A');
    expect(despues.transformacion).toMatchObject({ x: 10, y: 20, ancho: 200, rotacion: 0 });
    expect(despues.texto).toBe(antes.texto);
    expect(despues.estiloTexto).toEqual(antes.estiloTexto);
    expect(despues.estilo).toEqual(antes.estilo);
  });

  it('un cuadro de texto libre: líneas × 20 + 8', () => {
    const e = escena(texto('T', 0, 0, { texto: 'Uno\nDos\nTres', transformacion: { x: 0, y: 0, ancho: 200, alto: 20, rotacion: 0 } }));
    const r = ajustarAlTexto(e, ['T']);
    expect((r.escena.elementos[0] as Texto).transformacion.alto).toBe(68);
  });

  it('la zona de texto depende de la forma: una elipse necesita más alto que un rectángulo', () => {
    const e = escena(f('R', 0, 0, 200, 60), f('E', 400, 0, 200, 60, { forma: 'elipse' }));
    const r = ajustarAlTexto(e, ['R', 'E']).escena;
    expect(altoDe(r, 'R')).toBe(108);
    expect(altoDe(r, 'E')).toBe(153);
  });

  it('con viñetas el alto tiene en cuenta la sangría', () => {
    const frase = 'aaaa bbbb cccc dddd eeee ffff gggg';
    const sin = escena(forma('A', 0, 0, 108, 40, { texto: frase, estiloTexto: { tamano: 10 } }));
    const con = escena(forma('A', 0, 0, 108, 40, { texto: frase, estiloTexto: { tamano: 10, vinetas: 'numeros' } }));
    expect(altoDe(ajustarAlTexto(sin, ['A']).escena, 'A')).toBe(33); // 2 líneas × 12,5 + 8
    expect(altoDe(ajustarAlTexto(con, ['A']).escena, 'A')).toBe(46); // 3 líneas × 12,5 + 8 = 45,5
  });
});

describe('ajustarAlTexto: crecer o también encoger', () => {
  it('con «soloCrecer» una caja que ya sobra no se toca (misma escena)', () => {
    const e = escena(forma('A', 0, 0, 200, 200, { texto: 'Uno' }));
    const r = ajustarAlTexto(e, ['A'], { soloCrecer: true });
    expect(r.escena).toBe(e);
    expect(r.cambios).toEqual([]);
  });

  it('sin él, el comando explícito encoge hasta lo justo: 1 línea × 20 + 8 = 28', () => {
    const e = escena(forma('A', 0, 0, 200, 200, { texto: 'Uno' }));
    expect(altoDe(ajustarAlTexto(e, ['A']).escena, 'A')).toBe(28);
  });

  it('nunca baja de 24 unidades', () => {
    const e = escena(forma('A', 0, 0, 200, 200, { texto: 'x', estiloTexto: { tamano: 6 } }));
    expect(ALTO_MINIMO_AJUSTE).toBe(24);
    expect(altoDe(ajustarAlTexto(e, ['A']).escena, 'A')).toBe(24);
  });

  it('«soloCrecer» también crece cuando no cabe', () => {
    expect(altoDe(ajustarAlTexto(escena(f('A', 0, 0, 200, 60)), ['A'], { soloCrecer: true }).escena, 'A')).toBe(108);
  });

  it('no crece más de cuatro veces su alto original, aunque el texto no quepa', () => {
    const e = escena(forma('A', 0, 0, 200, 20, { texto: Array.from({ length: 100 }, (_v, i) => `l${i}`).join('\n') }));
    expect(CRECIMIENTO_MAXIMO).toBe(4);
    const r = ajustarAlTexto(e, ['A']);
    expect(altoDe(r.escena, 'A')).toBe(80);
    expect(r.cambios[0]).toMatchObject({ altoDespues: 80, noCabe: true, frenadoPorVecina: false });
  });

  it('ni pasa del máximo del modelo (20000)', () => {
    const e = escena(forma('A', 0, 0, 200, 6000, { texto: Array.from({ length: 1000 }, () => 'x').join('\n') }));
    const r = ajustarAlTexto(e, ['A'], { soloCrecer: true });
    expect(r.cambios[0]?.altoDespues).toBe(20000);
  });
});

describe('ajustarAlTexto: la esquina superior izquierda se queda', () => {
  it.each([0, 30, 90, 180, 270])('con giro de %s° la esquina de arriba a la izquierda no se mueve', (giro) => {
    const e = escena(f('A', 100, 100, 200, 60, { transformacion: { x: 100, y: 100, ancho: 200, alto: 60, rotacion: giro } }));
    const antes = esquinas(getForma(e, 'A').transformacion);
    const r = ajustarAlTexto(e, ['A']);
    const t = getForma(r.escena, 'A').transformacion;
    const despues = esquinas(t);
    expect(t.alto).toBe(108);
    expect(t.rotacion).toBe(giro);
    expect(despues[0]?.x).toBeCloseTo(antes[0]?.x as number, 1);
    expect(despues[0]?.y).toBeCloseTo(antes[0]?.y as number, 1);
    expect(despues[1]?.x).toBeCloseTo(antes[1]?.x as number, 1);
    expect(despues[1]?.y).toBeCloseTo(antes[1]?.y as number, 1);
  });

  it('sin giro, x e y no cambian', () => {
    const r = ajustarAlTexto(escena(f('A', 37, 41, 200, 60)), ['A']);
    expect(getForma(r.escena, 'A').transformacion).toMatchObject({ x: 37, y: 41 });
  });
});

describe('ajustarAlTexto: lo que no cambia', () => {
  it('lo bloqueado, una forma sin texto, solo espacios y una línea no cambian (misma escena)', () => {
    const e = escena(f('B', 0, 0, 200, 60, { bloqueado: true }), forma('S', 300, 0, 200, 60), forma('E', 600, 0, 200, 60, { texto: '  \n ' }), linea('L', [[0, 300], [100, 300]], { texto: CINCO }));
    const r = ajustarAlTexto(e, ['B', 'S', 'E', 'L']);
    expect(r.escena).toBe(e);
    expect(r.cambios).toEqual([]);
  });

  it('es idempotente: aplicarla dos veces da lo mismo (la segunda, la misma escena)', () => {
    const una = ajustarAlTexto(escena(f('A', 0, 0, 200, 60)), ['A']).escena;
    const dos = ajustarAlTexto(una, ['A']);
    expect(dos.escena).toBe(una);
    expect(dos.cambios).toEqual([]);
  });

  it('sin ids o con ids que no existen, la misma escena', () => {
    const e = escena(f('A', 0, 0, 200, 60));
    expect(ajustarAlTexto(e, []).escena).toBe(e);
    expect(ajustarAlTexto(e, ['no-existe']).escena).toBe(e);
  });

  it('solo cambia lo elegido, también dentro de un grupo', () => {
    const e = escena(f('A', 0, 0, 200, 60), f('B', 300, 0, 200, 60), f('C', 600, 0, 200, 60), grupo('G', ['B', 'C']));
    const r = ajustarAlTexto(e, ['A', 'G']).escena;
    expect([altoDe(r, 'A'), altoDe(r, 'B'), altoDe(r, 'C')]).toEqual([108, 108, 108]);
    const solo = ajustarAlTexto(e, ['A']).escena;
    expect([altoDe(solo, 'A'), altoDe(solo, 'B'), altoDe(solo, 'C')]).toEqual([108, 60, 60]);
  });
});

describe('ajustarAlTexto: no pisa a las vecinas', () => {
  const con = (...vecina: Array<Record<string, unknown>>): Escena => escena(f('A', 0, 0, 200, 60), ...vecina);
  const sinTexto = (id: string, x: number, y: number, ancho = 200, extra: Record<string, unknown> = {}) => forma(id, x, y, ancho, 40, extra);

  it('la de debajo detiene el crecimiento con 8 unidades de margen y el cambio lo dice', () => {
    expect(MARGEN_VECINAS).toBe(8);
    const r = ajustarAlTexto(con(sinTexto('V', 0, 100)), ['A']);
    expect(altoDe(r.escena, 'A')).toBe(92); // la vecina empieza en 100: 100 − 8
    expect(r.cambios[0]).toMatchObject({ altoDespues: 92, frenadoPorVecina: true, noCabe: true });
  });

  it('el frenazo no encoge ni mueve nada más', () => {
    const e = con(sinTexto('V', 0, 100));
    const r = ajustarAlTexto(e, ['A']).escena;
    expect(getForma(r, 'V').transformacion).toEqual(getForma(e, 'V').transformacion);
  });

  it('una vecina con hueco suficiente no frena', () => {
    const r = ajustarAlTexto(con(sinTexto('V', 0, 130)), ['A']);
    expect(altoDe(r.escena, 'A')).toBe(108);
    expect(r.cambios[0]?.frenadoPorVecina).toBe(false);
  });

  it('una al lado (sin solape horizontal) no frena', () => {
    expect(altoDe(ajustarAlTexto(con(sinTexto('V', 260, 100)), ['A']).escena, 'A')).toBe(108);
  });

  it('una oculta no frena; una dentro de un grupo oculto tampoco', () => {
    expect(altoDe(ajustarAlTexto(con(sinTexto('V', 0, 100, 200, { oculto: true })), ['A']).escena, 'A')).toBe(108);
    const g = con(sinTexto('V', 0, 100), grupo('G', ['V', 'W']), sinTexto('W', 400, 100));
    const oculto = escena(f('A', 0, 0, 200, 60), sinTexto('V', 0, 100), sinTexto('W', 400, 100), grupo('G', ['V', 'W'], { oculto: true }));
    expect(altoDe(ajustarAlTexto(oculto, ['A']).escena, 'A')).toBe(108);
    expect(altoDe(ajustarAlTexto(g, ['A']).escena, 'A')).toBe(92); // sin ocultar sí frena
  });

  it('una bloqueada sí frena', () => {
    expect(altoDe(ajustarAlTexto(con(sinTexto('V', 0, 100, 200, { bloqueado: true })), ['A']).escena, 'A')).toBe(92);
  });

  it('un cuadro de texto libre también frena', () => {
    const e = con(texto('T', 0, 100, { texto: 'x', transformacion: { x: 0, y: 100, ancho: 200, alto: 30, rotacion: 0 } }));
    expect(altoDe(ajustarAlTexto(e, ['A']).escena, 'A')).toBe(92);
  });

  it('una forma de un grupo frena por sí misma (los grupos cuentan por sus hijos)', () => {
    const e = escena(f('A', 0, 0, 200, 60), sinTexto('V', 0, 100), sinTexto('W', 0, 300), grupo('G', ['V', 'W']));
    expect(altoDe(ajustarAlTexto(e, ['A']).escena, 'A')).toBe(92);
  });

  it('una girada cuenta por la caja que ocupa en la escena', () => {
    // 200 × 40 girada 90° ocupa 40 × 200 centrada en (100, 120): de y = 20 a 220 → ya pisa a A, no cuenta; a más abajo sí
    const e = con(forma('V', 0, 250, 200, 40, { transformacion: { x: 0, y: 250, ancho: 200, alto: 40, rotacion: 90 } }));
    const caja = esquinas(getForma(e, 'V').transformacion);
    const arriba = Math.min(...caja.map((p) => p.y));
    expect(arriba).toBe(170);
    expect(altoDe(ajustarAlTexto(e, ['A']).escena, 'A')).toBe(108); // empieza en 170: cabe de sobra
    const cerca = con(forma('V', 0, 150, 200, 40, { transformacion: { x: 0, y: 150, ancho: 200, alto: 40, rotacion: 90 } }));
    const arriba2 = Math.min(...esquinas(getForma(cerca, 'V').transformacion).map((p) => p.y));
    expect(arriba2).toBe(70);
    expect(altoDe(ajustarAlTexto(cerca, ['A']).escena, 'A')).toBe(62); // 70 − 8
  });

  it('una que ya pisa la caja actual no cuenta: no se puede arreglar desde aquí', () => {
    expect(altoDe(ajustarAlTexto(con(sinTexto('V', 0, 40)), ['A']).escena, 'A')).toBe(108);
  });

  it('al encoger no hay vecinas que valgan', () => {
    const e = escena(forma('A', 0, 0, 200, 200, { texto: 'Uno' }), sinTexto('V', 0, 210));
    expect(altoDe(ajustarAlTexto(e, ['A']).escena, 'A')).toBe(28);
  });

  it('lo que una elegida ya creció cuenta para las siguientes: una girada que crece de lado frena a la que viene después', () => {
    // A (girada 90°) crece hacia la izquierda: su caja pasa de x 370–430 a x 322–430. E, más a la izquierda y más arriba, crecería hacia abajo
    // dentro de ese hueco: con la caja nueva de A frena en 82; con la vieja habría llegado a 108.
    const e = escena(f('A', 300, 200, 200, 60, { transformacion: { x: 300, y: 200, ancho: 200, alto: 60, rotacion: 90 } }), f('E', 100, 40, 230, 60));
    expect(esquinas(getForma(e, 'A').transformacion).map((p) => Math.round(p.x))).toEqual([430, 430, 370, 370]);
    const r = ajustarAlTexto(e, ['A', 'E']).escena;
    expect(altoDe(r, 'A')).toBe(108);
    expect(altoDe(r, 'E')).toBe(82);
  });

  it('dos elegidas, una encima de la otra: la de arriba la frena la de abajo', () => {
    const e = escena(f('A', 0, 0, 200, 60), f('B', 0, 100, 200, 60));
    const r = ajustarAlTexto(e, ['A', 'B']).escena;
    expect(altoDe(r, 'A')).toBe(92);
    expect(altoDe(r, 'B')).toBe(108);
  });
});

describe('ajustarAlTexto: los conectores', () => {
  it('uno pegado a la forma la sigue: su extremo queda en el puerto de abajo', () => {
    let e = escena(f('A', 0, 0, 200, 60), forma('B', 0, 400, 200, 60));
    e = conectarFormas(e, 'A', 'B');
    const l = e.elementos.find((x) => x.tipo === 'linea') as Linea;
    const r = ajustarAlTexto(e, ['A']).escena;
    const nueva = r.elementos.find((x) => x.tipo === 'linea') as Linea;
    expect(nueva.origen).toEqual(l.origen);
    const a = getForma(r, 'A');
    expect(nueva.puntos[0]).toEqual(puntoDePuerto(a, l.origen?.puerto as number));
    expect(nueva.puntos[0]?.y).toBe(108); // el puerto de abajo de A ahora está en y = 108
  });

  it('los demás conectores no se mueven ni una unidad', () => {
    let e = escena(f('A', 0, 0, 200, 60), forma('B', 0, 400, 200, 60), forma('C', 600, 400, 200, 60), forma('D', 900, 400, 100, 60));
    e = conectarFormas(e, 'B', 'C');
    e = conectarFormas(e, 'C', 'D');
    const libre = escena(f('A', 0, 0, 200, 60), linea('L', [[10, 300], [90, 340]]));
    const antes = e.elementos.filter((x) => x.tipo === 'linea');
    const despues = ajustarAlTexto(e, ['A']).escena.elementos.filter((x) => x.tipo === 'linea');
    expect(despues).toEqual(antes);
    const l = getLinea(ajustarAlTexto(libre, ['A']).escena, 'L');
    expect(l.puntos).toEqual([{ x: 10, y: 300 }, { x: 90, y: 340 }]);
  });
});

describe('ajustarAlTexto con las 21 formas', () => {
  it.each(TIPOS_FORMA)('«%s»: tras ajustar, el texto cabe o la caja llegó al tope de cuatro veces', (tipo) => {
    const e = escena(forma('A', 0, 0, 160, 40, { forma: tipo, texto: 'Uno\nDos\nTres\nCuatro' }));
    const r = ajustarAlTexto(e, ['A'], { soloCrecer: true });
    const a = getForma(r.escena, 'A');
    expect(a.transformacion.ancho).toBe(160);
    expect(a.transformacion.alto === 160 || estadoDelTexto(a).tipo === 'cabe').toBe(true);
    expect(a.transformacion.alto).toBeGreaterThanOrEqual(40);
  });
});

describe('estadoDelTexto', () => {
  it('«cabe» si el render no cambia nada', () => {
    expect(estadoDelTexto(getForma(escena(forma('A', 0, 0, 200, 100, { texto: 'Uno' })), 'A'))).toEqual({ tipo: 'cabe' });
  });

  it('«reduce» con el tamaño al que baja el autoajuste en una forma', () => {
    expect(estadoDelTexto(getForma(escena(f('A', 0, 0, 200, 60)), 'A'))).toEqual({ tipo: 'reduce', tamano: 8 });
  });

  it('«sale» en un cuadro de texto libre cuyo texto no entra (no se reduce)', () => {
    const e = escena(texto('T', 0, 0, { texto: CINCO, transformacion: { x: 0, y: 0, ancho: 200, alto: 40, rotacion: 0 } }));
    expect(estadoDelTexto(e.elementos[0] as Texto)).toEqual({ tipo: 'sale' });
    const ancho = escena(texto('T', 0, 0, { texto: 'Uno', transformacion: { x: 0, y: 0, ancho: 200, alto: 40, rotacion: 0 } }));
    expect(estadoDelTexto(ancho.elementos[0] as Texto)).toEqual({ tipo: 'cabe' });
  });

  it('sin texto, «cabe»', () => {
    expect(estadoDelTexto(getForma(escena(forma('A', 0, 0, 200, 20)), 'A'))).toEqual({ tipo: 'cabe' });
  });
});

describe('rendimiento (DW9)', () => {
  const mediana = (g: () => void): number => {
    for (let i = 0; i < 3; i++) g();
    const t: number[] = [];
    for (let i = 0; i < 7; i++) {
      const a = performance.now();
      g();
      t.push(performance.now() - a);
    }
    return [...t].sort((x, y) => x - y)[3] as number;
  };

  // Una cota absoluta en ms depende del equipo (en CI dio 52 ms con 40 de tope); lo que importa es que
  // el costo crezca de forma lineal: 5× las formas debe costar mucho menos que 25× (cuadrático).
  const montar = (n: number) => {
    const e = escena(...Array.from({ length: n }, (_v, i) => forma(`f${i}`, (i % 25) * 300, Math.floor(i / 25) * 300, 200, 60, { texto: 'Primera idea del tema\nSegunda idea algo más larga que se parte\nTercera' })));
    return { e, ids: e.elementos.map((x) => x.id) };
  };

  it('ajustar 500 formas con texto crece de forma lineal (no cuadrática) y sin pasarse de 250 ms', () => {
    const chica = montar(100);
    const grande = montar(500);
    const t100 = mediana(() => void ajustarAlTexto(chica.e, chica.ids));
    const t500 = mediana(() => void ajustarAlTexto(grande.e, grande.ids));
    expect(t500).toBeLessThan(Math.max(t100, 1) * 12);
    expect(t500).toBeLessThan(250);
  });
});
