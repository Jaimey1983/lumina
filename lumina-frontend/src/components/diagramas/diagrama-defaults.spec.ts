import { describe, expect, it } from 'vitest';
import {
  CRONOLOGIA_BASELINE_Y,
  createDefaultCronologiaBlock,
  createDefaultFlujoBlock,
  createDefaultMapaConceptualBlock,
  createDefaultMapaMentalBlock,
  createDefaultOrganigramaBlock,
  createDefaultVennBlock,
  layoutCronologiaLineal,
  normalizeDiagramaBlock,
} from './diagrama-defaults';
import {
  applyGraphModelToDiagrama,
  diagramaToGraphModel,
} from './diagrama-bridge';
import {
  BLOCK_FALLBACKS,
  type DiagramaGrafoBlock,
  type DiagramaVennBlock,
} from '@/types/slide.types';

describe('diagrama-defaults y bridge', () => {
  it('crea un mapa mental por defecto con contratos v1 correctos', () => {
    const block = createDefaultMapaMentalBlock();

    expect(block.tipo).toBe('diagrama');
    expect(block.subtipo).toBe('mapa_mental');
    expect(block.modo).toBe('contenido');
    expect(block.soloLecturaEnViewer).toBe(true);
    expect(block.nodos.length).toBe(4);
    expect(block.aristas.length).toBe(3);
    expect(block.x).toBe(BLOCK_FALLBACKS.diagrama.x);
    expect(block.y).toBe(BLOCK_FALLBACKS.diagrama.y);
    expect(block.ancho).toBe(BLOCK_FALLBACKS.diagrama.ancho);
    expect(block.alto).toBe(BLOCK_FALLBACKS.diagrama.alto);
  });

  it('normalizeDiagramaBlock sanitiza datos corruptos y preserva consistencia referencial', () => {
    const corruptInput = {
      tipo: 'diagrama',
      subtipo: 'subtipo_invalido',
      modo: 'modo_invalido',
      soloLecturaEnViewer: false,
      nodos: [
        { id: 'n1', etiqueta: 'Nodo 1', x: 10, y: 20 },
        { id: 'n2', etiqueta: 'Nodo 2', x: 100, y: 200 },
        null,
      ],
      aristas: [
        { id: 'e1', desdeId: 'n1', haciaId: 'n2' },
        { id: 'e2', desdeId: 'n1', haciaId: 'nodo_fantasma_inexistente' },
      ],
      x: 'invalido',
      y: null,
    };

    const normalized = normalizeDiagramaBlock(corruptInput) as DiagramaGrafoBlock;

    expect(normalized.tipo).toBe('diagrama');
    expect(normalized.subtipo).toBe('mapa_mental');
    expect(normalized.modo).toBe('contenido');
    expect(normalized.soloLecturaEnViewer).toBe(true);
    expect(normalized.nodos.length).toBe(2);
    // La arista hacia el nodo inexistente debe ser descartada
    expect(normalized.aristas.length).toBe(1);
    expect(normalized.aristas[0].haciaId).toBe('n2');
    expect(normalized.x).toBe(BLOCK_FALLBACKS.diagrama.x);
    expect(normalized.y).toBe(BLOCK_FALLBACKS.diagrama.y);
  });

  it('diagramaToGraphModel y applyGraphModelToDiagrama realizan round-trip consistente', () => {
    const block = createDefaultMapaMentalBlock();
    const model = diagramaToGraphModel(block);

    expect(model.nodes.length).toBe(block.nodos.length);
    expect(model.edges.length).toBe(block.aristas.length);
    expect(model.nodes[0].id).toBe(block.nodos[0].id);

    // Mover un nodo en el modelo
    const updatedModel = {
      ...model,
      nodes: model.nodes.map((n) =>
        n.id === 'nodo-raiz' ? { ...n, x: 300, y: 200 } : n,
      ),
    };

    const updatedBlock = applyGraphModelToDiagrama(block, updatedModel);
    const movedNode = updatedBlock.nodos.find((n) => n.id === 'nodo-raiz');
    expect(movedNode?.x).toBe(300);
    expect(movedNode?.y).toBe(200);
  });

  it('crea un Venn por defecto con contratos v1 y regiones canónicas', () => {
    const block = createDefaultVennBlock();

    expect(block.tipo).toBe('diagrama');
    expect(block.subtipo).toBe('venn');
    expect(block.modo).toBe('contenido');
    expect(block.soloLecturaEnViewer).toBe(true);
    expect(block.conjuntos).toBe(2);
    expect(block.regiones.map((r) => r.id)).toEqual(['a', 'b', 'ab']);
    expect(block.elementos.length).toBeGreaterThan(0);
    expect(block.x).toBe(BLOCK_FALLBACKS.diagrama.x);
    expect(block.descripcionAccesible).toBeTruthy();
  });

  it('sanitize Venn: JSON corrupto, regionId inválido y 2↔3 conjuntos', () => {
    const corrupt = normalizeDiagramaBlock({
      tipo: 'diagrama',
      subtipo: 'venn',
      modo: 'evaluable',
      soloLecturaEnViewer: false,
      conjuntos: 99,
      regiones: [{ id: 'zona-inventada' }],
      elementos: [
        { id: 'ok', texto: 'Perro', regionId: 'a' },
        { id: 'bad', texto: 'X', regionId: 'xyz' },
        null,
        { texto: '' },
      ],
    }) as DiagramaVennBlock;

    expect(corrupt.modo).toBe('contenido');
    expect(corrupt.soloLecturaEnViewer).toBe(true);
    expect(corrupt.conjuntos).toBe(2);
    expect(corrupt.regiones.map((r) => r.id)).toEqual(['a', 'b', 'ab']);
    expect(corrupt.elementos.find((el) => el.id === 'ok')?.regionId).toBe('a');
    expect(corrupt.elementos.find((el) => el.id === 'bad')?.regionId).toBeNull();

    const three = normalizeDiagramaBlock({
      ...corrupt,
      conjuntos: 3,
    }) as DiagramaVennBlock;
    expect(three.conjuntos).toBe(3);
    expect(three.regiones.map((r) => r.id)).toContain('abc');
    expect(three.elementos.find((el) => el.id === 'ok')?.regionId).toBe('a');

    const backToTwo = normalizeDiagramaBlock({
      ...three,
      conjuntos: 2,
      elementos: [
        ...three.elementos,
        { id: 'solo-c', texto: 'Solo C', regionId: 'c' },
      ],
    }) as DiagramaVennBlock;
    expect(backToTwo.conjuntos).toBe(2);
    expect(backToTwo.regiones.map((r) => r.id)).toEqual(['a', 'b', 'ab']);
    expect(backToTwo.elementos.find((el) => el.id === 'solo-c')?.regionId).toBeNull();
  });

  it('crea un organigrama jerárquico por defecto con aristas dirigidas', () => {
    const org = createDefaultOrganigramaBlock();

    expect(org.tipo).toBe('diagrama');
    expect(org.subtipo).toBe('organigrama');
    expect(org.modo).toBe('contenido');
    expect(org.soloLecturaEnViewer).toBe(true);
    expect(org.layout).toBe('jerarquico');
    expect(org.nodos.length).toBeGreaterThanOrEqual(4);
    expect(org.aristas.length).toBeGreaterThanOrEqual(3);

    const model = diagramaToGraphModel(org);
    expect(model.edges.every((e) => e.directed === true)).toBe(true);
  });

  it('crea un mapa conceptual con proposiciones en las aristas y preserva etiquetas', () => {
    const mc = createDefaultMapaConceptualBlock();

    expect(mc.tipo).toBe('diagrama');
    expect(mc.subtipo).toBe('mapa_conceptual');
    expect(mc.modo).toBe('contenido');
    expect(mc.soloLecturaEnViewer).toBe(true);
    expect(mc.nodos.length).toBe(4);
    expect(mc.aristas.some((a) => typeof a.etiqueta === 'string' && a.etiqueta.length > 0)).toBe(true);

    const model = diagramaToGraphModel(mc);
    expect(model.edges[0].label).toBe(mc.aristas[0].etiqueta);

    // Round-trip con bridge
    const updatedModel = {
      ...model,
      edges: model.edges.map((e) =>
        e.id === mc.aristas[0].id ? { ...e, label: 'nueva relación pedagógica' } : e,
      ),
    };
    const updatedBlock = applyGraphModelToDiagrama(mc, updatedModel);
    expect(updatedBlock.aristas[0].etiqueta).toBe('nueva relación pedagógica');
  });

  it('crea un diagrama de flujo de procesos con aristas dirigidas y secuencia de pasos', () => {
    const flujo = createDefaultFlujoBlock();

    expect(flujo.tipo).toBe('diagrama');
    expect(flujo.subtipo).toBe('flujo');
    expect(flujo.modo).toBe('contenido');
    expect(flujo.soloLecturaEnViewer).toBe(true);
    expect(flujo.nodos.length).toBe(5);
    expect(flujo.aristas.every((a) => a.dirigida === true)).toBe(true);

    const model = diagramaToGraphModel(flujo);
    expect(model.edges.every((e) => e.directed === true)).toBe(true);
    expect(model.edges.some((e) => e.label === 'Sí')).toBe(true);
    expect(model.edges.some((e) => e.label === 'No')).toBe(true);
  });
});

describe('cronología pedagógica (layout lineal restringido)', () => {
  it('crea una cronología por defecto sobre un eje horizontal con cadena secuencial', () => {
    const crono = createDefaultCronologiaBlock();

    expect(crono.tipo).toBe('diagrama');
    expect(crono.subtipo).toBe('cronologia');
    expect(crono.modo).toBe('contenido');
    expect(crono.soloLecturaEnViewer).toBe(true);
    expect(crono.layout).toBe('lineal');
    expect(crono.nodos.length).toBe(5);

    // Todos los eventos comparten la línea base.
    expect(crono.nodos.every((n) => n.y === CRONOLOGIA_BASELINE_Y)).toBe(true);
    // x monótona creciente.
    for (let i = 1; i < crono.nodos.length; i++) {
      expect(crono.nodos[i].x).toBeGreaterThan(crono.nodos[i - 1].x);
    }
    // Cadena: n-1 conectores dirigidos que encadenan evento i → i+1.
    expect(crono.aristas.length).toBe(crono.nodos.length - 1);
    expect(crono.aristas.every((a) => a.dirigida === true)).toBe(true);
    crono.aristas.forEach((a, i) => {
      expect(a.desdeId).toBe(crono.nodos[i].id);
      expect(a.haciaId).toBe(crono.nodos[i + 1].id);
    });

    const model = diagramaToGraphModel(crono);
    expect(model.edges.every((e) => e.directed === true)).toBe(true);
  });

  it('normalizeDiagramaBlock re-aplana al eje, reordena por x e ignora aristas manuales', () => {
    const normalized = normalizeDiagramaBlock({
      tipo: 'diagrama',
      subtipo: 'cronologia',
      layout: 'libre',
      nodos: [
        { id: 'c', etiqueta: '1830', x: 500, y: 12 },
        { id: 'a', etiqueta: '1810', x: 20, y: 260 },
        { id: 'b', etiqueta: '1820', x: 250, y: 90 },
      ],
      // aristas arbitrarias que deben descartarse
      aristas: [{ id: 'x', desdeId: 'c', haciaId: 'a' }],
    }) as DiagramaGrafoBlock;

    expect(normalized.subtipo).toBe('cronologia');
    expect(normalized.layout).toBe('lineal');
    expect(normalized.nodos.map((n) => n.id)).toEqual(['a', 'b', 'c']);
    expect(normalized.nodos.every((n) => n.y === CRONOLOGIA_BASELINE_Y)).toBe(true);
    expect(normalized.aristas.map((e) => [e.desdeId, e.haciaId])).toEqual([
      ['a', 'b'],
      ['b', 'c'],
    ]);
  });

  it('layoutCronologiaLineal es idempotente', () => {
    const nodos = [
      { id: 'n2', etiqueta: 'B', x: 300, y: 40 },
      { id: 'n1', etiqueta: 'A', x: 10, y: 200 },
      { id: 'n3', etiqueta: 'C', x: 900, y: 5 },
    ];
    const once = layoutCronologiaLineal(nodos);
    const twice = layoutCronologiaLineal(once.nodos);

    expect(once.nodos).toEqual(twice.nodos);
    expect(once.aristas).toEqual(twice.aristas);
    expect(once.nodos.map((n) => n.id)).toEqual(['n1', 'n2', 'n3']);
    expect(once.aristas.length).toBe(2);
  });

  it('preserva etiqueta/cuerpo/estilo de cada evento al re-linealizar', () => {
    const crono = createDefaultCronologiaBlock();
    const shuffled = normalizeDiagramaBlock({
      ...crono,
      nodos: crono.nodos.map((n, i) => ({ ...n, x: (crono.nodos.length - i) * 111, y: i * 33 })),
    }) as DiagramaGrafoBlock;

    const byId = new Map(shuffled.nodos.map((n) => [n.id, n]));
    crono.nodos.forEach((orig) => {
      const after = byId.get(orig.id);
      expect(after?.etiqueta).toBe(orig.etiqueta);
      expect(after?.cuerpo).toBe(orig.cuerpo);
      expect(after?.estilo?.color).toBe(orig.estilo?.color);
    });
  });
});
