// ─── Mover, redimensionar y rotar (W4) ────────────────────────────────────────
// Funciones puras: devuelven una escena nueva (o la MISMA referencia si no hay nada que cambiar).
// Los elementos bloqueados nunca se transforman. No redondean: el normalizador redondea al guardar.

import type { Elemento, Escena, Linea, Punto } from '../tipos.js';
import { cajaDeSeleccion, centroDe, rotarPunto, type Caja } from './geometria.js';
import {
  conCambios,
  esConCaja,
  hojasEditables,
  mapaPorId,
  normalizarAngulo,
  type ElementoConCaja,
} from './utilidades.js';

const mismoNumero = (a: number, b: number): boolean => Math.abs(a - b) < 1e-9;

// ─── Mover ────────────────────────────────────────────────────────────────────

const moverPuntos = (puntos: readonly Punto[], dx: number, dy: number): Punto[] => puntos.map((p) => ({ x: p.x + dx, y: p.y + dy }));

/**
 * Desplaza los elementos (y los hijos de los grupos). Una línea que se mueve sola
 * se despega de las formas que no se mueven con ella; si se mueve la forma, la
 * línea la sigue por sí sola (no hace falta tocarla).
 */
export function mover(escena: Escena, ids: Iterable<string>, dx: number, dy: number): Escena {
  if (!Number.isFinite(dx) || !Number.isFinite(dy) || (dx === 0 && dy === 0)) return escena;
  const hojas = hojasEditables(escena, ids);
  if (hojas.length === 0) return escena;
  const movidos = new Set(hojas.map((h) => h.id));
  const cambios = new Map<string, Elemento>();
  for (const h of hojas) {
    if (esConCaja(h)) {
      cambios.set(h.id, { ...h, transformacion: { ...h.transformacion, x: h.transformacion.x + dx, y: h.transformacion.y + dy } } as Elemento);
    } else {
      const { origen, destino, ...resto } = h;
      cambios.set(h.id, {
        ...resto,
        puntos: moverPuntos(h.puntos, dx, dy),
        ...(origen && movidos.has(origen.elementoId) ? { origen } : {}),
        ...(destino && movidos.has(destino.elementoId) ? { destino } : {}),
      });
    }
  }
  return conCambios(escena, cambios);
}

// ─── Redimensionar ────────────────────────────────────────────────────────────

export const ASAS = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const;
export type Asa = (typeof ASAS)[number];

export interface OpcionesRedimensionar {
  /** Conservar la proporción de la caja (por defecto no). */
  proporcional?: boolean;
  /** Crecer desde el centro en vez de dejar fijo el lado opuesto (por defecto no). */
  desdeCentro?: boolean;
  /** Tamaño mínimo de cada lado (por defecto 8). */
  minimo?: number;
}

const signos = (asa: Asa): { sx: number; sy: number } => ({
  sx: asa.includes('e') ? 1 : asa.includes('w') ? -1 : 0,
  sy: asa.includes('s') ? 1 : asa.includes('n') ? -1 : 0,
});

/** Nuevas medidas de una caja de `ancho` × `alto` al arrastrar `asa` un vector `(dx, dy)` ya expresado en sus ejes. */
function nuevasMedidas(
  ancho: number,
  alto: number,
  sx: number,
  sy: number,
  dx: number,
  dy: number,
  opciones: OpcionesRedimensionar,
): { ancho: number; alto: number } {
  const minimo = Math.max(1, opciones.minimo ?? 8);
  const factor = opciones.desdeCentro ? 2 : 1;
  let nw = ancho + sx * dx * factor;
  let nh = alto + sy * dy * factor;
  if (opciones.proporcional && ancho > 0 && alto > 0) {
    let k: number;
    if (sx !== 0 && sy !== 0) k = Math.max(nw / ancho, nh / alto);
    else if (sx !== 0) k = nw / ancho;
    else k = nh / alto;
    k = Math.max(k, minimo / ancho, minimo / alto);
    nw = ancho * k;
    nh = alto * k;
  } else {
    nw = sx === 0 ? ancho : Math.max(minimo, nw);
    nh = sy === 0 ? alto : Math.max(minimo, nh);
  }
  return { ancho: nw, alto: nh };
}

function redimensionarUno(
  escena: Escena,
  e: ElementoConCaja,
  asa: Asa,
  dx: number,
  dy: number,
  opciones: OpcionesRedimensionar,
): Escena {
  const t = e.transformacion;
  const { sx, sy } = signos(asa);
  // El arrastre se expresa en los ejes del elemento (que puede estar rotado).
  const local = rotarPunto({ x: dx, y: dy }, { x: 0, y: 0 }, -t.rotacion);
  const m = nuevasMedidas(t.ancho, t.alto, sx, sy, local.x, local.y, opciones);
  const c = centroDe(t);
  let centro: Punto = c;
  if (!opciones.desdeCentro) {
    // El lado (o esquina) opuesto queda fijo en la escena.
    const ancla = rotarPunto({ x: c.x - sx * (t.ancho / 2), y: c.y - sy * (t.alto / 2) }, c, t.rotacion);
    // centro nuevo = ancla + R·(sx·w'/2, sy·h'/2)
    const vector = rotarPunto({ x: sx * (m.ancho / 2), y: sy * (m.alto / 2) }, { x: 0, y: 0 }, t.rotacion);
    centro = { x: ancla.x + vector.x, y: ancla.y + vector.y };
  }
  const nuevo = { ...t, x: centro.x - m.ancho / 2, y: centro.y - m.alto / 2, ancho: m.ancho, alto: m.alto };
  if (mismoNumero(nuevo.x, t.x) && mismoNumero(nuevo.y, t.y) && mismoNumero(nuevo.ancho, t.ancho) && mismoNumero(nuevo.alto, t.alto)) return escena;
  return conCambios(escena, new Map<string, Elemento>([[e.id, { ...e, transformacion: nuevo } as Elemento]]));
}

function escalarPunto(p: Punto, ancla: Punto, fx: number, fy: number): Punto {
  return { x: ancla.x + (p.x - ancla.x) * fx, y: ancla.y + (p.y - ancla.y) * fy };
}

function redimensionarCaja(
  escena: Escena,
  ids: Iterable<string>,
  asa: Asa,
  dx: number,
  dy: number,
  opciones: OpcionesRedimensionar,
): Escena {
  const hojas = hojasEditables(escena, ids);
  if (hojas.length === 0) return escena;
  const caja = cajaDeSeleccion(
    escena,
    hojas.map((h) => h.id),
  );
  if (!caja) return escena;
  const { sx, sy } = signos(asa);
  // Un lado sin extensión (una línea horizontal, por ejemplo) no se puede escalar en ese eje.
  const sxEf = caja.ancho > 1e-9 ? sx : 0;
  const syEf = caja.alto > 1e-9 ? sy : 0;
  const m = nuevasMedidas(caja.ancho || 1, caja.alto || 1, sxEf, syEf, dx, dy, opciones);
  const fx = sxEf === 0 ? 1 : m.ancho / caja.ancho;
  const fy = syEf === 0 ? 1 : m.alto / caja.alto;
  const cx = caja.x + caja.ancho / 2;
  const cy = caja.y + caja.alto / 2;
  const ancla: Punto = opciones.desdeCentro
    ? { x: cx, y: cy }
    : { x: sxEf === 0 ? cx : sxEf > 0 ? caja.x : caja.x + caja.ancho, y: syEf === 0 ? cy : syEf > 0 ? caja.y : caja.y + caja.alto };
  if (mismoNumero(fx, 1) && mismoNumero(fy, 1)) return escena;

  const cambios = new Map<string, Elemento>();
  for (const h of hojas) {
    if (esConCaja(h)) {
      const t = h.transformacion;
      const c = escalarPunto(centroDe(t), ancla, fx, fy);
      const ancho = Math.max(1, t.ancho * fx);
      const alto = Math.max(1, t.alto * fy);
      cambios.set(h.id, { ...h, transformacion: { ...t, ancho, alto, x: c.x - ancho / 2, y: c.y - alto / 2 } } as Elemento);
    } else {
      cambios.set(h.id, { ...h, puntos: h.puntos.map((p) => escalarPunto(p, ancla, fx, fy)) });
    }
  }
  return conCambios(escena, cambios);
}

/**
 * Arrastra el asa `asa` un vector `(dx, dy)` (en coordenadas de escena).
 * Un solo elemento con caja se redimensiona exactamente, también si está rotado;
 * varios elementos (o un grupo o una línea) se escalan juntos respecto de su caja.
 */
export function redimensionar(
  escena: Escena,
  ids: Iterable<string>,
  asa: Asa,
  dx: number,
  dy: number,
  opciones: OpcionesRedimensionar = {},
): Escena {
  if (!Number.isFinite(dx) || !Number.isFinite(dy) || (dx === 0 && dy === 0)) return escena;
  const lista = [...ids];
  const hojas = hojasEditables(escena, lista);
  const unico = hojas.length === 1 ? hojas[0] : undefined;
  const porId = mapaPorId(escena);
  const sinGrupos = lista.every((id) => porId.get(id)?.tipo !== 'grupo');
  if (unico && esConCaja(unico) && sinGrupos) return redimensionarUno(escena, unico, asa, dx, dy, opciones);
  return redimensionarCaja(escena, lista, asa, dx, dy, opciones);
}

// ─── Rotar ────────────────────────────────────────────────────────────────────

/** Redondea `grados` al múltiplo de `paso` más cercano (por defecto 15°). */
export function ajustarAngulo(grados: number, paso = 15): number {
  if (!(paso > 0)) return grados;
  return Math.round(grados / paso) * paso;
}

export interface OpcionesRotar {
  /** Paso de ajuste en grados (por ejemplo 15); sin esto la rotación es continua. */
  ajustar?: number;
  /** Centro de giro cuando son varios elementos (por defecto: el centro medio de ellos). */
  centro?: Punto;
}

function centroMedio(hojas: ReadonlyArray<ElementoConCaja | Linea>): Punto {
  const centros = hojas.map((h) => {
    if (esConCaja(h)) return centroDe(h.transformacion);
    // El promedio de los puntos gira con la línea; el centro de su caja no, y rotar `a` y luego `-a` no sería la identidad.
    const n = Math.max(1, h.puntos.length);
    return { x: h.puntos.reduce((s, p) => s + p.x, 0) / n, y: h.puntos.reduce((s, p) => s + p.y, 0) / n };
  });
  return {
    x: centros.reduce((s, c) => s + c.x, 0) / centros.length,
    y: centros.reduce((s, c) => s + c.y, 0) / centros.length,
  };
}

/**
 * Gira los elementos `grados` (positivo = horario). Uno solo gira sobre su centro;
 * varios giran juntos alrededor de `centro`. Rotar `a` y luego `-a` devuelve la escena original.
 */
export function rotar(escena: Escena, ids: Iterable<string>, grados: number, opciones: OpcionesRotar = {}): Escena {
  if (!Number.isFinite(grados)) return escena;
  const hojas = hojasEditables(escena, ids);
  if (hojas.length === 0) return escena;
  const delta = opciones.ajustar ? ajustarAngulo(grados, opciones.ajustar) : grados;
  if (delta === 0) return escena;
  const centro = opciones.centro ?? centroMedio(hojas);
  const cambios = new Map<string, Elemento>();
  for (const h of hojas) {
    if (esConCaja(h)) {
      const t = h.transformacion;
      const c = rotarPunto(centroDe(t), centro, delta);
      cambios.set(h.id, {
        ...h,
        transformacion: { ...t, x: c.x - t.ancho / 2, y: c.y - t.alto / 2, rotacion: normalizarAngulo(t.rotacion + delta) },
      } as Elemento);
    } else {
      cambios.set(h.id, { ...h, puntos: h.puntos.map((p) => rotarPunto(p, centro, delta)) });
    }
  }
  return conCambios(escena, cambios);
}

/** Fija la rotación absoluta de un elemento con caja (lo que entrega el asa de rotar), con ajuste opcional. */
export function rotarA(escena: Escena, id: string, grados: number, opciones: Pick<OpcionesRotar, 'ajustar'> = {}): Escena {
  if (!Number.isFinite(grados)) return escena;
  const e = escena.elementos.find((x) => x.id === id);
  if (!e || !esConCaja(e)) return escena;
  const destino = normalizarAngulo(opciones.ajustar ? ajustarAngulo(grados, opciones.ajustar) : grados);
  let delta = destino - e.transformacion.rotacion;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return rotar(escena, [id], delta);
}

export type { Caja };
