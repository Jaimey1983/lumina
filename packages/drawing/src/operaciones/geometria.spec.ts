import { describe, expect, it } from 'vitest';
import { cajaDeElemento, cajaDeSeleccion, elementoEn, elementosEn, esquinas } from './geometria.js';
import { escena, forma, get, grupo, linea, texto } from './util-pruebas.js';

describe('cajas', () => {
  it('una forma sin rotar: su propia caja', () => {
    const e = escena(forma('a', 10, 20, 100, 50));
    expect(cajaDeElemento(e, get(e, 'a'))).toEqual({ x: 10, y: 20, ancho: 100, alto: 50 });
  });

  it('una forma rotada 90°: la caja envolvente intercambia ancho y alto alrededor del centro', () => {
    const e = escena(forma('a', 0, 0, 100, 40, { transformacion: { x: 0, y: 0, ancho: 100, alto: 40, rotacion: 90 } }));
    const c = cajaDeElemento(e, get(e, 'a'));
    expect(c?.ancho).toBeCloseTo(40);
    expect(c?.alto).toBeCloseTo(100);
    expect((c?.x ?? 0) + (c?.ancho ?? 0) / 2).toBeCloseTo(50);
    expect((c?.y ?? 0) + (c?.alto ?? 0) / 2).toBeCloseTo(20);
  });

  it('rotada 45°, las cuatro esquinas quedan a la misma distancia del centro', () => {
    const e = escena(forma('a', 0, 0, 100, 100, { transformacion: { x: 0, y: 0, ancho: 100, alto: 100, rotacion: 45 } }));
    const t = (get(e, 'a') as { transformacion: { x: number; y: number; ancho: number; alto: number; rotacion: number } }).transformacion;
    for (const p of esquinas(t)) expect(Math.hypot(p.x - 50, p.y - 50)).toBeCloseTo(Math.hypot(50, 50));
  });

  it('una línea: la caja de sus puntos', () => {
    const e = escena(linea('l', [[10, 10], [110, 60]]));
    expect(cajaDeElemento(e, get(e, 'l'))).toEqual({ x: 10, y: 10, ancho: 100, alto: 50 });
  });

  it('una línea conectada usa la posición del puerto, no su punto guardado', () => {
    const e = escena(forma('f', 200, 200, 100, 100), linea('l', [[0, 0], [50, 50]], { origen: { elementoId: 'f', puerto: 3 } }));
    // Puerto 3 = izquierda de la forma = (200, 250): reemplaza al (0, 0) guardado.
    expect(cajaDeElemento(e, get(e, 'l'))).toEqual({ x: 50, y: 50, ancho: 150, alto: 200 });
  });

  it('un grupo: la unión de sus hijos; la selección de un grupo incluye a sus hijos', () => {
    const e = escena(forma('a', 0, 0, 50, 50), forma('b', 100, 100, 50, 50), grupo('g', ['a', 'b']));
    expect(cajaDeSeleccion(e, ['g'])).toEqual({ x: 0, y: 0, ancho: 150, alto: 150 });
  });

  it('selección vacía o con ids inexistentes: null', () => {
    const e = escena(forma('a', 0, 0));
    expect(cajaDeSeleccion(e, [])).toBeNull();
    expect(cajaDeSeleccion(e, ['nada'])).toBeNull();
  });
});

describe('elementoEn', () => {
  it('devuelve el de más arriba cuando se superponen', () => {
    const e = escena(forma('abajo', 0, 0, 100, 100), forma('arriba', 50, 50, 100, 100));
    expect(elementoEn(e, { x: 75, y: 75 })).toBe('arriba');
    expect(elementoEn(e, { x: 10, y: 10 })).toBe('abajo');
  });

  it('un clic en el vacío no elige nada', () => {
    expect(elementoEn(escena(forma('a', 0, 0)), { x: 500, y: 500 })).toBeUndefined();
  });

  it('respeta la rotación: la esquina original de una forma rotada ya no la toca', () => {
    const e = escena(forma('a', 0, 0, 200, 20, { transformacion: { x: 0, y: 0, ancho: 200, alto: 20, rotacion: 90 } }));
    // Rotada 90° alrededor de (100, 10): ahora es vertical, centrada en x=100.
    expect(elementoEn(e, { x: 100, y: -60 }, { tolerancia: 0 })).toBe('a');
    expect(elementoEn(e, { x: 5, y: 10 }, { tolerancia: 0 })).toBeUndefined();
  });

  it('una forma sin relleno solo se elige por el borde', () => {
    const e = escena(forma('a', 0, 0, 200, 200, { estilo: { relleno: { tipo: 'ninguno' } } }));
    expect(elementoEn(e, { x: 100, y: 100 }, { tolerancia: 2 })).toBeUndefined();
    expect(elementoEn(e, { x: 0, y: 100 }, { tolerancia: 2 })).toBe('a');
  });

  it('un rombo no se elige por la esquina vacía de su caja', () => {
    const e = escena(forma('r', 0, 0, 100, 100, { forma: 'rombo' }));
    expect(elementoEn(e, { x: 5, y: 5 }, { tolerancia: 0 })).toBeUndefined();
    expect(elementoEn(e, { x: 50, y: 50 }, { tolerancia: 0 })).toBe('r');
  });

  it('una elipse no se elige por la esquina de su caja', () => {
    const e = escena(forma('o', 0, 0, 100, 100, { forma: 'elipse' }));
    expect(elementoEn(e, { x: 3, y: 3 }, { tolerancia: 0 })).toBeUndefined();
    expect(elementoEn(e, { x: 50, y: 50 }, { tolerancia: 0 })).toBe('o');
  });

  it('una línea se elige cerca de su trazo, no lejos', () => {
    const e = escena(linea('l', [[0, 0], [200, 0]]));
    expect(elementoEn(e, { x: 100, y: 4 })).toBe('l');
    expect(elementoEn(e, { x: 100, y: 40 })).toBeUndefined();
  });

  it('un hijo de grupo devuelve el grupo; con entrarEnGrupos, el hijo', () => {
    const e = escena(forma('a', 0, 0, 50, 50), forma('b', 100, 0, 50, 50), grupo('g', ['a', 'b']));
    expect(elementoEn(e, { x: 25, y: 25 })).toBe('g');
    expect(elementoEn(e, { x: 25, y: 25 }, { entrarEnGrupos: true })).toBe('a');
  });

  it('ignora lo oculto y, por defecto, lo bloqueado', () => {
    const e = escena(forma('a', 0, 0, 100, 100), forma('oculta', 0, 0, 100, 100, { oculto: true }), forma('fija', 0, 0, 100, 100, { bloqueado: true }));
    expect(elementoEn(e, { x: 50, y: 50 })).toBe('a');
    expect(elementoEn(e, { x: 50, y: 50 }, { incluirBloqueados: true })).toBe('fija');
  });

  it('un grupo oculto oculta a sus hijos', () => {
    const e = escena(forma('a', 0, 0, 50, 50), forma('b', 100, 0, 50, 50), grupo('g', ['a', 'b'], { oculto: true }));
    expect(elementoEn(e, { x: 25, y: 25 })).toBeUndefined();
  });

  it('un texto se elige por toda su caja', () => {
    const e = escena(texto('t', 10, 10));
    expect(elementoEn(e, { x: 20, y: 20 }, { tolerancia: 0 })).toBe('t');
  });
});

describe('elementosEn', () => {
  const e = escena(forma('a', 10, 10, 50, 50), forma('b', 200, 200, 50, 50), forma('c', 40, 40, 100, 100), grupo('g', ['a', 'c']));

  it('contenidos: solo lo que cabe entero; un grupo cuenta como una unidad', () => {
    expect(elementosEn(e, { x: 0, y: 0, ancho: 300, alto: 300 })).toEqual(['b', 'g']);
    expect(elementosEn(e, { x: 0, y: 0, ancho: 100, alto: 100 })).toEqual([]);
  });

  it('cruzan: también lo que solo toca', () => {
    expect(elementosEn(e, { x: 190, y: 190, ancho: 20, alto: 20 }, { modo: 'cruzan' })).toEqual(['b']);
    expect(elementosEn(e, { x: 0, y: 0, ancho: 20, alto: 20 }, { modo: 'cruzan' })).toEqual(['g']);
  });

  it('no devuelve ocultos ni bloqueados', () => {
    const s = escena(forma('a', 0, 0, 10, 10), forma('o', 0, 0, 10, 10, { oculto: true }), forma('f', 0, 0, 10, 10, { bloqueado: true }));
    expect(elementosEn(s, { x: -5, y: -5, ancho: 50, alto: 50 })).toEqual(['a']);
  });
});
