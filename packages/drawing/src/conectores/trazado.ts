// ─── Trazado de una línea o conector (W7) ─────────────────────────────────────
// Une el modelo (`Linea`, formas a las que está pegada) con el enrutado: de aquí sale el trazado
// SVG, los puntos para orientar los extremos, el punto medio de la etiqueta y los tramos.

import type { Forma, Linea, Punto } from '../tipos.js';
import { ladoDePuerto, puntoDePuerto, type Lado } from './puertos.js';
import { muestrearCurva, polilineaRedondeada, puntoMedio, rutaCurva, rutaOrtogonal, simplificar, trazadoCurvo, trazadoPoligonal, type Rect } from './ruteo.js';

/** Radio con el que el trazado «curvo» suaviza los codos de una ruta pegada a formas (cada codo se limita a la mitad de sus tramos). */
const RADIO_CURVO = 1000;

export interface TrazadoLinea {
  /** Atributo `d` del `<path>`. */
  d: string;
  /**
   * Puntos que orientan los extremos: la dirección del primero es `ruta[1] - ruta[0]` y la del último
   * `ruta[n-1] - ruta[n-2]` (en una curva son los puntos de control, para que la flecha siga la tangente).
   */
  ruta: Punto[];
  /** El trazo como polilínea (las curvas, muestreadas): sirve para detectar clics y ubicar cosas. */
  polilinea: Punto[];
  /** La polilínea de cada tramo entre dos puntos consecutivos (extremos y puntos intermedios). */
  tramos: Punto[][];
  /** Mitad del recorrido: ahí va la etiqueta. */
  medio: Punto;
  /** Extremos ya resueltos (pegados a su puerto si lo están). */
  inicio: Punto;
  fin: Punto;
}

function cajaDeForma(f: Forma): Rect {
  const t = f.transformacion;
  const c = { x: t.x + t.ancho / 2, y: t.y + t.alto / 2 };
  const a = (t.rotacion * Math.PI) / 180;
  const cos = Math.abs(Math.cos(a));
  const sin = Math.abs(Math.sin(a));
  const ancho = t.ancho * cos + t.alto * sin;
  const alto = t.ancho * sin + t.alto * cos;
  return { x: c.x - ancho / 2, y: c.y - alto / 2, ancho, alto };
}

export interface ExtremoResuelto {
  punto: Punto;
  lado?: Lado;
  forma?: Forma;
}

/** Extremo de una línea: pegado a su puerto si la forma existe; si no, el punto guardado. */
export function resolverExtremo(linea: Linea, cual: 'origen' | 'destino', formas: ReadonlyMap<string, Forma>): ExtremoResuelto {
  const conexion = linea[cual];
  const guardado = cual === 'origen' ? (linea.puntos[0] as Punto) : (linea.puntos[linea.puntos.length - 1] as Punto);
  const forma = conexion ? formas.get(conexion.elementoId) : undefined;
  if (!conexion || !forma) return { punto: { ...guardado } };
  return { punto: puntoDePuerto(forma, conexion.puerto), lado: ladoDePuerto(forma, conexion.puerto), forma };
}

/** Puntos de la línea tal como se dibujan (extremos pegados a su puerto) y los lados por los que sale/entra. */
export function puntosDeControl(linea: Linea, formas: ReadonlyMap<string, Forma>): { puntos: Punto[]; ladoInicio?: Lado; ladoFin?: Lado; obstaculos: Rect[] } {
  const a = resolverExtremo(linea, 'origen', formas);
  const b = resolverExtremo(linea, 'destino', formas);
  const intermedios = linea.puntos.slice(1, -1).map((p) => ({ ...p }));
  return {
    puntos: [a.punto, ...intermedios, b.punto],
    ...(a.lado ? { ladoInicio: a.lado } : {}),
    ...(b.lado ? { ladoFin: b.lado } : {}),
    obstaculos: [a.forma, b.forma].filter((f): f is Forma => f !== undefined).map(cajaDeForma),
  };
}

export function trazarLinea(linea: Linea, formas: ReadonlyMap<string, Forma>): TrazadoLinea {
  const { puntos, ladoInicio, ladoFin, obstaculos } = puntosDeControl(linea, formas);
  const inicio = puntos[0] as Punto;
  const fin = puntos[puntos.length - 1] as Punto;

  if (linea.trazado === 'ortogonal') {
    const { ruta, tramos } = rutaOrtogonal({ puntos, ladoInicio, ladoFin, obstaculos });
    return { d: trazadoPoligonal(ruta, linea.estilo.radio), ruta, polilinea: ruta, tramos, medio: puntoMedio(ruta), inicio, fin };
  }

  // Pegado a una forma, el conector curvo es la ruta ortogonal con todos los codos suavizados: así
  // sale de frente, no cruza las formas y no hace bucles aunque el otro extremo quede «detrás».
  if (linea.trazado === 'curvo' && (ladoInicio || ladoFin)) {
    const { ruta, tramos } = rutaOrtogonal({ puntos, ladoInicio, ladoFin, obstaculos });
    const polilinea = polilineaRedondeada(ruta, RADIO_CURVO);
    return { d: trazadoPoligonal(ruta, RADIO_CURVO), ruta, polilinea, tramos: tramos.map((t) => polilineaRedondeada(t, RADIO_CURVO)), medio: puntoMedio(polilinea), inicio, fin };
  }

  if (linea.trazado === 'curvo') {
    const curva = rutaCurva({ puntos, ladoInicio, ladoFin });
    const polilinea = muestrearCurva(curva);
    const pasos = polilinea.length > 1 ? (polilinea.length - 1) / curva.segmentos.length : 1;
    const tramos = curva.segmentos.map((_, i) => polilinea.slice(i * pasos, (i + 1) * pasos + 1));
    const primero = curva.segmentos[0];
    const ultimo = curva.segmentos[curva.segmentos.length - 1];
    return {
      d: trazadoCurvo(curva),
      ruta: [inicio, primero?.c1 ?? inicio, ultimo?.c2 ?? fin, fin],
      polilinea,
      tramos,
      medio: puntoMedio(polilinea),
      inicio,
      fin,
    };
  }

  const ruta = simplificar(puntos);
  const tramos = puntos.slice(1).map((p, i) => [puntos[i] as Punto, p]);
  return { d: trazadoPoligonal(puntos), ruta: ruta.length >= 2 ? ruta : puntos, polilinea: puntos, tramos, medio: puntoMedio(puntos), inicio, fin };
}
