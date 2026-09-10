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
  const utils = render(
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
  return { el, onCommit, onDiscard, unmount: utils.unmount };
}

describe('RichTextEditor (Fase 2B)', () => {
  it('monta un contenteditable en español con el contenido inicial', async () => {
    const { el } = await mountEditor({ value: doc('Contenido inicial') });
    expect(el.getAttribute('contenteditable')).toBe('true');
    expect(el.getAttribute('lang')).toBe('es');
    expect(el.getAttribute('role')).toBe('textbox');
    expect(el.textContent).toContain('Contenido inicial');
  });

  it('blur ambiguo (sin relatedTarget) NO comitea — no expulsa al usuario', async () => {
    const { el, onCommit } = await mountEditor({ value: doc('Texto de prueba') });
    fireEvent.blur(el); // relatedTarget nulo → gesto de selección / re-render
    await new Promise((r) => setTimeout(r, 20));
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('blur hacia un elemento real fuera → un único onCommit equivalente', async () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    const { el, onCommit } = await mountEditor({ value: doc('Texto de prueba') });
    fireEvent.blur(el, { relatedTarget: outside });
    await waitFor(() => expect(onCommit).toHaveBeenCalledTimes(1));
    const committed = onCommit.mock.calls[0]![0] as RichDoc;
    expect(committed.version).toBe(1);
    expect(richToPlain(committed)).toBe('Texto de prueba');
    fireEvent.blur(el, { relatedTarget: outside });
    expect(onCommit).toHaveBeenCalledTimes(1); // un commit por gesto
    outside.remove();
  });

  it('desmontar (cambio de slide / bloque) comitea la edición pendiente', async () => {
    const { onCommit, unmount } = await mountEditor({ value: doc('pendiente') });
    unmount();
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(richToPlain(onCommit.mock.calls[0]![0] as RichDoc)).toBe('pendiente');
  });

  it('Escape → onDiscard, sin onCommit', async () => {
    const { el, onCommit, onDiscard } = await mountEditor();
    fireEvent.keyDown(el, { key: 'Escape' });
    await waitFor(() => expect(onDiscard).toHaveBeenCalledTimes(1));
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('registra el editor activo con el foco; un blur ambiguo lo mantiene', async () => {
    const { el } = await mountEditor();
    fireEvent.focus(el);
    await waitFor(() => expect(getActiveRichEditor()?.ownerId).toBe('texto'));
    // Blur sin relatedTarget: el editor sigue vivo (panel / barra flotante) →
    // sigue registrado para que el inspector aplique formato al rango.
    fireEvent.blur(el);
    await new Promise((r) => setTimeout(r, 20));
    expect(getActiveRichEditor()?.ownerId).toBe('texto');
  });

  it('limpia el editor activo al desmontar', async () => {
    const { el, unmount } = await mountEditor();
    fireEvent.focus(el);
    await waitFor(() => expect(getActiveRichEditor()?.ownerId).toBe('texto'));
    unmount();
    expect(getActiveRichEditor()).toBeNull();
  });
});
