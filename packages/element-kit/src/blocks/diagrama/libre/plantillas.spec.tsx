import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { normalizarEscena, type Elemento, type Escena, type Forma, type Linea } from '@lumina/drawing';
import type { Block, DiagramaBlock, DiagramaGrafoBlock } from '@lumina/types/slide';
import { DiagramaProperties } from '../diagrama-properties.js';
import { createDefaultFlujoBlock, createDefaultMapaMentalBlock, normalizeDiagramaBlock } from '../diagrama-defaults.js';
import { PLANTILLAS_EDITABLES } from './plantillas.js';

afterEach(() => cleanup());

const marco = { id: 'bloque-1', x: 7, y: 9, ancho: 55, alto: 44 };
/** El texto de una forma es «etiqueta» o «etiqueta\ncuerpo»: se compara la etiqueta. */
const primeraLinea = (t: string | undefined): string => (t ?? '').split('\n')[0]!.replace(/\s+/g, ' ').trim();
const escenaDe = (b: DiagramaGrafoBlock): Escena => normalizarEscena(b.escena);
const formas = (e: Escena): Forma[] => e.elementos.filter((x: Elemento): x is Forma => x.tipo === 'forma');
const lineas = (e: Escena): Linea[] => e.elementos.filter((x: Elemento): x is Linea => x.tipo === 'linea');

describe('plantillas editables (W10)', () => {
  it('son las seis de la ficha, con ids únicos y en orden', () => {
    expect(PLANTILLAS_EDITABLES.map((p) => p.id)).toEqual(['flujo', 'mapa_conceptual', 'linea_tiempo', 'comparacion', 'ciclo', 'piramide']);
    expect(PLANTILLAS_EDITABLES.map((p) => p.label)).toEqual(['Flujo', 'Mapa conceptual', 'Línea de tiempo', 'Comparación', 'Ciclo', 'Pirámide']);
  });

  describe.each(PLANTILLAS_EDITABLES.map((p) => [p.label, p] as const))('%s', (_n, plantilla) => {
    const bloque = plantilla.crear(marco);
    const escena = escenaDe(bloque);

    it('nace como dibujo libre: ya tiene escena, en el lugar y con el id del bloque', () => {
      expect(bloque.tipo).toBe('diagrama');
      expect(bloque.id).toBe('bloque-1');
      expect([bloque.x, bloque.y, bloque.ancho, bloque.alto]).toEqual([7, 9, 55, 44]);
      expect(escena.elementos.length).toBeGreaterThan(0);
    });

    it('la escena ya está normalizada (guardarla no la cambia)', () => {
      expect(normalizarEscena(bloque.escena)).toEqual(bloque.escena);
      expect((normalizeDiagramaBlock(bloque) as DiagramaGrafoBlock).escena).toEqual(bloque.escena);
    });

    it('tiene tantas formas como nodos y tantos conectores como aristas, con el mismo texto', () => {
      expect(formas(escena)).toHaveLength(bloque.nodos.length);
      expect(lineas(escena)).toHaveLength(bloque.aristas.length);
      const textos = new Set(formas(escena).map((f) => primeraLinea(f.texto)));
      for (const n of bloque.nodos) expect(textos.has(primeraLinea(n.etiqueta)), `falta «${n.etiqueta}»`).toBe(true);
    });

    it('cada conector está pegado a formas que existen', () => {
      const ids = new Set(formas(escena).map((f) => f.id));
      for (const l of lineas(escena)) {
        if (l.origen) expect(ids.has(l.origen.elementoId)).toBe(true);
        if (l.destino) expect(ids.has(l.destino.elementoId)).toBe(true);
      }
    });

    it('conserva los nodos y aristas como respaldo del diagrama original', () => {
      expect(bloque.nodos.length).toBeGreaterThan(0);
    });

    it('cada llamada da un bloque independiente', () => {
      const otra = plantilla.crear(marco);
      expect(otra).not.toBe(bloque);
      expect(otra.escena).not.toBe(bloque.escena);
    });
  });

  it('el conector sigue pegado a las formas correctas (flujo): une los mismos nodos que la arista', () => {
    const b = PLANTILLAS_EDITABLES[0]!.crear(marco);
    const e = escenaDe(b);
    // Cada arista del diagrama existe como un conector entre las formas de sus nodos (mismo orden de creación).
    const textoDe = new Map(formas(e).map((f) => [f.id, primeraLinea(f.texto)]));
    const pares = lineas(e).map((l) => `${textoDe.get(l.origen!.elementoId)}→${textoDe.get(l.destino!.elementoId)}`);
    const esperados = b.aristas.map((a) => {
      const de = b.nodos.find((n) => n.id === a.desdeId)!;
      const hacia = b.nodos.find((n) => n.id === a.haciaId)!;
      return `${primeraLinea(de.etiqueta)}→${primeraLinea(hacia.etiqueta)}`;
    });
    expect(pares.sort()).toEqual(esperados.sort());
  });

  it('un diagrama viejo guardado sin abrir no cambia: normalizarlo no inventa una escena', () => {
    const viejo = createDefaultMapaMentalBlock({ id: 'viejo' });
    const normal = normalizeDiagramaBlock(viejo) as DiagramaBlock;
    expect('escena' in normal).toBe(false);
    expect(normalizeDiagramaBlock(normal)).toEqual(normal);
  });
});

describe('galería «Plantillas editables» del panel', () => {
  const montar = (bloque: DiagramaBlock) => {
    const applyNow = vi.fn<(f: (b: Block) => Block) => Promise<void>>(async () => undefined);
    render(<DiagramaProperties block={bloque} applyNow={applyNow} />);
    return applyNow;
  };
  const abrirGaleria = () => {
    // La sección recuerda si estaba abierta (localStorage): se abre solo si hace falta.
    if (!document.querySelector('[data-diagrama-plantillas-editables]')) fireEvent.click(screen.getByText('Plantillas editables'));
    return document.querySelector('[data-diagrama-plantillas-editables]') as HTMLElement;
  };

  it('ofrece las seis plantillas', () => {
    montar(createDefaultFlujoBlock({ id: 'b1' }));
    const galeria = abrirGaleria();
    expect(Array.from(galeria.querySelectorAll('button')).map((b) => b.querySelector('span')?.textContent)).toEqual(PLANTILLAS_EDITABLES.map((p) => p.label));
  });

  it('elegir una reemplaza el bloque por un dibujo libre, en el mismo lugar y con el mismo id', () => {
    const actual = createDefaultFlujoBlock({ id: 'b1', x: 12, y: 13, ancho: 61, alto: 47 });
    const applyNow = montar(actual);
    const galeria = abrirGaleria();
    const boton = Array.from(galeria.querySelectorAll('button')).find((b) => b.textContent?.startsWith('Ciclo')) as HTMLElement;
    fireEvent.click(boton);
    expect(applyNow).toHaveBeenCalledTimes(1);
    const resultado = applyNow.mock.calls[0]![0]({ ...actual } as unknown as Block) as unknown as DiagramaGrafoBlock;
    expect(resultado.id).toBe('b1');
    expect([resultado.x, resultado.y, resultado.ancho, resultado.alto]).toEqual([12, 13, 61, 47]);
    expect(normalizarEscena(resultado.escena).elementos.length).toBeGreaterThan(0);
  });

  it('no cambia otro bloque con distinto id', () => {
    const actual = createDefaultFlujoBlock({ id: 'b1' });
    const applyNow = montar(actual);
    const galeria = abrirGaleria();
    fireEvent.click(galeria.querySelector('button') as HTMLElement);
    const otro = createDefaultFlujoBlock({ id: 'otro' }) as unknown as Block;
    expect(applyNow.mock.calls[0]![0](otro)).toBe(otro);
  });
});
