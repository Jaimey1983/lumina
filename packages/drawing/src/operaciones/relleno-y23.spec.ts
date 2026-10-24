import { describe, expect, it } from 'vitest';
import { cambiarEstilo, duplicar } from './edicion.js';
import { elementoEn } from './geometria.js';
import { copiar, pegar, validarFragmento, type Fragmento } from './portapapeles.js';
import type { Escena, Forma } from '../tipos.js';
import { escena, forma, getForma } from './util-pruebas.js';

const RADIAL = { tipo: 'degradado', desde: '#000000', hasta: '#FFFFFF', angulo: 30, forma: 'radial', paradas: [{ posicion: 0.4, color: '#FF0000' }] };
const PATRON = { tipo: 'patron', patron: 'cuadricula', color: '#123456', fondo: null, escala: 24 };
const SOMBRA = { color: '#00000055', desenfoque: 8, dx: 0, dy: 0, interior: true };

const conNuevo = (): Escena =>
  escena(
    forma('A', 0, 0, 100, 60, { estilo: { relleno: RADIAL, sombra: SOMBRA } }),
    forma('B', 300, 0, 100, 60, { estilo: { relleno: PATRON } }),
    forma('V', 600, 0, 100, 60, { estilo: { relleno: { tipo: 'ninguno' } } }),
  );

const rellenoDe = (e: Escena, id: string) => getForma(e, id).estilo.relleno;

describe('los campos nuevos sobreviven a las operaciones de la escena', () => {
  it('la escena de prueba de verdad los tiene (que las demás pruebas no sean vacías)', () => {
    const e = conNuevo();
    expect(rellenoDe(e, 'A')).toMatchObject({ tipo: 'degradado', forma: 'radial', paradas: [{ posicion: 0.4, color: '#FF0000' }] });
    expect(getForma(e, 'A').estilo.sombra).toMatchObject({ interior: true });
    expect(rellenoDe(e, 'B')).toMatchObject({ tipo: 'patron', patron: 'cuadricula', escala: 24 });
  });

  it('copiar y pegar conservan el radial, las paradas, la sombra interior y el patrón', () => {
    const e = conNuevo();
    const f = copiar(e, ['A', 'B']) as Fragmento;
    const { escena: pegada } = pegar(e, f);
    const nuevas = pegada.elementos.filter((x): x is Forma => x.tipo === 'forma' && !['A', 'B', 'V'].includes(x.id));
    expect(nuevas).toHaveLength(2);
    expect(nuevas[0]?.estilo.relleno).toEqual(rellenoDe(e, 'A'));
    expect(nuevas[0]?.estilo.sombra).toEqual(getForma(e, 'A').estilo.sombra);
    expect(nuevas[1]?.estilo.relleno).toEqual(rellenoDe(e, 'B'));
  });

  it('un fragmento que viaja como JSON (el portapapeles del sistema) los conserva', () => {
    const e = conNuevo();
    const f = validarFragmento(JSON.parse(JSON.stringify(copiar(e, ['A', 'B']))));
    expect(f).not.toBeNull();
    const { escena: pegada } = pegar(escena(), f as Fragmento);
    const [a, b] = pegada.elementos as Forma[];
    expect(a?.estilo.relleno).toEqual(rellenoDe(e, 'A'));
    expect(a?.estilo.sombra).toEqual(getForma(e, 'A').estilo.sombra);
    expect(b?.estilo.relleno).toEqual(rellenoDe(e, 'B'));
  });

  it('duplicar los conserva', () => {
    const e = conNuevo();
    const { escena: dup, ids } = duplicar(e, ['A', 'B']);
    expect(getForma(dup, ids[0] as string).estilo.relleno).toEqual(rellenoDe(e, 'A'));
    expect(getForma(dup, ids[0] as string).estilo.sombra).toEqual(getForma(e, 'A').estilo.sombra);
    expect(getForma(dup, ids[1] as string).estilo.relleno).toEqual(rellenoDe(e, 'B'));
  });

  it('un estilo que reemplaza el relleno lo reemplaza entero: no quedan restos del patrón ni del radial', () => {
    const e = conNuevo();
    const solido = cambiarEstilo(e, ['A', 'B'], { estilo: { relleno: { tipo: 'solido', color: '#112233' } } });
    expect(rellenoDe(solido, 'A')).toEqual({ tipo: 'solido', color: '#112233' });
    expect(rellenoDe(solido, 'B')).toEqual({ tipo: 'solido', color: '#112233' });
    const sinSombra = cambiarEstilo(e, ['A'], { estilo: { sombra: null } });
    expect(getForma(sinSombra, 'A').estilo.sombra).toBeNull();
  });
});

describe('seleccionar una forma con patrón', () => {
  const e = conNuevo();

  it('el clic dentro de la forma la elige, aunque caiga entre las líneas del patrón', () => {
    // El centro de B (300–400 × 0–60) está lejos de cualquier línea de una cuadrícula de 24.
    expect(elementoEn(e, { x: 350, y: 30 }, { tolerancia: 1 })).toBe('B');
    expect(elementoEn(e, { x: 311, y: 11 }, { tolerancia: 1 })).toBe('B');
  });

  it('con relleno radial también se elige por dentro', () => {
    expect(elementoEn(e, { x: 50, y: 30 }, { tolerancia: 1 })).toBe('A');
  });

  it('una forma sin relleno solo se elige por el borde (como siempre)', () => {
    expect(elementoEn(e, { x: 650, y: 30 }, { tolerancia: 1 })).toBeUndefined();
  });
});
