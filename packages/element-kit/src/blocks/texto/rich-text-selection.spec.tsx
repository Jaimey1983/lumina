import { render, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Editor } from '@tiptap/core';
import type { RichDoc } from '@lumina/types/rich-text';
import {
  applyTypographyToSelection,
  applyHeadingLevelToSelection,
  getActiveRichEditor,
  registerActiveRichEditor,
  pmDocToRich,
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

  it('selección vacía → aplica el estilo al NODO de todo el documento (no a marcas)', async () => {
    const editor = await mountAndGetEditor('sin selección');
    editor.commands.setTextSelection({ from: 3, to: 3 });
    expect(applyTypographyToSelection(editor, { fontWeight: 'bold' })).toBe(true);
    // No es una marca de rango: es atributo del nodo `paragraph`.
    expect(editor.isActive('bold')).toBe(false);
    expect(editor.getAttributes('paragraph').bold).toBe(true);
  });

  it('selección vacía + color/tamaño → atributos del nodo, no textStyle', async () => {
    const editor = await mountAndGetEditor('bloque entero');
    editor.commands.setTextSelection({ from: 3, to: 3 });
    applyTypographyToSelection(editor, { color: '#0000ff', fontSize: 30 });
    const a = editor.getAttributes('paragraph');
    expect(a.color).toBe('#0000ff');
    expect(a.fontSize).toBe(30);
    expect(editor.getAttributes('textStyle').color).toBeUndefined();
  });

  it('cambiar a un nivel de encabezado con cursor colapsado convierte todo el bloque', async () => {
    const editor = await mountAndGetEditor('Mi título');
    editor.commands.setTextSelection({ from: 3, to: 3 });
    applyHeadingLevelToSelection(editor, 1);
    expect(editor.isActive('heading', { level: 1 })).toBe(true);
    // Cuerpo → H1 escribe la escala en el nodo (40 / bold), no espera CSS.
    expect(editor.getAttributes('heading').fontSize).toBe(40);
    expect(editor.getAttributes('heading').bold).toBe(true);
  });

  it('un tamaño manual distinto de la escala se respeta al cambiar de nivel', async () => {
    const editor = await mountAndGetEditor('Texto');
    editor.commands.setTextSelection({ from: 1, to: 6 });
    applyTypographyToSelection(editor, { fontSize: 30 }); // marca de rango
    editor.commands.setTextSelection({ from: 3, to: 3 });
    // aplica tamaño 55 al nodo (no escala de ningún nivel)
    applyTypographyToSelection(editor, { fontSize: 55 });
    applyHeadingLevelToSelection(editor, 2);
    expect(editor.getAttributes('heading').fontSize).toBe(55);
  });

  it('sangría de primera línea / francesa sobrevive getJSON → RichDoc', async () => {
    const editor = await mountAndGetEditor('párrafo de prueba');
    editor.chain().focus().updateAttributes('paragraph', { textIndent: 1.5 }).run();
    expect(pmDocToRich(editor.getJSON() as never).nodes[0]?.textIndent).toBe(1.5);
    editor.chain().focus().updateAttributes('paragraph', { textIndent: -1.5 }).run();
    expect(pmDocToRich(editor.getJSON() as never).nodes[0]?.textIndent).toBe(-1.5);
  });

  it('<BubbleToolbar> monta sin romper con un editor', async () => {
    const editor = await mountAndGetEditor('texto');
    const { container } = render(<BubbleToolbar editor={editor} />);
    // en jsdom coordsAtPos no da geometría → la barra puede no renderizar, pero no lanza
    expect(container).toBeDefined();
  });
});
