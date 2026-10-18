import { describe, expect, it } from 'vitest';
import { normalizarEscena, puertosForma, type Forma, type Linea } from '@lumina/drawing';
import type { DiagramaBlock, DiagramaGrafoBlock, DiagramaVennBlock } from '@lumina/types/slide';
import * as defaults from './diagrama-defaults.js';
import { diagramaAEscena } from './diagrama-escena.js';

const CREADORES = Object.entries(defaults).filter(([nombre]) => /^createDefault.*Block$/.test(nombre)) as Array<[string, () => DiagramaBlock]>;

const formas = (b: ReturnType<typeof diagramaAEscena>): Forma[] => b.elementos.filter((e): e is Forma => e.tipo === 'forma');
const lineas = (b: ReturnType<typeof diagramaAEscena>): Linea[] => b.elementos.filter((e): e is Linea => e.tipo === 'linea');

describe('hay creadores de diagramas que probar', () => {
  it('son los 17 de siempre', () => {
    expect(CREADORES.length).toBeGreaterThanOrEqual(17);
  });
});

describe.each(CREADORES)('%s → escena', (_nombre, crear) => {
  const bloque = crear();
  const escena = diagramaAEscena(bloque);

  it('es una escena válida y estable (normalizarla no la cambia)', () => {
    expect(normalizarEscena(escena)).toEqual(escena);
    expect(escena.elementos.length).toBeGreaterThan(0);
  });

  it('no modifica el bloque original', () => {
    const copia = JSON.stringify(bloque);
    diagramaAEscena(bloque);
    expect(JSON.stringify(bloque)).toBe(copia);
  });

  it('ids únicos y conexiones que apuntan a formas que existen', () => {
    const ids = escena.elementos.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    const porId = new Map(formas(escena).map((f) => [f.id, f]));
    for (const l of lineas(escena)) {
      for (const c of [l.origen, l.destino]) {
        if (!c) continue;
        const f = porId.get(c.elementoId);
        expect(f, `${l.id} apunta a ${c.elementoId}`).toBeDefined();
        if (f) expect(c.puerto).toBeLessThan(puertosForma(f.forma, f.transformacion.ancho, f.transformacion.alto).length);
      }
    }
  });

  it('todo cabe dentro de la escena', () => {
    for (const f of formas(escena)) {
      const t = f.transformacion;
      expect(t.x).toBeGreaterThanOrEqual(-0.01);
      expect(t.y).toBeGreaterThanOrEqual(-0.01);
      expect(t.x + t.ancho).toBeLessThanOrEqual(escena.ancho + 0.01);
      expect(t.y + t.alto).toBeLessThanOrEqual(escena.alto + 0.01);
    }
  });
});

describe('grafos', () => {
  const grafos = CREADORES.map(([n, c]) => [n, c()] as const).filter(([, b]) => b.subtipo !== 'venn') as Array<[string, DiagramaGrafoBlock]>;

  it.each(grafos)('%s: un nodo = una forma con su texto; una arista = un conector pegado a sus dos formas', (_n, b) => {
    const escena = diagramaAEscena(b);
    expect(formas(escena)).toHaveLength(b.nodos.length);
    expect(lineas(escena)).toHaveLength(b.aristas.length);
    const textos = formas(escena).map((f) => (f.texto ?? '').split('\n')[0]);
    for (const n of b.nodos) expect(textos).toContain(n.etiqueta);
    for (const l of lineas(escena)) {
      expect(l.origen?.elementoId).toBeTruthy();
      expect(l.destino?.elementoId).toBeTruthy();
      expect(l.origen?.elementoId).not.toBe(l.destino?.elementoId);
    }
  });

  it('cada arista conecta los mismos nodos que en el diagrama', () => {
    const b = defaults.createDefaultFlujoBlock();
    const escena = diagramaAEscena(b);
    const etiquetaDe = (id: string | undefined): string => (formas(escena).find((f) => f.id === id)?.texto ?? '').split('\n')[0] ?? '';
    const esperadas = b.aristas.map((a) => `${b.nodos.find((n) => n.id === a.desdeId)?.etiqueta}→${b.nodos.find((n) => n.id === a.haciaId)?.etiqueta}`).sort();
    const reales = lineas(escena).map((l) => `${etiquetaDe(l.origen?.elementoId)}→${etiquetaDe(l.destino?.elementoId)}`).sort();
    expect(reales).toEqual(esperadas);
  });

  it('los conectores salen y llegan por el lado que mira al otro nodo (flujo vertical: abajo → arriba)', () => {
    const b = defaults.createDefaultFlujoBlock();
    const escena = diagramaAEscena(b);
    const porId = new Map(formas(escena).map((f) => [f.id, f]));
    const l = lineas(escena).find((x) => {
      const o = porId.get(x.origen?.elementoId ?? '');
      const d = porId.get(x.destino?.elementoId ?? '');
      return o && d && d.transformacion.y > o.transformacion.y + o.transformacion.alto && Math.abs(o.transformacion.x - d.transformacion.x) < 60;
    });
    expect(l, 'una arista vertical hacia abajo').toBeDefined();
    expect(l?.origen?.puerto).toBe(2); // abajo
    expect(l?.destino?.puerto).toBe(0); // arriba
  });

  it('el texto del cuerpo va debajo de la etiqueta', () => {
    const b = defaults.createDefaultMapaMentalBlock();
    const conCuerpo = b.nodos.find((n) => n.cuerpo);
    expect(conCuerpo).toBeDefined();
    const f = formas(diagramaAEscena(b)).find((x) => x.texto?.startsWith(`${conCuerpo?.etiqueta}\n`));
    expect(f?.texto).toBe(`${conCuerpo?.etiqueta}\n${conCuerpo?.cuerpo}`);
  });

  it('la forma del nodo se traduce (rombo, elipse, hexágono, triángulo, trapecio, trapecio invertido)', () => {
    const b = defaults.createDefaultFlujoBlock();
    const base = b.nodos[0];
    const probar = (forma: NonNullable<typeof base.forma>) => formas(diagramaAEscena({ ...b, nodos: [{ ...base, forma }], aristas: [] }))[0]?.forma;
    expect(probar('diamond')).toBe('rombo');
    expect(probar('ellipse')).toBe('elipse');
    expect(probar('circle')).toBe('circulo');
    expect(probar('hexagon')).toBe('hexagono');
    expect(probar('triangle')).toBe('triangulo');
    expect(probar('trapezoid')).toBe('trapecio');
    expect(probar('inverted-trapezoid')).toBe('trapecio-invertido');
    expect(probar('parallelogram')).toBe('paralelogramo');
    expect(probar('rect')).toBe('rectangulo');
  });

  it('pastilla = rectángulo con esquinas de media altura', () => {
    const b = defaults.createDefaultFlujoBlock();
    const f = formas(diagramaAEscena({ ...b, nodos: [{ ...b.nodos[0], forma: 'pill' }], aristas: [] }))[0];
    expect(f?.estilo.radio).toBeCloseTo((f?.transformacion.alto ?? 0) / 2, 5);
  });

  it('el relleno del diagrama se respeta: contorno, tintado y sólido', () => {
    const b = defaults.createDefaultFlujoBlock();
    const con = (relleno: 'contorno' | 'tintado' | 'solido') =>
      formas(diagramaAEscena({ ...b, nodos: [{ ...b.nodos[0], estilo: { color: '#2563EB' } }], aristas: [], opciones: { ...b.opciones, estilo: { relleno } } }))[0];
    expect(con('contorno')?.estilo.relleno).toEqual({ tipo: 'solido', color: 'var(--card)' });
    const tinte = con('tintado')?.estilo.relleno;
    expect(tinte?.tipo === 'solido' && tinte.color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(tinte?.tipo === 'solido' && tinte.color.toLowerCase()).not.toBe('#2563eb');
    expect(con('solido')?.estilo.relleno).toEqual({ tipo: 'solido', color: '#2563EB' });
    expect(con('solido')?.estiloTexto.color).toBe('#FFFFFF');
  });

  it('sin sombra si el diagrama la quita; con sombra si no', () => {
    const b = defaults.createDefaultFlujoBlock();
    const f = (sombra: boolean) => formas(diagramaAEscena({ ...b, opciones: { ...b.opciones, estilo: { sombra } } }))[0]?.estilo.sombra;
    expect(f(false)).toBeNull();
    expect(f(true)).not.toBeNull();
  });

  it('el trazado, el patrón, la flecha y la etiqueta de la arista pasan al conector', () => {
    const b = defaults.createDefaultFlujoBlock();
    const a = b.aristas[0];
    expect(a).toBeDefined();
    const escena = diagramaAEscena({ ...b, aristas: [{ ...a, tipoTrazado: 'bezier', estiloLinea: 'discontinua', grosor: 4, dirigida: true, flechaInicio: true, etiqueta: 'Sí' }] });
    const l = lineas(escena)[0];
    expect(l).toMatchObject({ trazado: 'curvo', inicio: 'flecha', fin: 'flecha', texto: 'Sí' });
    expect(l?.estilo.contorno).toMatchObject({ patron: 'guiones', grosor: 4 });
  });

  it('un id de nodo con caracteres raros no rompe las conexiones', () => {
    const b = defaults.createDefaultFlujoBlock();
    const [n1, n2] = b.nodos;
    const raro: DiagramaGrafoBlock = {
      ...b,
      nodos: [
        { ...n1, id: 'a b/ñ' },
        { ...n2, id: 'a-b-ñ' },
      ],
      aristas: [{ id: 'e 1', desdeId: 'a b/ñ', haciaId: 'a-b-ñ', dirigida: true }],
    };
    const escena = diagramaAEscena(raro);
    expect(formas(escena)).toHaveLength(2);
    const l = lineas(escena)[0];
    expect(l?.origen?.elementoId).not.toBe(l?.destino?.elementoId);
    expect(formas(escena).map((f) => f.id)).toEqual(expect.arrayContaining([l?.origen?.elementoId, l?.destino?.elementoId]));
  });

  it('la cebolla pone los círculos grandes debajo de los chicos (si no, taparían lo de dentro)', () => {
    const escena = diagramaAEscena(defaults.createDefaultCebollaBlock());
    const areas = formas(escena).map((f) => f.transformacion.ancho * f.transformacion.alto);
    expect(areas.length).toBeGreaterThan(2);
    expect(areas).toEqual([...areas].sort((a, b) => b - a));
  });

  it('un diagrama de un solo nodo o con aristas rotas no lanza', () => {
    const b = defaults.createDefaultFlujoBlock();
    expect(() => diagramaAEscena({ ...b, nodos: [b.nodos[0]], aristas: [{ id: 'x', desdeId: b.nodos[0].id, haciaId: 'no-existe' }] })).not.toThrow();
    expect(lineas(diagramaAEscena({ ...b, nodos: [b.nodos[0]], aristas: [{ id: 'x', desdeId: b.nodos[0].id, haciaId: 'no-existe' }] }))).toHaveLength(0);
  });
});

describe('Venn', () => {
  it('3 conjuntos: tres círculos con los colores de la paleta y sus nombres', () => {
    const b = { ...defaults.createDefaultVennBlock(), conjuntos: 3 as const, nombresConjuntos: ['Aves', 'Peces', 'Mamíferos'] } as DiagramaVennBlock;
    const escena = diagramaAEscena(b);
    const circulos = formas(escena).filter((f) => f.forma === 'circulo');
    expect(circulos).toHaveLength(3);
    const nombres = escena.elementos.filter((e) => e.tipo === 'texto').map((t) => (t.tipo === 'texto' ? t.texto : ''));
    expect(nombres).toEqual(['Aves', 'Peces', 'Mamíferos']);
  });

  it('cada elemento del diagrama es una etiqueta; los de dentro quedan sobre su región y los de fuera, debajo', () => {
    const base = defaults.createDefaultVennBlock();
    const b: DiagramaVennBlock = {
      ...base,
      conjuntos: 2,
      elementos: [
        { id: 'e1', texto: 'Solo A', regionId: 'a' },
        { id: 'e2', texto: 'En ambos', regionId: 'ab' },
        { id: 'e3', texto: 'Suelto', regionId: null },
      ],
    };
    const escena = diagramaAEscena(b);
    const etiquetas = formas(escena).filter((f) => f.forma === 'rectangulo');
    expect(etiquetas.map((f) => f.texto).sort()).toEqual(['En ambos', 'Solo A', 'Suelto']);
    const de = (t: string) => etiquetas.find((f) => f.texto === t)?.transformacion;
    const centroX = (t: string) => (de(t)?.x ?? 0) + (de(t)?.ancho ?? 0) / 2;
    expect(centroX('Solo A')).toBeLessThan(centroX('En ambos'));
    expect(de('Suelto')?.y ?? 0).toBeGreaterThan(800);
    expect(escena.alto).toBeGreaterThan(800);
  });

  it('los colores de los círculos son hex válidos con transparencia', () => {
    const escena = diagramaAEscena(defaults.createDefaultVennBlock());
    for (const c of formas(escena).filter((f) => f.forma === 'circulo')) {
      expect(c.estilo.relleno.tipo === 'solido' && c.estilo.relleno.color).toMatch(/^#[0-9a-f]{8}$/i);
    }
  });
});
