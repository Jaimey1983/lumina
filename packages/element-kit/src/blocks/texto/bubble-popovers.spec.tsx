import { render, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Editor } from '@tiptap/core';
import type { RichDoc } from '@lumina/types/rich-text';
import {
  getActiveRichEditor,
  registerActiveRichEditor,
} from '@lumina/editor-shared/rich-text';
import { RichTextEditor } from '@lumina/editor-shared/rich-text/rich-text-editor';
import {
  LinkPopover,
  SlideRefPopover,
  CodeBlockPopover,
} from '@lumina/editor-shared/rich-text/bubble-popovers';

afterEach(() => {
  cleanup();
  registerActiveRichEditor(null);
});

const doc = (text: string): RichDoc => ({
  version: 1,
  nodes: [{ type: 'paragraph', runs: [{ text }] }],
});

async function mountEditor(text = 'Hola mundo cruel'): Promise<Editor> {
  render(<RichTextEditor value={doc(text)} onCommit={vi.fn()} onDiscard={vi.fn()} />);
  const el = await waitFor(() => {
    const n = document.querySelector('.lumina-rich-editor');
    if (!n) throw new Error('no montado');
    return n as HTMLElement;
  });
  fireEvent.focus(el);
  return waitFor(() => {
    const e = getActiveRichEditor()?.editor;
    if (!e) throw new Error('sin editor activo');
    return e;
  });
}

const btn = (root: HTMLElement, text: string): HTMLButtonElement => {
  const b = [...root.querySelectorAll('button')].find((x) => x.textContent === text);
  if (!b) throw new Error(`sin botón "${text}"`);
  return b as HTMLButtonElement;
};

describe('BubblePopovers (Fase 6 — sin window.prompt)', () => {
  it('LinkPopover: escribir URL + Aplicar pone la marca link en la selección', async () => {
    const editor = await mountEditor('Hola mundo cruel');
    editor.commands.setTextSelection({ from: 6, to: 11 }); // "mundo"
    const onClose = vi.fn();
    const { container } = render(
      <LinkPopover editor={editor} pos={{ top: 0, left: 0 }} onClose={onClose} />,
    );
    fireEvent.change(container.querySelector('input')!, {
      target: { value: 'https://lumina.edu' },
    });
    fireEvent.click(btn(container, 'Aplicar'));
    expect(onClose).toHaveBeenCalled();
    editor.commands.setTextSelection({ from: 7, to: 8 });
    expect(editor.getAttributes('link').href).toBe('https://lumina.edu');
  });

  it('LinkPopover: una URL insegura no aplica', async () => {
    const editor = await mountEditor('texto');
    editor.commands.setTextSelection({ from: 1, to: 6 });
    const { container } = render(
      <LinkPopover editor={editor} pos={{ top: 0, left: 0 }} onClose={vi.fn()} />,
    );
    fireEvent.change(container.querySelector('input')!, {
      target: { value: 'javascript:alert(1)' },
    });
    fireEvent.click(btn(container, 'Aplicar'));
    editor.commands.setTextSelection({ from: 2, to: 3 });
    expect(editor.getAttributes('link').href).toBeUndefined();
  });

  it('SlideRefPopover: número → marca link con slideRef', async () => {
    const editor = await mountEditor('ver mas');
    editor.commands.setTextSelection({ from: 1, to: 4 });
    const { container } = render(
      <SlideRefPopover editor={editor} pos={{ top: 0, left: 0 }} onClose={vi.fn()} />,
    );
    fireEvent.change(container.querySelector('input')!, { target: { value: '5' } });
    fireEvent.click(btn(container, 'Aplicar'));
    editor.commands.setTextSelection({ from: 2, to: 3 });
    expect(editor.getAttributes('link').slideRef).toBe(5);
  });

  it('CodeBlockPopover: elegir lenguaje inserta un codeBlock con `language`', async () => {
    const editor = await mountEditor('const x = 1');
    editor.commands.setTextSelection({ from: 1, to: 6 });
    const { container } = render(
      <CodeBlockPopover editor={editor} pos={{ top: 0, left: 0 }} onClose={vi.fn()} />,
    );
    fireEvent.change(container.querySelector('select')!, { target: { value: 'python' } });
    fireEvent.click(btn(container, 'Insertar'));
    expect(editor.isActive('codeBlock')).toBe(true);
    expect(editor.getAttributes('codeBlock').language).toBe('python');
  });

  it('Escape cierra el popover', async () => {
    const editor = await mountEditor('x');
    const onClose = vi.fn();
    const { container } = render(
      <LinkPopover editor={editor} pos={{ top: 0, left: 0 }} onClose={onClose} />,
    );
    fireEvent.keyDown(container.querySelector('[role="dialog"]')!, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
