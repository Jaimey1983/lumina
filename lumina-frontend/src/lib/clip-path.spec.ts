import { describe, expect, it } from 'vitest';

import {
  createDefaultClipGroupBlock,
  createDefaultLibreShape,
  applyHandleDrag,
  toggleClipPathNodeKind,
  clampClipContentImageOffsets,
  clampClipImageOffsetsForBlock,
  formatClipDropShadow,
  generarClipPath,
  getClipImageStyle,
  computeClipImagePanClamp,
  librePathFromNodes,
  normalizeClipContentImage,
  normalizeClipGroupBlock,
} from './clip-path';
import type { ClipPathNode, ClipShape } from '@/types/slide.types';
import { remintBlockChildIds } from '@/components/widgets/shared/widget-clone';

describe('generarClipPath', () => {
  it('rectángulo sin radio genera caja 0–1', () => {
    const { d } = generarClipPath({ tipo: 'rectangulo' });
    expect(d).toContain('M 0,0');
    expect(d).toContain('Z');
  });

  it('triángulo apunta hacia arriba', () => {
    const { d } = generarClipPath({ tipo: 'triangulo' });
    expect(d).toBe('M 0.5,0 L 1,1 L 0,1 Z');
  });

  it('polígono respeta número de lados', () => {
    const { d } = generarClipPath({ tipo: 'poligono', lados: 8 });
    const segments = d.split(' L ').length;
    expect(segments).toBeGreaterThanOrEqual(8);
  });

  it('estrella genera path cerrado', () => {
    const { d } = generarClipPath({
      tipo: 'estrella',
      puntas: 5,
      radioInterno: 0.4,
    });
    expect(d.startsWith('M ')).toBe(true);
    expect(d.endsWith(' Z')).toBe(true);
  });

  it('svg custom usa el path provisto', () => {
    const custom = 'M 0.1,0.1 L 0.9,0.1 L 0.5,0.9 Z';
    const { d } = generarClipPath({ tipo: 'svg', path: custom });
    expect(d).toBe(custom);
  });

  it('hexágono es polígono de 6 lados', () => {
    const hex = generarClipPath({ tipo: 'hexagono' });
    const tri = generarClipPath({ tipo: 'poligono', lados: 6 });
    expect(hex.d).toBe(tri.d);
  });

  it('forma libre genera path cerrado con nodos', () => {
    const shape = createDefaultLibreShape();
    const { d } = generarClipPath(shape);
    expect(d.startsWith('M ')).toBe(true);
    expect(shape.nodos.length).toBeGreaterThanOrEqual(3);
  });

  it('libre con curvas Bézier usa comandos C', () => {
    const nodos: ClipPathNode[] = [
      { x: 0, y: 0.5, cpOut: { x: 0.3, y: 0 }, tipo: 'corner' },
      { x: 1, y: 0.5, cpIn: { x: 0.7, y: 1 }, tipo: 'corner' },
    ];
    const d = librePathFromNodes(nodos, false);
    expect(d).toContain('C ');
  });

  it('symmetric refleja la manija opuesta al arrastrar', () => {
    const node: ClipPathNode = {
      x: 0.5,
      y: 0.5,
      cpIn: { x: 0.42, y: 0.5 },
      cpOut: { x: 0.58, y: 0.5 },
      tipo: 'symmetric',
    };
    const moved = applyHandleDrag(node, 'cpOut', { x: 0.7, y: 0.55 });
    expect(moved.cpOut).toEqual({ x: 0.7, y: 0.55 });
    expect(moved.cpIn?.x).toBeCloseTo(0.3, 2);
    expect(moved.cpIn?.y).toBeCloseTo(0.45, 2);
  });

  it('Alt rompe simetría → corner independiente', () => {
    const node: ClipPathNode = {
      x: 0.5,
      y: 0.5,
      cpIn: { x: 0.42, y: 0.5 },
      cpOut: { x: 0.58, y: 0.5 },
      tipo: 'symmetric',
    };
    const moved = applyHandleDrag(node, 'cpOut', { x: 0.72, y: 0.6 }, { breakSymmetry: true });
    expect(moved.tipo).toBe('corner');
    expect(moved.cpOut).toEqual({ x: 0.72, y: 0.6 });
    expect(moved.cpIn).toEqual({ x: 0.42, y: 0.5 });
  });

  it('toggle corner ↔ smooth añade manijas al activar curva', () => {
    const corner: ClipPathNode = { x: 0.5, y: 0.2, tipo: 'corner' };
    const prev: ClipPathNode = { x: 0.2, y: 0.5, tipo: 'corner' };
    const next: ClipPathNode = { x: 0.8, y: 0.5, tipo: 'corner' };
    const curved = toggleClipPathNodeKind(corner, prev, next);
    expect(curved.cpIn).toBeDefined();
    expect(curved.cpOut).toBeDefined();
    expect(curved.tipo).toBe('symmetric');
    const back = toggleClipPathNodeKind(curved, prev, next);
    expect(back.tipo).toBe('corner');
  });

  it.each([
    { tipo: 'circulo' },
    { tipo: 'elipse' },
    { tipo: 'hexagono' },
    { tipo: 'poligono', lados: 5 },
    { tipo: 'rectangulo', borderRadius: 12 },
  ] satisfies ClipShape[])('forma %o genera path cerrado', (shape) => {
    const { d } = generarClipPath(shape);
    expect(d.startsWith('M ')).toBe(true);
    expect(d.endsWith(' Z')).toBe(true);
  });
});

describe('formatClipDropShadow', () => {
  it('devuelve undefined si no hay sombra o valores nulos', () => {
    expect(formatClipDropShadow(undefined)).toBeUndefined();
    expect(formatClipDropShadow({ blur: 0, offsetX: 0, offsetY: 0 })).toBeUndefined();
  });

  it('genera drop-shadow CSS con color por defecto', () => {
    expect(formatClipDropShadow({ blur: 8, offsetX: 2, offsetY: 4 })).toBe(
      'drop-shadow(2px 4px 8px rgba(0,0,0,0.25))',
    );
  });

  it('respeta color personalizado', () => {
    expect(
      formatClipDropShadow({ blur: 6, offsetX: 0, offsetY: 3, color: '#ff0000' }),
    ).toBe('drop-shadow(0px 3px 6px #ff0000)');
  });
});

describe('remintBlockChildIds clip-group', () => {
  it('forma libre: reminta ids de nodos; el id del bloque no cambia aquí', () => {
    const block = createDefaultClipGroupBlock(createDefaultLibreShape());
    const originalIds =
      block.clipShape.tipo === 'libre'
        ? block.clipShape.nodos.map((n) => n.id)
        : [];
    const reminted = remintBlockChildIds(structuredClone(block));
    expect(reminted.tipo).toBe('clip-group');
    if (reminted.tipo === 'clip-group' && reminted.clipShape.tipo === 'libre') {
      const newIds = reminted.clipShape.nodos.map((n) => n.id);
      expect(newIds).toHaveLength(originalIds.length);
      newIds.forEach((id, i) => {
        expect(id).not.toBe(originalIds[i]);
      });
    }
  });
});

describe('normalizeClipGroupBlock', () => {
  it('aplica defaults de imagen sin inyectar borde si no existía', () => {
    const block = createDefaultClipGroupBlock({ tipo: 'circulo' });
    const n = normalizeClipGroupBlock({
      ...block,
      contenido: { tipo: 'imagen', url: 'https://example.com/a.jpg' },
      borde: undefined,
    });
    expect(n.contenido.tipo).toBe('imagen');
    if (n.contenido.tipo === 'imagen') {
      expect(n.contenido.escala).toBe(1);
      expect(n.contenido.offsetX).toBe(0);
    }
    expect(n.borde).toBeUndefined();
  });

  it('respeta borde explícito con grosor 0', () => {
    const block = createDefaultClipGroupBlock({ tipo: 'circulo' });
    const n = normalizeClipGroupBlock({
      ...block,
      borde: { color: '#000000', grosor: 0 },
    });
    expect(n.borde?.grosor).toBe(0);
    expect(n.borde?.color).toBe('#000000');
  });

  it('completa color/grosor cuando borde existe pero faltan campos', () => {
    const block = createDefaultClipGroupBlock({ tipo: 'circulo' });
    const n = normalizeClipGroupBlock({
      ...block,
      borde: { color: '#ff0000' },
    });
    expect(n.borde?.color).toBe('#ff0000');
    expect(n.borde?.grosor).toBe(2);
  });

  it('normaliza nodos de forma libre con id y tipo', () => {
    const block = createDefaultClipGroupBlock(createDefaultLibreShape());
    const n = normalizeClipGroupBlock(block);
    expect(n.clipShape.tipo).toBe('libre');
    if (n.clipShape.tipo === 'libre') {
      expect(n.clipShape.nodos.every((node) => node.id)).toBe(true);
      expect(n.clipShape.nodos[0]?.tipo).toBeDefined();
    }
  });
});

describe('createDefaultClipGroupBlock', () => {
  it('crea bloque clip-group con bbox por defecto', () => {
    const block = createDefaultClipGroupBlock({ tipo: 'circulo' });
    expect(block.tipo).toBe('clip-group');
    expect(block.clipShape.tipo).toBe('circulo');
    expect(block.contenido.tipo).toBe('color');
    expect(block.ancho).toBe(40);
  });
});

describe('normalizeClipContentImage', () => {
  it('aplica defaults de pan y escala', () => {
    const n = normalizeClipContentImage({
      tipo: 'imagen',
      url: 'https://example.com/a.jpg',
    });
    expect(n.offsetX).toBe(0);
    expect(n.offsetY).toBe(0);
    expect(n.escala).toBe(1);
    expect(n.ajuste).toBe('cubrir');
  });
});

describe('getClipImageStyle', () => {
  it('modo cubrir deja la imagen más grande que el contenedor para permitir pan', () => {
    const style = getClipImageStyle(1600, 900, 400, 300, 1, 0, 0, 'cubrir');
    expect(parseFloat(String(style.width))).toBeCloseTo(533.33, 1);
    expect(style.height).toBe('300px');
    expect(parseFloat(String(style.width))).toBeGreaterThan(400);
  });

  it('modo llenar escala al bbox del contenedor', () => {
    const style = getClipImageStyle(1600, 900, 400, 300, 1, 0, 0, 'llenar');
    expect(style.width).toBe('400px');
    expect(style.height).toBe('300px');
  });
});

describe('computeClipImagePanClamp', () => {
  it('cover a escala 1 permite desplazamiento horizontal en panoramas', () => {
    const { maxPanX, maxPanY } = computeClipImagePanClamp(
      1600,
      900,
      400,
      300,
      1,
      'cubrir',
    );
    expect(maxPanX).toBeGreaterThan(0);
    expect(maxPanY).toBe(0);
  });
});

describe('clampClipContentImageOffsets', () => {
  it('limita offsets fuera de rango tras escala cover', () => {
    const content = normalizeClipContentImage({
      tipo: 'imagen',
      url: 'https://example.com/a.jpg',
      escala: 1,
      offsetX: 80,
      offsetY: 50,
      ajuste: 'cubrir',
    });
    const clamped = clampClipContentImageOffsets(content, 400, 300, 1600, 900);
    expect(Math.abs(clamped.offsetX)).toBeLessThan(80);
    expect(clamped.offsetY).toBe(0);
  });

  it('clampClipImageOffsetsForBlock usa bbox % sobre lienzo virtual', () => {
    const content = normalizeClipContentImage({
      tipo: 'imagen',
      url: 'https://example.com/a.jpg',
      escala: 2,
      offsetX: 100,
      offsetY: 100,
      ajuste: 'cubrir',
    });
    const clamped = clampClipImageOffsetsForBlock(content, 40, 50, 1600, 900);
    expect(Math.abs(clamped.offsetX)).toBeLessThan(100);
    expect(Math.abs(clamped.offsetY)).toBeLessThan(100);
  });
});
