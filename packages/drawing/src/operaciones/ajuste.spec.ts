import { describe, expect, it } from 'vitest';
import { ajustar, ajustarCaja } from './ajuste.js';
import { escena, forma, linea } from './util-pruebas.js';

describe('ajustarCaja a otros elementos', () => {
  const e = escena(forma('ref', 200, 100, 100, 100));

  it('imanta el borde izquierdo al borde izquierdo de otro y muestra la guía', () => {
    const r = ajustarCaja({ x: 203, y: 400, ancho: 50, alto: 50 }, e);
    expect(r.dx).toBe(-3);
    expect(r.dy).toBe(0);
    expect(r.guias).toContainEqual({ orientacion: 'vertical', posicion: 200, desde: 100, hasta: 450 });
  });

  it('imanta centro con centro', () => {
    const r = ajustarCaja({ x: 227, y: 400, ancho: 50, alto: 50 }, e);
    // centro de la caja = 252; centro de ref = 250
    expect(r.dx).toBe(-2);
    expect(r.guias.some((g) => g.orientacion === 'vertical' && g.posicion === 250)).toBe(true);
  });

  it('imanta en vertical (el borde de abajo con el de arriba de otro)', () => {
    const r = ajustarCaja({ x: 600, y: 54, ancho: 50, alto: 50 }, e);
    expect(r.dy).toBe(-4);
    expect(r.guias.some((g) => g.orientacion === 'horizontal' && g.posicion === 100)).toBe(true);
  });

  it('puede imantar en los dos ejes a la vez', () => {
    const r = ajustarCaja({ x: 305, y: 197, ancho: 40, alto: 40 }, e);
    expect(r).toMatchObject({ dx: -5, dy: 3 });
    expect(r.guias).toHaveLength(2);
  });

  it('fuera del umbral no corrige ni muestra guías', () => {
    const r = ajustarCaja({ x: 100, y: 450, ancho: 30, alto: 30 }, e);
    expect(r).toEqual({ dx: 0, dy: 0, guias: [] });
  });

  it('el umbral es configurable', () => {
    expect(ajustarCaja({ x: 210, y: 450, ancho: 30, alto: 30 }, e, { umbral: 3 }).dx).toBe(0);
    expect(ajustarCaja({ x: 210, y: 450, ancho: 30, alto: 30 }, e, { umbral: 12 }).dx).toBe(-10);
  });

  it('no usa de referencia a lo que se está moviendo', () => {
    const r = ajustarCaja({ x: 203, y: 400, ancho: 50, alto: 50 }, e, { excluir: ['ref'] });
    expect(r.dx).toBe(0);
  });

  it('no usa de referencia a lo oculto', () => {
    const o = escena(forma('ref', 200, 100, 100, 100, { oculto: true }));
    expect(ajustarCaja({ x: 203, y: 400, ancho: 50, alto: 50 }, o).dx).toBe(0);
  });

  it('también imanta a los bordes y al centro de la escena', () => {
    const vacia = escena();
    expect(ajustarCaja({ x: 4, y: 300, ancho: 50, alto: 50 }, vacia).dx).toBe(-4);
    expect(ajustarCaja({ x: 500 - 25 + 3, y: 300, ancho: 50, alto: 50 }, vacia).dx).toBe(-3); // centro de la escena (1000 / 2)
  });

  it('con guías desactivadas ignora a los elementos y a la escena', () => {
    expect(ajustarCaja({ x: 203, y: 4, ancho: 50, alto: 50 }, e, { guias: false })).toEqual({ dx: 0, dy: 0, guias: [] });
  });

  it('elige la corrección más chica cuando hay varias', () => {
    const dos = escena(forma('a', 200, 100, 50, 50), forma('b', 206, 300, 50, 50));
    expect(ajustarCaja({ x: 207, y: 450, ancho: 20, alto: 20 }, dos).dx).toBe(-1);
  });
});

describe('ajustarCaja a la cuadrícula', () => {
  const vacia = escena();

  it('lleva la esquina a la intersección más cercana', () => {
    expect(ajustarCaja({ x: 47, y: 103, ancho: 30, alto: 30 }, vacia, { cuadricula: 20, guias: false })).toEqual({ dx: -7, dy: -3, guias: [] });
    expect(ajustarCaja({ x: 54, y: 100, ancho: 30, alto: 30 }, vacia, { cuadricula: 20, guias: false })).toEqual({ dx: 6, dy: 0, guias: [] });
  });

  it('ya sobre la cuadrícula no corrige', () => {
    expect(ajustarCaja({ x: 40, y: 100, ancho: 30, alto: 30 }, vacia, { cuadricula: 20, guias: false })).toEqual({ dx: 0, dy: 0, guias: [] });
  });

  it('una guía tiene prioridad sobre la cuadrícula en ese eje', () => {
    const e = escena(forma('ref', 203, 0, 50, 50));
    const r = ajustarCaja({ x: 201, y: 400, ancho: 30, alto: 30 }, e, { cuadricula: 20 });
    expect(r.dx).toBe(2); // a la guía en 203, no a la cuadrícula en 200
  });

  it('una cuadrícula inválida se ignora', () => {
    expect(ajustarCaja({ x: 47, y: 103, ancho: 30, alto: 30 }, vacia, { cuadricula: 0, guias: false }).dx).toBe(0);
    expect(ajustarCaja({ x: 47, y: 103, ancho: 30, alto: 30 }, vacia, { cuadricula: -5, guias: false }).dx).toBe(0);
  });
});

describe('ajustar un punto', () => {
  it('a la cuadrícula', () => {
    expect(ajustar({ x: 38, y: 61 }, escena(), { cuadricula: 20, guias: false }).punto).toEqual({ x: 40, y: 60 });
  });

  it('al borde de otro elemento, con su guía', () => {
    const e = escena(forma('ref', 200, 100, 100, 100));
    const r = ajustar({ x: 297, y: 500 }, e);
    expect(r.punto).toEqual({ x: 300, y: 500 });
    expect(r.guias.some((g) => g.orientacion === 'vertical' && g.posicion === 300)).toBe(true);
  });

  it('un punto lejos de todo queda igual', () => {
    expect(ajustar({ x: 123, y: 456 }, escena(forma('r', 800, 10, 10, 10)))).toEqual({ punto: { x: 123, y: 456 }, guias: [] });
  });
});

describe('ajustarCaja a las guías de la persona (Y16a)', () => {
  // La página mide 1000 × 600: las posiciones están lejos de sus bordes y de su centro, para que solo cuente la guía.
  const vacia = escena();
  const v203 = { orientacion: 'vertical' as const, posicion: 203 };
  const h153 = { orientacion: 'horizontal' as const, posicion: 153 };
  const caja = { x: 200, y: 150, ancho: 40, alto: 40 };

  it('imanta el borde o el centro de la caja a una guía vertical y a una horizontal', () => {
    expect(ajustarCaja(caja, vacia, { guiasUsuario: [v203] })).toMatchObject({ dx: 3, dy: 0 });
    // El centro (x + 20 = 206) va a 203.
    expect(ajustarCaja({ ...caja, x: 186 }, vacia, { guiasUsuario: [v203] }).dx).toBe(-3);
    expect(ajustarCaja(caja, vacia, { guiasUsuario: [h153] })).toMatchObject({ dx: 0, dy: 3 });
    expect(ajustarCaja(caja, vacia, { guiasUsuario: [v203, h153] })).toMatchObject({ dx: 3, dy: 3 });
  });

  it('una guía vertical no imanta en y, ni una horizontal en x', () => {
    expect(ajustarCaja(caja, vacia, { guiasUsuario: [{ orientacion: 'vertical', posicion: 151 }] })).toMatchObject({ dx: 0, dy: 0 });
    expect(ajustarCaja(caja, vacia, { guiasUsuario: [{ orientacion: 'horizontal', posicion: 201 }] })).toMatchObject({ dx: 0, dy: 0 });
  });

  it('solo imanta dentro del umbral', () => {
    expect(ajustarCaja({ ...caja, x: 190 }, vacia, { guiasUsuario: [v203] }).dx).toBe(0);
    expect(ajustarCaja({ ...caja, x: 190 }, vacia, { guiasUsuario: [v203], umbral: 15 }).dx).toBe(-7); // el centro (210) queda más cerca que el borde (190)
  });

  it('imantan aunque las guías de los elementos estén apagadas', () => {
    expect(ajustarCaja(caja, vacia, { guias: false, guiasUsuario: [v203] }).dx).toBe(3);
  });

  it('sin guías de la persona no cambia nada', () => {
    expect(ajustarCaja(caja, vacia, { guiasUsuario: [] })).toEqual(ajustarCaja(caja, vacia));
  });

  it('gana la más cercana entre la guía de la persona y el borde de otra forma', () => {
    const e = escena(forma('ref', 400, 100, 100, 100));
    const c = { x: 403, y: 400, ancho: 50, alto: 50 };
    // El borde izquierdo de «ref» está en 400 (a 3) y la guía en 405 (a 2): gana la guía.
    expect(ajustarCaja(c, e, { guiasUsuario: [{ orientacion: 'vertical', posicion: 405 }] }).dx).toBe(2);
    // Con la guía en 407 (a 4) gana el borde.
    expect(ajustarCaja(c, e, { guiasUsuario: [{ orientacion: 'vertical', posicion: 407 }] }).dx).toBe(-3);
  });

  it('a igual distancia gana la guía de la persona', () => {
    const e = escena(forma('ref', 400, 100, 100, 100));
    // El borde izquierdo de «ref» (400) está a 3 hacia la izquierda y la guía (406) a 3 hacia la derecha.
    expect(ajustarCaja({ x: 403, y: 400, ancho: 50, alto: 50 }, e, { guiasUsuario: [{ orientacion: 'vertical', posicion: 406 }] }).dx).toBe(3);
  });

  it('una guía tiene prioridad sobre la cuadrícula en su eje, y la cuadrícula sigue mandando en el otro', () => {
    // Sin la guía, la cuadrícula de 20 llevaría x=303 a 300 (-3) y y=101 a 100 (-1).
    const r = ajustarCaja({ x: 303, y: 101, ancho: 40, alto: 40 }, vacia, { cuadricula: 20, guiasUsuario: [{ orientacion: 'vertical', posicion: 307 }] });
    expect(r.dx).toBe(4);
    expect(r.dy).toBe(-1);
  });

  it('ajustar (un punto) también imanta a las guías', () => {
    expect(ajustar({ x: 201, y: 152 }, vacia, { guiasUsuario: [v203, h153] }).punto).toEqual({ x: 203, y: 153 });
  });
});

describe('espaciado igual y cotas (Y16b)', () => {
  const opc = { espaciado: true, guias: false } as const;
  // Fila: A (0–100) y B (400–500) a la misma altura; se mueve una caja de 100 × 60.
  const fila = (): ReturnType<typeof escena> => escena(forma('A', 0, 100, 100, 60), forma('B', 400, 100, 100, 60));
  const caja = (x: number, y = 100): { x: number; y: number; ancho: number; alto: number } => ({ x, y, ancho: 100, alto: 60 });
  const huecos = (r: ReturnType<typeof ajustarCaja>): number[] => (r.cotas ?? []).filter((c) => c.igual).map((c) => c.valor);

  it('entre dos formas: si los dos huecos van a ser iguales se imanta al reparto exacto y marca las cotas', () => {
    const r = ajustarCaja(caja(203), fila(), opc);
    // Hueco libre = 400 − 100 − 100 = 200 → 100 a cada lado: x = 200.
    expect(r.dx).toBe(-3);
    expect(huecos(r)).toEqual([100, 100]);
    const [izq, der] = (r.cotas ?? []).filter((c) => c.igual);
    expect(izq).toMatchObject({ orientacion: 'horizontal', desde: 100, hasta: 200, posicion: 130 });
    expect(der).toMatchObject({ orientacion: 'horizontal', desde: 300, hasta: 400, posicion: 130 });
  });

  it('con tamaños distintos: reparte según el tamaño de la que se mueve', () => {
    const e = escena(forma('A', 0, 100, 50, 60), forma('B', 500, 100, 150, 60));
    // Libre = 500 − 50 − 100 = 350 → 175 a cada lado: x = 225.
    const r = ajustarCaja(caja(230), e, opc);
    expect(r.dx).toBe(-5);
    expect(huecos(r)).toEqual([175, 175]);
  });

  it('en columna: lo mismo en el eje vertical', () => {
    const e = escena(forma('A', 100, 0, 100, 50), forma('B', 100, 400, 100, 50));
    const r = ajustarCaja({ x: 100, y: 178, ancho: 100, alto: 60 }, e, opc);
    // Libre = 400 − 50 − 60 = 290 → 145: y = 195.
    expect(r.dy).toBe(0); // a 17 del reparto: fuera del umbral
    const r2 = ajustarCaja({ x: 100, y: 198, ancho: 100, alto: 60 }, e, opc);
    expect(r2.dy).toBe(-3);
    expect((r2.cotas ?? []).filter((c) => c.igual).map((c) => [c.orientacion, c.valor])).toEqual([['vertical', 145], ['vertical', 145]]);
  });

  it('tres o más formas en fila: repite el hueco que ya hay entre las dos vecinas del mismo lado', () => {
    // A (0–100) y B (200–300): hueco 100. Una tercera va a 300 + 100 = 400.
    const e = escena(forma('A', 0, 100, 100, 60), forma('B', 200, 100, 100, 60));
    const r = ajustarCaja(caja(403), e, opc);
    expect(r.dx).toBe(-3);
    expect(huecos(r)).toEqual([100, 100]);
    // Y por el otro lado: C (600–700) y D (800–900) con hueco 100; la nueva va a 600 − 100 − 100 = 400.
    const e2 = escena(forma('C', 600, 100, 100, 60), forma('D', 800, 100, 100, 60));
    expect(ajustarCaja(caja(397), e2, opc).dx).toBe(3);
  });

  it('con cuatro formas en fila: se reparte con la vecina de cada lado', () => {
    const e = escena(forma('A', 0, 100, 100, 60), forma('B', 200, 100, 100, 60), forma('C', 700, 100, 100, 60), forma('D', 900, 100, 100, 60));
    // Entre B (300) y C (700) caben 400 − 100 = 300 → 150 a cada lado: x = 450.
    expect(ajustarCaja(caja(453), e, opc).dx).toBe(-3);
  });

  it('la tolerancia es en píxeles de pantalla: umbral 24 con zoom 0,25 y 1,5 con zoom 4', () => {
    const e = fila();
    const umbral = (zoom: number): number => 6 / zoom;
    // A 20 unidades del reparto: entra con zoom 0,25 (24) y no con zoom 1 (6) ni con 4 (1,5).
    expect(ajustarCaja(caja(220), e, { ...opc, umbral: umbral(0.25) }).dx).toBe(-20);
    expect(ajustarCaja(caja(220), e, { ...opc, umbral: umbral(1) }).dx).toBe(0);
    // A 1 unidad: entra con zoom 4 y a 2 no.
    expect(ajustarCaja(caja(201), e, { ...opc, umbral: umbral(4) }).dx).toBe(-1);
    expect(ajustarCaja(caja(202), e, { ...opc, umbral: umbral(4) }).dx).toBe(0);
  });

  it('las bloqueadas, las ocultas y los conectores no cuentan como vecinas', () => {
    const base = [forma('A', 0, 100, 100, 60), forma('B', 400, 100, 100, 60)];
    expect(ajustarCaja(caja(203), escena(base[0]!, forma('B', 400, 100, 100, 60, { bloqueado: true })), opc).dx).toBe(0);
    expect(ajustarCaja(caja(203), escena(base[0]!, forma('B', 400, 100, 100, 60, { oculto: true })), opc).dx).toBe(0);
    // Un conector con caja (diagonal) tampoco: sin esta regla contaría como la vecina de la derecha.
    expect(ajustarCaja(caja(203), escena(base[0]!, linea('B', [[400, 100], [500, 160]])), opc).dx).toBe(0);
    // Y las que se están moviendo tampoco: no pueden ser su propia vecina.
    expect(ajustarCaja(caja(203), fila(), { ...opc, excluir: ['B'] }).dx).toBe(0);
  });

  it('solo cuentan las que están en la misma fila (se solapan en el otro eje)', () => {
    const e = escena(forma('A', 0, 100, 100, 60), forma('B', 400, 300, 100, 60));
    expect(ajustarCaja(caja(203), e, opc).dx).toBe(0);
    // Si apenas se rozan (sin solaparse) tampoco.
    const rozan = escena(forma('A', 0, 160, 100, 60), forma('B', 400, 160, 100, 60));
    expect(ajustarCaja(caja(203), rozan, opc).dx).toBe(0);
  });

  it('sin la opción `espaciado` no imanta ni da cotas (comportamiento de siempre)', () => {
    const r = ajustarCaja(caja(203), fila(), { guias: false });
    expect(r).toEqual({ dx: 0, dy: 0, guias: [] });
    expect(r.cotas).toBeUndefined();
  });

  it('un punto (sin tamaño) no usa el espaciado', () => {
    expect(ajustar({ x: 203, y: 130 }, fila(), { ...opc }).punto).toEqual({ x: 203, y: 130 });
  });

  it('una guía (de un elemento o de la persona) manda sobre el reparto, y el reparto sobre la cuadrícula', () => {
    // La guía de la persona en 202 le gana al reparto (200): el reparto no se aplica en ese eje.
    expect(ajustarCaja(caja(203), fila(), { ...opc, guiasUsuario: [{ orientacion: 'vertical', posicion: 202 }] }).dx).toBe(-1);
    // La cuadrícula de 30 llevaría 203 a 210; el reparto lo lleva a 200.
    expect(ajustarCaja(caja(203), fila(), { ...opc, cuadricula: 30 }).dx).toBe(-3);
    expect(ajustarCaja(caja(203), fila(), { espaciado: false, guias: false, cuadricula: 30 }).dx).toBe(7); // sin el reparto, la cuadrícula lo llevaría a 210
  });

  it('cotas de distancia: a la vecina más cercana alineada de cada lado', () => {
    const e = escena(forma('izq', 0, 100, 80, 60), forma('izq2', 20, 100, 30, 60), forma('der', 600, 100, 100, 60), forma('arriba', 200, 0, 100, 40), forma('lejos', 300, 400, 100, 60));
    const r = ajustarCaja({ x: 250, y: 100, ancho: 100, alto: 60 }, e, { espaciado: true, guias: false, umbral: 0 });
    const d = (r.cotas ?? []).filter((c) => !c.igual);
    // Izquierda: la más cercana (80, no 50); derecha: 600; arriba: 40; abajo: «lejos» se solapa en x (300–400) y está a 400 − 160 = 240.
    expect(d.map((c) => [c.orientacion, c.desde, c.hasta, c.valor])).toEqual(
      expect.arrayContaining([
        ['horizontal', 80, 250, 170],
        ['horizontal', 350, 600, 250],
        ['vertical', 40, 100, 60],
        ['vertical', 160, 400, 240],
      ]),
    );
    expect(d).toHaveLength(4);
  });

  it('una forma que no está alineada no da cota, y sin vecinas no hay cotas', () => {
    const e = escena(forma('X', 0, 400, 100, 60));
    expect(ajustarCaja({ x: 250, y: 100, ancho: 100, alto: 60 }, e, { espaciado: true, guias: false }).cotas).toEqual([]);
    expect(ajustarCaja({ x: 250, y: 100, ancho: 100, alto: 60 }, escena(), { espaciado: true }).cotas).toEqual([]);
  });

  it('en el reparto no se repite la misma cota como distancia', () => {
    const r = ajustarCaja(caja(203), fila(), opc);
    const mismas = (r.cotas ?? []).filter((c) => c.orientacion === 'horizontal');
    expect(mismas).toHaveLength(2);
    expect(mismas.every((c) => c.igual)).toBe(true);
  });
});

describe('espaciado igual: barrido contra una referencia ingenua (Y16b)', () => {
  /** Generador con semilla (mulberry32). */
  function azar(semilla: number): () => number {
    let a = semilla >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  type C = { x: number; y: number; ancho: number; alto: number };

  /** Referencia: recorre TODAS las vecinas de la fila con bucles, sin ordenar, y prueba las tres reglas. */
  function ingenuo(caja: C, vecinas: C[], umbral: number): number {
    const fila = vecinas.filter((v) => Math.min(caja.y + caja.alto, v.y + v.alto) - Math.max(caja.y, v.y) > 0.01);
    const cx = caja.x + caja.ancho / 2;
    const c = (v: C): number => v.x + v.ancho / 2;
    let L: C | undefined;
    let R: C | undefined;
    for (const v of fila) {
      if (c(v) < cx && (!L || c(v) > c(L))) L = v;
      if (c(v) >= cx && (!R || c(v) < c(R))) R = v;
    }
    let LL: C | undefined;
    let RR: C | undefined;
    for (const v of fila) {
      if (L && v !== L && c(v) < c(L) && (!LL || c(v) > c(LL))) LL = v;
      if (R && v !== R && c(v) > c(R) && (!RR || c(v) < c(RR))) RR = v;
    }
    const cand: number[] = [];
    if (L && R) {
      const libre = R.x - (L.x + L.ancho) - caja.ancho;
      if (libre >= 0) cand.push(L.x + L.ancho + libre / 2 - caja.x);
    }
    if (L && LL) {
      const h = L.x - (LL.x + LL.ancho);
      if (h >= 0) cand.push(L.x + L.ancho + h - caja.x);
    }
    if (R && RR) {
      const h = RR.x - (R.x + R.ancho);
      if (h >= 0) cand.push(R.x - h - caja.ancho - caja.x);
    }
    let mejor = 0;
    let dist = Infinity;
    for (const d of cand) if (Math.abs(d) <= umbral && Math.abs(d) < dist) {
      mejor = d;
      dist = Math.abs(d);
    }
    return mejor;
  }

  it('coincide con la referencia en 300 escenas al azar, barriendo la posición de la caja', () => {
    const r = azar(20261023);
    let comparaciones = 0;
    let imanes = 0;
    for (let n = 0; n < 300; n++) {
      const cuantas = 2 + Math.floor(r() * 6);
      // Una fila de formas de tamaños distintos con huecos al azar (algunas bloqueadas).
      let x = Math.floor(r() * 50);
      const crudas: Array<Record<string, unknown>> = [];
      const vecinas: C[] = [];
      for (let i = 0; i < cuantas; i++) {
        const ancho = 20 + Math.floor(r() * 120);
        const alto = 30 + Math.floor(r() * 100);
        const y = 100 + Math.floor(r() * 60) - 30;
        const bloqueada = r() < 0.15;
        crudas.push(forma(`f${i}`, x, y, ancho, alto, bloqueada ? { bloqueado: true } : {}));
        if (!bloqueada) vecinas.push({ x, y, ancho, alto });
        x += ancho + Math.floor(r() * 150);
      }
      const e = escena(...crudas);
      const ancho = 30 + Math.floor(r() * 90);
      const alto = 40 + Math.floor(r() * 80);
      for (let px = -20; px <= x + 40; px += 7) {
        const c = { x: px, y: 110, ancho, alto };
        const umbral = [1.5, 6, 24][Math.floor(r() * 3)] as number;
        const esperado = ingenuo(c, vecinas, umbral);
        const obtenido = ajustarCaja(c, e, { espaciado: true, guias: false, umbral }).dx;
        expect(obtenido, `escena ${n}, x ${px}, umbral ${umbral}`).toBeCloseTo(esperado, 6);
        comparaciones++;
        if (esperado !== 0) imanes++;
      }
    }
    expect(comparaciones).toBeGreaterThan(5000);
    // Para que la propiedad diga algo: una parte de los casos tiene que imantar de verdad.
    expect(imanes).toBeGreaterThan(50);
  });
});

describe('espaciado igual: rendimiento con 500 elementos (DW9)', () => {
  it('cada movimiento calcula en menos de 2 ms por fotograma', () => {
    const crudas: Array<Record<string, unknown>> = [];
    for (let i = 0; i < 500; i++) crudas.push(forma(`f${i}`, (i % 25) * 140, Math.floor(i / 25) * 90, 100, 60));
    const e = escena(...crudas);
    const opciones = { espaciado: true, guias: true, umbral: 6, excluir: ['f0'] };
    for (let i = 0; i < 30; i++) ajustarCaja({ x: 500 + i, y: 300, ancho: 100, alto: 60 }, e, opciones); // calentamiento
    const veces = 300;
    const t0 = performance.now();
    for (let i = 0; i < veces; i++) ajustarCaja({ x: 500 + (i % 40), y: 300 + (i % 7), ancho: 100, alto: 60 }, e, opciones);
    const porFotograma = (performance.now() - t0) / veces;
    expect(porFotograma).toBeLessThan(2);
  });
});
