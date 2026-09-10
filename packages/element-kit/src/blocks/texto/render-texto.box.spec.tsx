import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { TextBlock } from '@lumina/types/slide';
import { RenderText } from './render-texto.js';

const block = (extra: Partial<TextBlock>): TextBlock => ({ tipo: 'texto', contenido: 'Hola', ...extra });

describe('RenderText — caja del bloque (Fase 5A)', () => {
  it('sin props de caja: DOM idéntico (sin envoltorio)', () => {
    const out = render(<RenderText block={block({})} modo="viewer" />).container.innerHTML;
    expect(out).toBe(
      '<p style="margin: 0px; white-space: pre-wrap; word-break: break-word;">Hola</p>',
    );
  });

  it('con relleno + borde: se añade <div> de caja alrededor del <p>', () => {
    const { container } = render(
      <RenderText
        block={block({ relleno: 16, borde: { color: '#2563eb', grosor: 2, radio: 8 } })}
        modo="viewer"
      />,
    );
    const box = container.firstElementChild as HTMLElement;
    expect(box.tagName).toBe('DIV');
    expect(box.style.padding).toBe('16px');
    expect(box.style.border).toBe('2px solid rgb(37, 99, 235)');
    expect(box.querySelector('p')?.textContent).toBe('Hola');
  });

  it('alineación vertical → flex + justify-content en la caja', () => {
    const { container } = render(
      <RenderText block={block({ alineacionVertical: 'abajo' })} modo="viewer" />,
    );
    const box = container.firstElementChild as HTMLElement;
    expect(box.style.display).toBe('flex');
    expect(box.style.justifyContent).toBe('flex-end');
  });

  it('columnas + medidaMax → estilo en el <p>, sin envoltorio', () => {
    const { container } = render(
      <RenderText block={block({ columnas: 2, columnasBrecha: 20, medidaMax: 60 })} modo="viewer" />,
    );
    const p = container.querySelector('p') as HTMLElement;
    expect(p.style.columnCount).toBe('2');
    expect(p.style.columnGap).toBe('20px');
    expect(p.style.maxWidth).toBe('60ch');
    expect(container.firstElementChild?.tagName).toBe('P'); // sin <div> de caja
  });

  it('fondoTexto + fondoTextoOpacidad → backgroundColor rgba', () => {
    const { container } = render(
      <RenderText block={block({ fondoTexto: '#facc15', fondoTextoOpacidad: 35 })} modo="viewer" />,
    );
    expect((container.querySelector('p') as HTMLElement).style.backgroundColor).toBe(
      'rgba(250, 204, 21, 0.35)',
    );
  });

  it('contorno → -webkit-text-stroke en el <p>', () => {
    const { container } = render(
      <RenderText block={block({ contorno: { color: '#000000', grosor: 2 } })} modo="viewer" />,
    );
    const p = container.querySelector('p') as HTMLElement;
    expect(p.style.getPropertyValue('-webkit-text-stroke')).toBe('2px #000000');
  });

  it('degradado → linear-gradient + background-clip:text + color transparente', () => {
    const { container } = render(
      <RenderText
        block={block({ degradado: { desde: '#6366f1', hasta: '#ec4899', angulo: 45 } })}
        modo="viewer"
      />,
    );
    const p = container.querySelector('p') as HTMLElement;
    expect(p.style.backgroundImage).toBe('linear-gradient(45deg, #6366f1, #ec4899)');
    // `-webkit-background-clip` no lo refleja la CSSOM de jsdom; el valor se asevera
    // directo sobre `textBlockDecorCss` en editor-shared/text-box.spec.ts.
    expect(p.style.color).toBe('transparent');
  });
});
