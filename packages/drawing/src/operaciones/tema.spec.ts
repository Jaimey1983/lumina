import { describe, expect, it } from 'vitest';
import { normalizarEscena } from '../normalizar.js';
import type { Escena, Forma, Linea } from '../tipos.js';
import { ALFA_TINTE, COLOR_TEXTO_TEMA, aplicarPaleta, coloresPorRama, type PaletaColores } from './tema.js';
import { escena, forma, grupo, linea, texto } from './util-pruebas.js';

const PALETA: PaletaColores = { acento: '#1E3A8A', colores: ['#0D9488', '#D97706', '#831843', '#0284C7', '#475569', '#059669'] };
const f = (e: Escena, id: string): Forma => e.elementos.find((x) => x.id === id) as Forma;
const l = (e: Escena, id: string): Linea => e.elementos.find((x) => x.id === id) as Linea;
const todas = (e: Escena): string[] => e.elementos.map((x) => x.id);
const arista = (id: string, de: string, a: string): Record<string, unknown> => linea(id, [[0, 0], [10, 10]], { origen: { elementoId: de, puerto: 1 }, destino: { elementoId: a, puerto: 3 } });

/** raíz R con tres hijos A, B, C; A tiene un hijo A1, que tiene un hijo A2. */
const arbol = (): Escena =>
  escena(
    forma('R', 0, 0), forma('A', 200, 0), forma('B', 200, 100), forma('C', 200, 200), forma('A1', 400, 0), forma('A2', 600, 0),
    arista('rA', 'R', 'A'), arista('rB', 'R', 'B'), arista('rC', 'R', 'C'), arista('aA1', 'A', 'A1'), arista('a12', 'A1', 'A2'),
  );

describe('coloresPorRama', () => {
  it('la raíz toma el acento, los hijos los colores en orden y los descendientes heredan la rama', () => {
    const e = arbol();
    const c = coloresPorRama(e, new Set(['R', 'A', 'B', 'C', 'A1', 'A2']), PALETA);
    expect(c.get('R')).toBe('#1E3A8A');
    expect(c.get('A')).toBe('#0D9488');
    expect(c.get('B')).toBe('#D97706');
    expect(c.get('C')).toBe('#831843');
    expect(c.get('A1')).toBe('#0D9488');
    expect(c.get('A2')).toBe('#0D9488');
  });
  it('pasados los colores de la paleta, vuelve a empezar', () => {
    const hijos = Array.from({ length: 8 }, (_, i) => forma(`h${i}`, 200, i * 80));
    const e = escena(forma('R', 0, 0), ...hijos, ...hijos.map((h, i) => arista(`c${i}`, 'R', `h${i}`)));
    const c = coloresPorRama(e, new Set(e.elementos.filter((x) => x.tipo === 'forma').map((x) => x.id)), PALETA);
    expect(c.get('h6')).toBe(PALETA.colores[0]);
    expect(c.get('h7')).toBe(PALETA.colores[1]);
  });
  it('varios árboles y formas sueltas: cada raíz toma el acento y reinicia el orden', () => {
    const e = escena(forma('R1', 0, 0), forma('X', 200, 0), forma('R2', 0, 300), forma('Y', 200, 300), forma('S', 600, 600), arista('a', 'R1', 'X'), arista('b', 'R2', 'Y'));
    const c = coloresPorRama(e, new Set(['R1', 'X', 'R2', 'Y', 'S']), PALETA);
    expect([c.get('R1'), c.get('R2'), c.get('S')]).toEqual(['#1E3A8A', '#1E3A8A', '#1E3A8A']);
    expect([c.get('X'), c.get('Y')]).toEqual(['#0D9488', '#0D9488']);
  });
  it('un ciclo sin raíz: la primera forma empieza el árbol', () => {
    const e = escena(forma('P', 0, 0), forma('Q', 200, 0), forma('S', 400, 0), arista('a', 'P', 'Q'), arista('b', 'Q', 'S'), arista('c', 'S', 'P'));
    const c = coloresPorRama(e, new Set(['P', 'Q', 'S']), PALETA);
    expect(c.get('P')).toBe('#1E3A8A');
    expect(c.get('Q')).toBe('#0D9488');
    expect(c.get('S')).toBe('#0D9488');
  });
  it('un conector con un extremo fuera del alcance no cuenta para el árbol', () => {
    const c = coloresPorRama(arbol(), new Set(['A', 'A1']), PALETA);
    expect(c.get('A')).toBe('#1E3A8A'); // sin R en el alcance, A es la raíz
    expect(c.get('A1')).toBe('#0D9488');
  });
});

describe('aplicarPaleta', () => {
  it('pone contorno, relleno con 14 % de alfa y texto del tema a cada forma, y el color del destino a cada conector', () => {
    const r = aplicarPaleta(arbol(), todas(arbol()), PALETA);
    expect(f(r, 'A').estilo.contorno.color).toBe('#0D9488');
    expect(f(r, 'A').estilo.relleno).toEqual({ tipo: 'solido', color: `#0D9488${ALFA_TINTE}` });
    expect(f(r, 'A').estiloTexto.color).toBe(COLOR_TEXTO_TEMA);
    expect(f(r, 'R').estilo.contorno.color).toBe('#1E3A8A');
    expect(l(r, 'rB').estilo.contorno.color).toBe('#D97706');
    expect(l(r, 'a12').estilo.contorno.color).toBe('#0D9488');
  });
  it('no toca geometría, tipografía, sombra, grosor ni opacidad', () => {
    const base = escena(
      forma('R', 10, 20, 150, 90, { estilo: { sombra: { color: '#00000055', desenfoque: 3, dx: 1, dy: 2 }, contorno: { color: '#111111', grosor: 5, patron: 'guiones' }, opacidad: 0.5 }, estiloTexto: { tamano: 30, negrita: true } }),
    );
    const r = f(aplicarPaleta(base, ['R'], PALETA), 'R');
    const antes = f(base, 'R');
    expect(r.transformacion).toEqual(antes.transformacion);
    expect(r.estilo.sombra).toEqual(antes.estilo.sombra);
    expect(r.estilo.contorno.grosor).toBe(5);
    expect(r.estilo.contorno.patron).toBe('guiones');
    expect(r.estilo.opacidad).toBe(0.5);
    expect(r.estiloTexto).toMatchObject({ tamano: 30, negrita: true });
  });
  it('no toca los textos libres', () => {
    const e = escena(forma('R', 0, 0), texto('t', 0, 200));
    const r = aplicarPaleta(e, ['R', 't'], PALETA);
    expect(r.elementos.find((x) => x.id === 't')).toEqual(e.elementos.find((x) => x.id === 't'));
  });
  it('solo las formas del alcance (y los conectores entre ellas); lo bloqueado no se toca', () => {
    const e = escena(forma('R', 0, 0), forma('A', 200, 0), forma('B', 200, 100, 100, 60, { bloqueado: true }), arista('a', 'R', 'A'), arista('b', 'R', 'B'));
    const r = aplicarPaleta(e, ['R', 'A', 'B'], PALETA);
    expect(f(r, 'B').estilo).toEqual(f(e, 'B').estilo);
    expect(f(r, 'A').estilo.contorno.color).toBe('#0D9488');
    const parcial = aplicarPaleta(arbol(), ['R', 'A'], PALETA);
    expect(f(parcial, 'B').estilo).toEqual(f(arbol(), 'B').estilo);
    // un conector con el destino fuera del alcance toma el color de su origen; uno sin ningún extremo dentro, no cambia
    expect(l(parcial, 'rB').estilo.contorno.color).toBe('#1E3A8A');
    expect(l(parcial, 'a12').estilo).toEqual(l(arbol(), 'a12').estilo);
  });
  it('un conector bloqueado no cambia de color', () => {
    const e = escena(forma('R', 0, 0), forma('A', 200, 0), linea('c', [[0, 0], [10, 10]], { origen: { elementoId: 'R', puerto: 1 }, destino: { elementoId: 'A', puerto: 3 }, bloqueado: true }));
    const r = aplicarPaleta(e, ['R', 'A'], PALETA);
    expect(l(r, 'c').estilo).toEqual(l(e, 'c').estilo);
    expect(f(r, 'A').estilo.contorno.color).toBe('#0D9488');
  });
  it('los grupos aportan sus formas', () => {
    const e = escena(forma('a', 0, 0), forma('b', 200, 0), grupo('g', ['a', 'b']));
    const r = aplicarPaleta(e, ['g'], PALETA);
    expect(f(r, 'a').estilo.contorno.color).toBe('#1E3A8A');
    expect(f(r, 'b').estilo.contorno.color).toBe('#1E3A8A');
  });
  it('es idempotente: aplicarla dos veces da la misma escena (y la segunda es la misma referencia)', () => {
    const una = aplicarPaleta(arbol(), todas(arbol()), PALETA);
    const dos = aplicarPaleta(una, todas(una), PALETA);
    expect(dos).toBe(una);
  });
  it('devuelve la misma escena si no hay formas', () => {
    const e = escena(texto('t', 0, 0), linea('l', [[0, 0], [5, 5]]));
    expect(aplicarPaleta(e, ['t', 'l'], PALETA)).toBe(e);
    expect(aplicarPaleta(e, [], PALETA)).toBe(e);
  });
  it('el resultado pasa por el normalizador sin cambios', () => {
    const r = aplicarPaleta(arbol(), todas(arbol()), PALETA);
    expect(normalizarEscena(r)).toEqual(r);
  });
  it('un color de 3 dígitos o un token no se corrompe (el relleno usa el color tal cual)', () => {
    const r = aplicarPaleta(escena(forma('R', 0, 0)), ['R'], { acento: '#abc', colores: [] });
    expect(f(r, 'R').estilo.relleno).toEqual({ tipo: 'solido', color: '#abc' });
  });
});

describe('rendimiento (DW9)', () => {
  it('un tema a 500 formas con 500 conectores tarda menos de 30 ms', () => {
    const formas = Array.from({ length: 500 }, (_, i) => forma(`f${i}`, (i % 25) * 120, Math.floor(i / 25) * 90, 100, 60));
    const lineas = Array.from({ length: 499 }, (_, i) => arista(`c${i}`, `f${Math.floor(i / 2)}`, `f${i + 1}`));
    const e = escena(...formas, ...lineas);
    const ids = formas.map((x) => x.id as string);
    const otra: PaletaColores = { acento: '#2563EB', colores: ['#7C3AED', '#06B6D4', '#10B981', '#EC4899', '#4F46E5', '#F59E0B'] };
    for (let i = 0; i < 4; i++) aplicarPaleta(e, ids, i % 2 ? PALETA : otra);
    const t: number[] = [];
    for (let i = 0; i < 9; i++) {
      const t0 = performance.now();
      aplicarPaleta(e, ids, i % 2 ? PALETA : otra);
      t.push(performance.now() - t0);
    }
    t.sort((a, b) => a - b);
    expect(t[4]).toBeLessThan(30);
  });
});
