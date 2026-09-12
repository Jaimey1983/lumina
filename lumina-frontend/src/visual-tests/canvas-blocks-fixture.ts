import { createDefaultGraficoBlock } from '@lumina/element-kit/blocks/grafico/grafico-defaults';
import {
  createDefaultMapaMentalBlock,
  createDefaultVennBlock,
} from '@lumina/element-kit/blocks/diagrama/diagrama-defaults';
import { createDefaultClipGroupBlock } from '@lumina/editor-shared/clip-path';
import type {
  ClipGroupBlock,
  DiagramaGrafoBlock,
  DiagramaVennBlock,
  GraficoDatosBlock,
} from '@lumina/types/slide';

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
      // ApexCharts genera una clase de instancia aleatoria por montaje
      // (`apexcharts9g5ek1xx`, sin guion tras el prefijo — no confundir con
      // clases reales como `apexcharts-canvas`/`apexcharts-svg`, que sí llevan
      // guion) para su hoja de estilos con scope; distinta en cada render.
      // Va ANTES que la normalización de `useId` de React: esa regex matchea
      // cualquier "r" seguida de dígitos en cualquier posición, y si corriera
      // primero mordería un fragmento del sufijo aleatorio (p. ej. "...12r34"
      // → "...12R") dejando el resto sin colapsar — falso negativo de paridad.
      .replace(/\bapexcharts[0-9a-z]{6,}\b/g, 'apexcharts_')
      // React useId: `_r_0_`, `«r1»`, `:r2:` — colapsar a un token fijo.
      .replace(/[«:]?r_?\d+_?[»:]?/g, 'R')
      .replace(/\sid="[^"]*"/g, '')
      .replace(/\saria-labelledby="[^"]*"/g, '')
      // referencias SVG `url(#x)` y `url("#x")` / `url(&quot;#x&quot;)`.
      .replace(/url\((?:&quot;|")?#[^)]*?(?:&quot;|")?\)/g, 'url(#_)')
      .replace(/\srecharts-[\w-]+-\d+/g, ' recharts-_')
      // `pathFrom`/`pathTo`: bookkeeping interno de ApexCharts para
      // interpolar la transición de entrada — no son atributos SVG estándar,
      // no afectan lo renderizado (solo `d` lo hace) y su valor depende de
      // qué instancia previa (si alguna) reusó su caché interna, no de los
      // datos del gráfico. Mismo criterio que ya se aplica a `id="..."`.
      .replace(/\s(?:pathFrom|pathTo)="[^"]*"/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  );
}
