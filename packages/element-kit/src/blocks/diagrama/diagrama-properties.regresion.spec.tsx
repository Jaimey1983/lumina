// ─── Regresión: panel de propiedades de Diagrama — "desorden" / elementos
// duplicados ───
// Dos problemas reales reportados en producción:
// 1. "Pirámide"/"Embudo"/"Cebolla" aparecían DOS veces en el panel: una vez
//    como botón base en "Tipo de Diagrama" y otra vez como "plantilla
//    pedagógica" ("Pirámide de Bloom"/"Embudo de Proceso"/"Círculos
//    Concéntricos") — pero `handleLoadTemplate` para esos 3 ids llamaba
//    exactamente al mismo `createDefault*Block` que el botón base: cero
//    diferencia real, solo el mismo elemento repetido con otro nombre.
// 2. El panel entero (Tipo de Diagrama + Paleta + Estilo Visual + las 11
//    plantillas) estaba siempre expandido de punta a punta — "un desorden".
//    "Plantillas Pedagógicas" (la sección más larga, de uso ocasional) pasa
//    a ser colapsable, cerrada por defecto.
// 3. "Tipo de Diagrama" (el selector primario) y "Paleta de Colores"
//    (+ Estilo Visual Global) también pasan a colapsables — Tipo abierta por
//    defecto (refleja el estado actual del bloque), Paleta cerrada (uso
//    ocasional, como Plantillas).

import { render, cleanup, screen, fireEvent, act, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DiagramaProperties } from './diagrama-properties.js';
import type { DiagramaBlock, DiagramaGrafoBlock, DiagramaVennBlock } from '@lumina/types/slide';
import {
  createDefaultFlujoBlock,
  createDefaultMapaMentalBlock,
  createDefaultPiramideBlock,
  createDefaultVennBlock,
} from './diagrama-defaults.js';
import { organizarGrafo } from './diagrama-dagre.js';

// La descarga real toca el DOM/canvas del navegador: se reemplaza solo `exportarDiagrama`.
vi.mock('./diagrama-export.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./diagrama-export.js')>()),
  exportarDiagrama: vi.fn(async () => undefined),
}));

import { exportarDiagrama } from './diagrama-export.js';

afterEach(() => {
  cleanup();
});

function renderProperties() {
  const block = createDefaultMapaMentalBlock();
  const applyNow = vi.fn(async () => undefined);
  render(<DiagramaProperties block={block} applyNow={applyNow} />);
}

describe('DiagramaProperties — sin plantillas duplicadas y panel colapsable (regresión)', () => {
  it('"Pirámide"/"Embudo"/"Cebolla" aparecen una sola vez cada uno (solo como Tipo de Diagrama, no también como plantilla)', () => {
    renderProperties();
    // Los botones base de "Tipo de Diagrama" siempre están montados.
    expect(screen.getByText('Pirámide')).toBeTruthy();
    expect(screen.getByText('Embudo')).toBeTruthy();
    expect(screen.getByText('Cebolla')).toBeTruthy();
    // Las versiones "plantilla" (mismo contenido, otro nombre) ya no existen.
    expect(screen.queryByText('Pirámide de Bloom')).toBeNull();
    expect(screen.queryByText('Embudo de Proceso')).toBeNull();
    expect(screen.queryByText('Círculos Concéntricos')).toBeNull();
  });

  it('"Plantillas Pedagógicas" arranca colapsada y se expande al hacer clic', () => {
    renderProperties();
    // Colapsada: el trigger existe, pero el contenido (ej. "Modelo Frayer") no está montado.
    screen.getByText('Plantillas Pedagógicas');
    expect(screen.queryByText('Modelo Frayer')).toBeNull();

    fireEvent.click(screen.getByText('Plantillas Pedagógicas'));
    screen.getByText('Modelo Frayer');
    screen.getByText('Ishikawa');
  });

  it('"Tipo de Diagrama" arranca expandida (selector primario) y se puede colapsar', () => {
    renderProperties();
    // Abierta por defecto: los botones de tipo ya están montados (el badge
    // del trigger también dice "Mapa Mental" — "Organigrama" es unívoco).
    screen.getByText('Organigrama');

    fireEvent.click(screen.getByText('Tipo de Diagrama'));
    expect(screen.queryByText('Organigrama')).toBeNull();
  });

  it('"Paleta de Colores" arranca colapsada (uso ocasional, como Plantillas) y se expande al hacer clic', () => {
    renderProperties();
    expect(screen.queryByText('Editorial Académico')).toBeNull();

    fireEvent.click(screen.getByText('Paleta de Colores'));
    screen.getByText('Editorial Académico');
    // Estilo Visual Global vive dentro del mismo bloque colapsable.
    screen.getByText('Estilo Visual Global');
  });

  describe('cambio de subtipo y `dirigida` por arista (V1.4)', () => {
    // Las secciones recuerdan abierto/cerrado en localStorage: un test previo
    // colapsa «Tipo de Diagrama» y ocultaría los botones de tipo.
    beforeEach(() => {
      window.localStorage.clear();
    });

    /** Aplica la última actualización enviada a `applyNow` sobre `base` y devuelve el bloque resultante. */
    function ultimoBloque(applyNow: ReturnType<typeof vi.fn>, base: DiagramaBlock): DiagramaGrafoBlock {
      const fn = applyNow.mock.calls.at(-1)?.[0] as (b: DiagramaBlock) => DiagramaBlock;
      return fn(base) as DiagramaGrafoBlock;
    }

    function clicTipo(label: string) {
      // El badge del encabezado repite el nombre del tipo actual: se busca el <button>.
      const boton = screen.getAllByText(label).map((n) => n.closest('button')).find(Boolean);
      fireEvent.click(boton as HTMLElement);
    }

    it('flujo → mapa mental → flujo conserva la `dirigida` explícita de cada arista', () => {
      const base = createDefaultFlujoBlock({ id: 'b-dir' }) as DiagramaGrafoBlock;
      const conDecisiones: DiagramaGrafoBlock = {
        ...base,
        aristas: base.aristas.map((a, i) => ({ ...a, dirigida: i === 0 })),
      };
      expect(conDecisiones.aristas.length).toBeGreaterThan(1);
      const applyNow = vi.fn(async () => undefined);
      render(<DiagramaProperties block={conDecisiones} applyNow={applyNow} />);

      clicTipo('Mapa Mental');
      const enMapa = ultimoBloque(applyNow, conDecisiones);
      expect(enMapa.subtipo).toBe('mapa_mental');
      expect(enMapa.aristas.map((a) => a.dirigida)).toEqual(conDecisiones.aristas.map((a) => a.dirigida));

      clicTipo('Flujo');
      const deVuelta = ultimoBloque(applyNow, enMapa);
      expect(deVuelta.subtipo).toBe('flujo');
      expect(deVuelta.aristas.map((a) => a.dirigida)).toEqual(conDecisiones.aristas.map((a) => a.dirigida));
    });

    it('las aristas sin `dirigida` explícita toman el valor por defecto del subtipo destino', () => {
      const base = createDefaultMapaMentalBlock({ id: 'b-sin' }) as DiagramaGrafoBlock;
      const sinDecision: DiagramaGrafoBlock = {
        ...base,
        aristas: base.aristas.map((a) => {
          const sinDecision = { ...a };
          delete sinDecision.dirigida;
          return sinDecision;
        }),
      };
      const applyNow = vi.fn(async () => undefined);
      render(<DiagramaProperties block={sinDecision} applyNow={applyNow} />);

      clicTipo('Flujo');
      const enFlujo = ultimoBloque(applyNow, sinDecision);
      expect(enFlujo.aristas.every((a) => a.dirigida === true)).toBe(true);
    });
  });

  describe('nombres de conjunto en Venn (V2.3)', () => {
    beforeEach(() => {
      window.localStorage.clear();
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('muestra una entrada por conjunto con la letra como placeholder y guarda el nombre (con debounce)', () => {
      const block = createDefaultVennBlock({ id: 'v-ui' }) as DiagramaVennBlock;
      const applyNow = vi.fn(async (fn: unknown) => {
        void fn;
      });
      render(<DiagramaProperties block={block} applyNow={applyNow} />);

      const a = screen.getByLabelText('Conjunto A') as HTMLInputElement;
      expect(a.placeholder).toBe('A');
      expect(screen.getByLabelText('Conjunto B')).toBeTruthy();
      expect(screen.queryByLabelText('Conjunto C')).toBeNull();

      fireEvent.change(a, { target: { value: 'Mamíferos' } });
      expect((screen.getByLabelText('Conjunto A') as HTMLInputElement).value).toBe('Mamíferos');
      expect(applyNow).not.toHaveBeenCalled();
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(applyNow).toHaveBeenCalledTimes(1);
      const fn = applyNow.mock.calls[0][0] as (b: DiagramaBlock) => DiagramaBlock;
      expect((fn(block) as DiagramaVennBlock).nombresConjuntos).toEqual(['Mamíferos', '']);
    });

    it('con 3 conjuntos aparece también el C', () => {
      const block = createDefaultVennBlock({ id: 'v-3', conjuntos: 3 }) as DiagramaVennBlock;
      render(<DiagramaProperties block={block} applyNow={vi.fn(async () => undefined)} />);
      expect(screen.getByLabelText('Conjunto C')).toBeTruthy();
    });

    it('un diagrama de grafo no muestra la sección', () => {
      render(<DiagramaProperties block={createDefaultMapaMentalBlock()} applyNow={vi.fn(async () => undefined)} />);
      expect(screen.queryByLabelText('Conjunto A')).toBeNull();
    });
  });

  describe('sección «Estilo» (V2.4)', () => {
    beforeEach(() => {
      window.localStorage.clear();
    });

    function montar(block: DiagramaGrafoBlock = createDefaultFlujoBlock({ id: 'b-est' }) as DiagramaGrafoBlock) {
      const applyNow = vi.fn(async (fn: unknown) => {
        void fn;
      });
      const utils = render(<DiagramaProperties block={block} applyNow={applyNow} />);
      return { applyNow, block, ...utils };
    }

    function abrir() {
      fireEvent.click(screen.getByText('Estilo'));
    }

    /** Último bloque que el panel pidió guardar, aplicado sobre `base`. */
    function ultimo(applyNow: ReturnType<typeof vi.fn>, base: DiagramaBlock): DiagramaGrafoBlock {
      const fn = applyNow.mock.calls.at(-1)?.[0] as (b: DiagramaBlock) => DiagramaBlock;
      return fn(base) as DiagramaGrafoBlock;
    }

    it('arranca cerrada, entre «Paleta de Colores» y «Plantillas Pedagógicas», y no reordena las demás', () => {
      montar();
      expect(screen.queryByText('Aspecto de las formas')).toBeNull();
      const titulos = ['Tipo de Diagrama', 'Paleta de Colores', 'Estilo', 'Plantillas Pedagógicas'].map((t) =>
        screen.getByText(t),
      );
      for (let i = 0; i < titulos.length - 1; i++) {
        expect(titulos[i].compareDocumentPosition(titulos[i + 1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      }
      abrir();
      screen.getByText('Aspecto de las formas');
    });

    it('elegir un relleno guarda opciones.estilo con una sola confirmación inmediata', () => {
      const { applyNow, block } = montar();
      abrir();
      fireEvent.click(screen.getByRole('button', { name: 'Sólido' }));
      expect(applyNow).toHaveBeenCalledTimes(1);
      expect(ultimo(applyNow, block).opciones?.estilo).toEqual({ relleno: 'solido' });
    });

    it('los controles se combinan: relleno + sombra + conector', () => {
      const { applyNow, block } = montar();
      abrir();
      fireEvent.click(screen.getByRole('button', { name: 'Tintado' }));
      fireEvent.click(screen.getByRole('button', { name: 'Sin sombra' }));
      fireEvent.click(screen.getByRole('button', { name: 'Ortogonal' }));
      fireEvent.click(screen.getByRole('button', { name: 'Grueso' }));
      fireEvent.click(screen.getByRole('button', { name: 'Guiones' }));
      expect(applyNow).toHaveBeenCalledTimes(5);
      expect(ultimo(applyNow, block).opciones?.estilo).toEqual({
        relleno: 'tintado',
        sombra: false,
        conector: { trazado: 'orthogonal', grosor: 4, patron: 'discontinua' },
      });
    });

    it('«Automático» y «Con sombra» quitan el valor; sin nada, opciones.estilo desaparece y el resto de opciones se conserva', () => {
      const base = createDefaultFlujoBlock({ id: 'b-aut' }) as DiagramaGrafoBlock;
      const conPaleta: DiagramaGrafoBlock = { ...base, opciones: { paleta: 'menta' } };
      const { applyNow } = montar(conPaleta);
      abrir();
      fireEvent.click(screen.getByRole('button', { name: 'Contorno' }));
      fireEvent.click(screen.getByRole('button', { name: 'Sin sombra' }));
      expect(ultimo(applyNow, conPaleta).opciones).toEqual({ paleta: 'menta', estilo: { relleno: 'contorno', sombra: false } });

      fireEvent.click(screen.getByRole('button', { name: 'Automático' }));
      fireEvent.click(screen.getByRole('button', { name: 'Con sombra' }));
      const final = ultimo(applyNow, conPaleta);
      expect(final.opciones).toEqual({ paleta: 'menta' });
      expect(final.opciones).not.toHaveProperty('estilo');
    });

    it('el conector admite «Auto» por campo sin tocar los otros', () => {
      const { applyNow, block } = montar();
      abrir();
      fireEvent.click(screen.getByRole('button', { name: 'Fino' }));
      fireEvent.click(screen.getByRole('button', { name: 'Puntos' }));
      const fila = screen.getByText('Conector · grosor').parentElement as HTMLElement;
      fireEvent.click(within(fila).getByRole('button', { name: 'Auto' }));
      expect(ultimo(applyNow, block).opciones?.estilo).toEqual({ conector: { patron: 'punteada' } });
    });

    it('marca el botón activo (aria-pressed) y muestra «Personalizado» solo con estilo', () => {
      const base = createDefaultFlujoBlock({ id: 'b-pr' }) as DiagramaGrafoBlock;
      montar(base);
      expect(screen.queryByText('Personalizado')).toBeNull();
      cleanup();
      const conEstilo: DiagramaGrafoBlock = { ...base, opciones: { estilo: { relleno: 'tintado' } } };
      render(<DiagramaProperties block={conEstilo} applyNow={vi.fn(async () => undefined)} />);
      screen.getByText('Personalizado');
      abrir();
      expect(screen.getByRole('button', { name: 'Tintado' }).getAttribute('aria-pressed')).toBe('true');
      expect(screen.getByRole('button', { name: 'Sólido' }).getAttribute('aria-pressed')).toBe('false');
    });

    it('«Restablecer estilo» solo aparece con estilo y lo borra entero', () => {
      const base = createDefaultFlujoBlock({ id: 'b-rs' }) as DiagramaGrafoBlock;
      const { applyNow } = montar(base);
      abrir();
      expect(screen.queryByRole('button', { name: 'Restablecer estilo' })).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: 'Sólido' }));
      fireEvent.click(screen.getByRole('button', { name: 'Restablecer estilo' }));
      expect(ultimo(applyNow, base).opciones?.estilo).toBeUndefined();
      expect(screen.queryByRole('button', { name: 'Restablecer estilo' })).toBeNull();
    });

    it('el panel de un Venn no muestra la sección', () => {
      render(
        <DiagramaProperties
          block={createDefaultVennBlock({ id: 'v-sin' }) as DiagramaVennBlock}
          applyNow={vi.fn(async () => undefined)}
        />,
      );
      expect(screen.queryByText('Estilo')).toBeNull();
    });
  });

  describe('sección «Disposición» (V3.1)', () => {
    beforeEach(() => {
      window.localStorage.clear();
    });

    function montar(block: DiagramaGrafoBlock) {
      const applyNow = vi.fn(async (fn: unknown) => {
        void fn;
      });
      render(<DiagramaProperties block={block} applyNow={applyNow} />);
      fireEvent.click(screen.getByText('Disposición'));
      return applyNow;
    }
    function ultimo(applyNow: ReturnType<typeof vi.fn>, base: DiagramaBlock): DiagramaGrafoBlock {
      const fn = applyNow.mock.calls.at(-1)?.[0] as (b: DiagramaBlock) => DiagramaBlock;
      return fn(base) as DiagramaGrafoBlock;
    }

    it('arranca cerrada y marca la dirección efectiva: TB en flujo, radial en mapa mental', () => {
      render(<DiagramaProperties block={createDefaultFlujoBlock({ id: 'f' })} applyNow={vi.fn(async () => undefined)} />);
      expect(screen.queryByText('Se aplica al pulsar «Organizar».')).toBeNull();
      fireEvent.click(screen.getByText('Disposición'));
      expect(screen.getByRole('button', { name: 'Arriba → abajo' }).getAttribute('aria-pressed')).toBe('true');
      cleanup();
      window.localStorage.clear();
      render(<DiagramaProperties block={createDefaultMapaMentalBlock({ id: 'm' })} applyNow={vi.fn(async () => undefined)} />);
      fireEvent.click(screen.getByText('Disposición'));
      expect(screen.getByRole('button', { name: 'Radial' }).getAttribute('aria-pressed')).toBe('true');
      expect((screen.getByRole('button', { name: 'Amplia' }) as HTMLButtonElement).disabled).toBe(true);
    });

    it('elegir dirección y densidad guarda las opciones de inmediato, sin mover los nodos', () => {
      const base = createDefaultFlujoBlock({ id: 'f2' }) as DiagramaGrafoBlock;
      const applyNow = montar(base);
      fireEvent.click(screen.getByRole('button', { name: 'Izq. → der.' }));
      fireEvent.click(screen.getByRole('button', { name: 'Amplia' }));
      expect(applyNow).toHaveBeenCalledTimes(2);
      const out = ultimo(applyNow, base);
      expect(out.opciones).toMatchObject({ direccionLayout: 'LR', densidad: 'amplia' });
      expect(out.nodos).toEqual(base.nodos);
    });

    it('«Organizar» aplica la dirección y la densidad elegidas', () => {
      const base = createDefaultFlujoBlock({ id: 'f3' }) as DiagramaGrafoBlock;
      const applyNow = montar(base);
      fireEvent.click(screen.getByRole('button', { name: 'Izq. → der.' }));
      fireEvent.click(screen.getByRole('button', { name: 'Compacta' }));
      fireEvent.click(screen.getByRole('button', { name: 'Organizar' }));
      const out = ultimo(applyNow, base);
      expect(out.nodos).toEqual(
        organizarGrafo(base.nodos, base.aristas, 'flujo', { direccionLayout: 'LR', densidad: 'compacta' }),
      );
      expect(out.nodos).not.toEqual(organizarGrafo(base.nodos, base.aristas, 'flujo', undefined));
    });

    it('un tipo con disposición propia deshabilita la dirección y lo explica', () => {
      montar(createDefaultPiramideBlock({ id: 'p' }) as DiagramaGrafoBlock);
      screen.getByText('Este tipo de diagrama tiene su propia disposición.');
      for (const nombre of ['Arriba → abajo', 'Izq. → der.', 'Radial', 'Normal']) {
        expect((screen.getByRole('button', { name: nombre }) as HTMLButtonElement).disabled).toBe(true);
      }
    });

    it('el Venn no muestra la sección', () => {
      render(<DiagramaProperties block={createDefaultVennBlock({ id: 'v-d' }) as DiagramaVennBlock} applyNow={vi.fn(async () => undefined)} />);
      expect(screen.queryByText('Disposición')).toBeNull();
    });
  });

  describe('sección «Exportar» (V3.2)', () => {
    beforeEach(() => {
      window.localStorage.clear();
      vi.mocked(exportarDiagrama).mockClear();
    });

    function montar(block: DiagramaGrafoBlock = createDefaultFlujoBlock({ id: 'b-ex' }) as DiagramaGrafoBlock) {
      render(<DiagramaProperties block={block} applyNow={vi.fn(async () => undefined)} />);
      fireEvent.click(screen.getByText('Exportar'));
      return block;
    }

    it('arranca cerrada; abierta ofrece PNG y SVG', () => {
      render(<DiagramaProperties block={createDefaultFlujoBlock({ id: 'b-c' })} applyNow={vi.fn(async () => undefined)} />);
      expect(screen.queryByRole('button', { name: 'Descargar PNG' })).toBeNull();
      fireEvent.click(screen.getByText('Exportar'));
      screen.getByRole('button', { name: 'Descargar PNG' });
      screen.getByRole('button', { name: 'Descargar SVG' });
    });

    it('descarga con el tema claro y fondo por defecto', async () => {
      const block = montar();
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Descargar PNG' }));
      });
      expect(exportarDiagrama).toHaveBeenCalledTimes(1);
      expect(exportarDiagrama).toHaveBeenCalledWith(block, 'png', { tema: 'claro', fondo: true });
    });

    it('respeta el tema oscuro y el fondo transparente elegidos', async () => {
      const block = montar();
      fireEvent.click(screen.getByRole('button', { name: 'Oscuro' }));
      fireEvent.click(screen.getByRole('button', { name: 'Transparente' }));
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Descargar SVG' }));
      });
      expect(exportarDiagrama).toHaveBeenCalledWith(block, 'svg', { tema: 'oscuro', fondo: false });
    });

    it('elegir tema o fondo no exporta ni cambia el bloque', () => {
      montar();
      fireEvent.click(screen.getByRole('button', { name: 'Oscuro' }));
      expect(exportarDiagrama).not.toHaveBeenCalled();
    });

    it('muestra el error si la exportación falla y vuelve a habilitar los botones', async () => {
      vi.mocked(exportarDiagrama).mockRejectedValueOnce(new Error('No se pudo generar el PNG.'));
      montar();
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Descargar PNG' }));
      });
      expect(screen.getByRole('alert').textContent).toBe('No se pudo generar el PNG.');
      expect((screen.getByRole('button', { name: 'Descargar PNG' }) as HTMLButtonElement).disabled).toBe(false);
    });

    it('sin nodos los botones están deshabilitados', () => {
      const base = createDefaultFlujoBlock({ id: 'b-vacio' }) as DiagramaGrafoBlock;
      montar({ ...base, nodos: [], aristas: [] });
      expect((screen.getByRole('button', { name: 'Descargar PNG' }) as HTMLButtonElement).disabled).toBe(true);
    });

    it('el Venn no muestra la sección', () => {
      render(<DiagramaProperties block={createDefaultVennBlock({ id: 'v-ex' }) as DiagramaVennBlock} applyNow={vi.fn(async () => undefined)} />);
      expect(screen.queryByText('Exportar')).toBeNull();
    });
  });
});
