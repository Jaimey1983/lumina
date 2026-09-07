import { createDefaultGraficoBlock } from '@/components/graficos/grafico-defaults';
import {
  createDefaultMapaMentalBlock,
  createDefaultVennBlock,
} from '@/components/diagramas/diagrama-defaults';
import { createDefaultClipGroupBlock } from '@/lib/clip-path';
import type {
  ClipGroupBlock,
  DiagramaGrafoBlock,
  DiagramaVennBlock,
  GraficoDatosBlock,
} from '@/types/slide.types';

/** Lienzo fijo para render determinista de los 3 bloques con canvas (E5.7). */
export const CANVAS_HOST_SIZE = { width: 480, height: 320 } as const;
export const CANVAS_HOST_BG = '#f1f5f9';

export function graficoFixture(): GraficoDatosBlock {
  return {
    ...createDefaultGraficoBlock({ titulo: 'Notas del período', chartType: 'column' }),
    id: 'fx-grafico',
    x: 0,
    y: 0,
    ancho: 100,
    alto: 100,
  };
}

export function grafoFixture(): DiagramaGrafoBlock {
  return {
    ...createDefaultMapaMentalBlock(),
    id: 'fx-grafo',
    titulo: 'Mapa mental',
    x: 0,
    y: 0,
    ancho: 100,
    alto: 100,
  };
}

export function vennFixture(): DiagramaVennBlock {
  return {
    ...createDefaultVennBlock(),
    id: 'fx-venn',
    titulo: 'Diagrama de Venn',
    x: 0,
    y: 0,
    ancho: 100,
    alto: 100,
  };
}

export function clipGroupFixture(): ClipGroupBlock {
  return {
    ...createDefaultClipGroupBlock(
      { tipo: 'circulo' },
      { tipo: 'color', valor: '#2563eb' },
    ),
    id: 'fx-clip',
    x: 0,
    y: 0,
    ancho: 100,
    alto: 100,
  };
}

/**
 * Normaliza el HTML renderizado para comparar legacy vs kit sin ruido:
 * ids autogenerados, `useId` de React (varía según el orden de montaje en el
 * mismo test), referencias `url(#…)` de SVG, nonces de Recharts y espacios.
 */
export function normalizeRenderedHtml(html: string): string {
  return (
    html
      // React useId: `_r_0_`, `«r1»`, `:r2:` — colapsar a un token fijo.
      .replace(/[«:]?r_?\d+_?[»:]?/g, 'R')
      .replace(/\sid="[^"]*"/g, '')
      .replace(/\saria-labelledby="[^"]*"/g, '')
      // referencias SVG `url(#x)` y `url("#x")` / `url(&quot;#x&quot;)`.
      .replace(/url\((?:&quot;|")?#[^)]*?(?:&quot;|")?\)/g, 'url(#_)')
      .replace(/\srecharts-[\w-]+-\d+/g, ' recharts-_')
      .replace(/\s+/g, ' ')
      .trim()
  );
}
