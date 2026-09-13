import { describe, expect, it } from 'vitest';
import type { DiagramaGrafoBlock } from '@lumina/types/slide';
import { aplicarPaletaADiagrama, PALETAS_DIAGRAMA } from './diagrama-temas.js';

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
