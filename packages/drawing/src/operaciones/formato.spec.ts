import { describe, expect, it } from 'vitest';
import { conectarFormas } from '../conectores/enlazar.js';
import type { Escena, Forma, Linea, Texto } from '../tipos.js';
import { aplicarFormato, extraerFormato } from './formato.js';
import { escena, forma, getForma, getLinea, grupo, linea, texto } from './util-pruebas.js';

const estiloA = {
  relleno: { tipo: 'solido', color: '#ff0000' },
  contorno: { color: '#00ff00', grosor: 5, patron: 'guiones' },
  opacidad: 0.5,
  sombra: { color: '#00000080', desenfoque: 6, dx: 3, dy: 4 },
  radio: 12,
};
const estiloTextoA = { tamano: 30, negrita: true, cursiva: true, subrayado: true, alineacionH: 'derecha', alineacionV: 'abajo', color: '#0000ff', fuente: 'Georgia' };
const origen = (): Escena => escena(forma('A', 0, 0, 100, 60, { texto: 'Rojo', estilo: estiloA, estiloTexto: estiloTextoA }), forma('B', 300, 0, 100, 60, { texto: 'Plano' }));

describe('extraerFormato', () => {
  it('de una forma: estilo y estilo de texto, copiados (no referencias)', () => {
    const e = origen();
    const f = extraerFormato(e, 'A');
    expect(f?.origen).toBe('forma');
    expect(f?.estilo).toEqual(getForma(e, 'A').estilo);
    expect(f?.estiloTexto).toEqual(getForma(e, 'A').estiloTexto);
    expect(f?.estilo).not.toBe(getForma(e, 'A').estilo);
    expect(f?.estilo.contorno.color).toBe('#00ff00');
    expect(f?.estiloTexto.fuente).toBe('Georgia');
  });

  it('de un cuadro de texto', () => {
    const e = escena(texto('t', 0, 0, { estiloTexto: estiloTextoA }));
    expect(extraerFormato(e, 't')).toMatchObject({ origen: 'texto', estiloTexto: { tamano: 30, negrita: true } });
  });

  it('de una línea: estilo, estilo de texto y las puntas', () => {
    const e = escena(linea('l', [[0, 0], [10, 10]], { estilo: estiloA, inicio: 'circulo', fin: 'rombo' }));
    expect(extraerFormato(e, 'l')).toMatchObject({ origen: 'linea', inicio: 'circulo', fin: 'rombo', estilo: { opacidad: 0.5 } });
  });

  it('de un grupo: el de su primer elemento en orden de apilado', () => {
    const e = escena(forma('x', 0, 0, 100, 60, { estilo: estiloA }), forma('y', 200, 0), grupo('g', ['y', 'x']));
    expect(extraerFormato(e, 'g')?.estilo.relleno).toEqual({ tipo: 'solido', color: '#ff0000' }); // «x» va antes que «y» en la escena
  });

  it('de algo bloqueado se puede leer; de lo que no existe no hay formato', () => {
    const e = escena(forma('b', 0, 0, 100, 60, { bloqueado: true, estilo: estiloA }));
    expect(extraerFormato(e, 'b')?.estilo.opacidad).toBe(0.5);
    expect(extraerFormato(e, 'no-existe')).toBeNull();
  });
});

describe('aplicarFormato: de forma a forma', () => {
  it('pasa todo el aspecto (relleno, contorno, sombra, opacidad, radio y estilo de texto)', () => {
    const e = origen();
    const r = aplicarFormato(e, ['B'], extraerFormato(e, 'A')!);
    const b = getForma(r.escena, 'B');
    expect(b.estilo).toEqual(getForma(e, 'A').estilo);
    expect(b.estiloTexto).toEqual(getForma(e, 'A').estiloTexto);
    expect(r.aplicados).toEqual(['B']);
    expect(r.omitidos).toEqual([]);
  });

  it('nunca toca geometría, texto, tamaño, rotación, forma ni nombre', () => {
    const base = escena(
      forma('A', 0, 0, 100, 60, { estilo: estiloA, estiloTexto: estiloTextoA }),
      forma('B', 300, 40, 150, 90, { forma: 'rombo', texto: 'Texto de B', nombre: 'Caja B', descripcion: 'desc', transformacion: { x: 300, y: 40, ancho: 150, alto: 90, rotacion: 30 } }),
    );
    const antes = getForma(base, 'B');
    const b = getForma(aplicarFormato(base, ['B'], extraerFormato(base, 'A')!).escena, 'B');
    expect(b.transformacion).toEqual(antes.transformacion);
    expect(b.forma).toBe('rombo');
    expect(b.texto).toBe('Texto de B');
    expect(b.nombre).toBe('Caja B');
    expect(b.descripcion).toBe('desc');
    expect(b.id).toBe('B');
  });

  it('varios destinos a la vez, y los grupos pasan el formato a sus hijos', () => {
    const e = escena(forma('A', 0, 0, 100, 60, { estilo: estiloA }), forma('B', 200, 0), forma('C', 400, 0), forma('D', 600, 0), grupo('g', ['C', 'D']));
    const r = aplicarFormato(e, ['B', 'g'], extraerFormato(e, 'A')!);
    expect(r.aplicados.sort()).toEqual(['B', 'C', 'D']);
    for (const id of ['B', 'C', 'D']) expect(getForma(r.escena, id).estilo.opacidad).toBe(0.5);
    expect(getForma(r.escena, 'A').estilo.opacidad).toBe(0.5); // la de origen no cambia
  });

  it('a un cuadro de texto pasa estilo y estilo de texto', () => {
    const e = escena(forma('A', 0, 0, 100, 60, { estilo: estiloA, estiloTexto: estiloTextoA }), texto('t', 200, 0, { texto: 'Nota' }));
    const t = aplicarFormato(e, ['t'], extraerFormato(e, 'A')!).escena.elementos.find((x) => x.id === 't') as Texto;
    expect(t.estiloTexto.color).toBe('#0000ff');
    expect(t.estilo.opacidad).toBe(0.5);
    expect(t.texto).toBe('Nota');
  });
});

describe('aplicarFormato: entre formas y líneas', () => {
  it('de forma a línea: solo contorno (color, grosor, discontinuo) y opacidad', () => {
    const e = escena(forma('A', 0, 0, 100, 60, { estilo: estiloA }), linea('l', [[0, 100], [100, 100]], { trazado: 'curvo', inicio: 'circulo', fin: 'flecha', texto: 'Sí' }));
    const antes = getLinea(e, 'l');
    const l = getLinea(aplicarFormato(e, ['l'], extraerFormato(e, 'A')!).escena, 'l');
    expect(l.estilo.contorno).toEqual({ color: '#00ff00', grosor: 5, patron: 'guiones' });
    expect(l.estilo.opacidad).toBe(0.5);
    // Nada más cambia: ni relleno, sombra ni radio, ni trazado, puntas, texto o puntos.
    expect(l.estilo.relleno).toEqual(antes.estilo.relleno);
    expect(l.estilo.sombra).toEqual(antes.estilo.sombra);
    expect(l.estilo.radio).toBe(antes.estilo.radio);
    expect(l.estiloTexto).toEqual(antes.estiloTexto);
    expect(l.trazado).toBe('curvo');
    expect(l.inicio).toBe('circulo');
    expect(l.fin).toBe('flecha');
    expect(l.texto).toBe('Sí');
    expect(l.puntos).toEqual(antes.puntos);
  });

  it('de línea a forma: solo el contorno', () => {
    const e = escena(linea('l', [[0, 0], [10, 10]], { estilo: estiloA, estiloTexto: estiloTextoA }), forma('B', 200, 0, 100, 60, { texto: 'B' }));
    const antes = getForma(e, 'B');
    const b = getForma(aplicarFormato(e, ['B'], extraerFormato(e, 'l')!).escena, 'B');
    expect(b.estilo.contorno).toEqual({ color: '#00ff00', grosor: 5, patron: 'guiones' });
    expect(b.estilo.relleno).toEqual(antes.estilo.relleno);
    expect(b.estilo.opacidad).toBe(antes.estilo.opacidad);
    expect(b.estilo.sombra).toEqual(antes.estilo.sombra);
    expect(b.estilo.radio).toBe(antes.estilo.radio);
    expect(b.estiloTexto).toEqual(antes.estiloTexto);
  });

  it('de línea a línea: contorno, opacidad y puntas, pero no el trazado ni los puntos', () => {
    const e = escena(
      linea('a', [[0, 0], [10, 10]], { estilo: estiloA, inicio: 'circulo', fin: 'rombo', trazado: 'ortogonal' }),
      linea('b', [[0, 50], [90, 50], [90, 120]], { trazado: 'recto' }),
    );
    const antes = getLinea(e, 'b');
    const b = getLinea(aplicarFormato(e, ['b'], extraerFormato(e, 'a')!).escena, 'b');
    expect(b.inicio).toBe('circulo');
    expect(b.fin).toBe('rombo');
    expect(b.estilo.contorno.color).toBe('#00ff00');
    expect(b.estilo.opacidad).toBe(0.5);
    expect(b.trazado).toBe('recto');
    expect(b.puntos).toEqual(antes.puntos);
  });

  it('un conector pegado a formas sigue pegado a las mismas formas', () => {
    let e = escena(forma('A', 0, 0, 100, 60, { estilo: estiloA }), forma('B', 300, 0), forma('C', 600, 0));
    e = conectarFormas(e, 'B', 'C');
    const id = e.elementos.find((x) => x.tipo === 'linea')!.id;
    const antes = getLinea(e, id);
    const l = getLinea(aplicarFormato(e, [id], extraerFormato(e, 'A')!).escena, id);
    expect(l.origen).toEqual(antes.origen);
    expect(l.destino).toEqual(antes.destino);
    expect(l.puntos).toEqual(antes.puntos);
  });
});

describe('aplicarFormato: bloqueados y sin cambios', () => {
  it('un destino bloqueado se salta y se informa; el resto se aplica', () => {
    const e = escena(forma('A', 0, 0, 100, 60, { estilo: estiloA }), forma('B', 200, 0, 100, 60, { bloqueado: true }), forma('C', 400, 0));
    const r = aplicarFormato(e, ['B', 'C'], extraerFormato(e, 'A')!);
    expect(r.omitidos).toEqual(['B']);
    expect(r.aplicados).toEqual(['C']);
    expect(getForma(r.escena, 'B').estilo.opacidad).toBe(getForma(e, 'B').estilo.opacidad);
    expect(getForma(r.escena, 'C').estilo.opacidad).toBe(0.5);
  });

  it('si todo está bloqueado, la misma escena', () => {
    const e = escena(forma('A', 0, 0, 100, 60, { estilo: estiloA }), forma('B', 200, 0, 100, 60, { bloqueado: true }));
    const r = aplicarFormato(e, ['B'], extraerFormato(e, 'A')!);
    expect(r.escena).toBe(e);
    expect(r.aplicados).toEqual([]);
    expect(r.omitidos).toEqual(['B']);
  });

  it('los hijos bloqueados de un grupo también se saltan', () => {
    const e = escena(forma('A', 0, 0, 100, 60, { estilo: estiloA }), forma('B', 200, 0, 100, 60, { bloqueado: true }), forma('C', 400, 0), grupo('g', ['B', 'C']));
    const r = aplicarFormato(e, ['g'], extraerFormato(e, 'A')!);
    expect(r.omitidos).toEqual(['B']);
    expect(r.aplicados).toEqual(['C']);
  });

  it('aplicar un formato que el destino ya tiene devuelve la misma escena (nada que registrar)', () => {
    const e = origen();
    const f = extraerFormato(e, 'A')!;
    const una = aplicarFormato(e, ['B'], f).escena;
    const dos = aplicarFormato(una, ['B'], f);
    expect(dos.escena).toBe(una);
    expect(dos.aplicados).toEqual(['B']);
  });

  it('ids que no existen: nada', () => {
    const e = origen();
    const r = aplicarFormato(e, ['no-existe'], extraerFormato(e, 'A')!);
    expect(r.escena).toBe(e);
    expect(r.aplicados).toEqual([]);
  });

  it('el resultado pasa por el normalizador: un formato con valores fuera de rango no rompe la escena', () => {
    const f = extraerFormato(origen(), 'A')!;
    const raro = { ...f, estilo: { ...f.estilo, opacidad: 99, contorno: { ...f.estilo.contorno, grosor: 1e9 } } };
    const e = origen();
    const b = getForma(aplicarFormato(e, ['B'], raro).escena, 'B');
    expect(b.estilo.opacidad).toBeLessThanOrEqual(1);
    expect(b.estilo.contorno.grosor).toBeLessThanOrEqual(50);
  });
});
