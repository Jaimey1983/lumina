import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { TextBlock } from '@lumina/types/slide';
import { SlideNavContext } from '@lumina/editor-shared/slide-nav-context';
import { TextTokensProvider } from '@lumina/editor-shared/rich-text';
import { RenderText } from './render-texto.js';

const block = (contenido: string): TextBlock => ({ tipo: 'texto', contenido });

function html(node: React.ReactElement) {
  return render(node).container.innerHTML;
}

describe('RenderText — tokens {{…}} (Fase 5A)', () => {
  it('en viewer resuelve built-ins y tokens de clase; deja los desconocidos', () => {
    const out = html(
      <SlideNavContext.Provider value={{ navigate: null, slideIndex: 2, slideCount: 7 }}>
        <TextTokensProvider value={{ extra: { docente: 'Ana Ruiz' } }}>
          <RenderText
            block={block('Diapositiva {{n_slide}}/{{total_slides}} — {{docente}} — {{x}}')}
            modo="viewer"
          />
        </TextTokensProvider>
      </SlideNavContext.Provider>,
    );
    expect(out).toContain('Diapositiva 3/7 — Ana Ruiz — {{x}}');
  });

  it('en el editor los tokens quedan literales', () => {
    const out = html(
      <SlideNavContext.Provider value={{ navigate: null, slideIndex: 2, slideCount: 7 }}>
        <RenderText block={block('slide {{n_slide}}')} modo="editor" />
      </SlideNavContext.Provider>,
    );
    expect(out).toContain('slide {{n_slide}}');
  });

  it('sin proveedor de contexto no rompe (tokens de posición quedan literales)', () => {
    const out = html(<RenderText block={block('slide {{n_slide}} · {{fecha}}')} modo="viewer" />);
    expect(out).toContain('{{n_slide}}'); // slideCount = 0 → literal
    expect(out).not.toContain('{{fecha}}'); // fecha built-in siempre resuelve
  });

  it('texto sin tokens: DOM idéntico a antes', () => {
    const plain = html(<RenderText block={block('Hola mundo')} modo="viewer" />);
    expect(plain).toBe('<p style="margin: 0px; white-space: pre-wrap; word-break: break-word;">Hola mundo</p>');
  });
});
