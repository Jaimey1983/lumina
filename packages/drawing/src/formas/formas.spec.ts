import { describe, expect, it } from 'vitest';

import { TIPOS_FORMA, type Punto, type TipoForma } from '../tipos.js';
import {
  FORMAS,
  formasPorGrupo,
  poligonoForma,
  puertosForma,
  rectanguloTexto,
  resolverParametros,
  trazadoForma,
  trazadoPoligono,
} from './index.js';

// ─── Ayudas de prueba ─────────────────────────────────────────────────────────

/** Puntos (extremos y de control) de un path hecho solo con M, L, C, A y Z. */
function coordenadas(d: string): Punto[] {
  const puntos: Punto[] = [];
  for (const [, cmd, resto] of d.matchAll(/([MLCAZ])([^MLCAZ]*)/g)) {
    const n = resto.split(/[\s,]+/).filter(Boolean).map(Number);
    if (cmd === 'A') {
      for (let i = 0; i + 6 < n.length + 0; i += 7) puntos.push({ x: n[i + 5], y: n[i + 6] });
    } else {
      for (let i = 0; i + 1 < n.length; i += 2) puntos.push({ x: n[i], y: n[i + 1] });
    }
  }
  return puntos;
}

/** Todos los números del path, incluidos radios y banderas, para comprobar que son finitos. */
const numeros = (d: string): number[] => d.replace(/[MLCAZ]/g, ' ').split(/[\s,]+/).filter(Boolean).map(Number);

function distanciaASegmento(p: Punto, a: Punto, b: Punto): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const largo2 = dx * dx + dy * dy;
  const t = largo2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / largo2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function distanciaAPoligono(p: Punto, poligono: Punto[]): number {
  return Math.min(...poligono.map((a, i) => distanciaASegmento(p, a, poligono[(i + 1) % poligono.length])));
}

function dentroDePoligono(p: Punto, poligono: Punto[]): boolean {
  if (distanciaAPoligono(p, poligono) < 1e-6) return true;
  let dentro = false;
  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const a = poligono[i];
    const b = poligono[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) dentro = !dentro;
  }
  return dentro;
}

const TAMANOS: Array<[number, number]> = [[40, 30], [160, 100], [300, 60], [20, 200], [100, 100]];
const ELIPTICAS: TipoForma[] = ['elipse', 'circulo'];

// ─── Catálogo ─────────────────────────────────────────────────────────────────

describe('catálogo de formas', () => {
  it('declara exactamente las formas del modelo, cada una con su propio id', () => {
    expect(Object.keys(FORMAS).sort()).toEqual([...TIPOS_FORMA].sort());
    for (const t of TIPOS_FORMA) expect(FORMAS[t].id).toBe(t);
  });

  it('tiene al menos 20 formas con nombre, grupo y tamaño de inserción', () => {
    expect(TIPOS_FORMA.length).toBeGreaterThanOrEqual(20);
    for (const t of TIPOS_FORMA) {
      const f = FORMAS[t];
      expect(f.nombre.length).toBeGreaterThan(0);
      expect(['basicas', 'flechas', 'diagramas']).toContain(f.grupo);
      expect(f.tamano.ancho).toBeGreaterThan(0);
      expect(f.tamano.alto).toBeGreaterThan(0);
    }
  });

  it('los nombres son únicos', () => {
    const nombres = TIPOS_FORMA.map((t) => FORMAS[t].nombre);
    expect(new Set(nombres).size).toBe(nombres.length);
  });

  it('formasPorGrupo reparte todas las formas sin repetir ni omitir', () => {
    const grupos = formasPorGrupo();
    expect(grupos.map((g) => g.grupo)).toEqual(['basicas', 'flechas', 'diagramas']);
    const todas = grupos.flatMap((g) => g.formas.map((f) => f.id));
    expect(todas.sort()).toEqual([...TIPOS_FORMA].sort());
    for (const g of grupos) expect(g.formas.length).toBeGreaterThan(0);
    expect(grupos.find((g) => g.grupo === 'flechas')?.formas.map((f) => f.id)).toEqual(['flecha-derecha', 'flecha-izquierda', 'flecha-doble']);
  });
});

// ─── Trazado ──────────────────────────────────────────────────────────────────

describe.each(TIPOS_FORMA)('forma %s', (forma) => {
  it.each(TAMANOS)('trazado válido y cerrado en %s × %s', (ancho, alto) => {
    const d = trazadoForma(forma, ancho, alto);
    expect(d.startsWith('M')).toBe(true);
    expect(d.trim().endsWith('Z')).toBe(true);
    expect(d).not.toMatch(/NaN|Infinity|undefined/);
    for (const n of numeros(d)) expect(Number.isFinite(n)).toBe(true);
  });

  it.each(TAMANOS)('todo el trazado cabe en su caja de %s × %s', (ancho, alto) => {
    const margen = 0.011;
    for (const p of coordenadas(trazadoForma(forma, ancho, alto))) {
      expect(p.x).toBeGreaterThanOrEqual(-margen);
      expect(p.x).toBeLessThanOrEqual(ancho + margen);
      expect(p.y).toBeGreaterThanOrEqual(-margen);
      expect(p.y).toBeLessThanOrEqual(alto + margen);
    }
  });

  it('con el tamaño de inserción da un trazado no vacío que usa casi toda la caja', () => {
    const { ancho, alto } = FORMAS[forma].tamano;
    const pts = coordenadas(trazadoForma(forma, ancho, alto));
    expect(pts.length).toBeGreaterThanOrEqual(3);
    // Una elipse se dibuja con arcos: sus extremos están a la misma altura, así que se mide con los radios.
    if (ELIPTICAS.includes(forma)) return;
    expect(Math.max(...pts.map((p) => p.x)) - Math.min(...pts.map((p) => p.x))).toBeGreaterThan(ancho * 0.9);
    expect(Math.max(...pts.map((p) => p.y)) - Math.min(...pts.map((p) => p.y))).toBeGreaterThan(alto * 0.5);
  });

  it('el rectángulo de texto es positivo y queda dentro de la caja', () => {
    for (const [ancho, alto] of TAMANOS) {
      const r = rectanguloTexto(forma, ancho, alto);
      const margen = 0.011;
      expect(r.ancho).toBeGreaterThan(0);
      expect(r.alto).toBeGreaterThan(0);
      expect(r.x).toBeGreaterThanOrEqual(-margen);
      expect(r.y).toBeGreaterThanOrEqual(-margen);
      expect(r.x + r.ancho).toBeLessThanOrEqual(ancho + margen);
      expect(r.y + r.alto).toBeLessThanOrEqual(alto + margen);
    }
  });

  it('tiene al menos 4 puertos distintos dentro de la caja', () => {
    for (const [ancho, alto] of TAMANOS) {
      const puertos = puertosForma(forma, ancho, alto);
      expect(puertos.length).toBeGreaterThanOrEqual(4);
      expect(new Set(puertos.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`)).size).toBe(puertos.length);
      for (const p of puertos) {
        expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
        expect(p.x).toBeGreaterThanOrEqual(-0.011);
        expect(p.x).toBeLessThanOrEqual(ancho + 0.011);
        expect(p.y).toBeGreaterThanOrEqual(-0.011);
        expect(p.y).toBeLessThanOrEqual(alto + 0.011);
      }
    }
  });
});

// ─── Polígonos ────────────────────────────────────────────────────────────────

const POLIGONALES = TIPOS_FORMA.filter((t) => poligonoForma(t, 100, 100) !== undefined && t !== 'rectangulo');

describe('formas poligonales', () => {
  it('son todas las que no tienen curvas', () => {
    expect([...POLIGONALES].sort()).toEqual(
      ['rombo', 'triangulo', 'triangulo-rectangulo', 'trapecio', 'paralelogramo', 'pentagono', 'hexagono', 'octogono', 'estrella', 'cruz', 'flecha-derecha', 'flecha-izquierda', 'flecha-doble'].sort(),
    );
  });

  it.each(POLIGONALES)('%s: el trazado es exactamente su polígono', (forma) => {
    expect(trazadoForma(forma, 160, 100)).toBe(trazadoPoligono(poligonoForma(forma, 160, 100) ?? []));
  });

  it.each(POLIGONALES)('%s: escala sin deformar proporciones (2× el tamaño = 2× las coordenadas)', (forma) => {
    const a = poligonoForma(forma, 80, 50) ?? [];
    const b = poligonoForma(forma, 160, 100) ?? [];
    expect(b).toHaveLength(a.length);
    a.forEach((p, i) => {
      expect(b[i].x).toBeCloseTo(p.x * 2, 6);
      expect(b[i].y).toBeCloseTo(p.y * 2, 6);
    });
  });

  it.each(POLIGONALES)('%s: sus puertos están sobre el contorno', (forma) => {
    for (const [ancho, alto] of TAMANOS) {
      const poligono = poligonoForma(forma, ancho, alto) ?? [];
      for (const puerto of puertosForma(forma, ancho, alto)) {
        expect(distanciaAPoligono(puerto, poligono)).toBeLessThan(1e-6);
      }
    }
  });

  it.each(POLIGONALES)('%s: el rectángulo de texto cabe dentro de la forma', (forma) => {
    for (const [ancho, alto] of TAMANOS) {
      const poligono = poligonoForma(forma, ancho, alto) ?? [];
      const r = rectanguloTexto(forma, ancho, alto);
      for (const esquina of [{ x: r.x, y: r.y }, { x: r.x + r.ancho, y: r.y }, { x: r.x, y: r.y + r.alto }, { x: r.x + r.ancho, y: r.y + r.alto }]) {
        expect(dentroDePoligono(esquina, poligono)).toBe(true);
      }
    }
  });

  it('los parámetros por defecto también dejan el texto dentro (cada extremo del rango)', () => {
    for (const forma of POLIGONALES) {
      for (const def of FORMAS[forma].parametros) {
        for (const valor of [def.min, def.max]) {
          const opciones = { parametros: { [def.clave]: valor } };
          const poligono = poligonoForma(forma, 160, 100, opciones) ?? [];
          const r = rectanguloTexto(forma, 160, 100, opciones);
          for (const esquina of [{ x: r.x, y: r.y }, { x: r.x + r.ancho, y: r.y + r.alto }]) {
            expect(dentroDePoligono(esquina, poligono)).toBe(true);
          }
        }
      }
    }
  });

  it('valores exactos de un rombo y una flecha', () => {
    expect(trazadoForma('rombo', 100, 50)).toBe('M50,0 L100,25 L50,50 L0,25 Z');
    expect(trazadoForma('triangulo', 100, 80)).toBe('M50,0 L100,80 L0,80 Z');
    expect(poligonoForma('flecha-derecha', 100, 100, { parametros: { cabeza: 0.4, cuerpo: 0.5 } })).toEqual([
      { x: 0, y: 25 },
      { x: 60, y: 25 },
      { x: 60, y: 0 },
      { x: 100, y: 50 },
      { x: 60, y: 100 },
      { x: 60, y: 75 },
      { x: 0, y: 75 },
    ]);
  });

  it('la flecha izquierda es el espejo de la derecha', () => {
    const d = poligonoForma('flecha-derecha', 120, 60) ?? [];
    const i = poligonoForma('flecha-izquierda', 120, 60) ?? [];
    expect(i).toEqual(d.map((p) => ({ x: 120 - p.x, y: p.y })));
  });

  it('la estrella cambia de vértices con las puntas', () => {
    expect(poligonoForma('estrella', 100, 100)).toHaveLength(10);
    expect(poligonoForma('estrella', 100, 100, { parametros: { puntas: 8 } })).toHaveLength(16);
    expect(poligonoForma('estrella', 100, 100, { parametros: { puntas: 3 } })).toHaveLength(6);
    expect(poligonoForma('estrella', 100, 100, { parametros: { puntas: 5.4 } })).toHaveLength(10);
  });

  it('la estrella y el pentágono llenan su caja exactamente', () => {
    for (const forma of ['estrella', 'pentagono'] as const) {
      const p = poligonoForma(forma, 200, 120) ?? [];
      expect(Math.min(...p.map((q) => q.x))).toBeCloseTo(0, 6);
      expect(Math.max(...p.map((q) => q.x))).toBeCloseTo(200, 6);
      expect(Math.min(...p.map((q) => q.y))).toBeCloseTo(0, 6);
      expect(Math.max(...p.map((q) => q.y))).toBeCloseTo(120, 6);
    }
  });

  it('el parámetro de inclinación mueve las esquinas del trapecio', () => {
    const recto = poligonoForma('trapecio', 100, 50, { parametros: { inclinacion: 0 } }) ?? [];
    expect(recto[0]).toEqual({ x: 0, y: 0 });
    const inclinado = poligonoForma('trapecio', 100, 50, { parametros: { inclinacion: 0.4 } }) ?? [];
    expect(inclinado[0]).toEqual({ x: 40, y: 0 });
  });
});

// ─── Formas con curvas ────────────────────────────────────────────────────────

describe('formas curvas', () => {
  it.each(ELIPTICAS)('%s: sus puertos están sobre la elipse', (forma) => {
    for (const [ancho, alto] of TAMANOS) {
      const rx = forma === 'circulo' ? Math.min(ancho, alto) / 2 : ancho / 2;
      const ry = forma === 'circulo' ? Math.min(ancho, alto) / 2 : alto / 2;
      for (const p of puertosForma(forma, ancho, alto)) {
        const v = ((p.x - ancho / 2) / rx) ** 2 + ((p.y - alto / 2) / ry) ** 2;
        expect(v).toBeCloseTo(1, 6);
      }
    }
  });

  it.each(ELIPTICAS)('%s: las esquinas del texto caben dentro de la elipse', (forma) => {
    for (const [ancho, alto] of TAMANOS) {
      const rx = forma === 'circulo' ? Math.min(ancho, alto) / 2 : ancho / 2;
      const ry = forma === 'circulo' ? Math.min(ancho, alto) / 2 : alto / 2;
      const r = rectanguloTexto(forma, ancho, alto);
      for (const e of [{ x: r.x, y: r.y }, { x: r.x + r.ancho, y: r.y + r.alto }, { x: r.x + r.ancho, y: r.y }, { x: r.x, y: r.y + r.alto }]) {
        expect(((e.x - ancho / 2) / rx) ** 2 + ((e.y - alto / 2) / ry) ** 2).toBeLessThanOrEqual(1.0001);
      }
    }
  });

  it.each(ELIPTICAS)('%s: los radios del arco llenan su caja sin pasarse', (forma) => {
    for (const [ancho, alto] of TAMANOS) {
      const d = trazadoForma(forma, ancho, alto);
      const [rx, ry] = (/A([\d.]+),([\d.]+)/.exec(d) ?? []).slice(1).map(Number);
      const esperadoX = forma === 'circulo' ? Math.min(ancho, alto) / 2 : ancho / 2;
      const esperadoY = forma === 'circulo' ? Math.min(ancho, alto) / 2 : alto / 2;
      expect(rx).toBeCloseTo(esperadoX, 2);
      expect(ry).toBeCloseTo(esperadoY, 2);
      expect(rx * 2).toBeLessThanOrEqual(ancho + 0.011);
      expect(ry * 2).toBeLessThanOrEqual(alto + 0.011);
    }
  });

  it('el círculo sigue siendo círculo en una caja no cuadrada', () => {
    const pts = coordenadas(trazadoForma('circulo', 200, 80));
    expect(Math.max(...pts.map((p) => p.x)) - Math.min(...pts.map((p) => p.x))).toBeCloseTo(80, 6);
    expect(Math.min(...pts.map((p) => p.x))).toBeCloseTo(60, 6);
  });

  it('el rectángulo sin radio es un polígono y con radio usa arcos', () => {
    expect(trazadoForma('rectangulo', 100, 50)).toBe('M0,0 L100,0 L100,50 L0,50 Z');
    expect(trazadoForma('rectangulo', 100, 50, { radio: 10 })).toContain('A10,10');
  });

  it('el radio del rectángulo se limita a la mitad del lado menor y se ignora si es inválido', () => {
    expect(trazadoForma('rectangulo', 100, 50, { radio: 1e6 })).toBe(trazadoForma('rectangulo', 100, 50, { radio: 25 }));
    expect(trazadoForma('rectangulo', 100, 50, { radio: -5 })).toBe(trazadoForma('rectangulo', 100, 50));
    expect(trazadoForma('rectangulo', 100, 50, { radio: Number.NaN })).toBe(trazadoForma('rectangulo', 100, 50));
  });

  it('el rectángulo redondeado depende de su parámetro, no del radio del estilo', () => {
    const a = trazadoForma('rectangulo-redondeado', 100, 50, { parametros: { esquina: 0.1 }, radio: 40 });
    const b = trazadoForma('rectangulo-redondeado', 100, 50, { parametros: { esquina: 0.1 } });
    expect(a).toBe(b);
    expect(trazadoForma('rectangulo-redondeado', 100, 50, { parametros: { esquina: 0.4 } })).not.toBe(b);
  });

  it('el cilindro tiene silueta y tapa como dos subtrazados cerrados', () => {
    const d = trazadoForma('cilindro', 100, 130);
    expect(d.match(/M/g)).toHaveLength(2);
    expect(d.match(/Z/g)).toHaveLength(2);
  });

  it('la llave se cierra y su ancho total no pasa del de la caja aunque cambie el grosor', () => {
    for (const grosor of [0.04, 0.12, 0.3]) {
      const pts = coordenadas(trazadoForma('llave', 60, 200, { parametros: { grosor } }));
      expect(Math.max(...pts.map((p) => p.x))).toBeLessThanOrEqual(60.011);
      expect(Math.min(...pts.map((p) => p.x))).toBeGreaterThanOrEqual(-0.011);
    }
  });

  it('los puertos de la llave son la punta, las dos tapas y el dorso', () => {
    const [arriba, derecha, abajo, izquierda] = puertosForma('llave', 60, 200);
    expect(izquierda).toEqual({ x: 0, y: 100 });
    expect(arriba.y).toBe(0);
    expect(abajo.y).toBe(200);
    expect(derecha.y).toBe(50);
  });

  it('la nube escala a cualquier caja y sus puertos acompañan', () => {
    const [arriba, derecha, abajo, izquierda] = puertosForma('nube', 200, 108);
    expect(arriba.x).toBeCloseTo(115, 6);
    expect(derecha.x).toBeCloseTo(195.75, 6);
    expect(abajo.y).toBeCloseTo(104, 6);
    expect(izquierda.x).toBeCloseTo(6, 6);
  });

  it('la cola del globo de texto sigue su parámetro y siempre queda dentro de la caja', () => {
    const [, , colaIzquierda] = puertosForma('callout', 200, 100, { parametros: { cola: 0.1 } });
    const [, , colaDerecha] = puertosForma('callout', 200, 100, { parametros: { cola: 0.7 } });
    expect(colaDerecha.x).toBeGreaterThan(colaIzquierda.x);
    expect(colaIzquierda.y).toBe(100);
    for (const cola of [0, 0.1, 0.5, 0.7, 1, 9]) {
      for (const p of coordenadas(trazadoForma('callout', 200, 100, { parametros: { cola } }))) {
        expect(p.x).toBeGreaterThanOrEqual(-0.011);
        expect(p.x).toBeLessThanOrEqual(200.011);
        expect(p.y).toBeLessThanOrEqual(100.011);
      }
    }
  });
});

// ─── Parámetros ───────────────────────────────────────────────────────────────

describe('resolverParametros', () => {
  it('cada parámetro declarado tiene un rango coherente y un valor por defecto dentro de él', () => {
    for (const t of TIPOS_FORMA) {
      const claves = new Set<string>();
      for (const p of FORMAS[t].parametros) {
        expect(claves.has(p.clave)).toBe(false);
        claves.add(p.clave);
        expect(p.min).toBeLessThan(p.max);
        expect(p.porDefecto).toBeGreaterThanOrEqual(p.min);
        expect(p.porDefecto).toBeLessThanOrEqual(p.max);
        expect(p.paso).toBeGreaterThan(0);
        expect(p.etiqueta.length).toBeGreaterThan(0);
      }
    }
  });

  it('sin entrada devuelve los valores por defecto', () => {
    expect(resolverParametros('estrella')).toEqual({ puntas: 5, radioInterior: 0.4 });
    expect(resolverParametros('rombo')).toEqual({});
  });

  it('acota los fuera de rango, ignora los no numéricos y descarta claves desconocidas', () => {
    expect(resolverParametros('estrella', { puntas: 99, radioInterior: -1, intruso: 7 })).toEqual({ puntas: 12, radioInterior: 0.2 });
    expect(resolverParametros('estrella', { puntas: Number.NaN, radioInterior: Infinity })).toEqual({ puntas: 5, radioInterior: 0.4 });
    expect(resolverParametros('estrella', { puntas: 'ocho' as unknown as number })).toEqual({ puntas: 5, radioInterior: 0.4 });
  });

  it('un parámetro fuera de rango nunca rompe el trazado', () => {
    for (const t of TIPOS_FORMA) {
      const sucios: Record<string, number> = {};
      for (const p of FORMAS[t].parametros) sucios[p.clave] = p.max * 1000;
      for (const n of numeros(trazadoForma(t, 100, 80, { parametros: sucios }))) expect(Number.isFinite(n)).toBe(true);
      for (const p of FORMAS[t].parametros) sucios[p.clave] = -p.max * 1000;
      for (const n of numeros(trazadoForma(t, 100, 80, { parametros: sucios }))) expect(Number.isFinite(n)).toBe(true);
    }
  });
});

describe('tamaños degenerados', () => {
  it.each([0, -50, Number.NaN, Infinity, 0.0001])('un tamaño de %s no produce números inválidos', (valor) => {
    for (const t of TIPOS_FORMA) {
      expect(() => trazadoForma(t, valor, valor)).not.toThrow();
      for (const n of numeros(trazadoForma(t, valor, 50))) expect(Number.isFinite(n)).toBe(true);
      for (const p of puertosForma(t, 50, valor)) expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
      const r = rectanguloTexto(t, valor, valor);
      expect(Number.isFinite(r.x) && Number.isFinite(r.ancho)).toBe(true);
    }
  });
});
