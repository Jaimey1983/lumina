import { render, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RichDoc } from '@lumina/types/rich-text';
import { richToPlain } from '@lumina/editor-shared/rich-text';
import {
  getActiveRichEditor,
  registerActiveRichEditor,
} from '@lumina/editor-shared/rich-text';
import { RichTextEditor } from '@lumina/editor-shared/rich-text/rich-text-editor';

afterEach(() => {
  cleanup();
  registerActiveRichEditor(null);
});

const doc = (text: string): RichDoc => ({
  version: 1,
  nodes: [{ type: 'paragraph', runs: [{ text }] }],
});

async function mountEditor(props: Partial<Parameters<typeof RichTextEditor>[0]> = {}) {
  const onCommit = vi.fn();
  const onDiscard = vi.fn();
  render(
    <RichTextEditor
      value={props.value ?? doc('Hola mundo')}
      onCommit={onCommit}
      onDiscard={onDiscard}
      {...props}
    />,
  );
  const el = await waitFor(() => {
    const node = document.querySelector('.lumina-rich-editor');
    if (!node) throw new Error('editor no montado');
    return node as HTMLElement;
  });
  return { el, onCommit, onDiscard };
}

describe('RichTextEditor (Fase 2B)', () => {
  it('monta un contenteditable en español con el contenido inicial', async () => {
    const { el } = await mountEditor({ value: doc('Contenido inicial') });
    expect(el.getAttribute('contenteditable')).toBe('true');
    expect(el.getAttribute('lang')).toBe('es');
    expect(el.getAttribute('role')).toBe('textbox');
    expect(el.textContent).toContain('Contenido inicial');
  });

  it('blur → un único onCommit con un RichDoc equivalente', async () => {
    const { el, onCommit } = await mountEditor({ value: doc('Texto de prueba') });
    fireEvent.blur(el);
    await waitFor(() => expect(onCommit).toHaveBeenCalledTimes(1));
    const committed = onCommit.mock.calls[0]![0] as RichDoc;
    expect(committed.version).toBe(1);
    expect(richToPlain(committed)).toBe('Texto de prueba');
    // segundo blur no vuelve a comitear (un commit por gesto)
    fireEvent.blur(el);
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it('Escape → onDiscard, sin onCommit', async () => {
    const { el, onCommit, onDiscard } = await mountEditor();
    fireEvent.keyDown(el, { key: 'Escape' });
    await waitFor(() => expect(onDiscard).toHaveBeenCalledTimes(1));
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('registra y limpia el editor activo con el foco', async () => {
    const { el } = await mountEditor();
    fireEvent.focus(el);
    await waitFor(() => expect(getActiveRichEditor()?.ownerId).toBe('texto'));
    fireEvent.blur(el);
    await waitFor(() => expect(getActiveRichEditor()).toBeNull());
  });
});
