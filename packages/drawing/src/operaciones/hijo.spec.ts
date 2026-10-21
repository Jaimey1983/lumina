import { describe, expect, it } from 'vitest';
import { puntoDePuerto, type Lado } from '../conectores/puertos.js';
import { TIPOS_FORMA } from '../tipos.js';
import { cajaDeElemento } from './geometria.js';
import { crearHijo, crearHijoEn, DISTANCIA_HIJO_POR_DEFECTO } from './hijo.js';
import { escena, forma, getForma, getLinea, grupo, linea, texto } from './util-pruebas.js';

const PUERTO: Record<Lado, number> = { arriba: 0, derecha: 1, abajo: 2, izquierda: 3 };

const padre = (): ReturnType<typeof escena> => escena(forma('P', 100, 100, 100, 60));

describe('crearHijo', () => {
  it('en cada lado: distancia fija, centrada en el eje perpendicular y conector por los puertos correctos', () => {
    const casos: Array<{ lado: Lado; otro: Lado }> = [
      { lado: 'abajo', otro: 'arriba' },
      { lado: 'arriba', otro: 'abajo' },
      { lado: 'derecha', otro: 'izquierda' },
      { lado: 'izquierda', otro: 'derecha' },
    ];
    for (const { lado, otro } of casos) {
      const e0 = padre();
      const r = crearHijo(e0, 'P', lado);
      expect(r.id).not.toBe('');
      const h = getForma(r.escena, r.id);
      const cP = cajaDeElemento(e0, getForma(e0, 'P'));
      const cH = cajaDeElemento(r.escena, h);
      expect(cP && cH).toBeTruthy();
      if (lado === 'abajo') {
        expect(cH!.y - (cP!.y + cP!.alto)).toBeCloseTo(DISTANCIA_HIJO_POR_DEFECTO, 5);
        expect(cH!.x + cH!.ancho / 2).toBeCloseTo(cP!.x + cP!.ancho / 2, 5);
      }
      const ls = r.escena.elementos.filter((x) => x.tipo === 'linea');
      expect(ls).toHaveLength(1);
      const l = getLinea(r.escena, ls[0]!.id);
      expect(l.origen).toEqual({ elementoId: 'P', puerto: PUERTO[lado] });
      expect(l.destino).toEqual({ elementoId: r.id, puerto: PUERTO[otro] });
      expect(l.trazado).toBe('ortogonal');
      expect(l.fin).toBe('flecha');
      expect(l.puntos[0]).toEqual(puntoDePuerto(getForma(r.escena, 'P'), PUERTO[lado]));
      expect(l.puntos.at(-1)).toEqual(puntoDePuerto(h, PUERTO[otro]));
    }
  });

  it('copia tipo, tamaño, estilo y parámetros; texto vacío, rotación 0, sin nombre, al frente', () => {
    const e0 = escena(forma('P', 50, 50, 120, 80, { forma: 'rombo', texto: 'Hola', nombre: 'N', parametros: { puntas: 5 }, estilo: { relleno: { tipo: 'color', color: '#112233' }, contorno: { color: '#445566', grosor: 3 }, opacidad: 0.8, radio: 4, sombra: null } }));
    const r = crearHijo(e0, 'P', 'derecha');
    const h = getForma(r.escena, r.id);
    const p = getForma(e0, 'P');
    expect(h.forma).toBe('rombo');
    expect(h.transformacion.ancho).toBe(120);
    expect(h.transformacion.alto).toBe(80);
    expect(h.transformacion.rotacion).toBe(0);
    expect(h.texto ?? '').toBe('');
    expect(h.nombre).toBeUndefined();
    expect(h.parametros).toEqual({ puntas: 5 });
    expect(h.estilo.relleno).toEqual(p.estilo.relleno);
    expect(r.escena.elementos.some((x) => x.id === r.id)).toBe(true);
  });

  it('padre girado: el lado es el de pantalla (caja envolvente)', () => {
    const e45 = escena(forma('P', 200, 200, 100, 60, { transformacion: { x: 200, y: 200, ancho: 100, alto: 60, rotacion: 45 } }));
    const r = crearHijo(e45, 'P', 'derecha');
    const cP = cajaDeElemento(e45, getForma(e45, 'P'));
    const h = getForma(r.escena, r.id);
    const cH = cajaDeElemento(r.escena, h);
    expect(cH!.x).toBeGreaterThan(cP!.x + cP!.ancho - 1);
  });

  it('evita superponerse: desplaza en el eje perpendicular y es determinista', () => {
    const bloque = forma('X', 100 + 100 + DISTANCIA_HIJO_POR_DEFECTO, 100, 100, 60);
    const e0 = escena(forma('P', 100, 100), bloque);
    const a = crearHijo(e0, 'P', 'derecha');
    const b = crearHijo(e0, 'P', 'derecha');
    expect(a.id).toBe(b.id);
    const h = getForma(a.escena, a.id);
    const cH = cajaDeElemento(a.escena, h)!;
    const cX = cajaDeElemento(a.escena, getForma(a.escena, 'X'))!;
    expect(cH.x + cH.ancho <= cX.x || cH.x >= cX.x + cX.ancho || cH.y + cH.alto <= cX.y || cH.y >= cX.y + cX.alto).toBe(true);
  });

  it('ignora líneas y elementos ocultos como obstáculos', () => {
    const e0 = escena(forma('P', 100, 100), linea('L', [[0, 0], [500, 500]]), forma('O', 100 + 100 + DISTANCIA_HIJO_POR_DEFECTO, 100, 100, 60, { oculto: true }));
    const r = crearHijo(e0, 'P', 'derecha');
    const h = getForma(r.escena, r.id);
    expect(h.transformacion.x).toBeCloseTo(100 + 100 + DISTANCIA_HIJO_POR_DEFECTO, 5);
  });

  it('crearHijoEn centra en el punto y conecta con puertos que se miran', () => {
    const e0 = padre();
    const centro = { x: 400, y: 200 };
    const r = crearHijoEn(e0, 'P', centro);
    const h = getForma(r.escena, r.id);
    expect(h.transformacion.x + h.transformacion.ancho / 2).toBeCloseTo(centro.x, 5);
    expect(h.transformacion.y + h.transformacion.alto / 2).toBeCloseTo(centro.y, 5);
    const l = getLinea(r.escena, r.escena.elementos.find((x) => x.tipo === 'linea')!.id);
    expect(l.origen?.elementoId).toBe('P');
    expect(l.destino?.elementoId).toBe(r.id);
  });

  it('devuelve id vacío y la misma referencia si el padre no es válido', () => {
    const base = escena(forma('P', 0, 0), linea('L', [[0, 0], [1, 1]]), texto('T', 0, 0), grupo('G', []));
    expect(crearHijo(base, 'falta', 'abajo')).toEqual({ escena: base, id: '' });
    expect(crearHijo(base, 'L', 'abajo').escena).toBe(base);
    expect(crearHijo(base, 'T', 'abajo').escena).toBe(base);
    expect(crearHijo(base, 'G', 'abajo').escena).toBe(base);
    const bloq = escena(forma('P', 0, 0, 100, 60, { bloqueado: true }));
    expect(crearHijo(bloq, 'P', 'abajo').escena).toBe(bloq);
  });

  it('funciona con las 21 formas del catálogo', () => {
    for (const t of TIPOS_FORMA) {
      const e0 = escena(forma('P', 80, 80, 100, 60, { forma: t }));
      const r = crearHijo(e0, 'P', 'abajo');
      expect(r.id).not.toBe('');
      expect(getForma(r.escena, r.id).forma).toBe(t);
    }
  });
});
