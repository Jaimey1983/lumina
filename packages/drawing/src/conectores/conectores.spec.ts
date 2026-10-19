import { describe, expect, it } from 'vitest';

import { normalizarEscena } from '../normalizar.js';
import { eliminar } from '../operaciones/edicion.js';
import { mover, redimensionar, rotarA } from '../operaciones/transformar.js';
import { escena, forma, getForma, getLinea, linea } from '../operaciones/util-pruebas.js';
import { escenaANodos, type NodoSvg } from '../render/render.js';
import { TIPOS_FORMA, type Escena, type Punto } from '../tipos.js';
import {
  conectar,
  conectoresDe,
  escenaConRutas,
  insertarVia,
  moverVia,
  quitarVia,
  sincronizarConectores,
  soltarExtremo,
  trazadoDeLinea,
} from './conectar.js';
import { cantidadDePuertos, ladoDePuerto, puertoCercano, puertosDeEscena, puntoDePuerto, type Lado } from './puertos.js';
import { muestrearCurva, puntoMedio, rutaCurva, rutaOrtogonal, simplificar, trazadoPoligonal, UMBRAL_ENDEREZAR, type Rect } from './ruteo.js';

// ─── Ayudas ───────────────────────────────────────────────────────────────────

const LADOS: Lado[] = ['arriba', 'derecha', 'abajo', 'izquierda'];
/** En un rectángulo, el puerto i es el lado i del orden arriba, derecha, abajo, izquierda. */
const PUERTO: Record<Lado, number> = { arriba: 0, derecha: 1, abajo: 2, izquierda: 3 };

const rect = (x: number, y: number, ancho = 100, alto = 60): Rect => ({ x, y, ancho, alto });
const esOrtogonal = (ruta: readonly Punto[]): boolean => ruta.every((p, i) => i === 0 || Math.abs(p.x - (ruta[i - 1] as Punto).x) < 1e-6 || Math.abs(p.y - (ruta[i - 1] as Punto).y) < 1e-6);
const dentro = (p: Punto, o: Rect): boolean => p.x > o.x + 1e-6 && p.x < o.x + o.ancho - 1e-6 && p.y > o.y + 1e-6 && p.y < o.y + o.alto - 1e-6;
/** ¿Algún tramo de la ruta atraviesa el interior del rectángulo? (se muestrea cada tramo) */
function atraviesa(ruta: readonly Punto[], o: Rect): boolean {
  for (let i = 1; i < ruta.length; i++) {
    const a = ruta[i - 1] as Punto;
    const b = ruta[i] as Punto;
    for (let k = 0; k <= 50; k++) {
      const t = k / 50;
      if (dentro({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }, o)) return true;
    }
  }
  return false;
}
const direccion = (a: Punto, b: Punto): Lado => (Math.abs(b.x - a.x) >= Math.abs(b.y - a.y) ? (b.x > a.x ? 'derecha' : 'izquierda') : b.y > a.y ? 'abajo' : 'arriba');
const codos = (ruta: readonly Punto[]): number => Math.max(0, ruta.length - 2);

/** Dos rectángulos A (100×60) y B conectados por una flecha del puerto `de` de A al puerto `a` de B. */
function conector(posB: Punto, de: Lado, a: Lado, trazado = 'ortogonal', extra: Record<string, unknown> = {}): Escena {
  return escena(
    forma('A', 100, 100),
    forma('B', posB.x, posB.y),
    linea('L', [[0, 0], [10, 10]], { trazado, origen: { elementoId: 'A', puerto: PUERTO[de] }, destino: { elementoId: 'B', puerto: PUERTO[a] }, ...extra }),
  );
}

// ─── Puertos ──────────────────────────────────────────────────────────────────

describe('puertos', () => {
  it('cada forma del catálogo tiene puertos y un lado de salida válido para cada uno', () => {
    for (const tipo of TIPOS_FORMA) {
      const e = escena(forma('F', 100, 100, 120, 80, { forma: tipo }));
      const f = getForma(e, 'F');
      const n = cantidadDePuertos(f);
      expect(n, tipo).toBeGreaterThanOrEqual(4);
      for (let i = 0; i < n; i++) expect(LADOS, `${tipo}#${i}`).toContain(ladoDePuerto(f, i));
    }
  });

  it('en un rectángulo, arriba/derecha/abajo/izquierda salen por su propio lado', () => {
    const f = getForma(escena(forma('F', 0, 0)), 'F');
    expect(LADOS.map((l) => ladoDePuerto(f, PUERTO[l]))).toEqual(LADOS);
  });

  it('el lado gira con la forma: a 90° el puerto de la derecha mira hacia abajo', () => {
    const f = getForma(escena(forma('F', 0, 0, 100, 60, { transformacion: { x: 0, y: 0, ancho: 100, alto: 60, rotacion: 90 } })), 'F');
    expect(ladoDePuerto(f, PUERTO.derecha)).toBe('abajo');
    expect(ladoDePuerto(f, PUERTO.arriba)).toBe('derecha');
    expect(ladoDePuerto(f, PUERTO.izquierda)).toBe('arriba');
    // y a 180° se invierte
    const g = getForma(escena(forma('G', 0, 0, 100, 60, { transformacion: { x: 0, y: 0, ancho: 100, alto: 60, rotacion: 180 } })), 'G');
    expect(ladoDePuerto(g, PUERTO.derecha)).toBe('izquierda');
  });

  it('puntoDePuerto sigue la posición y el giro', () => {
    const e = escena(forma('F', 100, 100));
    expect(puntoDePuerto(getForma(e, 'F'), PUERTO.derecha)).toEqual({ x: 200, y: 130 });
    const girada = getForma(rotarA(e, 'F', 90), 'F');
    const p = puntoDePuerto(girada, PUERTO.derecha);
    expect(p.x).toBeCloseTo(150, 5);
    expect(p.y).toBeCloseTo(180, 5);
  });

  it('puertoCercano respeta el radio, ignora lo oculto y elige el más cercano', () => {
    const e = escena(forma('A', 100, 100), forma('B', 400, 100, 100, 60, { oculto: true }));
    expect(puertoCercano(e, { x: 205, y: 133 }, 10)).toMatchObject({ elementoId: 'A', puerto: PUERTO.derecha });
    expect(puertoCercano(e, { x: 220, y: 130 }, 10)).toBeNull();
    expect(puertoCercano(e, { x: 400, y: 130 }, 30)).toBeNull(); // B está oculta
    expect(puertosDeEscena(e).every((p) => p.elementoId === 'A')).toBe(true);
  });
});

// ─── Ruta en ángulo recto ─────────────────────────────────────────────────────

describe('ruta ortogonal', () => {
  it('derecha → izquierda con la otra forma más abajo y a la derecha: una «Z» de dos codos con el tramo central a mitad de camino', () => {
    const e = conector({ x: 400, y: 260 }, 'derecha', 'izquierda');
    const { ruta } = trazadoDeLinea(e, getLinea(e, 'L'));
    expect(ruta).toEqual([{ x: 200, y: 130 }, { x: 300, y: 130 }, { x: 300, y: 290 }, { x: 400, y: 290 }]);
  });

  it('el punto medio (donde va la etiqueta) está a la mitad del recorrido real, no de la recta entre los extremos', () => {
    const e = conector({ x: 400, y: 260 }, 'derecha', 'izquierda');
    expect(trazadoDeLinea(e, getLinea(e, 'L')).medio).toEqual({ x: 300, y: 210 });
    const recto = conector({ x: 400, y: 260 }, 'derecha', 'izquierda', 'recto');
    expect(trazadoDeLinea(recto, getLinea(recto, 'L')).medio).toEqual({ x: 300, y: 210 });
  });

  it('alineadas queda una recta, sin codos de más', () => {
    const e = conector({ x: 400, y: 100 }, 'derecha', 'izquierda');
    expect(trazadoDeLinea(e, getLinea(e, 'L')).ruta).toEqual([{ x: 200, y: 130 }, { x: 400, y: 130 }]);
  });

  it('abajo → arriba, con la otra forma debajo y desplazada, también es una «Z» (vertical)', () => {
    const e = conector({ x: 300, y: 300 }, 'abajo', 'arriba');
    expect(trazadoDeLinea(e, getLinea(e, 'L')).ruta).toEqual([{ x: 150, y: 160 }, { x: 150, y: 230 }, { x: 350, y: 230 }, { x: 350, y: 300 }]);
  });

  it('derecha → derecha: sale, rodea y entra por el mismo lado, sin atravesar ninguna forma', () => {
    const e = conector({ x: 100, y: 300 }, 'derecha', 'derecha');
    const { ruta } = trazadoDeLinea(e, getLinea(e, 'L'));
    expect(esOrtogonal(ruta)).toBe(true);
    expect(direccion(ruta[0] as Punto, ruta[1] as Punto)).toBe('derecha');
    expect(direccion(ruta[ruta.length - 2] as Punto, ruta[ruta.length - 1] as Punto)).toBe('izquierda');
    expect(atraviesa(ruta, rect(100, 100))).toBe(false);
    expect(atraviesa(ruta, rect(100, 300))).toBe(false);
  });

  it('la otra forma queda «detrás» (a la izquierda y arriba): da la vuelta sin cruzar las formas', () => {
    const e = escena(
      forma('A', 300, 300),
      forma('B', 100, 100),
      linea('L', [[0, 0], [1, 1]], { trazado: 'ortogonal', origen: { elementoId: 'A', puerto: PUERTO.derecha }, destino: { elementoId: 'B', puerto: PUERTO.izquierda } }),
    );
    const { ruta } = trazadoDeLinea(e, getLinea(e, 'L'));
    expect(esOrtogonal(ruta)).toBe(true);
    expect(direccion(ruta[0] as Punto, ruta[1] as Punto)).toBe('derecha'); // sale hacia donde mira el puerto
    expect(direccion(ruta[ruta.length - 2] as Punto, ruta[ruta.length - 1] as Punto)).toBe('derecha'); // y entra por la izquierda de B
    expect(atraviesa(ruta, rect(300, 300))).toBe(false);
    expect(atraviesa(ruta, rect(100, 100))).toBe(false);
  });

  it('cualquier combinación de puertos y posiciones relativas: ruta ortogonal, sin cruzar las formas, saliendo y entrando de frente', () => {
    const posiciones: Punto[] = [
      { x: 400, y: 100 }, { x: 400, y: 300 }, { x: 100, y: 300 }, { x: -200, y: 300 }, { x: -200, y: 100 },
      { x: -200, y: -150 }, { x: 100, y: -150 }, { x: 400, y: -150 }, { x: 230, y: 100 }, { x: 230, y: 200 },
    ];
    let probados = 0;
    for (const pos of posiciones) {
      for (const de of LADOS) {
        for (const a of LADOS) {
          const e = conector(pos, de, a);
          const { ruta } = trazadoDeLinea(e, getLinea(e, 'L'));
          const etiqueta = `${JSON.stringify(pos)} ${de}→${a}`;
          expect(esOrtogonal(ruta), etiqueta).toBe(true);
          expect(ruta[0], etiqueta).toEqual(puntoDePuerto(getForma(e, 'A'), PUERTO[de]));
          expect(ruta[ruta.length - 1], etiqueta).toEqual(puntoDePuerto(getForma(e, 'B'), PUERTO[a]));
          // Sale de frente (en el sentido del puerto) y llega de frente (contra el sentido del puerto).
          expect(direccion(ruta[0] as Punto, ruta[1] as Punto), etiqueta).toBe(de);
          expect(direccion(ruta[ruta.length - 2] as Punto, ruta[ruta.length - 1] as Punto), etiqueta).toBe(
            { arriba: 'abajo', abajo: 'arriba', derecha: 'izquierda', izquierda: 'derecha' }[a],
          );
          // No atraviesa a las formas, salvo cuando están pegadas o solapadas (ahí no hay camino limpio).
          const solapadas = !(pos.x >= 200 + 4 || pos.x + 100 <= 100 - 4 || pos.y >= 160 + 4 || pos.y + 60 <= 100 - 4);
          if (!solapadas) {
            expect(atraviesa(ruta, rect(100, 100)), `${etiqueta} cruza A`).toBe(false);
            expect(atraviesa(ruta, rect(pos.x, pos.y)), `${etiqueta} cruza B`).toBe(false);
          }
          expect(ruta.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)), etiqueta).toBe(true);
          probados++;
        }
      }
    }
    expect(probados).toBe(160);
  });

  it('es determinista y no cambia lo que recibe', () => {
    const e = conector({ x: -200, y: 300 }, 'derecha', 'derecha');
    const antes = JSON.stringify(e);
    const a = trazadoDeLinea(e, getLinea(e, 'L'));
    const b = trazadoDeLinea(e, getLinea(e, 'L'));
    expect(a).toEqual(b);
    expect(JSON.stringify(e)).toBe(antes);
  });

  it('no hace codos de más: ninguna ruta de las combinaciones habituales tiene más de 4 codos', () => {
    for (const pos of [{ x: 400, y: 260 }, { x: 400, y: 100 }, { x: 100, y: 300 }, { x: -200, y: 300 }]) {
      for (const de of LADOS) {
        for (const a of LADOS) {
          const e = conector(pos, de, a);
          expect(codos(trazadoDeLinea(e, getLinea(e, 'L')).ruta), `${JSON.stringify(pos)} ${de}→${a}`).toBeLessThanOrEqual(4);
        }
      }
    }
  });

  it('con una forma girada 90°, el conector sale por el lado al que mira el puerto girado', () => {
    const e = escena(
      forma('A', 100, 100, 100, 60, { transformacion: { x: 100, y: 100, ancho: 100, alto: 60, rotacion: 90 } }),
      forma('B', 400, 400),
      linea('L', [[0, 0], [1, 1]], { trazado: 'ortogonal', origen: { elementoId: 'A', puerto: PUERTO.derecha }, destino: { elementoId: 'B', puerto: PUERTO.arriba } }),
    );
    const { ruta } = trazadoDeLinea(e, getLinea(e, 'L'));
    expect(direccion(ruta[0] as Punto, ruta[1] as Punto)).toBe('abajo');
    expect(ruta[0]).toEqual({ x: 150, y: expect.closeTo(180, 5) });
    expect(esOrtogonal(ruta)).toBe(true);
  });

  it('un extremo libre y el otro pegado: entra o sale de frente por el lado de la forma', () => {
    const e = escena(forma('A', 100, 100), linea('L', [[0, 0], [500, 400]], { trazado: 'ortogonal', origen: { elementoId: 'A', puerto: PUERTO.abajo } }));
    const { ruta } = trazadoDeLinea(e, getLinea(e, 'L'));
    expect(esOrtogonal(ruta)).toBe(true);
    expect(ruta[0]).toEqual({ x: 150, y: 160 });
    expect(direccion(ruta[0] as Punto, ruta[1] as Punto)).toBe('abajo');
    expect(ruta[ruta.length - 1]).toEqual({ x: 500, y: 400 });
  });

  it('con los dos extremos libres es la «Z» de siempre (y recta si están alineados)', () => {
    expect(rutaOrtogonal({ puntos: [{ x: 0, y: 0 }, { x: 100, y: 50 }] }).ruta).toEqual([{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 50 }, { x: 100, y: 50 }]);
    expect(rutaOrtogonal({ puntos: [{ x: 0, y: 0 }, { x: 20, y: 100 }] }).ruta).toEqual([{ x: 0, y: 0 }, { x: 0, y: 50 }, { x: 20, y: 50 }, { x: 20, y: 100 }]);
    expect(rutaOrtogonal({ puntos: [{ x: 0, y: 0 }, { x: 100, y: 0 }] }).ruta).toEqual([{ x: 0, y: 0 }, { x: 100, y: 0 }]);
  });

  it('pasa por los puntos intermedios, en orden', () => {
    const e = escena(
      forma('A', 100, 100),
      forma('B', 500, 100),
      linea('L', [[0, 0], [350, 400], [1, 1]], { trazado: 'ortogonal', origen: { elementoId: 'A', puerto: PUERTO.abajo }, destino: { elementoId: 'B', puerto: PUERTO.abajo } }),
    );
    const { ruta } = trazadoDeLinea(e, getLinea(e, 'L'));
    expect(esOrtogonal(ruta)).toBe(true);
    // El punto puede quedar en mitad de un tramo recto (entonces no es un vértice), pero la ruta pasa por él.
    const sobre = ruta.findIndex((p, i) => {
      const q = ruta[i - 1];
      if (!q) return false;
      const enX = Math.abs(p.x - 350) < 1e-6 && Math.abs(q.x - 350) < 1e-6 && Math.min(p.y, q.y) <= 400 && 400 <= Math.max(p.y, q.y);
      const enY = Math.abs(p.y - 400) < 1e-6 && Math.abs(q.y - 400) < 1e-6 && Math.min(p.x, q.x) <= 350 && 350 <= Math.max(p.x, q.x);
      return enX || enY;
    });
    expect(sobre).toBeGreaterThan(0);
  });

  it('simplificar quita repetidos y puntos alineados', () => {
    expect(simplificar([{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 5, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }])).toEqual([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }]);
  });

  it('el punto medio está a la mitad del recorrido', () => {
    expect(puntoMedio([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }])).toEqual({ x: 100, y: 0 });
    expect(puntoMedio([{ x: 0, y: 0 }, { x: 100, y: 0 }])).toEqual({ x: 50, y: 0 });
    expect(puntoMedio([])).toEqual({ x: 0, y: 0 });
  });
});

// ─── Casi alineadas y formas de por medio ─────────────────────────────────────

describe('puertos que se miran de cerca', () => {
  it('con menos de dos márgenes entre ellos, el codo queda a mitad de camino en vez de zigzaguear', () => {
    const e = conector({ x: 225, y: 300 }, 'derecha', 'izquierda');
    const { ruta } = trazadoDeLinea(e, getLinea(e, 'L'));
    expect(ruta).toEqual([{ x: 200, y: 130 }, { x: 212.5, y: 130 }, { x: 212.5, y: 330 }, { x: 225, y: 330 }]);
  });
  it('con espacio de sobra, no cambia nada', () => {
    const e = conector({ x: 400, y: 300 }, 'derecha', 'izquierda');
    expect(trazadoDeLinea(e, getLinea(e, 'L')).ruta[1]).toEqual({ x: 300, y: 130 });
  });
  it('si no se miran de frente, el margen entero se mantiene (sale y rodea con holgura)', () => {
    const e = conector({ x: 225, y: 300 }, 'derecha', 'derecha');
    const { ruta } = trazadoDeLinea(e, getLinea(e, 'L'));
    // el conector pasa 20 unidades más allá del puerto de la otra forma (325 + 20)
    expect(ruta[1]).toEqual({ x: 345, y: 130 });
  });
});

describe('desniveles diminutos', () => {
  it(`hasta ${UMBRAL_ENDEREZAR} unidades de desnivel el conector queda recto, sin codo diminuto; con más, hace su codo`, () => {
    for (const desnivel of [0, 3, 5, UMBRAL_ENDEREZAR]) {
      const e = conector({ x: 400, y: 100 + desnivel }, 'derecha', 'izquierda');
      expect(trazadoDeLinea(e, getLinea(e, 'L')).ruta, `desnivel ${desnivel}`).toEqual([{ x: 200, y: 130 }, { x: 400, y: 130 + desnivel }]);
    }
    for (const desnivel of [UMBRAL_ENDEREZAR + 1, 20]) {
      const e = conector({ x: 400, y: 100 + desnivel }, 'derecha', 'izquierda');
      expect(trazadoDeLinea(e, getLinea(e, 'L')).ruta, `desnivel ${desnivel}`).toHaveLength(4);
    }
  });
  it('también en vertical', () => {
    const e = conector({ x: 105, y: 300 }, 'abajo', 'arriba');
    expect(trazadoDeLinea(e, getLinea(e, 'L')).ruta).toHaveLength(2);
  });
  it('no afecta a los conectores con los dos extremos libres (la «Z» de siempre)', () => {
    expect(rutaOrtogonal({ puntos: [{ x: 0, y: 0 }, { x: 100, y: 5 }] }).ruta).toHaveLength(4);
  });
  it('el trazado curvo tampoco hace un bucle por un desnivel diminuto', () => {
    const e = conector({ x: 400, y: 105 }, 'derecha', 'izquierda', 'curvo');
    expect(trazadoDeLinea(e, getLinea(e, 'L')).d).toBe('M200,130 L400,135');
  });
});

describe('formas de por medio', () => {
  const conTercera = (extra: Record<string, unknown>, id = 'C', x = 300, y = 100): Escena =>
    escena(
      forma('A', 100, 100),
      forma('B', 500, 100),
      forma(id, x, y, 100, 60, extra),
      linea('L', [[0, 0], [1, 1]], { trazado: 'ortogonal', origen: { elementoId: 'A', puerto: PUERTO.derecha }, destino: { elementoId: 'B', puerto: PUERTO.izquierda } }),
    );

  it('el conector rodea una forma que está justo en medio, además de las dos a las que está pegado', () => {
    const e = conTercera({});
    const { ruta } = trazadoDeLinea(e, getLinea(e, 'L'));
    expect(esOrtogonal(ruta)).toBe(true);
    expect(atraviesa(ruta, rect(300, 100))).toBe(false);
    expect(atraviesa(ruta, rect(100, 100))).toBe(false);
    expect(atraviesa(ruta, rect(500, 100))).toBe(false);
    expect(direccion(ruta[0] as Punto, ruta[1] as Punto)).toBe('derecha');
    expect(direccion(ruta[ruta.length - 2] as Punto, ruta[ruta.length - 1] as Punto)).toBe('derecha');
    expect(codos(ruta)).toBeGreaterThan(0);
  });

  it('una forma oculta no estorba', () => {
    const e = conTercera({ oculto: true });
    expect(trazadoDeLinea(e, getLinea(e, 'L')).ruta).toEqual([{ x: 200, y: 130 }, { x: 500, y: 130 }]);
  });

  it('una forma lejos del pasillo no cambia nada', () => {
    const e = conTercera({}, 'C', 300, 500);
    expect(trazadoDeLinea(e, getLinea(e, 'L')).ruta).toEqual([{ x: 200, y: 130 }, { x: 500, y: 130 }]);
  });

  it('un fondo o contenedor que contiene los extremos tampoco estorba', () => {
    const e = escena(
      forma('Fondo', 50, 50, 700, 200),
      forma('A', 100, 100),
      forma('B', 500, 100),
      linea('L', [[0, 0], [1, 1]], { trazado: 'ortogonal', origen: { elementoId: 'A', puerto: PUERTO.derecha }, destino: { elementoId: 'B', puerto: PUERTO.izquierda } }),
    );
    expect(trazadoDeLinea(e, getLinea(e, 'L')).ruta).toEqual([{ x: 200, y: 130 }, { x: 500, y: 130 }]);
  });

  it('con un fondo debajo y una forma en medio, rodea la forma (el fondo no cuenta como obstáculo)', () => {
    const e = escena(
      forma('Fondo', 50, 50, 700, 300),
      forma('A', 100, 100),
      forma('B', 500, 100),
      forma('C', 300, 100),
      linea('L', [[0, 0], [1, 1]], { trazado: 'ortogonal', origen: { elementoId: 'A', puerto: PUERTO.derecha }, destino: { elementoId: 'B', puerto: PUERTO.izquierda } }),
    );
    const { ruta } = trazadoDeLinea(e, getLinea(e, 'L'));
    expect(atraviesa(ruta, rect(300, 100))).toBe(false);
    expect(esOrtogonal(ruta)).toBe(true);
  });

  it('el render dibuja exactamente el mismo trazado que el módulo de conectores', () => {
    const e = conTercera({});
    const buscar = (nodos: NodoSvg[]): NodoSvg | undefined => {
      for (const n of nodos) {
        if (n.attrs['data-elemento-id'] === 'L') return n;
        const h = buscar(n.hijos ?? []);
        if (h) return h;
      }
      return undefined;
    };
    const g = buscar(escenaANodos(e).nodos);
    expect(g?.hijos?.find((n) => n.tag === 'path')?.attrs.d).toBe(trazadoDeLinea(e, getLinea(e, 'L')).d);
  });

  it('con muchas formas en el pasillo sigue enrutando rápido y sin cruzarlas', () => {
    const elementos: Array<Record<string, unknown>> = [forma('A', 20, 300), forma('B', 900, 300)];
    for (let i = 0; i < 40; i++) elementos.push(forma(`X${i}`, 160 + (i % 8) * 90, 200 + Math.floor(i / 8) * 40, 60, 24));
    elementos.push(linea('L', [[0, 0], [1, 1]], { trazado: 'ortogonal', origen: { elementoId: 'A', puerto: PUERTO.derecha }, destino: { elementoId: 'B', puerto: PUERTO.izquierda } }));
    const e = escena(...elementos);
    const t0 = performance.now();
    const { ruta } = trazadoDeLinea(e, getLinea(e, 'L'));
    expect(performance.now() - t0).toBeLessThan(100);
    expect(esOrtogonal(ruta)).toBe(true);
    expect(ruta.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true);
  });
});

// ─── Esquinas ─────────────────────────────────────────────────────────────────

describe('esquinas redondeadas', () => {
  const ruta = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }];
  it('vivas: solo rectas', () => {
    expect(trazadoPoligonal(ruta)).toBe('M0,0 L100,0 L100,100');
  });
  it('redondeadas: una curva suave en cada codo, que empieza antes del codo y termina después', () => {
    expect(trazadoPoligonal(ruta, 10)).toBe('M0,0 L90,0 Q100,0 100,10 L100,100');
  });
  it('el radio nunca pasa de la mitad del tramo más corto', () => {
    expect(trazadoPoligonal([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 8 }], 50)).toBe('M0,0 L96,0 Q100,0 100,4 L100,8');
  });
  it('un conector ortogonal con estilo.radio dibuja curvas; con 0 no', () => {
    const vivo = conector({ x: 400, y: 260 }, 'derecha', 'izquierda');
    const redondo = conector({ x: 400, y: 260 }, 'derecha', 'izquierda', 'ortogonal', { estilo: { radio: 12 } });
    expect(trazadoDeLinea(vivo, getLinea(vivo, 'L')).d).not.toMatch(/Q/);
    expect(trazadoDeLinea(redondo, getLinea(redondo, 'L')).d).toMatch(/Q/);
    // la ruta (y por tanto la flecha) es la misma
    expect(trazadoDeLinea(redondo, getLinea(redondo, 'L')).ruta).toEqual(trazadoDeLinea(vivo, getLinea(vivo, 'L')).ruta);
  });
});

// ─── Curvo y recto ────────────────────────────────────────────────────────────

describe('trazado curvo y recto', () => {
  it('pegado a formas, la curva sale y llega de frente, con los codos suavizados', () => {
    const e = conector({ x: 400, y: 260 }, 'derecha', 'izquierda', 'curvo');
    const t = trazadoDeLinea(e, getLinea(e, 'L'));
    expect(t.d).toBe('M200,130 L250,130 Q300,130 300,180 L300,240 Q300,290 350,290 L400,290');
    expect(direccion(t.ruta[0] as Punto, t.ruta[1] as Punto)).toBe('derecha');
    expect(direccion(t.ruta[t.ruta.length - 2] as Punto, t.ruta[t.ruta.length - 1] as Punto)).toBe('derecha');
    expect(t.inicio).toEqual({ x: 200, y: 130 });
    expect(t.fin).toEqual({ x: 400, y: 290 });
  });

  it('si la otra forma queda detrás, la curva da la vuelta en vez de atravesar las formas', () => {
    const e = escena(
      forma('G', 400, 100),
      forma('H', 100, 100),
      linea('L', [[0, 0], [1, 1]], { trazado: 'curvo', origen: { elementoId: 'G', puerto: PUERTO.derecha }, destino: { elementoId: 'H', puerto: PUERTO.izquierda } }),
    );
    const t = trazadoDeLinea(e, getLinea(e, 'L'));
    expect(atraviesa(t.polilinea, rect(400, 100))).toBe(false);
    expect(atraviesa(t.polilinea, rect(100, 100))).toBe(false);
  });

  it('sin formas, la curva es la «S» de siempre', () => {
    const c = rutaCurva({ puntos: [{ x: 0, y: 0 }, { x: 100, y: 50 }] });
    expect(c.segmentos).toEqual([{ c1: { x: 50, y: 0 }, c2: { x: 50, y: 50 }, fin: { x: 100, y: 50 } }]);
  });

  it('con puntos intermedios pasa por todos ellos', () => {
    const c = rutaCurva({ puntos: [{ x: 0, y: 0 }, { x: 100, y: 80 }, { x: 200, y: 0 }] });
    expect(c.segmentos.map((s) => s.fin)).toEqual([{ x: 100, y: 80 }, { x: 200, y: 0 }]);
    const m = muestrearCurva(c);
    expect(m[0]).toEqual({ x: 0, y: 0 });
    expect(m).toContainEqual({ x: 100, y: 80 });
    expect(m[m.length - 1]).toEqual({ x: 200, y: 0 });
  });

  it('el punto medio de la etiqueta está sobre el recorrido, en la curva libre y en la pegada', () => {
    const sobre = (p: Punto, ruta: readonly Punto[]): number =>
      Math.min(
        ...ruta.slice(1).map((b, i) => {
          const a = ruta[i] as Punto;
          const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2 || 1;
          const t = Math.max(0, Math.min(1, ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2));
          return Math.hypot(p.x - (a.x + t * (b.x - a.x)), p.y - (a.y + t * (b.y - a.y)));
        }),
      );
    const pegado = conector({ x: 400, y: 260 }, 'derecha', 'izquierda', 'curvo');
    const t1 = trazadoDeLinea(pegado, getLinea(pegado, 'L'));
    expect(sobre(t1.medio, t1.polilinea)).toBeLessThan(0.01);
    const libre = escena(linea('L', [[0, 0], [200, 100]], { trazado: 'curvo' }));
    const t2 = trazadoDeLinea(libre, getLinea(libre, 'L'));
    expect(sobre(t2.medio, t2.polilinea)).toBeLessThan(0.01);
    expect(t2.medio.x).toBeCloseTo(100, 0);
  });

  it('recto: une los puertos en línea recta y respeta los puntos intermedios', () => {
    const e = conector({ x: 400, y: 260 }, 'derecha', 'izquierda', 'recto');
    expect(trazadoDeLinea(e, getLinea(e, 'L')).d).toBe('M200,130 L400,290');
    const v = insertarVia(e, 'L', 0, { x: 300, y: 50 });
    expect(trazadoDeLinea(v, getLinea(v, 'L')).d).toBe('M200,130 L300,50 L400,290');
  });

  it('cada tramo tiene su propia polilínea', () => {
    const e = insertarVia(conector({ x: 400, y: 260 }, 'derecha', 'izquierda', 'ortogonal'), 'L', 0, { x: 300, y: 50 });
    const t = trazadoDeLinea(e, getLinea(e, 'L'));
    expect(t.tramos).toHaveLength(2);
    expect(t.tramos[0]?.[0]).toEqual({ x: 200, y: 130 });
    expect(t.tramos[1]?.[t.tramos[1].length - 1]).toEqual({ x: 400, y: 290 });
  });
});

// ─── Seguir a las formas ──────────────────────────────────────────────────────

describe('seguir a las formas', () => {
  const base = (): Escena => sincronizarConectores(conector({ x: 400, y: 260 }, 'derecha', 'izquierda'));

  it('sincronizar deja en puntos la posición real de los puertos y es estable', () => {
    const e = base();
    expect(getLinea(e, 'L').puntos).toEqual([{ x: 200, y: 130 }, { x: 400, y: 290 }]);
    expect(sincronizarConectores(e)).toBe(e);
    expect(normalizarEscena(e)).toEqual(e);
  });

  it('mover la forma de origen mueve el extremo y el conector se vuelve a enrutar', () => {
    const e = sincronizarConectores(mover(base(), ['A'], 0, 200));
    expect(getLinea(e, 'L').puntos[0]).toEqual({ x: 200, y: 330 });
    expect(trazadoDeLinea(e, getLinea(e, 'L')).ruta[0]).toEqual({ x: 200, y: 330 });
    expect(getLinea(e, 'L').origen).toEqual({ elementoId: 'A', puerto: PUERTO.derecha });
  });

  it('redimensionar la forma de destino mueve el extremo al nuevo puerto', () => {
    const e = sincronizarConectores(redimensionar(base(), ['B'], 'e', 100, 0));
    expect(getForma(e, 'B').transformacion.ancho).toBe(200);
    // El puerto de la izquierda no se movió; el de la derecha sí.
    expect(getLinea(e, 'L').puntos[1]).toEqual({ x: 400, y: 290 });
    const f = sincronizarConectores(conectar(e, 'L', 'destino', { elementoId: 'B', puerto: PUERTO.derecha }));
    expect(getLinea(f, 'L').puntos[1]).toEqual({ x: 600, y: 290 });
  });

  it('rotar la forma lleva el extremo con su puerto y cambia el lado por el que sale', () => {
    const e = sincronizarConectores(rotarA(base(), 'A', 90));
    const p = getLinea(e, 'L').puntos[0] as Punto;
    expect(p.x).toBeCloseTo(150, 2);
    expect(p.y).toBeCloseTo(180, 2);
    const ruta = trazadoDeLinea(e, getLinea(e, 'L')).ruta;
    expect(direccion(ruta[0] as Punto, ruta[1] as Punto)).toBe('abajo');
  });

  it('eliminar una forma NO borra el conector: lo desconecta y lo deja donde estaba dibujado', () => {
    const antes = base();
    const dibujado = trazadoDeLinea(antes, getLinea(antes, 'L')).inicio;
    const e = eliminar(antes, ['A']);
    expect(e.elementos.map((x) => x.id)).toEqual(['B', 'L']);
    const l = getLinea(e, 'L');
    expect(l.origen).toBeUndefined();
    expect(l.destino).toEqual({ elementoId: 'B', puerto: PUERTO.izquierda });
    expect(l.puntos[0]).toEqual(dibujado);
    // y el conector sigue enrutándose desde ahí
    expect(trazadoDeLinea(e, l).inicio).toEqual(dibujado);
  });

  it('si la forma se movió y luego se elimina, el conector queda en el último lugar donde se vio', () => {
    const movida = sincronizarConectores(mover(base(), ['A'], 0, 200));
    const e = eliminar(movida, ['A']);
    expect(getLinea(e, 'L').puntos[0]).toEqual({ x: 200, y: 330 });
  });

  it('sincronizar quita las conexiones a formas que ya no existen sin mover el extremo', () => {
    const sin = { ...base(), elementos: base().elementos.filter((x) => x.id !== 'B') };
    const e = sincronizarConectores(sin);
    expect(getLinea(e, 'L').destino).toBeUndefined();
    expect(getLinea(e, 'L').puntos[1]).toEqual({ x: 400, y: 290 });
  });

  it('conectoresDe lista las líneas pegadas a una forma', () => {
    const e = base();
    expect(conectoresDe(e, 'A').map((l) => l.id)).toEqual(['L']);
    expect(conectoresDe(e, 'B').map((l) => l.id)).toEqual(['L']);
    expect(conectoresDe(e, 'Z')).toEqual([]);
  });

  it('un conector entre formas giradas llega a sus puertos reales', () => {
    const e = sincronizarConectores(
      escena(
        forma('A', 100, 100, 100, 60, { transformacion: { x: 100, y: 100, ancho: 100, alto: 60, rotacion: 45 } }),
        forma('B', 400, 300, 100, 60, { transformacion: { x: 400, y: 300, ancho: 100, alto: 60, rotacion: 30 } }),
        linea('L', [[0, 0], [1, 1]], { trazado: 'ortogonal', origen: { elementoId: 'A', puerto: PUERTO.derecha }, destino: { elementoId: 'B', puerto: PUERTO.arriba } }),
      ),
    );
    const l = getLinea(e, 'L');
    const ruta = trazadoDeLinea(e, l).ruta;
    const pa = puntoDePuerto(getForma(e, 'A'), PUERTO.derecha);
    const pb = puntoDePuerto(getForma(e, 'B'), PUERTO.arriba);
    expect(ruta[0]?.x).toBeCloseTo(pa.x, 1);
    expect(ruta[0]?.y).toBeCloseTo(pa.y, 1);
    expect(ruta[ruta.length - 1]?.x).toBeCloseTo(pb.x, 1);
    expect(ruta[ruta.length - 1]?.y).toBeCloseTo(pb.y, 1);
    expect(esOrtogonal(ruta)).toBe(true);
  });
});

// ─── Conectar y soltar ────────────────────────────────────────────────────────

describe('conectar y soltar un extremo', () => {
  const libre = (): Escena => escena(forma('A', 100, 100), forma('B', 400, 260), linea('L', [[50, 50], [350, 350]], { fin: 'flecha' }));

  it('soltar cerca de un puerto lo pega y deja el extremo exactamente en el puerto', () => {
    const r = soltarExtremo(libre(), 'L', 'destino', { x: 405, y: 292 }, { radio: 12 });
    expect(r.puerto).toMatchObject({ elementoId: 'B', puerto: PUERTO.izquierda });
    const l = getLinea(r.escena, 'L');
    expect(l.destino).toEqual({ elementoId: 'B', puerto: PUERTO.izquierda });
    expect(l.puntos[1]).toEqual({ x: 400, y: 290 });
    expect(l.origen).toBeUndefined();
  });

  it('soltar lejos de todo lo deja libre en ese punto, y despega si estaba pegado', () => {
    const pegado = soltarExtremo(libre(), 'L', 'destino', { x: 400, y: 290 }, { radio: 12 }).escena;
    const r = soltarExtremo(pegado, 'L', 'destino', { x: 700, y: 500 }, { radio: 12 });
    expect(r.puerto).toBeNull();
    const l = getLinea(r.escena, 'L');
    expect(l.destino).toBeUndefined();
    expect(l.puntos[1]).toEqual({ x: 700, y: 500 });
  });

  it('con radio 0 nunca se pega (Ctrl suspende el imán)', () => {
    const r = soltarExtremo(libre(), 'L', 'destino', { x: 400, y: 290 }, { radio: 0 });
    expect(r.puerto).toBeNull();
    expect(getLinea(r.escena, 'L').destino).toBeUndefined();
  });

  it('mover el origen no toca el destino pegado, y viceversa', () => {
    const e1 = soltarExtremo(libre(), 'L', 'destino', { x: 400, y: 290 }, { radio: 12 }).escena;
    const e2 = soltarExtremo(e1, 'L', 'origen', { x: 150, y: 100 }, { radio: 12 }).escena; // puerto de arriba de A
    expect(getLinea(e2, 'L').origen).toEqual({ elementoId: 'A', puerto: PUERTO.arriba });
    expect(getLinea(e2, 'L').destino).toEqual({ elementoId: 'B', puerto: PUERTO.izquierda });
    const e3 = soltarExtremo(e2, 'L', 'origen', { x: 20, y: 20 }, { radio: 12 }).escena;
    expect(getLinea(e3, 'L').origen).toBeUndefined();
    expect(getLinea(e3, 'L').destino).toEqual({ elementoId: 'B', puerto: PUERTO.izquierda });
  });

  it('se puede pegar a un puerto de la misma forma que el otro extremo', () => {
    const e = soltarExtremo(soltarExtremo(libre(), 'L', 'origen', { x: 200, y: 130 }, { radio: 12 }).escena, 'L', 'destino', { x: 150, y: 160 }, { radio: 12 }).escena;
    expect(getLinea(e, 'L').origen?.elementoId).toBe('A');
    expect(getLinea(e, 'L').destino?.elementoId).toBe('A');
    const { ruta } = trazadoDeLinea(e, getLinea(e, 'L'));
    expect(ruta.every((p) => Number.isFinite(p.x))).toBe(true);
  });

  it('conectar valida forma y puerto, y conectar(null) despega dejando el extremo en su sitio', () => {
    const e = libre();
    expect(conectar(e, 'L', 'destino', { elementoId: 'nada', puerto: 0 })).toBe(e);
    expect(conectar(e, 'L', 'destino', { elementoId: 'B', puerto: 99 })).toBe(e);
    expect(conectar(e, 'L', 'destino', { elementoId: 'B', puerto: -1 })).toBe(e);
    expect(conectar(e, 'L', 'destino', { elementoId: 'B', puerto: Number.NaN })).toBe(e);
    expect(conectar(e, 'A', 'destino', { elementoId: 'B', puerto: 0 })).toBe(e); // A no es una línea
    expect(conectar(e, 'L', 'destino', null)).toBe(e);
    const pegada = conectar(e, 'L', 'destino', { elementoId: 'B', puerto: PUERTO.arriba });
    expect(getLinea(pegada, 'L').puntos[1]).toEqual({ x: 450, y: 260 });
    expect(conectar(pegada, 'L', 'destino', { elementoId: 'B', puerto: PUERTO.arriba })).toBe(pegada);
    const suelta = conectar(pegada, 'L', 'destino', null);
    expect(getLinea(suelta, 'L').destino).toBeUndefined();
    expect(getLinea(suelta, 'L').puntos[1]).toEqual({ x: 450, y: 260 });
  });

  it('una línea bloqueada no se toca', () => {
    const e = escena(forma('A', 100, 100), linea('L', [[0, 0], [10, 10]], { bloqueado: true }));
    expect(conectar(e, 'L', 'origen', { elementoId: 'A', puerto: 0 })).toBe(e);
    expect(soltarExtremo(e, 'L', 'destino', { x: 5, y: 5 }, { radio: 10 }).escena).toBe(e);
    expect(insertarVia(e, 'L', 0, { x: 5, y: 5 })).toBe(e);
  });

  it('el resultado sigue siendo una escena válida', () => {
    const r = soltarExtremo(libre(), 'L', 'destino', { x: 405, y: 292 }, { radio: 12 }).escena;
    expect(normalizarEscena(r)).toEqual(r);
  });
});

// ─── Puntos intermedios ───────────────────────────────────────────────────────

describe('puntos intermedios', () => {
  const base = (): Escena => escena(linea('L', [[0, 0], [100, 100]], { trazado: 'ortogonal' }));
  it('insertar, mover y quitar', () => {
    const a = insertarVia(base(), 'L', 0, { x: 50, y: 80 });
    expect(getLinea(a, 'L').puntos).toEqual([{ x: 0, y: 0 }, { x: 50, y: 80 }, { x: 100, y: 100 }]);
    const b = moverVia(a, 'L', 1, { x: 60, y: 90.123 });
    expect(getLinea(b, 'L').puntos[1]).toEqual({ x: 60, y: 90.12 });
    const c = quitarVia(b, 'L', 1);
    expect(getLinea(c, 'L').puntos).toEqual([{ x: 0, y: 0 }, { x: 100, y: 100 }]);
  });
  it('no se puede mover ni quitar un extremo como si fuera intermedio, ni insertar fuera de rango', () => {
    const a = insertarVia(base(), 'L', 0, { x: 50, y: 80 });
    expect(moverVia(a, 'L', 0, { x: 1, y: 1 })).toBe(a);
    expect(moverVia(a, 'L', 2, { x: 1, y: 1 })).toBe(a);
    expect(quitarVia(a, 'L', 0)).toBe(a);
    expect(quitarVia(a, 'L', 2)).toBe(a);
    expect(insertarVia(a, 'L', 5, { x: 1, y: 1 })).toBe(a);
    expect(insertarVia(a, 'L', -1, { x: 1, y: 1 })).toBe(a);
    expect(moverVia(a, 'L', 1, { x: Number.NaN, y: 1 })).toBe(a);
    expect(moverVia(a, 'L', 1, { x: 50, y: 80 })).toBe(a);
  });
  it('el límite de puntos por línea se respeta', () => {
    let e = base();
    for (let i = 0; i < 300; i++) e = insertarVia(e, 'L', 0, { x: i, y: i });
    expect(getLinea(e, 'L').puntos.length).toBe(200);
    expect(normalizarEscena(e)).toEqual(e);
  });
  it('los puntos intermedios no mueven los extremos pegados', () => {
    const e = sincronizarConectores(conector({ x: 400, y: 260 }, 'derecha', 'izquierda'));
    const v = insertarVia(e, 'L', 0, { x: 300, y: 50 });
    const l = getLinea(v, 'L');
    expect(l.puntos[0]).toEqual({ x: 200, y: 130 });
    expect(l.puntos[2]).toEqual({ x: 400, y: 290 });
    expect(l.origen).toBeDefined();
    expect(l.destino).toBeDefined();
  });
});

// ─── Detección de clics sobre el recorrido real ───────────────────────────────

describe('escenaConRutas', () => {
  it('las líneas ortogonales y curvas se reemplazan por su recorrido, para poder hacer clic donde se ven', () => {
    const e = sincronizarConectores(conector({ x: 400, y: 260 }, 'derecha', 'izquierda'));
    const r = escenaConRutas(e);
    const l = getLinea(r, 'L');
    expect(l.trazado).toBe('recto');
    expect(l.puntos).toEqual(trazadoDeLinea(e, getLinea(e, 'L')).ruta);
    expect(l.origen).toBeUndefined();
    expect(getForma(r, 'A')).toBe(getForma(e, 'A'));
  });
  it('las rectas no se tocan', () => {
    const e = escena(linea('L', [[0, 0], [10, 10]]));
    expect(escenaConRutas(e)).toBe(e);
  });
});

// ─── Rendimiento ──────────────────────────────────────────────────────────────

describe('rendimiento', () => {
  it('enrutar 300 conectores ortogonales cabe en un fotograma de arrastre de la escena entera', () => {
    const elementos: Array<Record<string, unknown>> = [];
    for (let i = 0; i < 301; i++) elementos.push(forma(`F${i}`, (i % 20) * 160, Math.floor(i / 20) * 110, 100, 60));
    for (let i = 0; i < 300; i++) {
      elementos.push(linea(`L${i}`, [[0, 0], [1, 1]], { trazado: 'ortogonal', origen: { elementoId: `F${i}`, puerto: 1 }, destino: { elementoId: `F${i + 1}`, puerto: 3 } }));
    }
    const e = escena(...elementos);
    const t0 = performance.now();
    for (const l of e.elementos) if (l.tipo === 'linea') trazadoDeLinea(e, l);
    const ms = performance.now() - t0;
    expect(ms).toBeLessThan(500);
  });
});
