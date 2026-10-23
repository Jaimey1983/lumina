import { describe, expect, it } from 'vitest';
import { cantidadDePuertos, ladoDePuerto, puntoDePuerto } from '../conectores/puertos.js';
import { FORMAS } from '../formas/index.js';
import { normalizarEscena } from '../normalizar.js';
import { TIPOS_FORMA, type Escena, type Forma, type Linea, type TipoForma } from '../tipos.js';
import { cambiarForma, puertoEquivalente } from './cambiar-forma.js';
import { escena, forma, grupo, linea, texto } from './util-pruebas.js';

const f = (e: Escena, id: string): Forma => e.elementos.find((x) => x.id === id) as Forma;
const l = (e: Escena, id: string): Linea => e.elementos.find((x) => x.id === id) as Linea;
const de = (tipo: TipoForma, extra: Record<string, unknown> = {}): Record<string, unknown> => forma('a', 100, 100, 160, 100, { forma: tipo, ...extra });

/** Una escena con una forma `tipo` y un conector pegado a cada uno de sus 4 puertos. */
function conConectores(tipo: TipoForma, rotacion = 0): Escena {
  const base = escena(
    forma('a', 100, 100, 160, 100, { forma: tipo, transformacion: { x: 100, y: 100, ancho: 160, alto: 100, rotacion } }),
    ...[0, 1, 2, 3].map((i) => linea(`c${i}`, [[600, 50 + i * 100], [300, 150]], { destino: { elementoId: 'a', puerto: i } })),
    ...[0, 1, 2, 3].map((i) => linea(`o${i}`, [[300, 150], [600, 50 + i * 100]], { origen: { elementoId: 'a', puerto: i } })),
  );
  return base;
}

describe('cambiarForma: qué se conserva', () => {
  const base = (): Escena =>
    escena(
      forma('z', 0, 0),
      de('rectangulo-redondeado', {
        texto: 'Hola',
        nombre: 'Mi caja',
        descripcion: 'una caja',
        transformacion: { x: 100, y: 100, ancho: 160, alto: 100, rotacion: 33 },
        estilo: { relleno: { tipo: 'solido', color: '#FF0000' }, opacidad: 0.5, sombra: { color: '#00000055', desenfoque: 4, dx: 1, dy: 2 }, contorno: { color: '#111111', grosor: 3, patron: 'guiones' }, radio: 7 },
        estiloTexto: { negrita: true, tamano: 22 },
        parametros: { esquina: 0.3 },
      }),
      forma('y', 500, 500),
    );

  it('cambia el tipo y deja todo lo demás igual, incluido el lugar en el apilado', () => {
    const e = base();
    const r = cambiarForma(e, ['a'], 'rombo');
    expect(f(r, 'a').forma).toBe('rombo');
    expect(r.elementos.map((x) => x.id)).toEqual(['z', 'a', 'y']);
    const sinTipo = (x: Forma): Record<string, unknown> => Object.fromEntries(Object.entries(x).filter(([k]) => k !== 'forma' && k !== 'parametros'));
    const resto = sinTipo(f(r, 'a'));
    const restoViejo = sinTipo(f(e, 'a'));
    expect(resto).toEqual(restoViejo);
    expect(f(r, 'a').transformacion).toEqual({ x: 100, y: 100, ancho: 160, alto: 100, rotacion: 33 });
    expect(f(r, 'z')).toEqual(f(e, 'z'));
    expect(f(r, 'y')).toEqual(f(e, 'y'));
  });

  it('un círculo queda dentro de la misma caja (no se vuelve cuadrada)', () => {
    const r = cambiarForma(base(), ['a'], 'circulo');
    expect(f(r, 'a').transformacion).toMatchObject({ ancho: 160, alto: 100 });
  });

  it('cambia las formas de un grupo, pero no los textos ni los conectores elegidos con ellas', () => {
    const e = escena(forma('a', 0, 0), forma('b', 200, 0), texto('t', 0, 200), linea('l', [[0, 300], [100, 300]]), grupo('g', ['a', 'b']));
    const r = cambiarForma(e, ['g', 't', 'l'], 'elipse');
    expect(f(r, 'a').forma).toBe('elipse');
    expect(f(r, 'b').forma).toBe('elipse');
    expect(r.elementos.find((x) => x.id === 't')).toEqual(e.elementos.find((x) => x.id === 't'));
    expect(r.elementos.find((x) => x.id === 'l')).toEqual(e.elementos.find((x) => x.id === 'l'));
  });

  it('no toca lo bloqueado (ni lo que está dentro de un grupo bloqueado)', () => {
    const e = escena(forma('a', 0, 0, 100, 60, { bloqueado: true }), forma('b', 200, 0), forma('c', 400, 0), forma('d', 600, 0), grupo('g', ['c', 'd'], { bloqueado: true }));
    const r = cambiarForma(e, ['a', 'b', 'g'], 'rombo');
    expect(f(r, 'a').forma).toBe('rectangulo');
    expect(f(r, 'b').forma).toBe('rombo');
    expect(f(r, 'c').forma).toBe('rectangulo');
    expect(f(r, 'd').forma).toBe('rectangulo');
  });
});

describe('cambiarForma: devuelve la misma escena si no cambia nada', () => {
  const e = escena(forma('a', 0, 0), texto('t', 0, 100), linea('l', [[0, 200], [50, 200]]), forma('b', 300, 0, 100, 60, { bloqueado: true }));
  it.each([
    ['el mismo tipo', ['a'], 'rectangulo'],
    ['solo textos o conectores', ['t', 'l'], 'rombo'],
    ['todo bloqueado', ['b'], 'rombo'],
    ['ids que no existen', ['nada'], 'rombo'],
    ['ninguna selección', [], 'rombo'],
  ] as const)('%s', (_n, ids, tipo) => {
    expect(cambiarForma(e, ids, tipo)).toBe(e);
  });
  it('un tipo que no existe', () => {
    expect(cambiarForma(e, ['a'], 'no-existe' as TipoForma)).toBe(e);
  });
});

describe('cambiarForma: parametros', () => {
  it('se conserva la clave que la forma nueva declara con el mismo rango', () => {
    const e = escena(de('trapecio', { parametros: { inclinacion: 0.4 } }));
    expect(f(cambiarForma(e, ['a'], 'paralelogramo'), 'a').parametros).toEqual({ inclinacion: 0.4 });
    expect(f(cambiarForma(e, ['a'], 'trapecio-invertido'), 'a').parametros).toEqual({ inclinacion: 0.4 });
  });
  it('se descarta lo que la forma nueva no declara, y no queda un objeto vacío', () => {
    const e = escena(de('flecha-derecha', { parametros: { cabeza: 0.5, cuerpo: 0.4 } }));
    const r = f(cambiarForma(e, ['a'], 'rectangulo'), 'a');
    expect('parametros' in r).toBe(false);
  });
  it('una clave con el mismo nombre pero otro rango se descarta', () => {
    const distintas = TIPOS_FORMA.flatMap((a) => TIPOS_FORMA.map((b) => [a, b] as const)).filter(([a, b]) =>
      FORMAS[a].parametros.some((p) => FORMAS[b].parametros.some((q) => q.clave === p.clave && (q.min !== p.min || q.max !== p.max))),
    );
    expect(distintas.length).toBeGreaterThan(0);
    const [a, b] = distintas[0] as readonly [TipoForma, TipoForma];
    const clave = FORMAS[a].parametros.find((p) => FORMAS[b].parametros.some((q) => q.clave === p.clave && (q.min !== p.min || q.max !== p.max))) as { clave: string; min: number };
    const e = escena(de(a, { parametros: { [clave.clave]: clave.min } }));
    expect(f(cambiarForma(e, ['a'], b), 'a').parametros?.[clave.clave]).toBeUndefined();
  });
  it('lo que no estaba en la forma vieja no aparece', () => {
    const e = escena(de('trapecio'));
    expect('parametros' in f(cambiarForma(e, ['a'], 'paralelogramo'), 'a')).toBe(false);
  });
});

describe('cambiarForma: conectores', () => {
  it('las 22 × 22 combinaciones: cada conector sigue pegado por el mismo lado si la forma nueva lo tiene', () => {
    let comprobados = 0;
    for (const origen of TIPOS_FORMA) {
      for (const destino of TIPOS_FORMA) {
        if (origen === destino) continue;
        const e = conConectores(origen);
        const r = cambiarForma(e, ['a'], destino);
        for (let i = 0; i < 4; i++) {
          const ladoViejo = ladoDePuerto(f(e, 'a'), i);
          const nuevo = l(r, `c${i}`).destino?.puerto ?? -1;
          const hayDeEseLado = Array.from({ length: cantidadDePuertos(f(r, 'a')) }, (_, k) => ladoDePuerto(f(r, 'a'), k)).includes(ladoViejo);
          if (hayDeEseLado) expect(ladoDePuerto(f(r, 'a'), nuevo), `${origen} → ${destino}, puerto ${i}`).toBe(ladoViejo);
          const nuevoOrigen = l(r, `o${i}`).origen?.puerto ?? -1;
          if (hayDeEseLado) expect(ladoDePuerto(f(r, 'a'), nuevoOrigen), `${origen} → ${destino}, puerto ${i} (origen)`).toBe(ladoViejo);
          expect(nuevoOrigen, `${origen} → ${destino}: el origen y el destino del mismo puerto van al mismo puerto`).toBe(nuevo);
          // y el extremo del conector está donde el puerto nuevo
          expect(l(r, `c${i}`).puntos.at(-1)).toEqual({ x: Math.round(puntoDePuerto(f(r, 'a'), nuevo).x * 100) / 100, y: Math.round(puntoDePuerto(f(r, 'a'), nuevo).y * 100) / 100 });
          comprobados++;
        }
      }
    }
    expect(comprobados).toBe(22 * 21 * 4);
  });

  it('en un empate de distancia gana el puerto de menor índice', () => {
    // De rectángulo a llave, el puerto de la derecha no tiene lado equivalente y varios puertos quedan a la misma distancia.
    const e = conConectores('rectangulo');
    const r = cambiarForma(e, ['a'], 'llave');
    const viejo = puntoDePuerto(f(e, 'a'), 1);
    const nueva = f(r, 'a');
    const d = [0, 1, 2, 3].map((k) => Math.hypot(puntoDePuerto(nueva, k).x - viejo.x, puntoDePuerto(nueva, k).y - viejo.y));
    const minimo = Math.min(...d);
    const empatados = d.map((x, k) => (Math.abs(x - minimo) < 1e-9 ? k : -1)).filter((k) => k >= 0);
    expect(empatados.length).toBeGreaterThan(1);
    expect(l(r, 'c1').destino?.puerto).toBe(empatados[0]);
  });

  it('con giro de 90°, 180° y 33° sigue por el mismo lado', () => {
    for (const rotacion of [90, 180, 33]) {
      const e = conConectores('rectangulo', rotacion);
      const r = cambiarForma(e, ['a'], 'rombo');
      for (let i = 0; i < 4; i++) expect(ladoDePuerto(f(r, 'a'), l(r, `c${i}`).destino?.puerto ?? -1)).toBe(ladoDePuerto(f(e, 'a'), i));
    }
  });

  it('a un triángulo rectángulo (dos puertos a la izquierda, ninguno arriba): desempata por cercanía y, sin lado, usa el más cercano', () => {
    const e = conConectores('rectangulo');
    const r = cambiarForma(e, ['a'], 'triangulo-rectangulo');
    const nueva = f(r, 'a');
    const izquierdos = [0, 1, 2, 3].filter((i) => ladoDePuerto(nueva, i) === 'izquierda');
    expect(izquierdos.length).toBeGreaterThan(1);
    const viejoIzq = puntoDePuerto(f(e, 'a'), 3);
    const esperado = izquierdos.reduce((m, i) => (Math.hypot(puntoDePuerto(nueva, i).x - viejoIzq.x, puntoDePuerto(nueva, i).y - viejoIzq.y) < Math.hypot(puntoDePuerto(nueva, m).x - viejoIzq.x, puntoDePuerto(nueva, m).y - viejoIzq.y) ? i : m));
    expect(l(r, 'c3').destino?.puerto).toBe(esperado);
    // el de arriba no tiene lado equivalente: va al más cercano de todos
    const viejoArr = puntoDePuerto(f(e, 'a'), 0);
    const cercano = [0, 1, 2, 3].reduce((m, i) => (Math.hypot(puntoDePuerto(nueva, i).x - viejoArr.x, puntoDePuerto(nueva, i).y - viejoArr.y) < Math.hypot(puntoDePuerto(nueva, m).x - viejoArr.x, puntoDePuerto(nueva, m).y - viejoArr.y) ? i : m));
    expect(ladoDePuerto(nueva, 0)).not.toBe('arriba'); // (el puerto 0 de esta forma sale por la izquierda)
    expect(l(r, 'c0').destino?.puerto).toBe(cercano);
  });

  it('desde una llave (tres puertos «arriba»): conserva el lado de cada puerto en la forma nueva', () => {
    const e = conConectores('llave');
    const r = cambiarForma(e, ['a'], 'rectangulo');
    for (let i = 0; i < 4; i++) expect(ladoDePuerto(f(r, 'a'), l(r, `c${i}`).destino?.puerto ?? -1)).toBe(ladoDePuerto(f(e, 'a'), i));
  });

  it('origen y destino en dos formas que cambian a la vez, y en la misma forma', () => {
    const e = escena(
      forma('a', 0, 0),
      forma('b', 400, 0),
      linea('ab', [[100, 30], [400, 30]], { origen: { elementoId: 'a', puerto: 1 }, destino: { elementoId: 'b', puerto: 3 } }),
      linea('aa', [[50, 0], [0, 30]], { origen: { elementoId: 'a', puerto: 0 }, destino: { elementoId: 'a', puerto: 3 } }),
    );
    const r = cambiarForma(e, ['a', 'b'], 'hexagono');
    for (const [id, ext, forma_] of [['ab', 'origen', 'a'], ['ab', 'destino', 'b'], ['aa', 'origen', 'a'], ['aa', 'destino', 'a']] as const) {
      const c = l(r, id)[ext];
      const antes = l(e, id)[ext];
      expect(ladoDePuerto(f(r, forma_), c?.puerto ?? -1)).toBe(ladoDePuerto(f(e, forma_), antes?.puerto ?? -1));
    }
  });

  it('un conector a una forma bloqueada (que no cambia) no se toca', () => {
    const e = escena(forma('a', 0, 0, 100, 60, { bloqueado: true }), forma('b', 400, 0), linea('l', [[100, 30], [400, 30]], { origen: { elementoId: 'a', puerto: 1 }, destino: { elementoId: 'b', puerto: 3 } }));
    const r = cambiarForma(e, ['a', 'b'], 'circulo');
    expect(l(r, 'l').origen).toEqual(l(e, 'l').origen);
    expect(l(r, 'l').destino?.puerto).toBe(l(e, 'l').destino?.puerto);
  });

  it('el puerto equivalente es el mismo si la forma no cambia de puertos', () => {
    const e = escena(de('rectangulo'), de('rectangulo'));
    for (let i = 0; i < 4; i++) expect(puertoEquivalente(f(e, 'a'), f(e, 'a'), i)).toBe(i);
  });
});

describe('cambiarForma: el resultado es una escena válida', () => {
  it('pasa por el normalizador sin cambios', () => {
    const r = cambiarForma(conConectores('rectangulo', 33), ['a'], 'estrella');
    expect(normalizarEscena(r)).toEqual(r);
  });
});

describe('cambiarForma: rendimiento (DW9)', () => {
  it('500 formas con 500 conectores pegados: menos de 30 ms', () => {
    const formas = Array.from({ length: 500 }, (_, i) => forma(`f${i}`, (i % 25) * 120, Math.floor(i / 25) * 90, 100, 60));
    const lineas = Array.from({ length: 500 }, (_, i) => linea(`c${i}`, [[0, 0], [10, 10]], { origen: { elementoId: `f${i}`, puerto: 1 }, destino: { elementoId: `f${(i + 1) % 500}`, puerto: 3 } }));
    const e = escena(...formas, ...lineas);
    const ids = formas.map((x) => x.id as string);
    const tipos: TipoForma[] = ['rombo', 'hexagono'];
    for (let i = 0; i < 4; i++) cambiarForma(e, ids, tipos[i % 2] as TipoForma);
    const t: number[] = [];
    for (let i = 0; i < 9; i++) {
      const t0 = performance.now();
      cambiarForma(e, ids, tipos[i % 2] as TipoForma);
      t.push(performance.now() - t0);
    }
    t.sort((a, b) => a - b);
    expect(t[4]).toBeLessThan(30);
  });
});
