import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TextBlock } from '@lumina/types/slide';
import { TextoProperties } from './texto-properties.js';

afterEach(() => cleanup());

function block(extra: Partial<TextBlock> = {}): TextBlock {
  return { tipo: 'texto', contenido: 'Hola', ...extra };
}

describe('TextoProperties — "Estilo" no acopla "Nivel" (regresión)', () => {
  it('un clic en "Estilo" no toca el Nivel del bloque', () => {
    let current = block({ nivel: 2, tamanoFuente: '32px' });
    const onChange = vi.fn((next: TextBlock) => {
      current = next;
    });
    render(<TextoProperties block={current} onChange={onChange} />);

    // "Título"/"Cuerpo"/"Pie" existen dos veces (Estilo y Estilo de tema) —
    // el primero en el DOM es siempre el de "Estilo" (se renderiza antes).
    fireEvent.click(screen.getAllByRole('button', { name: 'Cuerpo' })[0]!);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(current.nivel).toBe(2); // "Estilo" no debe demover/forzar el nivel
  });

  it('el tamaño de un "Estilo" no queda congelado frente a un cambio de "Nivel" posterior', () => {
    // Antes de este fix: applyTypographyToTextBlock marcaba
    // tamanoFuenteManual:true para CUALQUIER patch con fontSize, incluido el
    // bundle de "Estilo" (que trae fontSize + 6 claves más) — un cambio de
    // Nivel después nunca volvía a reescalar el tamaño.
    let current = block({ nivel: 2, tamanoFuente: '26px' });
    const onChange = vi.fn((next: TextBlock) => {
      current = next;
    });
    const { rerender } = render(<TextoProperties block={current} onChange={onChange} />);

    fireEvent.click(screen.getAllByRole('button', { name: 'Título' })[0]!); // Estilo → 32px, bundle
    expect(current.tamanoFuenteManual).toBe(false); // preset del sistema, no un tecleo manual
    rerender(<TextoProperties block={current} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'H1' })); // Nivel → H1
    expect(current.nivel).toBe(1);
    expect(current.tamanoFuente).toBe('40px'); // reescalado a la escala de H1, no congelado en 32px
  });

  it('el input "Tamaño (px)" sí marca tamanoFuenteManual:true (y por lo tanto SÍ se respeta frente a Nivel)', () => {
    let current = block({ nivel: undefined, tamanoFuente: '18px' });
    const onChange = vi.fn((next: TextBlock) => {
      current = next;
    });
    const { rerender } = render(<TextoProperties block={current} onChange={onChange} />);

    const sizeInput = screen.getByLabelText('Tamaño de fuente en píxeles');
    fireEvent.focus(sizeInput);
    fireEvent.change(sizeInput, { target: { value: '22' } });
    fireEvent.blur(sizeInput);

    expect(current.tamanoFuente).toBe('22px');
    expect(current.tamanoFuenteManual).toBe(true);
    rerender(<TextoProperties block={current} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'H2' })); // Nivel → H2
    expect(current.nivel).toBe(2);
    expect(current.tamanoFuente).toBe('22px'); // el tamaño manual se respeta
  });
});
