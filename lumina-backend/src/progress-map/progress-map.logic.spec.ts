import {
  defaultSequentialEdges,
  deriveNodeStatus,
  edgesHaveCycle,
  layoutProgressNodes,
  mergeCompletedIds,
  resolveEdges,
  sanitizeEdges,
} from './progress-map.logic';

describe('progress-map.logic', () => {
  it('secuencia lineal por orden de ids', () => {
    expect(defaultSequentialEdges(['a', 'b', 'c'])).toEqual([
      { fromClassId: 'a', toClassId: 'b' },
      { fromClassId: 'b', toClassId: 'c' },
    ]);
    expect(defaultSequentialEdges(['solo'])).toEqual([]);
  });

  it('sanitizeEdges descarta huérfanos, bucles y duplicados', () => {
    const valid = new Set(['a', 'b']);
    expect(
      sanitizeEdges(
        [
          { fromClassId: 'a', toClassId: 'b' },
          { fromClassId: 'a', toClassId: 'b' },
          { fromClassId: 'a', toClassId: 'a' },
          { fromClassId: 'a', toClassId: 'zzz' },
          null,
        ],
        valid,
      ),
    ).toEqual([{ fromClassId: 'a', toClassId: 'b' }]);
  });

  it('detecta ciclos y hace fallback a secuencia', () => {
    expect(
      edgesHaveCycle(
        ['a', 'b'],
        [
          { fromClassId: 'a', toClassId: 'b' },
          { fromClassId: 'b', toClassId: 'a' },
        ],
      ),
    ).toBe(true);

    const resolved = resolveEdges(['a', 'b'], {
      edges: [
        { fromClassId: 'a', toClassId: 'b' },
        { fromClassId: 'b', toClassId: 'a' },
      ],
    });
    expect(resolved.custom).toBe(false);
    expect(resolved.edges).toEqual([{ fromClassId: 'a', toClassId: 'b' }]);
  });

  it('usa aristas personalizadas si son acíclicas', () => {
    const resolved = resolveEdges(['a', 'b', 'c'], {
      edges: [{ fromClassId: 'a', toClassId: 'c' }],
    });
    expect(resolved.custom).toBe(true);
    expect(resolved.edges).toEqual([{ fromClassId: 'a', toClassId: 'c' }]);
  });

  it('desbloqueo topológico: raíz available, sucesor locked hasta completar', () => {
    const edges = defaultSequentialEdges(['a', 'b']);
    expect(deriveNodeStatus('a', new Set(), new Set(), edges)).toBe(
      'available',
    );
    expect(deriveNodeStatus('b', new Set(), new Set(), edges)).toBe('locked');
    expect(deriveNodeStatus('b', new Set(['a']), new Set(), edges)).toBe(
      'available',
    );
    expect(deriveNodeStatus('a', new Set(['a']), new Set(), edges)).toBe(
      'completed',
    );
    expect(deriveNodeStatus('a', new Set(), new Set(['a']), edges)).toBe(
      'in_progress',
    );
  });

  it('mergeCompletedIds une las tres vías sin mutar', () => {
    const merged = mergeCompletedIds(['m'], ['l'], ['a']);
    expect([...merged].sort()).toEqual(['a', 'l', 'm']);
  });

  it('layout automático es lineal', () => {
    const pos = layoutProgressNodes(['a', 'b']);
    expect(pos.a?.x).toBeLessThan(pos.b?.x ?? 0);
    expect(pos.a?.y).toBe(pos.b?.y);
  });
});
