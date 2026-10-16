import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DiagramaGrafoBlock } from '@lumina/types/slide';

import {
  createDefaultCebollaBlock,
  createDefaultFlujoBlock,
  createDefaultMapaMentalBlock,
  createDefaultOrganigramaBlock,
  createDefaultPiramideBlock,
  normalizeDiagramaBlock,
} from './diagrama-defaults.js';
import { descargarBlob, diagramaToSvg, envolverTexto, escaparXml, exportarDiagrama, nombreArchivo, svgAPng } from './diagrama-export.js';

function parsear(svg: string): Document {
  return new DOMParser().parseFromString(svg, 'image/svg+xml');
}

const PLANTILLAS = [
  ['mapa mental', createDefaultMapaMentalBlock],
  ['organigrama', createDefaultOrganigramaBlock],
  ['flujo', createDefaultFlujoBlock],
  ['pirámide', createDefaultPiramideBlock],
  ['cebolla', createDefaultCebollaBlock],
] as const;

describe('diagramaToSvg (V3.2)', () => {
  it.each(PLANTILLAS)('%s: SVG válido con tantos nodos y aristas como el bloque', (_n, crear) => {
    const block = crear({ id: 'b-svg' }) as DiagramaGrafoBlock;
    const { svg, ancho, alto } = diagramaToSvg(block);
    const doc = parsear(svg);
    expect(doc.querySelector('parsererror')).toBeNull();
    expect(doc.querySelectorAll('g[data-nodo-id]')).toHaveLength(block.nodos.length);
    expect(doc.querySelectorAll('g[data-arista-id]')).toHaveLength(block.aristas.length);
    const raiz = doc.documentElement;
    expect(raiz.getAttribute('width')).toBe(String(ancho));
    expect(raiz.getAttribute('height')).toBe(String(alto));
    expect(raiz.getAttribute('viewBox')).toBe(`0 0 ${ancho} ${alto}`);
    expect(ancho).toBeGreaterThan(0);
    expect(alto).toBeGreaterThan(0);
  });

  it('cada nodo conserva su id y su etiqueta', () => {
    const block = createDefaultFlujoBlock({ id: 'b-et' }) as DiagramaGrafoBlock;
    const doc = parsear(diagramaToSvg(block).svg);
    for (const n of block.nodos) {
      const g = doc.querySelector(`g[data-nodo-id="${n.id}"]`);
      expect(g).not.toBeNull();
      const primera = n.etiqueta.split(/\s+/)[0];
      expect(g?.textContent).toContain(primera.slice(0, 4));
    }
  });

  it('el título y la descripción accesible salen como <title>/<desc> y encabezado', () => {
    const block = { ...(createDefaultFlujoBlock({ id: 'b-t' }) as DiagramaGrafoBlock), titulo: 'Ciclo del agua', descripcionAccesible: 'Pasos del ciclo' };
    const doc = parsear(diagramaToSvg(block).svg);
    expect(doc.querySelector('title')?.textContent).toBe('Ciclo del agua');
    expect(doc.querySelector('desc')?.textContent).toBe('Pasos del ciclo');
    expect(doc.documentElement.textContent).toContain('Ciclo del agua');
  });

  it('escapa los caracteres especiales del texto (no rompe el XML ni inyecta marcado)', () => {
    const block = normalizeDiagramaBlock({
      id: 'b-esc',
      tipo: 'diagrama',
      subtipo: 'flujo',
      titulo: '<b>A & B</b>',
      nodos: [{ id: 'a"x', etiqueta: '¿5 < 6 & "sí"?', cuerpo: "it's <i>", x: 0, y: 0 }, { id: 'b', etiqueta: 'B', x: 200, y: 0 }],
      aristas: [{ id: 'e', desdeId: 'a"x', haciaId: 'b', etiqueta: 'a<b' }],
    }) as DiagramaGrafoBlock;
    const { svg } = diagramaToSvg(block);
    const doc = parsear(svg);
    expect(doc.querySelector('parsererror')).toBeNull();
    expect(svg).not.toContain('<b>');
    expect(doc.querySelectorAll('g[data-nodo-id]')).toHaveLength(2);
    expect(doc.documentElement.textContent).toContain('5 < 6 & "sí"?');
  });

  it('el tema y el fondo se aplican con colores resueltos (sin variables CSS)', () => {
    const block = createDefaultFlujoBlock({ id: 'b-tema' }) as DiagramaGrafoBlock;
    const claro = diagramaToSvg(block, { tema: 'claro' }).svg;
    const oscuro = diagramaToSvg(block, { tema: 'oscuro' }).svg;
    const sinFondo = diagramaToSvg(block, { fondo: false }).svg;
    expect(parsear(claro).querySelector('svg > rect')?.getAttribute('fill')).toBe('#FFFFFF');
    expect(parsear(oscuro).querySelector('svg > rect')?.getAttribute('fill')).toBe('#0F172A');
    expect(parsear(sinFondo).querySelector('svg > rect')).toBeNull();
    for (const svg of [claro, oscuro, sinFondo]) {
      expect(svg).not.toContain('var(');
      expect(svg).not.toContain('color-mix');
    }
  });

  it('el relleno del estilo se refleja: tintado mezcla el acento y sólido lo usa con texto de contraste', () => {
    const base = createDefaultFlujoBlock({ id: 'b-rel' }) as DiagramaGrafoBlock;
    const nodo = { ...base.nodos[1], estilo: { color: '#1E3A8A' } };
    const con = (relleno: 'contorno' | 'tintado' | 'solido'): DiagramaGrafoBlock => ({
      ...base,
      nodos: [base.nodos[0], nodo],
      aristas: [],
      opciones: { estilo: { relleno } },
    });
    const figura = (b: DiagramaGrafoBlock) =>
      parsear(diagramaToSvg(b).svg).querySelector(`g[data-nodo-id="${nodo.id}"] > *`)?.getAttribute('fill');
    expect(figura(con('contorno'))).toBe('#FFFFFF');
    expect(figura(con('tintado'))).not.toBe('#FFFFFF');
    expect(figura(con('tintado'))).toMatch(/^#[0-9a-f]{6}$/);
    expect(figura(con('solido'))).toBe('#1E3A8A');
    const texto = parsear(diagramaToSvg(con('solido')).svg).querySelector(`g[data-nodo-id="${nodo.id}"] text`);
    expect(texto?.getAttribute('fill')).toBe('#FFFFFF');
  });

  it('las aristas respetan trazado, patrón, grosor, flechas y etiqueta', () => {
    const base = createDefaultFlujoBlock({ id: 'b-ar' }) as DiagramaGrafoBlock;
    const block: DiagramaGrafoBlock = {
      ...base,
      aristas: [
        { id: 'e1', desdeId: base.nodos[0].id, haciaId: base.nodos[1].id, dirigida: true, flechaInicio: true, estiloLinea: 'discontinua', grosor: 3, color: '#DC2626', etiqueta: 'Sí', tipoTrazado: 'orthogonal' },
      ],
    };
    const g = parsear(diagramaToSvg(block).svg).querySelector('g[data-arista-id="e1"]')!;
    const trazo = g.querySelector('path')!;
    expect(trazo.getAttribute('stroke')).toBe('#DC2626');
    expect(trazo.getAttribute('stroke-width')).toBe('3');
    expect(trazo.getAttribute('stroke-dasharray')).toBe('6 5');
    expect(trazo.getAttribute('d')).not.toMatch(/Q/); // ortogonal: esquinas vivas
    expect(g.querySelectorAll('polygon')).toHaveLength(2); // punta final + punta inicial
    expect(g.textContent).toContain('Sí');
  });

  it('un bloque sin nodos no falla', () => {
    const vacio = { ...(createDefaultFlujoBlock({ id: 'b-v' }) as DiagramaGrafoBlock), nodos: [], aristas: [] };
    const { svg } = diagramaToSvg(vacio);
    expect(parsear(svg).querySelector('parsererror')).toBeNull();
  });
});

describe('utilidades de exportación', () => {
  it('escaparXml', () => {
    expect(escaparXml(`<a href="x">&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&apos;&lt;/a&gt;');
  });

  it('envolverTexto parte por palabras y corta con «…» al pasar el máximo de líneas', () => {
    expect(envolverTexto('uno dos tres', 20, 2)).toEqual(['uno dos tres']);
    expect(envolverTexto('uno dos tres cuatro', 8, 3)).toEqual(['uno dos', 'tres', 'cuatro']);
    const cortado = envolverTexto('alfa beta gamma delta epsilon zeta', 10, 2);
    expect(cortado).toHaveLength(2);
    expect(cortado[1].endsWith('…')).toBe(true);
    expect(envolverTexto('', 10, 2)).toEqual([]);
    expect(envolverTexto('supercalifragilistico', 8, 2)[0]).toHaveLength(8);
  });

  it('nombreArchivo limpia acentos y símbolos y cae a «diagrama»', () => {
    expect(nombreArchivo({ titulo: 'Mapa del ciclo: ¡Agua!' }, 'svg')).toBe('mapa-del-ciclo-agua.svg');
    expect(nombreArchivo({ titulo: 'Árbol / Raíces' }, 'png')).toBe('arbol-raices.png');
    expect(nombreArchivo({ titulo: '   ' }, 'png')).toBe('diagrama.png');
    expect(nombreArchivo({}, 'svg')).toBe('diagrama.svg');
  });
});

describe('rasterizado y descarga (navegador simulado)', () => {
  const originalCrear = URL.createObjectURL;
  const originalRevocar = URL.revokeObjectURL;

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    URL.createObjectURL = originalCrear;
    URL.revokeObjectURL = originalRevocar;
  });

  /** `Image` que dispara `onload`/`onerror` al recibir `src`; canvas falso que registra el tamaño. */
  function simularNavegador(opciones: { falla?: boolean; sinContexto?: boolean; sinBlob?: boolean } = {}) {
    const creadas: Blob[] = [];
    const revocadas: string[] = [];
    URL.createObjectURL = vi.fn((b: Blob | MediaSource) => {
      creadas.push(b as Blob);
      return `blob:fake-${creadas.length}`;
    });
    URL.revokeObjectURL = vi.fn((u: string) => {
      revocadas.push(u);
    });
    class ImagenFalsa {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_valor: string) {
        queueMicrotask(() => (opciones.falla ? this.onerror?.() : this.onload?.()));
      }
    }
    vi.stubGlobal('Image', ImagenFalsa);
    const lienzo = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => (opciones.sinContexto ? null : { drawImage: vi.fn() })),
      toBlob: vi.fn((cb: (b: Blob | null) => void) => cb(opciones.sinBlob ? null : new Blob(['png'], { type: 'image/png' }))),
    };
    const crear = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) =>
      tag === 'canvas' ? (lienzo as unknown as HTMLCanvasElement) : crear(tag)) as typeof document.createElement);
    return { lienzo, creadas, revocadas };
  }

  it('svgAPng dibuja a escala y entrega un PNG; libera la URL', async () => {
    const { lienzo, revocadas } = simularNavegador();
    const blob = await svgAPng('<svg/>', 300, 150, 2);
    expect(blob.type).toBe('image/png');
    expect([lienzo.width, lienzo.height]).toEqual([600, 300]);
    expect(revocadas).toEqual(['blob:fake-1']);
  });

  it('svgAPng usa escala 2 por defecto', async () => {
    const { lienzo } = simularNavegador();
    await svgAPng('<svg/>', 100, 50);
    expect([lienzo.width, lienzo.height]).toEqual([200, 100]);
  });

  it('svgAPng rechaza si el SVG no carga, si no hay contexto 2D o si el canvas no da blob (y libera la URL)', async () => {
    const a = simularNavegador({ falla: true });
    await expect(svgAPng('<svg/>', 10, 10)).rejects.toThrow(/cargar el SVG/);
    expect(a.revocadas).toHaveLength(1);
    const b = simularNavegador({ sinContexto: true });
    await expect(svgAPng('<svg/>', 10, 10)).rejects.toThrow(/canvas/);
    expect(b.revocadas).toHaveLength(1);
    simularNavegador({ sinBlob: true });
    await expect(svgAPng('<svg/>', 10, 10)).rejects.toThrow(/PNG/);
  });

  it('descargarBlob crea un enlace con el nombre, lo pulsa y lo retira', () => {
    simularNavegador();
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    descargarBlob(new Blob(['x']), 'mi-diagrama.svg');
    expect(clic).toHaveBeenCalledTimes(1);
    expect(document.querySelector('a[download]')).toBeNull();
  });

  it('exportarDiagrama: SVG descarga el SVG con el nombre del título; PNG pasa por el canvas', async () => {
    const { creadas } = simularNavegador();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const nombres: string[] = [];
    const original = document.body.appendChild.bind(document.body);
    vi.spyOn(document.body, 'appendChild').mockImplementation(((nodo: Node) => {
      if (nodo instanceof HTMLAnchorElement) nombres.push(nodo.download);
      return original(nodo);
    }) as typeof document.body.appendChild);

    const block = { ...(createDefaultFlujoBlock({ id: 'b-exp' }) as DiagramaGrafoBlock), titulo: 'Mi diagrama' };
    await exportarDiagrama(block, 'svg');
    expect(nombres).toEqual(['mi-diagrama.svg']);
    expect(creadas[0].type).toContain('image/svg+xml');

    await exportarDiagrama(block, 'png', { escala: 1 });
    expect(nombres).toEqual(['mi-diagrama.svg', 'mi-diagrama.png']);
  });
});
