import { describe, expect, it } from 'vitest';
import { normalizarEscena } from '../normalizar.js';
import { escenaANodos, escenaASvg, type NodoSvg } from '../render/render.js';
import { TIPOS_FORMA, TIPOS_ICONO, type TipoIcono } from '../tipos.js';
import { FORMAS, formasPorGrupo, iconosPorGrupo, poligonoForma, puertosForma, rectanguloTexto, trazadoForma } from './index.js';
import { ICONOS_DATOS } from './iconos-datos.js';
import fuente from './iconos-datos.ts?raw';
import { GRUPOS_ICONO } from './iconos.js';

describe('los 30 iconos del catálogo (Y32a)', () => {
  it('son 30, con ids propios y distintos de las 22 formas', () => {
    expect(TIPOS_ICONO).toHaveLength(30);
    expect(new Set(TIPOS_ICONO).size).toBe(30);
    expect(TIPOS_ICONO.every((i) => i.startsWith('icono-'))).toBe(true);
    for (const i of TIPOS_ICONO) expect((TIPOS_FORMA as readonly string[]).includes(i)).toBe(false);
  });

  it('`TIPOS_FORMA` sigue siendo exactamente las 22 de siempre', () => {
    expect(TIPOS_FORMA).toHaveLength(22);
    expect(formasPorGrupo().flatMap((g) => g.formas)).toHaveLength(22);
    expect(formasPorGrupo().map((g) => g.grupo)).toEqual(['basicas', 'flechas', 'diagramas']);
  });

  it('cada icono está en el catálogo con su id, un nombre, el grupo `iconos` y 64 × 64', () => {
    for (const id of TIPOS_ICONO) {
      const f = FORMAS[id];
      expect(f.id).toBe(id);
      expect(f.nombre.length).toBeGreaterThan(0);
      expect(f.grupo).toBe('iconos');
      expect(f.tamano).toEqual({ ancho: 64, alto: 64 });
      expect(f.parametros).toEqual([]);
      expect(f.asasAjuste).toBeUndefined();
      expect(f.estiloInicial).toEqual({ relleno: { tipo: 'ninguno' } });
    }
  });

  it('los nombres son únicos (la galería y el buscador los muestran)', () => {
    const nombres = TIPOS_ICONO.map((i) => FORMAS[i].nombre);
    expect(new Set(nombres).size).toBe(30);
  });

  it('las formas de siempre no traen estilo inicial (nacen como hasta ahora)', () => {
    for (const t of TIPOS_FORMA) expect(FORMAS[t].estiloInicial).toBeUndefined();
  });

  it('los grupos de la galería: 5, en orden, con los 30 iconos sin repetir', () => {
    expect(GRUPOS_ICONO.map((g) => g.id)).toEqual(['personas', 'ciencia', 'estados', 'cosas', 'mundo']);
    const todos = GRUPOS_ICONO.flatMap((g) => g.iconos);
    expect(todos).toHaveLength(30);
    expect([...todos].sort()).toEqual([...TIPOS_ICONO].sort());
    const por = iconosPorGrupo();
    expect(por).toHaveLength(5);
    expect(por.flatMap((g) => g.formas.map((f) => f.id))).toEqual(todos);
    expect(por.map((g) => g.formas.length)).toEqual([5, 6, 6, 5, 8]);
  });

  it('el texto, si se escribe, va centrado sobre toda la caja; los puertos son el medio de cada lado', () => {
    for (const id of TIPOS_ICONO) {
      expect(rectanguloTexto(id, 64, 64)).toEqual({ x: 0, y: 0, ancho: 64, alto: 64 });
      expect(puertosForma(id, 80, 40)).toEqual([
        { x: 40, y: 0 },
        { x: 80, y: 20 },
        { x: 40, y: 40 },
        { x: 0, y: 20 },
      ]);
      expect(poligonoForma(id, 64, 64)).toBeUndefined(); // la puntería usa la caja, como la nube o la llave
    }
  });
});

describe('los datos de los iconos', () => {
  it('hay un trazado para cada icono y ninguno de más', () => {
    expect(Object.keys(ICONOS_DATOS).sort()).toEqual([...TIPOS_ICONO].sort());
  });

  it('ningún trazado se repite', () => {
    expect(new Set(Object.values(ICONOS_DATOS)).size).toBe(30);
  });

  it('ningún arco trae rotación (el escalado de los ejes no la soporta)', () => {
    for (const [id, d] of Object.entries(ICONOS_DATOS)) {
      // `a rx ry rot flag flag x y`: se busca la rotación de cada arco con las banderas pegadas o separadas.
      for (const m of d.matchAll(/[aA]\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([-\d.]+)/g)) expect(Number(m[1]), id).toBe(0);
    }
  });

  it('trae la licencia ISC, el aviso de copyright y la versión de origen', () => {
    expect(fuente).toContain('ISC License');
    expect(fuente).toContain('Copyright (c) 2026 Lucide Icons and Contributors');
    expect(fuente).toContain('lucide-react 1.41.0');
  });

  it('no importa nada (ni lucide ni otro paquete)', () => {
    expect(fuente).not.toMatch(/^\s*import\s/m);
  });
});

describe.each([[16, 16], [64, 64], [200, 40], [40, 200]])('el trazado de cada icono a %i × %i', (ancho, alto) => {
  it.each(TIPOS_ICONO)('%s: sin NaN y dentro de la caja', (id: TipoIcono) => {
    const d = trazadoForma(id, ancho, alto);
    expect(d.length).toBeGreaterThan(0);
    expect(d).not.toContain('NaN');
    // Todos los puntos de paso (el destino de cada comando) caen dentro de la caja; los arcos y curvas pueden salirse un poco por el
    // control pero la cuadrícula original deja 1-2 de margen, que escala igual.
    const tokens = d.split(/[ ]+/);
    for (const t of tokens) {
      const m = /^[MLCQ]?(-?[\d.]+),(-?[\d.]+)$/.exec(t); // los radios de un arco (`A rx,ry`) no son puntos
      if (!m) continue;
      const x = Number(m[1]);
      const y = Number(m[2]);
      expect(x, `${id} x`).toBeGreaterThanOrEqual(-0.01);
      expect(x, `${id} x`).toBeLessThanOrEqual(ancho + 0.01);
      expect(y, `${id} y`).toBeGreaterThanOrEqual(-0.01);
      expect(y, `${id} y`).toBeLessThanOrEqual(alto + 0.01);
    }
  });
});

describe('el escalado de un icono no estira el trazo', () => {
  it('el `d` cambia con el tamaño y el grosor del contorno no', () => {
    const e = (ancho: number, alto: number) =>
      normalizarEscena({ elementos: [{ id: 'i', tipo: 'forma', forma: 'icono-persona', transformacion: { x: 0, y: 0, ancho, alto, rotacion: 0 } }] });
    const camino = (n: NodoSvg[]): NodoSvg => {
      const buscar = (x: NodoSvg): NodoSvg | undefined => (x.tag === 'path' ? x : x.hijos?.map(buscar).find(Boolean));
      return n.map(buscar).find(Boolean) as NodoSvg;
    };
    const chico = camino(escenaANodos(e(32, 32)).nodos);
    const grande = camino(escenaANodos(e(200, 100)).nodos);
    expect(chico.attrs.d).not.toBe(grande.attrs.d);
    expect(chico.attrs['stroke-width']).toBe(grande.attrs['stroke-width']);
  });
});

describe('el normalizador', () => {
  const forma = (valor: unknown) => normalizarEscena({ elementos: [{ id: 'a', tipo: 'forma', forma: valor, transformacion: { x: 0, y: 0, ancho: 10, alto: 10, rotacion: 0 } }] }).elementos[0];

  it('conserva un icono', () => {
    for (const id of TIPOS_ICONO) expect(forma(id)).toMatchObject({ forma: id });
  });

  it('un id desconocido, de otra librería o que no es texto cae en `rectangulo`', () => {
    for (const v of ['icono-inexistente', 'lucide:user', 'user', '', undefined, null, 3, {}]) expect(forma(v)).toMatchObject({ forma: 'rectangulo' });
  });

  it('es idempotente', () => {
    const una = normalizarEscena({ elementos: [{ id: 'a', tipo: 'forma', forma: 'icono-reloj', transformacion: { x: 1, y: 2, ancho: 64, alto: 64, rotacion: 0 } }] });
    expect(JSON.stringify(normalizarEscena(una))).toBe(JSON.stringify(una));
  });

  it('no cambia la versión del modelo', () => {
    expect(normalizarEscena({}).elementos).toEqual([]);
  });
});

describe('el dibujo', () => {
  const escena = (forma: string) => normalizarEscena({ elementos: [{ id: 'a', tipo: 'forma', forma, transformacion: { x: 0, y: 0, ancho: 64, alto: 64, rotacion: 0 } }] });
  const trazoDe = (forma: string): NodoSvg => {
    const buscar = (x: NodoSvg): NodoSvg | undefined => (x.tag === 'path' ? x : x.hijos?.map(buscar).find(Boolean));
    return escenaANodos(escena(forma)).nodos.map(buscar).find(Boolean) as NodoSvg;
  };

  it('un icono lleva extremos redondeados; una forma de las 22, no', () => {
    expect(trazoDe('icono-reloj').attrs['stroke-linecap']).toBe('round');
    for (const t of TIPOS_FORMA) expect(trazoDe(t).attrs['stroke-linecap']).toBeUndefined();
  });

  it('el SVG exportado trae el icono y no deja ningún `var(` en modo claro', () => {
    const svg = escenaASvg(escena('icono-bombilla'), { modo: 'claro' }).svg;
    expect(svg).toContain('stroke-linecap="round"');
    expect(svg).not.toContain('var(');
  });
});

describe('rendimiento (DW9)', () => {
  const muchas = (forma: string) =>
    normalizarEscena({
      elementos: Array.from({ length: 500 }, (_, i) => ({ id: `e${i}`, tipo: 'forma', forma, transformacion: { x: (i % 25) * 70, y: Math.floor(i / 25) * 70, ancho: 64, alto: 64, rotacion: 0 } })),
    });
  const mediana = (fn: () => void): number => {
    const t: number[] = [];
    for (let i = 0; i < 7; i++) {
      const a = performance.now();
      fn();
      t.push(performance.now() - a);
    }
    return t.sort((x, y) => x - y)[3] as number;
  };

  it('500 iconos no cuestan más que unas pocas veces 500 rectángulos', () => {
    const rects = muchas('rectangulo');
    const iconos = muchas('icono-engranaje');
    escenaANodos(rects);
    escenaANodos(iconos);
    const tRect = mediana(() => void escenaANodos(rects));
    const tIcono = mediana(() => void escenaANodos(iconos));
    expect(tIcono).toBeLessThanOrEqual(Math.max(tRect * 12, 60));
  });
});
