import { describe, expect, it } from 'vitest';

import { progressMapToGraphModel, type ProgressMapResponse } from './progress-map';

describe('progressMapToGraphModel', () => {
  it('traduce nodos y aristas al modelo de graph-core', () => {
    const map: ProgressMapResponse = {
      courseId: 'c1',
      viewer: 'student',
      mode: 'student',
      studentId: 'u1',
      edgesCustom: false,
      edges: [{ fromClassId: 'a', toClassId: 'b' }],
      nodes: [
        {
          classId: 'a',
          title: 'Clase 1',
          classStatus: 'PUBLISHED',
          modoEntrega: 'clase',
          status: 'completed',
          source: 'live',
          x: 40,
          y: 140,
        },
        {
          classId: 'b',
          title: 'Clase 2',
          classStatus: 'PUBLISHED',
          modoEntrega: 'autonomo',
          status: 'available',
          source: null,
          x: 260,
          y: 140,
        },
      ],
    };

    const model = progressMapToGraphModel(map);
    expect(model.nodes).toHaveLength(2);
    expect(model.edges).toHaveLength(1);
    expect(model.edges[0]?.source).toBe('a');
    expect(model.nodes[0]?.accent).toBe('#059669');
    expect(model.nodes[1]?.highlighted).toBe(true);
  });
});
