import { render, waitFor, fireEvent, cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RichDoc } from '@lumina/types/rich-text';
import {
  richToPlain,
  pmDocToRich,
  getActiveRichEditor,
  registerActiveRichEditor,
  RichTextAiProvider,
} from '@lumina/editor-shared/rich-text';
import { AiAssistPanel } from '@lumina/editor-shared/rich-text/ai-assist-panel';
import { RichTextEditor } from '@lumina/editor-shared/rich-text/rich-text-editor';

afterEach(() => {
  cleanup();
  registerActiveRichEditor(null);
});

const doc = (text: string): RichDoc => ({
  version: 1,
  nodes: [{ type: 'paragraph', runs: [{ text }] }],
});

async function mountEditorSelect(from: number, to: number) {
  render(<RichTextEditor value={doc('hola mundo cruel')} onCommit={vi.fn()} onDiscard={vi.fn()} />);
  const el = await waitFor(() => {
    const n = document.querySelector('.lumina-rich-editor');
    if (!n) throw new Error('no montado');
    return n as HTMLElement;
  });
  fireEvent.focus(el);
  const editor = getActiveRichEditor()!.editor;
  editor.commands.setTextSelection({ from, to });
  return editor;
}

// El posicionamiento flotante de la barra usa `coordsAtPos`, que jsdom no
// implementa (→ `test:visual`). Aquí se prueba el panel de IA directamente.
describe('IA sobre la selección (Fase 4) — <AiAssistPanel>', () => {
  it('acción → asistente devuelve texto → Aceptar sustituye el rango seleccionado', async () => {
    const editor = await mountEditorSelect(1, 5); // "hola"
    const assist = vi.fn().mockResolvedValue('adiós');
    const onClose = vi.fn();

    render(
      <RichTextAiProvider value={{ assist, settingsHref: '/profile' }}>
        <AiAssistPanel editor={editor} onClose={onClose} />
      </RichTextAiProvider>,
    );

    fireEvent.click(screen.getByText('Mejorar redacción'));
    await waitFor(() => expect(assist).toHaveBeenCalledWith('hola', 'mejorar'));

    fireEvent.click(await screen.findByText('Aceptar'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(richToPlain(pmDocToRich(editor.getJSON() as never))).toBe('adiós mundo cruel');
  });

  it('Descartar no toca el editor', async () => {
    const editor = await mountEditorSelect(1, 5);
    render(
      <RichTextAiProvider value={{ assist: vi.fn().mockResolvedValue('x'), settingsHref: '/p' }}>
        <AiAssistPanel editor={editor} onClose={vi.fn()} />
      </RichTextAiProvider>,
    );
    fireEvent.click(screen.getByText('Acortar'));
    fireEvent.click(await screen.findByText('Descartar'));
    expect(richToPlain(pmDocToRich(editor.getJSON() as never))).toBe('hola mundo cruel');
  });

  it('error del proveedor → mensaje + enlace a configurar la clave', async () => {
    const editor = await mountEditorSelect(1, 5);
    render(
      <RichTextAiProvider value={{ assist: vi.fn().mockRejectedValue(new Error('boom')), settingsHref: '/profile' }}>
        <AiAssistPanel editor={editor} onClose={vi.fn()} />
      </RichTextAiProvider>,
    );
    fireEvent.click(screen.getByText('Corregir ortografía'));
    expect(await screen.findByText(/no se pudo completar/i)).not.toBeNull();
    const link = screen.getByText('Configurar clave de IA');
    expect(link.getAttribute('href')).toBe('/profile');
  });

  it('sin proveedor el panel no renderiza nada', async () => {
    const editor = await mountEditorSelect(1, 5);
    const { container } = render(<AiAssistPanel editor={editor} onClose={vi.fn()} />);
    expect(container.textContent).toBe('');
  });
});
