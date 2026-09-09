import { render, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { TextBlock } from '@lumina/types/slide';
import type { RichDoc } from '@lumina/types/rich-text';
import { RenderText } from './render-texto.js';

const spoilerDoc: RichDoc = {
  version: 1,
  nodes: [
    {
      type: 'paragraph',
      runs: [
        { text: 'La respuesta es ' },
        { text: '42', marks: [{ t: 'spoiler' }] },
      ],
    },
  ],
};
const block: TextBlock = { tipo: 'texto', contenido: 'La respuesta es 42', contenidoRich: spoilerDoc };

describe('RenderText — marca spoiler (Fase 5A)', () => {
  it('en viewer sale oculto (blur) y se revela al hacer clic', () => {
    const { container, getByRole } = render(<RenderText block={block} modo="viewer" />);
    const btn = getByRole('button', { name: 'Mostrar respuesta oculta' });
    expect((btn as HTMLElement).style.filter).toContain('blur');
    fireEvent.click(btn);
    expect(container.querySelector('[data-spoiler="revealed"]')).not.toBeNull();
  });

  it('se revela con Enter (accesible)', () => {
    const { container, getByRole } = render(<RenderText block={block} modo="viewer" />);
    fireEvent.keyDown(getByRole('button', { name: 'Mostrar respuesta oculta' }), { key: 'Enter' });
    expect(container.querySelector('[data-spoiler="revealed"]')).not.toBeNull();
  });

  it('en el editor (no interactivo) sale ya revelado', () => {
    const { container } = render(<RenderText block={block} modo="editor" />);
    expect(container.querySelector('[data-spoiler="revealed"]')).not.toBeNull();
    expect(container.textContent).toContain('42');
  });
});
