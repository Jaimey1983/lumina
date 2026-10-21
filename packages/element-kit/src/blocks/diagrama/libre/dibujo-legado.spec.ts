import { describe, expect, it } from 'vitest';
import { normalizarEscena } from '@lumina/drawing';
import type { DiagramaGrafoBlock } from '@lumina/types/slide';
import { dibujoLegadoADiagrama, esDibujoLegado } from './dibujo-legado.js';

const escena = {
  ancho: 800,
  alto: 400,
  elementos: [
    { tipo: 'forma', id: 'a', forma: 'rombo', texto: 'Decide', transformacion: { x: 10, y: 10, ancho: 120, alto: 80, rotacion: 0 } },
    { tipo: 'forma', id: 'b', forma: 'elipse', texto: 'Fin', transformacion: { x: 300, y: 10, ancho: 120, alto: 80, rotacion: 0 } },
    {
      tipo: 'linea',
      id: 'l',
      puntos: [
        { x: 130, y: 50 },
        { x: 300, y: 50 },
      ],
      origen: { elementoId: 'a', puerto: 1 },
      destino: { elementoId: 'b', puerto: 3 },
      fin: 'flecha',
    },
  ],
};
const guardado = { id: 'dib-1', tipo: 'dibujo', x: 5, y: 6, ancho: 70, alto: 50, zIndex: 3, titulo: '  Mi dibujo ', descripcionAccesible: 'Un rombo y una elipse', escena };

describe('dibujo guardado con el tipo transitorio → diagrama (W10)', () => {
  it('reconoce solo el tipo `dibujo`', () => {
    expect(esDibujoLegado(guardado)).toBe(true);
    for (const otro of [{ tipo: 'diagrama' }, { tipo: 'texto' }, null, undefined, 'dibujo', 3, []]) expect(esDibujoLegado(otro)).toBe(false);
  });

  it('se abre como diagrama en el mismo lugar, con el mismo id, título y descripción', () => {
    const d = dibujoLegadoADiagrama(guardado);
    expect(d.tipo).toBe('diagrama');
    expect(d.id).toBe('dib-1');
    expect([d.x, d.y, d.ancho, d.alto, d.zIndex]).toEqual([5, 6, 70, 50, 3]);
    expect(d.titulo).toBe('Mi dibujo');
    expect(d.descripcionAccesible).toBe('Un rombo y una elipse');
  });

  it('la escena llega entera: mismos elementos, textos y conector pegado', () => {
    const d = dibujoLegadoADiagrama(guardado);
    expect(normalizarEscena(d.escena)).toEqual(normalizarEscena(escena));
    const e = normalizarEscena(d.escena);
    expect(e.elementos.map((x) => x.id)).toEqual(['a', 'b', 'l']);
    const linea = e.elementos.find((x) => x.tipo === 'linea');
    expect(linea && linea.tipo === 'linea' ? [linea.origen?.elementoId, linea.destino?.elementoId] : []).toEqual(['a', 'b']);
  });

  it('una escena dañada se sanea, no rompe', () => {
    const d = dibujoLegadoADiagrama({ ...guardado, escena: { elementos: [{ tipo: 'forma', id: 'x', estilo: { relleno: { tipo: 'solido', color: 'no-es-color' } } }, 42, null] } });
    expect(normalizarEscena(d.escena).elementos).toHaveLength(1);
  });

  it('un bloque vacío o basura recibe marco, id y escena por defecto', () => {
    for (const basura of [{}, null, undefined, 'x', { tipo: 'dibujo', x: 'a', escena: 7 }]) {
      const d = dibujoLegadoADiagrama(basura);
      expect(d.tipo).toBe('diagrama');
      expect(typeof d.id).toBe('string');
      expect(d.id).not.toBe('');
      expect([d.x, d.y, d.ancho, d.alto]).toEqual([8, 12, 84, 70]);
      expect(d.escena).toBeDefined();
    }
  });

  it('no inventa nodos de grafo: queda solo el nodo raíz que el normalizador exige y ninguna arista (lo que se ve y se edita es la escena)', () => {
    const d: DiagramaGrafoBlock = dibujoLegadoADiagrama(guardado);
    expect(d.nodos).toHaveLength(1);
    expect(d.aristas).toEqual([]);
    expect(normalizarEscena(d.escena).elementos).toHaveLength(3);
  });

  it('es idempotente: lo que ya es diagrama no cambia al pasar otra vez', () => {
    const una = dibujoLegadoADiagrama(guardado);
    expect(esDibujoLegado(una)).toBe(false);
  });

  it('recorta títulos y descripciones muy largos y descarta los vacíos', () => {
    const d = dibujoLegadoADiagrama({ ...guardado, titulo: 'T'.repeat(500), descripcionAccesible: '   ' });
    expect(d.titulo).toHaveLength(200);
    expect(d.descripcionAccesible).toBeUndefined();
  });
});
