import { describe, expect, it } from 'vitest';
import { layoutCebolla, layoutCiclo, layoutCuadrantes, layoutEmbudo, layoutIshikawa, layoutPiramide, layoutRadial } from './layout-pedagogico.js';
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

  describe('layoutPiramide', () => {
    it('distribuye niveles apilados verticalmente con ancho creciente hacia la base', () => {
      const { nodos, aristas } = layoutPiramide(sampleNodes);
      expect(nodos).toHaveLength(4);
      // El vértice superior está más arriba que la base
      expect(nodos[0].y).toBeLessThan(nodos[1].y);
      expect(nodos[1].y).toBeLessThan(nodos[2].y);
      expect(nodos[2].y).toBeLessThan(nodos[3].y);

      // El ancho del vértice es menor que el de la base
      expect(nodos[0].ancho).toBeLessThan(nodos[3].ancho!);

      // Hay conexiones secuenciales entre niveles
      expect(aristas).toHaveLength(3);
      expect(aristas[0].desdeId).toBe('n1');
      expect(aristas[0].haciaId).toBe('n2');
    });
  });

  describe('layoutEmbudo', () => {
    it('distribuye niveles apilados verticalmente con ancho decreciente hacia la base', () => {
      const { nodos, aristas } = layoutEmbudo(sampleNodes);
      expect(nodos).toHaveLength(4);
      // Nivel 0 (boca) está más arriba que nivel 3 (filtro)
      expect(nodos[0].y).toBeLessThan(nodos[3].y);
      // El ancho del nivel 0 es mayor que el del nivel 3
      expect(nodos[0].ancho).toBeGreaterThan(nodos[3].ancho!);
      expect(aristas).toHaveLength(3);
      expect(aristas[0].desdeId).toBe('n1');
      expect(aristas[0].haciaId).toBe('n2');
    });
  });

  describe('layoutCebolla', () => {
    it('distribuye capas concéntricas con diámetros crecientes desde el núcleo', () => {
      const { nodos, aristas } = layoutCebolla(sampleNodes);
      expect(nodos).toHaveLength(4);
      // Todos comparten el mismo centro: x + ancho/2 === 300, y + alto/2 === 190
      for (const nodo of nodos) {
        expect(Math.round(nodo.x + nodo.ancho! / 2)).toBe(300);
        expect(Math.round(nodo.y + nodo.alto! / 2)).toBe(190);
      }
      // El núcleo interior tiene menor diámetro que la capa exterior
      expect(nodos[0].ancho).toBeLessThan(nodos[3].ancho!);
      expect(aristas).toHaveLength(3);
    });
  });
});
