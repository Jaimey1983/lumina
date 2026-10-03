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

  it('texto sin tokens: un <p> con saltos en el span interno, no en el bloque', () => {
    const { container } = render(<RenderText block={block('Hola mundo')} modo="viewer" />);
    const p = container.querySelector('p') as HTMLElement;
    expect(p.style.margin).toBe('0px');
    expect(p.style.whiteSpace).toBe('');
    const inner = p.querySelector('[data-rich-ws]') as HTMLElement;
    expect(inner.style.whiteSpace).toBe('pre-wrap');
    expect(inner.textContent).toBe('Hola mundo');
  });

  describe('N4 — variables de clase {{var:id}}', () => {
    const defs = [{ id: 'v1', nombre: 'intentos', tipo: 'numero', valorInicial: 0 }] as const;

    it('muestra el valor vivo y lo actualiza al cambiar', () => {
      const conValor = (n: number) => (
        <TextTokensProvider value={{ variables: { defs, valores: { v1: n } } }}>
          <RenderText block={block('Llevas {{var:v1}} intentos')} modo="viewer" />
        </TextTokensProvider>
      );
      const r = render(conValor(2));
      expect(r.container.textContent).toBe('Llevas 2 intentos');
      r.rerender(conValor(5));
      expect(r.container.textContent).toBe('Llevas 5 intentos');
    });

    it('sin valores vivos muestra el inicial (presentación / clase en vivo)', () => {
      const out = html(
        <TextTokensProvider value={{ variables: { defs } }}>
          <RenderText block={block('{{var:v1}}')} modo="viewer" />
        </TextTokensProvider>,
      );
      expect(out).toContain('0');
      expect(out).not.toContain('{{var:');
    });

    it('variable inexistente → vacío, nunca el token crudo; el editor deja el token', () => {
      expect(html(<RenderText block={block('a{{var:zz}}b')} modo="viewer" />)).not.toContain('{{var:');
      expect(html(<RenderText block={block('a{{var:zz}}b')} modo="editor" />)).toContain('{{var:zz}}');
    });

    it('un valor con HTML se pinta como texto', () => {
      const { container } = render(
        <TextTokensProvider value={{ variables: { defs: [{ id: 'n', nombre: 'n', tipo: 'texto', valorInicial: '' }], valores: { n: '<b>x</b>' } } }}>
          <RenderText block={block('{{var:n}}')} modo="viewer" />
        </TextTokensProvider>,
      );
      expect(container.querySelector('b')).toBeNull();
      expect(container.textContent).toBe('<b>x</b>');
    });
  });
});
