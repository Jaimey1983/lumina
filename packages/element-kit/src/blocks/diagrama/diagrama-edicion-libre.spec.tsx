import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizarEscena, type Escena } from '@lumina/drawing';
import type { Block, DiagramaBlock, DiagramaGrafoBlock, DiagramaVennBlock } from '@lumina/types/slide';
import { createDefaultFlujoBlock, createDefaultVennBlock, normalizeDiagramaBlock } from './diagrama-defaults.js';
import { diagramaAEscena } from './diagrama-escena.js';
import { DiagramaEditor } from './diagrama-editor.js';
import { DiagramaProperties } from './diagrama-properties.js';
import { DiagramaViewer } from './diagrama-viewer.js';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const flujo = (): DiagramaGrafoBlock => createDefaultFlujoBlock();
const conEscena = (b: DiagramaBlock = flujo()): DiagramaBlock => ({ ...b, escena: diagramaAEscena(b) as unknown as DiagramaBlock['escena'] }) as DiagramaBlock;

/** `applyNow` de prueba: guarda las funciones recibidas y permite aplicarlas al bloque. */
function montarPropiedades(block: DiagramaBlock) {
  const aplicadas: Array<(b: Block) => Block> = [];
  const applyNow = vi.fn(async (fn: (b: Block) => Block) => {
    aplicadas.push(fn);
  });
  const vista = render(<DiagramaProperties block={block} applyNow={applyNow} />);
  return { applyNow, aplicadas, ...vista, resultado: (i = aplicadas.length - 1) => aplicadas[i]?.(block as unknown as Block) as unknown as DiagramaBlock };
}

describe('normalizeDiagramaBlock con escena', () => {
  it('conserva la escena, ya normalizada, en grafos y en Venn', () => {
    const e = diagramaAEscena(flujo());
    const g = normalizeDiagramaBlock({ ...flujo(), escena: e });
    expect(g.escena).toEqual(e);
    const v = normalizeDiagramaBlock({ ...createDefaultVennBlock(), escena: { elementos: [{ tipo: 'forma', id: 'a' }] } });
    expect((v.escena as unknown as Escena).elementos).toHaveLength(1);
    expect((v.escena as unknown as Escena).elementos[0]?.id).toBe('a');
  });

  it('descarta lo que no es una escena y deja el diagrama como siempre', () => {
    for (const basura of ['texto', 42, null, [], true]) {
      expect('escena' in normalizeDiagramaBlock({ ...flujo(), escena: basura })).toBe(false);
    }
  });

  it('es idempotente y no toca los nodos ni las aristas originales', () => {
    const b = conEscena();
    const una = normalizeDiagramaBlock(b);
    expect(normalizeDiagramaBlock(una)).toEqual(una);
    expect((una as DiagramaGrafoBlock).nodos).toEqual((b as DiagramaGrafoBlock).nodos);
    expect((una as DiagramaGrafoBlock).aristas).toEqual((b as DiagramaGrafoBlock).aristas);
  });

  it('un bloque sin escena sigue sin tener la clave (paridad con el comportamiento anterior)', () => {
    expect('escena' in normalizeDiagramaBlock(flujo())).toBe(false);
  });
});

describe('Viewer', () => {
  it('con escena se ve el dibujo: una forma por nodo y un conector por arista', () => {
    const b = conEscena();
    const { container } = render(<DiagramaViewer block={b} />);
    const esperados = (b.escena as unknown as Escena).elementos.length;
    expect(container.querySelectorAll('[data-elemento-id]')).toHaveLength(esperados);
    expect(esperados).toBe((flujo() as DiagramaGrafoBlock).nodos.length + (flujo() as DiagramaGrafoBlock).aristas.length);
    expect(screen.getByRole('region', { name: b.titulo ?? 'Diagrama' })).toBeTruthy();
  });

  it('muestra el título y conserva la descripción para lectores de pantalla', () => {
    const b = { ...conEscena(), titulo: 'Mi proceso', descripcionAccesible: 'Cuenta el proceso' } as DiagramaBlock;
    render(<DiagramaViewer block={b} />);
    expect(screen.getByText('Mi proceso', { selector: 'figcaption' })).toBeTruthy();
    expect(screen.getByText('Cuenta el proceso')).toBeTruthy();
  });

  it('una escena inválida no rompe el viewer', () => {
    const b = { ...flujo(), escena: { basura: true } } as unknown as DiagramaBlock;
    expect(() => render(<DiagramaViewer block={b} />)).not.toThrow();
  });
});

describe('Editor en el slide', () => {
  it('con escena: un clic selecciona el bloque y un doble clic abre el editor', () => {
    const seleccionar = vi.fn();
    const { container } = render(<DiagramaEditor block={conEscena()} onEnsureBlockSelected={seleccionar} onChange={() => undefined} />);
    const figura = container.querySelector('[data-diagrama-escena]') as Element;
    fireEvent.click(figura);
    expect(seleccionar).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.doubleClick(figura);
    expect(screen.getByRole('dialog', { name: /Editor de dibujo/ })).toBeTruthy();
  });

  it('cada cambio hecho en el editor llega al bloque conservando todo lo demás', () => {
    const onChange = vi.fn();
    const b = conEscena();
    const { container } = render(<DiagramaEditor block={b} onChange={onChange} />);
    fireEvent.doubleClick(container.querySelector('[data-diagrama-escena]') as Element);
    const lienzo = screen.getByRole('application', { name: 'Lienzo de dibujo' });
    fireEvent.keyDown(lienzo, { key: 'Tab' });
    fireEvent.keyDown(lienzo, { key: 'ArrowRight', shiftKey: true });
    expect(onChange).toHaveBeenCalledTimes(1);
    const nuevo = onChange.mock.calls[0]?.[0] as DiagramaGrafoBlock;
    expect(nuevo).toMatchObject({ id: b.id, subtipo: 'flujo', titulo: b.titulo });
    expect(nuevo.nodos).toEqual((b as DiagramaGrafoBlock).nodos);
    expect((nuevo.escena as unknown as Escena).elementos).toHaveLength((b.escena as unknown as Escena).elementos.length);
  });

  it('sin escena sigue siendo el editor de siempre (no hay doble clic de dibujo)', () => {
    const { container } = render(<DiagramaEditor block={flujo()} onChange={() => undefined} />);
    expect(container.querySelector('[data-diagrama-escena]')).toBeNull();
  });
});

describe('Propiedades de un diagrama sin escena', () => {
  it('ofrece «Editar libremente» sin tocar el bloque al abrirlo y cerrarlo', () => {
    const { applyNow } = montarPropiedades(flujo());
    expect(screen.getByText('Edición libre')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Editar libremente' }));
    expect(screen.getByRole('dialog', { name: /Editor de dibujo/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Listo/ }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(applyNow).not.toHaveBeenCalled();
  });

  it('el editor abre con el diagrama ya convertido (una forma por nodo)', () => {
    montarPropiedades(flujo());
    fireEvent.click(screen.getByRole('button', { name: 'Editar libremente' }));
    expect(document.querySelectorAll('[data-dibujo-editor] [data-elemento-id]')).toHaveLength((diagramaAEscena(flujo()) as Escena).elementos.length);
  });

  it('el primer cambio guarda la escena en el bloque y conserva nodos y aristas', () => {
    const { applyNow, resultado } = montarPropiedades(flujo());
    fireEvent.click(screen.getByRole('button', { name: 'Editar libremente' }));
    const lienzo = screen.getByRole('application', { name: 'Lienzo de dibujo' });
    fireEvent.keyDown(lienzo, { key: 'Tab' });
    fireEvent.keyDown(lienzo, { key: 'ArrowDown' });
    expect(applyNow).toHaveBeenCalledTimes(1);
    const guardado = resultado();
    expect(guardado.escena).toBeDefined();
    expect((guardado as DiagramaGrafoBlock).nodos).toEqual(flujo().nodos);
    const e = guardado.escena as unknown as Escena;
    const original = diagramaAEscena(flujo());
    expect(e.elementos.length).toBe(original.elementos.length);
    expect(JSON.stringify(e)).not.toBe(JSON.stringify(original)); // el cambio quedó guardado
  });

  it('solo actualiza el bloque con su mismo id', () => {
    const { aplicadas } = montarPropiedades(flujo());
    fireEvent.click(screen.getByRole('button', { name: 'Editar libremente' }));
    const lienzo = screen.getByRole('application', { name: 'Lienzo de dibujo' });
    fireEvent.keyDown(lienzo, { key: 'Tab' });
    fireEvent.keyDown(lienzo, { key: 'ArrowDown' });
    const otro = { id: 'otro', tipo: 'diagrama' } as unknown as Block;
    expect(aplicadas[0]?.(otro)).toBe(otro);
    const noDiagrama = { id: flujo().id, tipo: 'texto' } as unknown as Block;
    expect(aplicadas[0]?.(noDiagrama)).toBe(noDiagrama);
  });

  it('con Venn también convierte', () => {
    const v: DiagramaVennBlock = createDefaultVennBlock();
    const { applyNow, resultado } = montarPropiedades(v);
    fireEvent.click(screen.getByRole('button', { name: 'Editar libremente' }));
    const lienzo = screen.getByRole('application', { name: 'Lienzo de dibujo' });
    fireEvent.keyDown(lienzo, { key: 'Tab' });
    fireEvent.keyDown(lienzo, { key: 'ArrowRight' });
    expect(applyNow).toHaveBeenCalledTimes(1);
    expect((resultado() as DiagramaVennBlock).elementos).toEqual(v.elementos);
    expect(resultado().escena).toBeDefined();
  });
});

describe('Propiedades de un diagrama con escena', () => {
  it('muestra el panel reducido (sin las opciones clásicas) y ofrece editar', () => {
    montarPropiedades(conEscena());
    expect(document.querySelector('[data-diagrama-panel-escena]')).toBeTruthy();
    expect(screen.queryByText('Auto-Organizar')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Editar libremente' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Editar dibujo/ }));
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('abre el editor con la escena guardada, no con una conversión nueva', () => {
    const b = conEscena();
    const editada = normalizarEscena({ ancho: 500, alto: 300, elementos: [{ tipo: 'forma', id: 'solo' }] });
    montarPropiedades({ ...b, escena: editada as unknown as DiagramaBlock['escena'] } as DiagramaBlock);
    fireEvent.click(screen.getByRole('button', { name: /Editar dibujo/ }));
    expect(document.querySelectorAll('[data-dibujo-editor] [data-elemento-id]')).toHaveLength(1);
  });

  it('editar el título se aplica con una pequeña espera y sin tocar la escena', () => {
    vi.useFakeTimers();
    const b = conEscena();
    const { applyNow, resultado } = montarPropiedades(b);
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Nuevo título' } });
    expect(applyNow).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(applyNow).toHaveBeenCalledTimes(1);
    expect(resultado()).toMatchObject({ titulo: 'Nuevo título' });
    expect(resultado().escena).toEqual(b.escena);
  });

  it('«Volver al diagrama original» pide confirmación y quita solo la escena', () => {
    const b = conEscena();
    const { applyNow, resultado } = montarPropiedades(b);
    fireEvent.click(screen.getByRole('button', { name: /Volver al diagrama original/ }));
    expect(applyNow).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(applyNow).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Volver al diagrama original/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Sí, volver' }));
    expect(applyNow).toHaveBeenCalledTimes(1);
    const vuelto = resultado();
    expect('escena' in vuelto).toBe(false);
    expect((vuelto as DiagramaGrafoBlock).nodos).toEqual((b as DiagramaGrafoBlock).nodos);
    expect(vuelto.titulo).toBe(b.titulo);
  });

  describe('descargar', () => {
    const descargas: Array<{ nombre: string; tipo: string }> = [];
    beforeEach(() => {
      descargas.length = 0;
      URL.createObjectURL = vi.fn((blob: Blob) => {
        descargas.push({ nombre: '', tipo: blob.type });
        return 'blob:prueba';
      });
      URL.revokeObjectURL = vi.fn();
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
        const ultima = descargas.at(-1);
        if (ultima) ultima.nombre = this.download;
      });
    });

    it('el SVG sale con el nombre del título y es un documento SVG válido', async () => {
      montarPropiedades({ ...conEscena(), titulo: 'Mi proceso' } as DiagramaBlock);
      // W10: usa el mismo «Exportar» del editor (formato, tema, fondo y resolución).
      fireEvent.click(document.querySelector('[data-dibujo-exportar]') as Element);
      const panel = document.querySelector('[data-dibujo-exportar-panel]') as HTMLElement;
      fireEvent.click(Array.from(panel.querySelectorAll('button')).find((b) => /Descargar/.test(b.textContent ?? '')) as Element);
      await vi.waitFor(() => expect(descargas).toHaveLength(1));
      expect(descargas[0]).toEqual({ nombre: 'mi-proceso.svg', tipo: 'image/svg+xml;charset=utf-8' });
    });
  });
});
