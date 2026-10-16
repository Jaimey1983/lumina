import { describe, expect, it } from 'vitest';
import type { DiagramaGrafoBlock } from '@lumina/types/slide';
import { graphEdgeToRF } from '@lumina/editor-shared/graph-editor';
import { diagramaToGraphModel } from './diagrama-bridge.js';
import { normalizeDiagramaBlock } from './diagrama-defaults.js';
import {
  aplicarPaletaADiagrama,
  GROSOR_CONECTOR_DEFECTO,
  PALETAS_DIAGRAMA,
  resolverEstiloArista,
  resolverEstiloDiagrama,
  resolverEstiloNodo,
} from './diagrama-temas.js';

describe('diagrama-temas', () => {
  const sampleGrafo: DiagramaGrafoBlock = {
    id: 'block-1',
    tipo: 'diagrama',
    subtipo: 'mapa_mental',
    modo: 'contenido',
    soloLecturaEnViewer: true,
    titulo: 'Grafo de Prueba',
    nodos: [
      { id: 'raiz', etiqueta: 'Centro', x: 0, y: 0 },
      { id: 'hijo-1', etiqueta: 'Rama A', x: 100, y: 50 },
      { id: 'hijo-2', etiqueta: 'Rama B', x: 100, y: -50 },
      { id: 'nieto-1', etiqueta: 'Detalle A1', x: 200, y: 50 },
    ],
    aristas: [
      { id: 'a1', desdeId: 'raiz', haciaId: 'hijo-1' },
      { id: 'a2', desdeId: 'raiz', haciaId: 'hijo-2' },
      { id: 'a3', desdeId: 'hijo-1', haciaId: 'nieto-1' },
    ],
  };

  it('asigna el acento principal a la raíz y distribuye colores armónicos a las ramas', () => {
    const updated = aplicarPaletaADiagrama(sampleGrafo, 'editorial');
    expect(updated.opciones?.paleta).toBe('editorial');

    const raiz = updated.nodos.find((n) => n.id === 'raiz');
    const hijo1 = updated.nodos.find((n) => n.id === 'hijo-1');
    const hijo2 = updated.nodos.find((n) => n.id === 'hijo-2');
    const nieto1 = updated.nodos.find((n) => n.id === 'nieto-1');

    // La raíz recibe el acento principal
    expect(raiz?.estilo?.color).toBe(PALETAS_DIAGRAMA.editorial.acentoPrincipal);

    // Los dos hijos reciben colores de la paleta distintos
    expect(hijo1?.estilo?.color).toBe(PALETAS_DIAGRAMA.editorial.colores[0]);
    expect(hijo2?.estilo?.color).toBe(PALETAS_DIAGRAMA.editorial.colores[1]);

    // El nieto hereda el color de su rama padre (hijo-1)
    expect(nieto1?.estilo?.color).toBe(hijo1?.estilo?.color);
  });

  it('soporta cambio dinámico a paleta tecnológico', () => {
    const updated = aplicarPaletaADiagrama(sampleGrafo, 'tecnologico');
    const raiz = updated.nodos.find((n) => n.id === 'raiz');
    expect(raiz?.estilo?.color).toBe(PALETAS_DIAGRAMA.tecnologico.acentoPrincipal);
  });

  it('soporta las nuevas paletas armónicas: oceano, aurora, monocromatico, pastel', () => {
    const paletas: Array<keyof typeof PALETAS_DIAGRAMA> = [
      'oceano',
      'aurora',
      'monocromatico',
      'pastel',
    ];

    for (const pal of paletas) {
      const updated = aplicarPaletaADiagrama(sampleGrafo, pal);
      expect(updated.opciones?.paleta).toBe(pal);
      const raiz = updated.nodos.find((n) => n.id === 'raiz');
      expect(raiz?.estilo?.color).toBe(PALETAS_DIAGRAMA[pal].acentoPrincipal);
      expect(PALETAS_DIAGRAMA[pal].colores.length).toBeGreaterThanOrEqual(6);
    }
  });
});

describe('estilo del diagrama (V2.1)', () => {
  const SUBTIPOS_GRAFO = [
    'mapa_mental',
    'organigrama',
    'mapa_conceptual',
    'flujo',
    'cronologia',
    'piramide',
    'embudo',
    'cebolla',
  ] as const;

  function bloque(subtipo: (typeof SUBTIPOS_GRAFO)[number], opciones?: unknown): DiagramaGrafoBlock {
    return normalizeDiagramaBlock({
      id: 'b-estilo',
      tipo: 'diagrama',
      subtipo,
      nodos: [
        { id: 'a', etiqueta: 'A', x: 0, y: 0 },
        { id: 'b', etiqueta: 'B', x: 150, y: 0 },
      ],
      aristas: [{ id: 'e', desdeId: 'a', haciaId: 'b' }],
      ...(opciones ? { opciones } : {}),
    }) as DiagramaGrafoBlock;
  }

  describe('saneo en normalizeDiagramaBlock', () => {
    it('un bloque sin estilo no gana la clave `estilo` (cero migración)', () => {
      expect(bloque('flujo', { paleta: 'menta' }).opciones).toEqual({ paleta: 'menta' });
      expect(bloque('flujo').opciones).toBeUndefined();
    });

    it('conserva un estilo válido completo', () => {
      const estilo = {
        relleno: 'tintado',
        sombra: false,
        conector: { trazado: 'orthogonal', grosor: 3, patron: 'discontinua' },
      };
      expect(bloque('flujo', { estilo }).opciones?.estilo).toEqual(estilo);
    });

    it('descarta valores desconocidos o fuera de rango y omite lo que queda vacío', () => {
      const sucio = bloque('flujo', {
        estilo: {
          relleno: 'neon',
          sombra: 'si',
          conector: { trazado: 'zigzag', grosor: 99, patron: 'raya' },
        },
      });
      expect(sucio.opciones?.estilo).toBeUndefined();

      const parcial = bloque('flujo', {
        estilo: { relleno: 'solido', sombra: 1, conector: { trazado: 'straight', grosor: -2 } },
      });
      expect(parcial.opciones?.estilo).toEqual({ relleno: 'solido', conector: { trazado: 'straight' } });
    });

    it('rechaza grosores no finitos y acepta los extremos 0.5 y 8', () => {
      expect(bloque('flujo', { estilo: { conector: { grosor: Number.NaN } } }).opciones?.estilo).toBeUndefined();
      expect(bloque('flujo', { estilo: { conector: { grosor: 0.5 } } }).opciones?.estilo?.conector?.grosor).toBe(0.5);
      expect(bloque('flujo', { estilo: { conector: { grosor: 8 } } }).opciones?.estilo?.conector?.grosor).toBe(8);
    });

    it('ignora un `estilo` que no es objeto', () => {
      expect(bloque('flujo', { estilo: 'tintado' }).opciones?.estilo).toBeUndefined();
      expect(bloque('flujo', { estilo: null }).opciones?.estilo).toBeUndefined();
    });
  });

  describe('resolverEstiloDiagrama — defaults por subtipo', () => {
    it.each(SUBTIPOS_GRAFO)('sin estilo reproduce el aspecto actual (%s)', (subtipo) => {
      const r = resolverEstiloDiagrama(undefined, subtipo);
      expect(r.sombra).toBe(true);
      expect(r.conector.grosor).toBe(GROSOR_CONECTOR_DEFECTO);
      expect(r.conector.patron).toBe('solida');
      expect(r.relleno).toBe(['piramide', 'embudo', 'cebolla'].includes(subtipo) ? 'tintado' : 'contorno');
    });

    it.each(SUBTIPOS_GRAFO)(
      'el trazado y el grosor por defecto coinciden con lo que hoy aplican los puentes (%s)',
      (subtipo) => {
        const block = bloque(subtipo);
        const model = diagramaToGraphModel(block);
        const arista = block.aristas[0];
        const hoy = graphEdgeToRF(model.edges.find((e) => e.id === arista.id)!);

        const r = resolverEstiloDiagrama(block.opciones, subtipo);
        expect(resolverEstiloArista(arista, r).trazado).toBe(hoy.data?.tipoTrazado);
        expect(resolverEstiloArista(arista, r).grosor).toBe(hoy.style?.strokeWidth);
      },
    );

    it('el estilo del diagrama manda sobre el default del subtipo', () => {
      const r = resolverEstiloDiagrama(
        { estilo: { relleno: 'solido', sombra: false, conector: { trazado: 'orthogonal', grosor: 4, patron: 'punteada' } } },
        'mapa_mental',
      );
      expect(r).toEqual({
        relleno: 'solido',
        sombra: false,
        conector: { trazado: 'orthogonal', grosor: 4, patron: 'punteada' },
      });
    });
  });

  describe('resolverEstiloArista — precedencia', () => {
    const estilo = resolverEstiloDiagrama({ estilo: { conector: { trazado: 'straight', grosor: 4, patron: 'punteada' } } }, 'flujo');

    it('lo que declara la arista gana al estilo del diagrama', () => {
      const r = resolverEstiloArista(
        { id: 'e', desdeId: 'a', haciaId: 'b', tipoTrazado: 'bezier', grosor: 2, estiloLinea: 'discontinua' },
        estilo,
      );
      expect(r).toEqual({ trazado: 'bezier', grosor: 2, patron: 'discontinua' });
    });

    it('una arista sin campos propios hereda el estilo del diagrama', () => {
      expect(resolverEstiloArista({ id: 'e', desdeId: 'a', haciaId: 'b' }, estilo)).toEqual({
        trazado: 'straight',
        grosor: 4,
        patron: 'punteada',
      });
    });
  });

  describe('resolverEstiloNodo', () => {
    const base = resolverEstiloDiagrama(undefined, 'flujo');

    it('contorno: fondo de tarjeta y texto del tema', () => {
      const n = resolverEstiloNodo({ ...base, relleno: 'contorno' }, '#2563EB');
      expect(n.rellenoCss).toContain('var(--card');
      expect(n.colorTexto).toContain('var(--foreground');
    });

    it('tintado: mezcla el acento sobre la tarjeta y mantiene el texto del tema', () => {
      const n = resolverEstiloNodo({ ...base, relleno: 'tintado' }, '#2563EB');
      expect(n.rellenoCss).toMatch(/^color-mix\(in srgb, #2563EB 14%, var\(--card/);
      expect(n.colorTexto).toContain('var(--foreground');
    });

    it('solido: acento pleno y texto con contraste (claro sobre oscuro, oscuro sobre claro)', () => {
      expect(resolverEstiloNodo({ ...base, relleno: 'solido' }, '#1E3A8A')).toMatchObject({
        rellenoCss: '#1E3A8A',
        colorTexto: '#ffffff',
      });
      expect(resolverEstiloNodo({ ...base, relleno: 'solido' }, '#FBBF24').colorTexto).toBe('#0f172a');
      expect(resolverEstiloNodo({ ...base, relleno: 'solido' }, '#fff').colorTexto).toBe('#0f172a');
    });

    it('solido con un color que no es hex cae al `primary-foreground` del tema', () => {
      expect(resolverEstiloNodo({ ...base, relleno: 'solido' }, 'var(--primary)').colorTexto).toContain('--primary-foreground');
    });

    it('propaga la sombra resuelta', () => {
      expect(resolverEstiloNodo({ ...base, sombra: false }, '#000').sombra).toBe(false);
    });
  });
});
