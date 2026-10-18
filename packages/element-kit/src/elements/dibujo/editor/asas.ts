// ─── Marco de selección y asas (W5) ───────────────────────────────────────────

import { ASAS, cajaDeSeleccion, type Asa, type Escena, type Punto } from "@lumina/drawing";

/** Rectángulo (posiblemente girado) que rodea a la selección y sobre el que van las asas. */
export interface Marco {
  x: number;
  y: number;
  ancho: number;
  alto: number;
  rotacion: number;
  /** Hay al menos un elemento seleccionado que se puede transformar (no bloqueado). */
  editable: boolean;
}

export type TipoAsa = Asa | "rotar";

/** Ids bloqueados, incluidos los hijos de un grupo bloqueado. */
export function bloqueadosEfectivos(escena: Escena): Set<string> {
  const porId = new Map(escena.elementos.map((e) => [e.id, e]));
  const salida = new Set<string>();
  const marcar = (id: string): void => {
    if (salida.has(id)) return;
    salida.add(id);
    const e = porId.get(id);
    if (e?.tipo === "grupo") e.hijos.forEach(marcar);
  };
  for (const e of escena.elementos) if (e.bloqueado) marcar(e.id);
  return salida;
}

const girar = (p: Punto, c: Punto, grados: number): Punto => {
  const a = (grados * Math.PI) / 180;
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  return { x: c.x + dx * Math.cos(a) - dy * Math.sin(a), y: c.y + dx * Math.sin(a) + dy * Math.cos(a) };
};

/**
 * Marco de la selección: si es una sola forma o texto, su propio rectángulo con su giro (así las asas
 * giran con ella); en cualquier otro caso, la caja que envuelve a todo, sin giro.
 */
export function marcoDeSeleccion(escena: Escena, seleccion: readonly string[]): Marco | null {
  const elegidos = escena.elementos.filter((e) => seleccion.includes(e.id));
  if (elegidos.length === 0) return null;
  const bloqueados = bloqueadosEfectivos(escena);
  const editable = elegidos.some((e) => !bloqueados.has(e.id));
  const unico = elegidos.length === 1 ? elegidos[0] : undefined;
  if (unico && (unico.tipo === "forma" || unico.tipo === "texto")) {
    const t = unico.transformacion;
    return { x: t.x, y: t.y, ancho: t.ancho, alto: t.alto, rotacion: t.rotacion, editable };
  }
  const caja = cajaDeSeleccion(escena, seleccion);
  return caja ? { ...caja, rotacion: 0, editable } : null;
}

export const centroDelMarco = (m: Marco): Punto => ({ x: m.x + m.ancho / 2, y: m.y + m.alto / 2 });

/** Distancia (en píxeles de pantalla) entre el borde de arriba y el asa de rotar. */
export const DISTANCIA_ASA_ROTAR_PX = 26;

/** Posición en la escena de cada asa; `zoom` mantiene constante la distancia del asa de rotar en pantalla. */
export function posicionesDeAsas(m: Marco, zoom: number): Record<TipoAsa, Punto> {
  const c = centroDelMarco(m);
  const izq = m.x;
  const der = m.x + m.ancho;
  const arr = m.y;
  const aba = m.y + m.alto;
  const medioX = m.x + m.ancho / 2;
  const medioY = m.y + m.alto / 2;
  const locales: Record<TipoAsa, Punto> = {
    nw: { x: izq, y: arr },
    n: { x: medioX, y: arr },
    ne: { x: der, y: arr },
    e: { x: der, y: medioY },
    se: { x: der, y: aba },
    s: { x: medioX, y: aba },
    sw: { x: izq, y: aba },
    w: { x: izq, y: medioY },
    rotar: { x: medioX, y: arr - DISTANCIA_ASA_ROTAR_PX / zoom },
  };
  const salida = {} as Record<TipoAsa, Punto>;
  for (const k of Object.keys(locales) as TipoAsa[]) salida[k] = girar(locales[k], c, m.rotacion);
  return salida;
}

/** Asa bajo `punto` (en la escena) con una tolerancia en píxeles de pantalla; la de rotar gana en un empate. */
export function asaEn(m: Marco, punto: Punto, zoom: number, toleranciaPx = 8): TipoAsa | null {
  if (!m.editable) return null;
  const pos = posicionesDeAsas(m, zoom);
  const tol = toleranciaPx / zoom;
  const orden: TipoAsa[] = ["rotar", "nw", "ne", "se", "sw", "n", "e", "s", "w"];
  for (const k of orden) {
    const p = pos[k];
    if (Math.hypot(p.x - punto.x, p.y - punto.y) <= tol) return k;
  }
  return null;
}

const CURSORES = ["ns-resize", "nesw-resize", "ew-resize", "nwse-resize"] as const;
const BASE: Record<Asa, number> = { n: 0, ne: 1, e: 2, se: 3, s: 0, sw: 1, w: 2, nw: 3 };

/** Cursor CSS de cada asa, girado según el ángulo del marco. */
export function cursorDeAsa(asa: TipoAsa, rotacion: number): string {
  if (asa === "rotar") return "grab";
  const paso = Math.round((((rotacion % 180) + 180) % 180) / 45) % 4;
  return CURSORES[(BASE[asa] + paso) % 4] ?? "default";
}

export { ASAS };
