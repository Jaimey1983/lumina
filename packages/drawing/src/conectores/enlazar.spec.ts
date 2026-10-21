import { describe, expect, it } from 'vitest';
import { escena, forma, linea } from '../operaciones/util-pruebas.js';
import { TIPOS_FORMA } from '../tipos.js';
import { cantidadDePuertos, ladoDePuerto, puntoDePuerto, VECTOR_LADO, type Lado } from './puertos.js';
import { puertosParaConectar } from './enlazar.js';

// Rectángulos de 100×60. En un rectángulo, el puerto i es el lado i del orden arriba, derecha, abajo, izquierda.
const PUERTO: Record<Lado, number> = { arriba: 0, derecha: 1, abajo: 2, izquierda: 3 };

/** `P` (el padre, al que se suelta) en (300,300); `H` (la que se arrastra) en `(x, y)`. */
const padreEHija = (x: number, y: number, extraH: Record<string, unknown> = {}, extraP: Record<string, unknown> = {}) =>
  escena(forma('P', 300, 300, 100, 60, extraP), forma('H', x, y, 100, 60, extraH));

describe('puertosParaConectar: los cuatro lados', () => {
  it('la hija debajo: sale el puerto de abajo del padre y entra el de arriba de la hija', () => {
    expect(puertosParaConectar(padreEHija(300, 450), 'P', 'H')).toEqual({ origen: { elementoId: 'P', puerto: PUERTO.abajo }, destino: { elementoId: 'H', puerto: PUERTO.arriba } });
  });
  it('la hija encima: sale el de arriba del padre y entra el de abajo de la hija', () => {
    expect(puertosParaConectar(padreEHija(300, 150), 'P', 'H')).toEqual({ origen: { elementoId: 'P', puerto: PUERTO.arriba }, destino: { elementoId: 'H', puerto: PUERTO.abajo } });
  });
  it('la hija a la derecha: sale el de la derecha del padre y entra el de la izquierda de la hija', () => {
    expect(puertosParaConectar(padreEHija(500, 300), 'P', 'H')).toEqual({ origen: { elementoId: 'P', puerto: PUERTO.derecha }, destino: { elementoId: 'H', puerto: PUERTO.izquierda } });
  });
  it('la hija a la izquierda: sale el de la izquierda del padre y entra el de la derecha de la hija', () => {
    expect(puertosParaConectar(padreEHija(100, 300), 'P', 'H')).toEqual({ origen: { elementoId: 'P', puerto: PUERTO.izquierda }, destino: { elementoId: 'H', puerto: PUERTO.derecha } });
  });

  it('en diagonal gana el eje en el que están más separadas', () => {
    // Más lejos en horizontal que en vertical → derecha / izquierda.
    expect(puertosParaConectar(padreEHija(600, 350), 'P', 'H')).toMatchObject({ origen: { puerto: PUERTO.derecha }, destino: { puerto: PUERTO.izquierda } });
    // Más lejos en vertical → abajo / arriba.
    expect(puertosParaConectar(padreEHija(340, 600), 'P', 'H')).toMatchObject({ origen: { puerto: PUERTO.abajo }, destino: { puerto: PUERTO.arriba } });
  });

  it('no depende de cuál es el padre: invertir los papeles da el par inverso', () => {
    const e = padreEHija(300, 450);
    const ida = puertosParaConectar(e, 'P', 'H');
    const vuelta = puertosParaConectar(e, 'H', 'P');
    expect(vuelta?.origen).toEqual(ida?.destino);
    expect(vuelta?.destino).toEqual(ida?.origen);
  });
});

describe('puertosParaConectar: formas pegadas', () => {
  it('con la hija justo debajo, tocándose, el par de contacto gana aunque el error de redondeo lo ponga «un pelo» al revés', () => {
    for (const hueco of [0, -1e-9, 1e-9, -0.3, 0.3, -0.9]) {
      // La hija empieza `hueco` más abajo del borde inferior del padre (negativo = lo pisa un poquito).
      const par = puertosParaConectar(padreEHija(300, 360 + hueco), 'P', 'H');
      expect(par, `hueco ${hueco}`).toEqual({ origen: { elementoId: 'P', puerto: PUERTO.abajo }, destino: { elementoId: 'H', puerto: PUERTO.arriba } });
    }
  });

  it('lo mismo de lado, tocándose', () => {
    for (const hueco of [0, -1e-9, 0.3, -0.9]) {
      expect(puertosParaConectar(padreEHija(400 + hueco, 300), 'P', 'H')).toEqual({ origen: { elementoId: 'P', puerto: PUERTO.derecha }, destino: { elementoId: 'H', puerto: PUERTO.izquierda } });
    }
  });
});

describe('puertosParaConectar: formas giradas y otras formas', () => {
  it('con el padre girado 90° elige el puerto que quedó abajo, no el «de abajo» del rectángulo sin girar', () => {
    const e = padreEHija(300, 450, {}, { transformacion: { x: 300, y: 300, ancho: 100, alto: 60, rotacion: 90 } });
    const par = puertosParaConectar(e, 'P', 'H');
    const padre = e.elementos.find((x) => x.id === 'P');
    expect(padre?.tipo).toBe('forma');
    // Girado 90°, el puerto de la derecha del rectángulo queda abajo.
    expect(par?.origen.puerto).toBe(PUERTO.derecha);
    if (padre?.tipo === 'forma') {
      expect(ladoDePuerto(padre, par!.origen.puerto)).toBe('abajo');
      const y = (i: number) => puntoDePuerto(padre, i).y;
      expect(y(par!.origen.puerto)).toBe(Math.max(...[0, 1, 2, 3].map(y)));
    }
  });

  it('con la hija girada 90° entra por el puerto que quedó arriba', () => {
    const e = padreEHija(300, 450, { transformacion: { x: 300, y: 450, ancho: 100, alto: 60, rotacion: 90 } });
    const par = puertosParaConectar(e, 'P', 'H');
    const hija = e.elementos.find((x) => x.id === 'H');
    expect(par?.origen.puerto).toBe(PUERTO.abajo);
    expect(par?.destino.puerto).toBe(PUERTO.izquierda); // girado 90°, el de la izquierda queda arriba
    if (hija?.tipo === 'forma') {
      const y = (i: number) => puntoDePuerto(hija, i).y;
      expect(y(par!.destino.puerto)).toBe(Math.min(...[0, 1, 2, 3].map(y)));
    }
  });

  it('con ambas giradas 45° elige puertos que se miran', () => {
    const giro = (x: number, y: number) => ({ transformacion: { x, y, ancho: 100, alto: 60, rotacion: 45 } });
    const e = padreEHija(300, 500, giro(300, 500), giro(300, 300));
    const par = puertosParaConectar(e, 'P', 'H');
    expect(par).not.toBeNull();
    const p = e.elementos.find((x) => x.id === 'P');
    const h = e.elementos.find((x) => x.id === 'H');
    if (p?.tipo === 'forma' && h?.tipo === 'forma') {
      expect(puntoDePuerto(p, par!.origen.puerto).y).toBeLessThan(puntoDePuerto(h, par!.destino.puerto).y);
    }
  });

  it('funciona con cualquier forma del catálogo, y el puerto elegido existe', () => {
    for (const tipo of TIPOS_FORMA) {
      const e = padreEHija(300, 450, { forma: tipo }, { forma: tipo });
      const par = puertosParaConectar(e, 'P', 'H');
      expect(par, tipo).not.toBeNull();
      const p = e.elementos.find((x) => x.id === 'P');
      const h = e.elementos.find((x) => x.id === 'H');
      if (p?.tipo === 'forma' && h?.tipo === 'forma') {
        expect(par!.origen.puerto, tipo).toBeLessThan(cantidadDePuertos(p));
        expect(par!.destino.puerto, tipo).toBeLessThan(cantidadDePuertos(h));
        // La hija está debajo: el puerto del padre queda por encima del de la hija.
        expect(puntoDePuerto(p, par!.origen.puerto).y, tipo).toBeLessThan(puntoDePuerto(h, par!.destino.puerto).y);
      }
    }
  });
});

describe('puertosParaConectar: nunca sale «de espaldas» si hay otra salida', () => {
  /** Referencia: todos los pares que se miran (cada puerto sale hacia el otro) y el más corto de ellos. */
  function referencia(e: ReturnType<typeof escena>) {
    const p = e.elementos.find((x) => x.id === 'P');
    const h = e.elementos.find((x) => x.id === 'H');
    if (p?.tipo !== 'forma' || h?.tipo !== 'forma') throw new Error('escena de prueba mal armada');
    const pares: Array<{ po: number; pd: number; d: number }> = [];
    for (let i = 0; i < cantidadDePuertos(p); i++) {
      for (let j = 0; j < cantidadDePuertos(h); j++) {
        const a = puntoDePuerto(p, i);
        const b = puntoDePuerto(h, j);
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const vo = VECTOR_LADO[ladoDePuerto(p, i)];
        const vd = VECTOR_LADO[ladoDePuerto(h, j)];
        if (vo.x * dx + vo.y * dy >= -1 && vd.x * -dx + vd.y * -dy >= -1) pares.push({ po: i, pd: j, d: Math.hypot(dx, dy) });
      }
    }
    return pares;
  }

  it('con las formas solapadas o muy juntas, y giradas de todas las maneras, elige siempre el par más corto de los que se miran', () => {
    let comprobados = 0;
    for (const giroP of [0, 45, 90, 135]) {
      for (const giroH of [0, 30, 90, 180]) {
        for (let dx = -120; dx <= 120; dx += 40) {
          for (let dy = -90; dy <= 90; dy += 30) {
            if (dx === 0 && dy === 0) continue;
            const e = escena(
              forma('P', 300, 300, 100, 60, { transformacion: { x: 300, y: 300, ancho: 100, alto: 60, rotacion: giroP } }),
              forma('H', 300 + dx, 300 + dy, 100, 60, { transformacion: { x: 300 + dx, y: 300 + dy, ancho: 100, alto: 60, rotacion: giroH } }),
            );
            const validos = referencia(e);
            if (validos.length === 0) continue;
            const par = puertosParaConectar(e, 'P', 'H');
            const mejor = validos.reduce((m, v) => (v.d < m.d ? v : m));
            const elegido = validos.find((v) => v.po === par?.origen.puerto && v.pd === par?.destino.puerto);
            expect(elegido, `P ${giroP}°, H ${giroH}° a (${dx}, ${dy}): el par elegido debe mirarse`).toBeDefined();
            expect(elegido?.d, `P ${giroP}°, H ${giroH}° a (${dx}, ${dy}): debe ser el más corto`).toBeCloseTo(mejor.d, 6);
            comprobados++;
          }
        }
      }
    }
    expect(comprobados).toBeGreaterThan(500);
  });
});

describe('puertosParaConectar: casos sin resultado', () => {
  it('la misma forma, una que no existe, una línea o una oculta: null', () => {
    const e = escena(forma('P', 300, 300), forma('H', 300, 450), forma('oculta', 300, 600, 100, 60, { oculto: true }), linea('L', [[0, 0], [10, 10]]));
    expect(puertosParaConectar(e, 'P', 'P')).toBeNull();
    expect(puertosParaConectar(e, 'P', 'zzz')).toBeNull();
    expect(puertosParaConectar(e, 'zzz', 'P')).toBeNull();
    expect(puertosParaConectar(e, 'P', 'L')).toBeNull();
    expect(puertosParaConectar(e, 'P', 'oculta')).toBeNull();
    expect(puertosParaConectar(e, 'P', 'H')).not.toBeNull();
  });

  it('no modifica la escena', () => {
    const e = padreEHija(300, 450);
    const antes = JSON.stringify(e);
    puertosParaConectar(e, 'P', 'H');
    expect(JSON.stringify(e)).toBe(antes);
  });
});
