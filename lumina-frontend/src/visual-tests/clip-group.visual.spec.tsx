import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';

import { createDefaultLibreShape } from '@/lib/clip-path';

import {
  CLIP_TEST_IMAGE_URL,
  CLIP_VISUAL_SIZE,
  clipVisualBlock,
} from './clip-group-fixture';
import { ClipVisualHost } from './clip-group-visual-host';

describe('clip-group visual (cross-browser)', () => {
  test('círculo + color: recorte contenido dentro de la máscara', async () => {
    const block = clipVisualBlock(
      { tipo: 'circulo' },
      { tipo: 'color', valor: '#2563eb' },
    );
    const view = await render(<ClipVisualHost block={block} />);
    const host = view.getByTestId('clip-visual-host');
    await expect.element(host).toBeVisible();
    await expect(host).toMatchScreenshot('clip-circle-color.png');
  });

  test('triángulo + color', async () => {
    const block = clipVisualBlock(
      { tipo: 'triangulo' },
      { tipo: 'color', valor: '#dc2626' },
    );
    const view = await render(<ClipVisualHost block={block} />);
    await expect(view.getByTestId('clip-visual-host')).toMatchScreenshot('clip-triangle-color.png');
  });

  test('estrella + gradiente', async () => {
    const block = clipVisualBlock(
      { tipo: 'estrella', puntas: 5, radioInterno: 0.4 },
      { tipo: 'gradiente', inicio: '#7c3aed', fin: '#ec4899', direccion: 135 },
    );
    const view = await render(<ClipVisualHost block={block} />);
    await expect(view.getByTestId('clip-visual-host')).toMatchScreenshot('clip-star-gradient.png');
  });

  test('rectángulo redondeado + borde + sombra', async () => {
    const block = clipVisualBlock(
      { tipo: 'rectangulo', borderRadius: 16 },
      { tipo: 'color', valor: '#059669' },
      {
        borde: { color: '#1e293b', grosor: 3 },
        sombra: { color: 'rgba(0,0,0,0.35)', blur: 12, offsetX: 4, offsetY: 6 },
      },
    );
    const view = await render(<ClipVisualHost block={block} />);
    await expect(view.getByTestId('clip-visual-host')).toMatchScreenshot(
      'clip-rect-border-shadow.png',
    );
  });

  test('forma libre + color', async () => {
    const block = clipVisualBlock(createDefaultLibreShape(), {
      tipo: 'color',
      valor: '#ea580c',
    });
    const view = await render(<ClipVisualHost block={block} />);
    await expect(view.getByTestId('clip-visual-host')).toMatchScreenshot('clip-libre-color.png');
  });

  test('hexágono + imagen (cover): sin desbordar fuera de la máscara', async () => {
    const block = clipVisualBlock(
      { tipo: 'hexagono' },
      {
        tipo: 'imagen',
        url: CLIP_TEST_IMAGE_URL,
        ajuste: 'cubrir',
        escala: 1,
        offsetX: 0,
        offsetY: 0,
      },
    );
    const view = await render(<ClipVisualHost block={block} />);
    const host = view.getByTestId('clip-visual-host');
    await expect.element(host).toBeVisible();
    await expect(host).toMatchScreenshot('clip-hex-image-cover.png');
  });

  test('dimensiones del lienzo de prueba', async () => {
    const block = clipVisualBlock(
      { tipo: 'circulo' },
      { tipo: 'color', valor: '#2563eb' },
    );
    const view = await render(<ClipVisualHost block={block} />);
    const host = view.getByTestId('clip-visual-host');
    await expect.element(host).toBeVisible();

    const hostEl = view.container.querySelector('[data-testid="clip-visual-host"]');
    expect(hostEl).toBeTruthy();
    expect((hostEl as HTMLElement).clientWidth).toBe(CLIP_VISUAL_SIZE.width);
    expect((hostEl as HTMLElement).clientHeight).toBe(CLIP_VISUAL_SIZE.height);
  });
});
