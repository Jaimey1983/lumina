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

  it('blur hacia fuera SIN cambios → cierra la sesión, no persiste', async () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    const { el, onCommit, onDiscard } = await mountEditor({ value: doc('Texto de prueba') });
    fireEvent.blur(el, { relatedTarget: outside });
    await waitFor(() => expect(onDiscard).toHaveBeenCalledTimes(1));
    expect(onCommit).not.toHaveBeenCalled();
    outside.remove();
  });

  it('blur hacia fuera CON cambios → un único onCommit', async () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    const { el, onCommit } = await mountEditor({ value: doc('Texto de prueba') });
    fireEvent.focus(el);
    await waitFor(() => expect(getActiveRichEditor()?.editor).toBeTruthy());
    getActiveRichEditor()!.editor.commands.insertContent(' extra');
    fireEvent.blur(el, { relatedTarget: outside });
    await waitFor(() => expect(onCommit).toHaveBeenCalledTimes(1));
    expect(richToPlain(onCommit.mock.calls[0]![0] as RichDoc)).toContain('Texto de prueba');
    fireEvent.blur(el, { relatedTarget: outside });
    expect(onCommit).toHaveBeenCalledTimes(1);
    outside.remove();
  });

  it('desmontar SIN cambios no persiste', async () => {
    const { onCommit, onDiscard, unmount } = await mountEditor({ value: doc('pendiente') });
    unmount();
    expect(onCommit).not.toHaveBeenCalled();
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it('desmontar CON cambios comitea la edición pendiente', async () => {
    const { el, onCommit, unmount } = await mountEditor({ value: doc('pendiente') });
    fireEvent.focus(el);
    await waitFor(() => expect(getActiveRichEditor()?.editor).toBeTruthy());
    getActiveRichEditor()!.editor.commands.insertContent(' x');
    unmount();
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(richToPlain(onCommit.mock.calls[0]![0] as RichDoc)).toContain('pendiente');
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
