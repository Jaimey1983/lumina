import { describe, expect, it } from 'vitest';
import { layoutCiclo, layoutCuadrantes, layoutIshikawa, layoutRadial } from './layout-pedagogico.js';
import type { DiagramaArista, DiagramaNodo } from '@lumina/types/slide';

describe('layout-pedagogico', () => {
  const sampleNodes: DiagramaNodo[] = [
    { id: 'n1', etiqueta: 'Raíz / Central', x: 0, y: 0 },
    { id: 'n2', etiqueta: 'Elemento 2', x: 0, y: 0 },
    { id: 'n3', etiqueta: 'Elemento 3', x: 0, y: 0 },
    { id: 'n4', etiqueta: 'Elemento 4', x: 0, y: 0 },
  ];
  const sampleEdges: DiagramaArista[] = [];

  describe('layoutRadial', () => {
    it('posiciona la raíz en el centro y distribuye ramas perimétricamente', () => {
      const laidOut = layoutRadial(sampleNodes, sampleEdges, { x: 300, y: 200 }, 150);
      expect(laidOut).toHaveLength(4);
      expect(laidOut[0].forma).toBe('root');
      // Las ramas no deben estar superpuestas
      expect(laidOut[1].x).not.toBe(laidOut[2].x);
      expect(laidOut[1].y).not.toBe(laidOut[2].y);
    });
  });

  describe('layoutCiclo', () => {
    it('crea un bucle cerrado secuencial de aristas', () => {
      const { nodos, aristas } = layoutCiclo(sampleNodes);
      expect(nodos).toHaveLength(4);
      expect(aristas).toHaveLength(4);
      // El último nodo se conecta de vuelta al primero
      expect(aristas[3].desdeId).toBe('n4');
      expect(aristas[3].haciaId).toBe('n1');
    });
  });

  describe('layoutIshikawa', () => {
    it('sitúa el efecto a la derecha y categorías en ramas superior e inferior', () => {
      const { nodos, aristas } = layoutIshikawa(sampleNodes, sampleEdges);
      expect(nodos[0].id).toBe('n1');
      expect(nodos[0].x).toBe(520); // Extremo derecho
      expect(aristas).toHaveLength(3); // Cada categoría conectada al efecto
      expect(aristas[0].haciaId).toBe('n1');
    });
  });

  describe('layoutCuadrantes', () => {
    it('posiciona modelo Frayer con centro y 4 cuadrantes', () => {
      const frayerNodes: DiagramaNodo[] = [
        ...sampleNodes,
        { id: 'n5', etiqueta: 'Elemento 5', x: 0, y: 0 },
      ];
      const laidOut = layoutCuadrantes(frayerNodes, 'frayer');
      expect(laidOut[0].forma).toBe('root');
      expect(laidOut[0].x).toBe(230);
      expect(laidOut[1].x).toBe(50);
      expect(laidOut[2].x).toBe(410);
    });

    it('organiza tabla T en 2 columnas balanceadas', () => {
      const laidOut = layoutCuadrantes(sampleNodes, 'tabla_t');
      expect(laidOut[0].x).toBe(70); // Columna izquierda
      expect(laidOut[1].x).toBe(320); // Columna derecha
      expect(laidOut[2].x).toBe(70);
      expect(laidOut[3].x).toBe(320);
    });
  });
});
