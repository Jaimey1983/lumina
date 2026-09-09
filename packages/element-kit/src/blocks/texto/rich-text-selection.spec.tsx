import { render, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Editor } from '@tiptap/core';
import type { RichDoc } from '@lumina/types/rich-text';
import {
  applyTypographyToSelection,
  getActiveRichEditor,
  registerActiveRichEditor,
} from '@lumina/editor-shared/rich-text';
import { RichTextEditor } from '@lumina/editor-shared/rich-text/rich-text-editor';
import { BubbleToolbar } from '@lumina/editor-shared/rich-text/bubble-toolbar';

afterEach(() => {
  cleanup();
  registerActiveRichEditor(null);
});

const doc = (text: string): RichDoc => ({
  version: 1,
  nodes: [{ type: 'paragraph', runs: [{ text }] }],
});

async function mountAndGetEditor(text = 'Hola mundo cruel'): Promise<Editor> {
  render(<RichTextEditor value={doc(text)} onCommit={vi.fn()} onDiscard={vi.fn()} />);
  const el = await waitFor(() => {
    const n = document.querySelector('.lumina-rich-editor');
    if (!n) throw new Error('no montado');
    return n as HTMLElement;
  });
  fireEvent.focus(el);
  const editor = await waitFor(() => {
    const e = getActiveRichEditor()?.editor;
    if (!e) throw new Error('sin editor activo');
    return e;
  });
  return editor;
}

/** Selecciona el rango de caracteres [start, end) del texto plano del primer párrafo. */
function selectRange(editor: Editor, start: number, end: number) {
  editor.commands.setTextSelection({ from: start + 1, to: end + 1 }); // +1: offset del nodo doc
}

describe('Formato por selección (Fase 2C/2D — resuelve P1)', () => {
  it('aplicar negrita al rango sólo marca ese rango, no todo el bloque', async () => {
    const editor = await mountAndGetEditor('Hola mundo cruel');
    selectRange(editor, 5, 10); // "mundo"
    applyTypographyToSelection(editor, { fontWeight: 'bold' });

    expect(editor.isActive('bold')).toBe(true);
    // fuera del rango no hay negrita
    editor.commands.setTextSelection({ from: 1, to: 5 });
    expect(editor.isActive('bold')).toBe(false);

    const json = editor.getJSON();
    const runs = (json.content?.[0]?.content ?? []) as { text?: string; marks?: { type: string }[] }[];
    const bolded = runs.filter((r) => r.marks?.some((m) => m.type === 'bold')).map((r) => r.text);
    expect(bolded).toEqual(['mundo']);
  });

  it('color y tamaño se aplican como un único textStyle al rango', async () => {
    const editor = await mountAndGetEditor('rojo grande');
    selectRange(editor, 0, 4); // "rojo"
    applyTypographyToSelection(editor, { color: '#ff0000', fontSize: 28 });

    const attrs = editor.getAttributes('textStyle');
    expect(attrs.color).toBe('#ff0000');
    expect(attrs.fontSize).toBe('28px');
  });

  it('selección vacía → no aplica nada', async () => {
    const editor = await mountAndGetEditor('sin selección');
    editor.commands.setTextSelection({ from: 3, to: 3 });
    expect(applyTypographyToSelection(editor, { fontWeight: 'bold' })).toBe(false);
    expect(editor.isActive('bold')).toBe(false);
  });

  it('<BubbleToolbar> monta sin romper con un editor', async () => {
    const editor = await mountAndGetEditor('texto');
    const { container } = render(<BubbleToolbar editor={editor} />);
    // en jsdom coordsAtPos no da geometría → la barra puede no renderizar, pero no lanza
    expect(container).toBeDefined();
  });
});
