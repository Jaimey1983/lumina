import { describe, expect, it } from 'vitest';

import { escenaVacia, esColorValido, LIMITES, normalizarEscena } from './normalizar.js';
import { ESCENA_VERSION, TIPOS_FORMA, type Elemento, type Escena, type Forma, type Grupo, type Linea } from './tipos.js';

/** Escena bien formada con un elemento de cada tipo, para comprobar que se conserva tal cual. */
function escenaCompleta(): unknown {
  return {
    version: 1,
    ancho: 1000,
    alto: 600,
    fondo: '#F8FAFC',
    elementos: [
      {
        id: 'a',
        tipo: 'forma',
        forma: 'rombo',
        nombre: 'Decisión',
        descripcion: 'Rombo de decisión',
        transformacion: { x: 10, y: 20, ancho: 120, alto: 80, rotacion: 45 },
        estilo: {
          relleno: { tipo: 'degradado', desde: '#FFFFFF', hasta: 'var(--primary)', angulo: 90 },
          contorno: { color: '#0F172A', grosor: 3, patron: 'guiones' },
          opacidad: 0.8,
          sombra: { color: '#00000040', desenfoque: 6, dx: 1, dy: 3 },
          radio: 4,
        },
        texto: '¿Continúa?',
        estiloTexto: { tamano: 14, negrita: true, cursiva: false, subrayado: false, alineacionH: 'centro', alineacionV: 'medio', color: '#0F172A', fuente: 'Georgia' },
        parametros: { puntas: 5 },
      },
      {
        id: 'b',
        tipo: 'forma',
        forma: 'elipse',
        transformacion: { x: 300, y: 20, ancho: 100, alto: 100, rotacion: 0 },
        bloqueado: true,
        oculto: false,
      },
      {
        id: 'l',
        tipo: 'linea',
        puntos: [{ x: 130, y: 60 }, { x: 300, y: 60 }],
        trazado: 'ortogonal',
        inicio: 'circulo',
        fin: 'flecha-abierta',
        origen: { elementoId: 'a', puerto: 1 },
        destino: { elementoId: 'b', puerto: 3 },
        texto: 'Sí',
      },
      { id: 't', tipo: 'texto', texto: 'Título', transformacion: { x: 0, y: 0, ancho: 300, alto: 40, rotacion: 0 } },
      { id: 'g', tipo: 'grupo', hijos: ['a', 'b'] },
    ],
  };
}

const porId = (e: Escena, id: string): Elemento => {
  const el = e.elementos.find((x) => x.id === id);
  if (!el) throw new Error(`no existe el elemento ${id}`);
  return el;
};

describe('escenaVacia', () => {
  it('es una escena válida y ya normalizada', () => {
    const e = escenaVacia();
    expect(e).toEqual({ version: ESCENA_VERSION, ancho: 1280, alto: 720, fondo: null, elementos: [] });
    expect(normalizarEscena(e)).toEqual(e);
  });

  it('cada llamada devuelve un objeto nuevo', () => {
    expect(escenaVacia()).not.toBe(escenaVacia());
    expect(escenaVacia().elementos).not.toBe(escenaVacia().elementos);
  });
});

describe('normalizarEscena — estabilidad', () => {
  it('es idempotente en una escena completa', () => {
    const una = normalizarEscena(escenaCompleta());
    expect(normalizarEscena(una)).toEqual(una);
  });

  it('conserva lo válido tal cual', () => {
    const e = normalizarEscena(escenaCompleta());
    expect(e).toMatchObject({ version: 1, ancho: 1000, alto: 600, fondo: '#F8FAFC' });
    expect(e.elementos.map((x) => x.id)).toEqual(['a', 'b', 'l', 't', 'g']);
    const a = porId(e, 'a') as Forma;
    expect(a).toMatchObject({
      forma: 'rombo',
      nombre: 'Decisión',
      descripcion: 'Rombo de decisión',
      texto: '¿Continúa?',
      parametros: { puntas: 5 },
      transformacion: { x: 10, y: 20, ancho: 120, alto: 80, rotacion: 45 },
    });
    expect(a.estilo.relleno).toEqual({ tipo: 'degradado', desde: '#FFFFFF', hasta: 'var(--primary)', angulo: 90 });
    expect(a.estilo.sombra).toEqual({ color: '#00000040', desenfoque: 6, dx: 1, dy: 3 });
    expect(a.estiloTexto.fuente).toBe('Georgia');
    expect(porId(e, 'b').bloqueado).toBe(true);
    expect(porId(e, 'l')).toMatchObject({ trazado: 'ortogonal', inicio: 'circulo', fin: 'flecha-abierta', origen: { elementoId: 'a', puerto: 1 }, destino: { elementoId: 'b', puerto: 3 }, texto: 'Sí' });
    expect((porId(e, 'g') as Grupo).hijos).toEqual(['a', 'b']);
  });

  it('el orden del arreglo (apilado) se respeta', () => {
    const entrada = { elementos: ['z', 'y', 'x'].map((id) => ({ id, tipo: 'forma' })) };
    expect(normalizarEscena(entrada).elementos.map((x) => x.id)).toEqual(['z', 'y', 'x']);
  });

  it('no modifica la entrada', () => {
    const entrada = escenaCompleta();
    const copia = JSON.parse(JSON.stringify(entrada));
    normalizarEscena(entrada);
    expect(entrada).toEqual(copia);
  });

  it('el resultado se puede serializar a JSON y volver sin cambios', () => {
    const e = normalizarEscena(escenaCompleta());
    expect(normalizarEscena(JSON.parse(JSON.stringify(e)))).toEqual(e);
  });
});

describe('normalizarEscena — entradas basura', () => {
  it.each([null, undefined, 0, 1, 'texto', true, [], [1, 2], () => 1, Symbol('x')])('devuelve escena vacía para %s', (basura) => {
    expect(normalizarEscena(basura)).toEqual(escenaVacia());
  });

  it('un objeto vacío o con elementos que no es arreglo da escena vacía', () => {
    expect(normalizarEscena({})).toEqual(escenaVacia());
    expect(normalizarEscena({ elementos: 'no' })).toEqual(escenaVacia());
    expect(normalizarEscena({ elementos: { 0: {} } })).toEqual(escenaVacia());
  });

  it('descarta los elementos irreconocibles y conserva los demás', () => {
    const e = normalizarEscena({
      elementos: [null, 3, 'x', [], {}, { tipo: 'dragon' }, { tipo: 'forma', id: 'ok' }],
    });
    expect(e.elementos.map((x) => x.id)).toEqual(['ok']);
  });

  it('un elemento con propiedades de tipo equivocado cae a los valores por defecto', () => {
    const e = normalizarEscena({
      ancho: 'ancho',
      alto: NaN,
      fondo: 12,
      elementos: [
        {
          tipo: 'forma',
          id: 99,
          forma: 'hexagono-gigante',
          nombre: { x: 1 },
          bloqueado: 'sí',
          transformacion: { x: 'a', y: Infinity, ancho: -4, alto: NaN, rotacion: 'girar' },
          estilo: { relleno: 'rojo', contorno: 7, opacidad: 'media', sombra: 'sí', radio: -3 },
          texto: 5,
          estiloTexto: { tamano: 'grande', alineacionH: 'diagonal', color: 'rojo' },
        },
      ],
    });
    expect(e.ancho).toBe(1280);
    expect(e.alto).toBe(720);
    expect(e.fondo).toBeNull();
    const f = e.elementos[0] as Forma;
    expect(f.id).toBe('forma-1');
    expect(f.forma).toBe('rectangulo');
    expect(f.nombre).toBeUndefined();
    expect(f.bloqueado).toBe(false);
    expect(f.transformacion).toEqual({ x: 0, y: 0, ancho: 1, alto: 100, rotacion: 0 });
    expect(f.estilo).toEqual({
      relleno: { tipo: 'solido', color: '#FFFFFF' },
      contorno: { color: '#334155', grosor: 2, patron: 'solido' },
      opacidad: 1,
      sombra: null,
      radio: 0,
    });
    expect(f.texto).toBeUndefined();
    expect(f.estiloTexto).toMatchObject({ tamano: 16, alineacionH: 'centro', color: '#0F172A' });
  });

  it('nunca lanza, ni con referencias circulares ni con objetos hostiles', () => {
    const circular: Record<string, unknown> = { tipo: 'forma' };
    circular.estilo = circular;
    circular.transformacion = circular;
    expect(() => normalizarEscena({ elementos: [circular] })).not.toThrow();
    expect(normalizarEscena({ elementos: [circular] }).elementos).toHaveLength(1);

    const getterQueLanza = {
      get elementos(): never {
        throw new Error('getter hostil');
      },
    };
    expect(() => normalizarEscena(getterQueLanza)).not.toThrow();
    expect(normalizarEscena(getterQueLanza)).toEqual(escenaVacia());

    const proxyHostil = new Proxy({}, { get: () => { throw new Error('proxy hostil'); }, has: () => { throw new Error('proxy hostil'); } });
    expect(normalizarEscena(proxyHostil)).toEqual(escenaVacia());
    expect(normalizarEscena({ elementos: [proxyHostil, { tipo: 'forma', id: 'ok' }] }).elementos.length).toBeLessThanOrEqual(1);
  });

  it('rechaza prototipos contaminados sin usarlos', () => {
    const e = normalizarEscena(JSON.parse('{"__proto__":{"polluted":true},"elementos":[{"tipo":"forma","__proto__":{"x":1},"constructor":"x"}]}'));
    expect(e.elementos).toHaveLength(1);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(Object.keys(e.elementos[0])).not.toContain('constructor');
  });
});

describe('normalizarEscena — ids', () => {
  it('asigna ids únicos a los que faltan o son inválidos', () => {
    const e = normalizarEscena({
      elementos: [{ tipo: 'forma' }, { tipo: 'forma', id: '' }, { tipo: 'forma', id: 'con espacio' }, { tipo: 'forma', id: 'x'.repeat(65) }, { tipo: 'texto' }],
    });
    const ids = e.elementos.map((x) => x.id);
    expect(new Set(ids).size).toBe(5);
    for (const id of ids) expect(id).toMatch(/^[A-Za-z0-9_-]{1,64}$/);
  });

  it('los ids duplicados se renombran y el primero conserva el suyo', () => {
    const e = normalizarEscena({ elementos: [{ tipo: 'forma', id: 'dup' }, { tipo: 'forma', id: 'dup' }, { tipo: 'texto', id: 'dup' }] });
    const ids = e.elementos.map((x) => x.id);
    expect(ids[0]).toBe('dup');
    expect(new Set(ids).size).toBe(3);
  });

  it('un id generado no choca con uno explícito que aparece después', () => {
    const e = normalizarEscena({ elementos: [{ tipo: 'forma' }, { tipo: 'forma', id: 'forma-2' }, { tipo: 'forma' }] });
    const ids = e.elementos.map((x) => x.id);
    expect(new Set(ids).size).toBe(3);
    expect(ids).toContain('forma-2');
  });

  it('el resultado es estable aunque los ids se hayan generado', () => {
    const una = normalizarEscena({ elementos: [{ tipo: 'forma' }, { tipo: 'forma' }, { tipo: 'forma', id: 'forma-2' }] });
    expect(normalizarEscena(una)).toEqual(una);
  });
});

describe('normalizarEscena — números y límites', () => {
  it('acota las medidas de la escena', () => {
    expect(normalizarEscena({ ancho: 5, alto: 5 })).toMatchObject({ ancho: 100, alto: 100 });
    expect(normalizarEscena({ ancho: 1e9, alto: 1e9 })).toMatchObject({ ancho: 10000, alto: 10000 });
    expect(normalizarEscena({ ancho: Infinity, alto: -Infinity })).toMatchObject({ ancho: 1280, alto: 720 });
  });

  it('acota posición, tamaño y rotación de un elemento', () => {
    const f = normalizarEscena({
      elementos: [{ tipo: 'forma', transformacion: { x: 1e12, y: -1e12, ancho: 1e12, alto: 0, rotacion: -90 } }],
    }).elementos[0] as Forma;
    expect(f.transformacion).toEqual({ x: 100000, y: -100000, ancho: 20000, alto: 1, rotacion: 270 });
  });

  it.each([[360, 0], [720, 0], [-360, 0], [370, 10], [-10, 350], [359.999, 0], [45.456, 45.46]])('rotación %s° → %s°', (entrada, esperado) => {
    const f = normalizarEscena({ elementos: [{ tipo: 'forma', transformacion: { rotacion: entrada } }] }).elementos[0] as Forma;
    expect(f.transformacion.rotacion).toBe(esperado);
  });

  it('redondea a 2 decimales y por eso es estable', () => {
    const una = normalizarEscena({ elementos: [{ tipo: 'forma', transformacion: { x: 10.123456, y: 0.005, ancho: 33.3333, alto: 2 } }] });
    expect((una.elementos[0] as Forma).transformacion).toMatchObject({ x: 10.12, y: 0.01, ancho: 33.33 });
    expect(normalizarEscena(una)).toEqual(una);
  });

  it('acota opacidad, grosor, radio, sombra y tamaño de texto', () => {
    const f = normalizarEscena({
      elementos: [
        {
          tipo: 'forma',
          estilo: { opacidad: 7, contorno: { grosor: 1e6 }, radio: 1e9, sombra: { desenfoque: 1e6, dx: -1e6, dy: 1e6 } },
          estiloTexto: { tamano: 1e6 },
        },
        { tipo: 'forma', estilo: { opacidad: -1 }, estiloTexto: { tamano: 1 } },
      ],
    }).elementos as Forma[];
    expect(f[0].estilo).toMatchObject({ opacidad: 1, radio: 5000, contorno: { grosor: 50 }, sombra: { desenfoque: 100, dx: -200, dy: 200 } });
    expect(f[0].estiloTexto.tamano).toBe(400);
    expect(f[1].estilo.opacidad).toBe(0);
    expect(f[1].estiloTexto.tamano).toBe(6);
  });

  it('limita la cantidad de elementos', () => {
    const muchos = Array.from({ length: LIMITES.elementos + 500 }, (_, i) => ({ tipo: 'forma', id: `f${i}` }));
    expect(normalizarEscena({ elementos: muchos }).elementos).toHaveLength(LIMITES.elementos);
  });

  it('recorta textos, nombres y descripciones largos', () => {
    const f = normalizarEscena({
      elementos: [{ tipo: 'forma', texto: 'x'.repeat(5000), nombre: 'n'.repeat(500), descripcion: 'd'.repeat(5000), estiloTexto: { fuente: 'f'.repeat(500) } }],
    }).elementos[0] as Forma;
    expect(f.texto).toHaveLength(LIMITES.texto);
    expect(f.nombre).toHaveLength(LIMITES.nombre);
    expect(f.descripcion).toHaveLength(LIMITES.descripcion);
    expect(f.estiloTexto.fuente).toHaveLength(LIMITES.fuente);
  });

  it('omite textos vacíos o solo espacios', () => {
    const f = normalizarEscena({ elementos: [{ tipo: 'forma', texto: '   ', nombre: '', descripcion: '\n' }] }).elementos[0] as Forma;
    expect(f).not.toHaveProperty('texto');
    expect(f).not.toHaveProperty('nombre');
    expect(f).not.toHaveProperty('descripcion');
  });

  it('un texto sin contenido recibe uno por defecto en vez de desaparecer', () => {
    const t = normalizarEscena({ elementos: [{ tipo: 'texto', texto: '' }] }).elementos[0];
    expect(t).toMatchObject({ tipo: 'texto', texto: 'Texto' });
  });

  it('los parámetros: solo claves válidas, números finitos y máximo 8', () => {
    const parametros: Record<string, unknown> = { puntas: 5, 'radio-interior': 0.4, 'MAL CLAVE': 1, nan: NaN, texto: 'x', gigante: 1e9 };
    for (let i = 0; i < 20; i++) parametros[`p${i}`] = i;
    const f = normalizarEscena({ elementos: [{ tipo: 'forma', parametros }] }).elementos[0] as Forma;
    expect(Object.keys(f.parametros ?? {}).length).toBeLessThanOrEqual(LIMITES.parametros);
    expect(f.parametros).toMatchObject({ puntas: 5, 'radio-interior': 0.4 });
    expect(f.parametros).not.toHaveProperty('MAL CLAVE');
    expect(f.parametros).not.toHaveProperty('nan');
    expect(f.parametros).not.toHaveProperty('texto');
  });

  it('sin parámetros válidos el campo no existe', () => {
    expect(normalizarEscena({ elementos: [{ tipo: 'forma', parametros: { 'X Y': 1 } }] }).elementos[0]).not.toHaveProperty('parametros');
    expect(normalizarEscena({ elementos: [{ tipo: 'forma', parametros: [1, 2] }] }).elementos[0]).not.toHaveProperty('parametros');
  });
});

describe('normalizarEscena — colores', () => {
  it.each(['#fff', '#FFFFFF', '#ffffff80', '#0F172A', 'var(--primary)', 'var(--muted-foreground)'])('acepta %s', (c) => {
    expect(esColorValido(c)).toBe(true);
  });

  it.each(['rojo', 'red', 'rgb(0,0,0)', 'url(javascript:alert(1))', '#ggg', '#12', '#12345', 'var(--x, red)', 'var(primary)', 'var(--a b)', 'expression(1)', '', 12, null, undefined, {}])(
    'rechaza %s',
    (c) => {
      expect(esColorValido(c)).toBe(false);
    },
  );

  it('un color inválido en el fondo, el relleno o el contorno cae al valor por defecto', () => {
    const e = normalizarEscena({
      fondo: 'url(x)',
      elementos: [{ tipo: 'forma', estilo: { relleno: { tipo: 'solido', color: 'rojo' }, contorno: { color: 'azul' } } }],
    });
    expect(e.fondo).toBeNull();
    const f = e.elementos[0] as Forma;
    expect(f.estilo.relleno).toEqual({ tipo: 'solido', color: '#FFFFFF' });
    expect(f.estilo.contorno.color).toBe('#334155');
  });

  it('el degradado completa los colores inválidos y acota el ángulo', () => {
    const f = normalizarEscena({ elementos: [{ tipo: 'forma', estilo: { relleno: { tipo: 'degradado', desde: 'x', hasta: 'y', angulo: 450 } } }] }).elementos[0] as Forma;
    expect(f.estilo.relleno).toEqual({ tipo: 'degradado', desde: '#FFFFFF', hasta: '#334155', angulo: 90 });
  });

  it('un relleno de tipo desconocido conserva el del elemento por defecto', () => {
    const f = normalizarEscena({ elementos: [{ tipo: 'forma', estilo: { relleno: { tipo: 'patron' } } }] }).elementos[0] as Forma;
    expect(f.estilo.relleno).toEqual({ tipo: 'solido', color: '#FFFFFF' });
  });
});

describe('normalizarEscena — formas', () => {
  it.each(TIPOS_FORMA)('conoce la forma %s', (forma) => {
    expect((normalizarEscena({ elementos: [{ tipo: 'forma', forma }] }).elementos[0] as Forma).forma).toBe(forma);
  });

  it('hay al menos 20 formas', () => {
    expect(TIPOS_FORMA.length).toBeGreaterThanOrEqual(20);
    expect(new Set(TIPOS_FORMA).size).toBe(TIPOS_FORMA.length);
  });

  it('los valores por defecto de cada tipo de elemento difieren como corresponde', () => {
    const [forma, linea, texto] = normalizarEscena({
      elementos: [{ tipo: 'forma' }, { tipo: 'linea', puntos: [{ x: 0, y: 0 }, { x: 5, y: 5 }] }, { tipo: 'texto' }],
    }).elementos;
    expect((forma as Forma).estilo.relleno.tipo).toBe('solido');
    expect((linea as Linea).estilo.relleno.tipo).toBe('ninguno');
    expect((linea as Linea).estilo.contorno.grosor).toBe(2);
    expect((texto as Elemento & { estilo: { contorno: { grosor: number } } }).estilo.contorno.grosor).toBe(0);
    expect((texto as Elemento & { estiloTexto: { alineacionH: string } }).estiloTexto.alineacionH).toBe('izquierda');
    expect((forma as Forma).estiloTexto.alineacionH).toBe('centro');
  });
});

describe('normalizarEscena — líneas', () => {
  const dosPuntos = [{ x: 0, y: 0 }, { x: 10, y: 10 }];

  it('descarta una línea con menos de 2 puntos válidos', () => {
    const e = normalizarEscena({
      elementos: [
        { tipo: 'linea', id: 'sin' },
        { tipo: 'linea', id: 'uno', puntos: [{ x: 1, y: 1 }] },
        { tipo: 'linea', id: 'malos', puntos: [{ x: 'a', y: 1 }, null, { x: NaN, y: 0 }, { x: 1 }] },
        { tipo: 'linea', id: 'bien', puntos: dosPuntos },
      ],
    });
    expect(e.elementos.map((x) => x.id)).toEqual(['bien']);
  });

  it('filtra los puntos inválidos y conserva los buenos', () => {
    const l = normalizarEscena({ elementos: [{ tipo: 'linea', puntos: [{ x: 0, y: 0 }, { x: 'z', y: 0 }, { x: 5, y: 5 }, null] }] }).elementos[0] as Linea;
    expect(l.puntos).toEqual([{ x: 0, y: 0 }, { x: 5, y: 5 }]);
  });

  it('limita la cantidad de puntos', () => {
    const puntos = Array.from({ length: LIMITES.puntosPorLinea + 100 }, (_, i) => ({ x: i, y: i }));
    expect((normalizarEscena({ elementos: [{ tipo: 'linea', puntos }] }).elementos[0] as Linea).puntos).toHaveLength(LIMITES.puntosPorLinea);
  });

  it('trazado y extremos desconocidos caen a recto / ninguno / flecha', () => {
    const l = normalizarEscena({ elementos: [{ tipo: 'linea', puntos: dosPuntos, trazado: 'zigzag', inicio: 'x', fin: 'y' }] }).elementos[0] as Linea;
    expect(l).toMatchObject({ trazado: 'recto', inicio: 'ninguno', fin: 'flecha' });
  });

  it('elimina las conexiones a elementos inexistentes o que no son formas', () => {
    const e = normalizarEscena({
      elementos: [
        { tipo: 'forma', id: 'f' },
        { tipo: 'texto', id: 't' },
        {
          tipo: 'linea',
          id: 'l',
          puntos: dosPuntos,
          origen: { elementoId: 'f', puerto: 0 },
          destino: { elementoId: 't', puerto: 0 },
        },
        { tipo: 'linea', id: 'l2', puntos: dosPuntos, origen: { elementoId: 'fantasma', puerto: 0 }, destino: { elementoId: 'f', puerto: 2 } },
        { tipo: 'linea', id: 'l3', puntos: dosPuntos, origen: { elementoId: 'f', puerto: -1 }, destino: { elementoId: 'f', puerto: 1.5 } },
      ],
    });
    const l = porId(e, 'l') as Linea;
    expect(l.origen).toEqual({ elementoId: 'f', puerto: 0 });
    expect(l).not.toHaveProperty('destino');
    const l2 = porId(e, 'l2') as Linea;
    expect(l2).not.toHaveProperty('origen');
    expect(l2.destino).toEqual({ elementoId: 'f', puerto: 2 });
    const l3 = porId(e, 'l3') as Linea;
    expect(l3).not.toHaveProperty('origen');
    expect(l3).not.toHaveProperty('destino');
  });

  it('una conexión a una forma que se descartó también se elimina', () => {
    const e = normalizarEscena({
      elementos: [{ tipo: 'linea', id: 'l', puntos: dosPuntos, origen: { elementoId: 'f', puerto: 0 } }],
    });
    expect(porId(e, 'l')).not.toHaveProperty('origen');
  });
});

describe('normalizarEscena — grupos', () => {
  const formas = ['a', 'b', 'c', 'd'].map((id) => ({ tipo: 'forma', id }));

  it('conserva un grupo válido', () => {
    const e = normalizarEscena({ elementos: [...formas, { tipo: 'grupo', id: 'g', hijos: ['a', 'b', 'c'] }] });
    expect((porId(e, 'g') as Grupo).hijos).toEqual(['a', 'b', 'c']);
  });

  it('quita los hijos inexistentes, repetidos o que son el propio grupo', () => {
    const e = normalizarEscena({ elementos: [...formas, { tipo: 'grupo', id: 'g', hijos: ['a', 'a', 'zzz', 'g', 'b', 7, null] }] });
    expect((porId(e, 'g') as Grupo).hijos).toEqual(['a', 'b']);
  });

  it('disuelve un grupo con menos de 2 hijos y deja los hijos sueltos', () => {
    const e = normalizarEscena({
      elementos: [...formas, { tipo: 'grupo', id: 'vacio', hijos: [] }, { tipo: 'grupo', id: 'uno', hijos: ['a'] }, { tipo: 'grupo', id: 'malos', hijos: ['x', 'y'] }],
    });
    expect(e.elementos.map((x) => x.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('un elemento solo puede estar en un grupo: gana el primero', () => {
    const e = normalizarEscena({
      elementos: [...formas, { tipo: 'grupo', id: 'g1', hijos: ['a', 'b'] }, { tipo: 'grupo', id: 'g2', hijos: ['b', 'c', 'd'] }],
    });
    expect((porId(e, 'g1') as Grupo).hijos).toEqual(['a', 'b']);
    expect((porId(e, 'g2') as Grupo).hijos).toEqual(['c', 'd']);
  });

  it('si al quitar el hijo robado un grupo queda corto, también se disuelve', () => {
    const e = normalizarEscena({
      elementos: [...formas, { tipo: 'grupo', id: 'g1', hijos: ['a', 'b'] }, { tipo: 'grupo', id: 'g2', hijos: ['b', 'c'] }],
    });
    expect(e.elementos.map((x) => x.id)).toEqual(['a', 'b', 'c', 'd', 'g1']);
  });

  it('permite grupos dentro de grupos', () => {
    const e = normalizarEscena({
      elementos: [...formas, { tipo: 'grupo', id: 'interno', hijos: ['a', 'b'] }, { tipo: 'grupo', id: 'externo', hijos: ['interno', 'c'] }],
    });
    expect((porId(e, 'externo') as Grupo).hijos).toEqual(['interno', 'c']);
    expect((porId(e, 'interno') as Grupo).hijos).toEqual(['a', 'b']);
  });

  it('rompe los ciclos entre grupos', () => {
    const e = normalizarEscena({
      elementos: [
        ...formas,
        { tipo: 'grupo', id: 'g1', hijos: ['g2', 'a', 'b'] },
        { tipo: 'grupo', id: 'g2', hijos: ['g1', 'c', 'd'] },
      ],
    });
    expect((porId(e, 'g1') as Grupo).hijos).toEqual(['g2', 'a', 'b']);
    expect((porId(e, 'g2') as Grupo).hijos).toEqual(['c', 'd']);
  });

  it('rompe un ciclo de tres grupos', () => {
    const e = normalizarEscena({
      elementos: [
        ...formas,
        { tipo: 'grupo', id: 'g1', hijos: ['g2', 'a'] },
        { tipo: 'grupo', id: 'g2', hijos: ['g3', 'b'] },
        { tipo: 'grupo', id: 'g3', hijos: ['g1', 'c', 'd'] },
      ],
    });
    const padres = new Map<string, string>();
    for (const x of e.elementos) if (x.tipo === 'grupo') for (const h of x.hijos) padres.set(h, x.id);
    for (const id of padres.keys()) {
      const visto = new Set<string>();
      for (let p: string | undefined = id; p !== undefined; p = padres.get(p)) {
        expect(visto.has(p)).toBe(false);
        visto.add(p);
      }
    }
  });

  it('es idempotente tras reparar grupos', () => {
    const una = normalizarEscena({
      elementos: [...formas, { tipo: 'grupo', id: 'g1', hijos: ['g2', 'a', 'b'] }, { tipo: 'grupo', id: 'g2', hijos: ['g1', 'b', 'c'] }],
    });
    expect(normalizarEscena(una)).toEqual(una);
  });
});

describe('normalizarEscena — cargas grandes', () => {
  it('normaliza 2000 elementos con grupos y conectores sin demorar', () => {
    const elementos: unknown[] = [];
    for (let i = 0; i < 1500; i++) elementos.push({ tipo: 'forma', id: `f${i}`, forma: TIPOS_FORMA[i % TIPOS_FORMA.length], transformacion: { x: i, y: i, ancho: 50, alto: 50 } });
    for (let i = 0; i < 400; i++) elementos.push({ tipo: 'linea', id: `l${i}`, puntos: [{ x: 0, y: 0 }, { x: i, y: i }], origen: { elementoId: `f${i}`, puerto: 0 }, destino: { elementoId: `f${i + 1}`, puerto: 1 } });
    for (let i = 0; i < 100; i++) elementos.push({ tipo: 'grupo', id: `g${i}`, hijos: [`f${i * 2}`, `f${i * 2 + 1}`] });
    const inicio = performance.now();
    const e = normalizarEscena({ elementos });
    expect(performance.now() - inicio).toBeLessThan(1500);
    expect(e.elementos).toHaveLength(2000);
    expect(normalizarEscena(e)).toEqual(e);
  });
});
