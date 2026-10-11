/**
 * U6 — accesibilidad del arrastre (etapa U / DU8): anuncios en español, instrucciones para
 * lectores de pantalla y el desplazamiento con flechas entre zonas. Todo PURO (sin React ni
 * DOM) salvo lo que recibe de `@dnd-kit`, para probarlo sin navegador.
 */
import type {
  Announcements,
  DroppableContainer,
  KeyboardCoordinateGetter,
  ScreenReaderInstructions,
  UniqueIdentifier,
} from '@dnd-kit/core';

// ─── Etiquetas ────────────────────────────────────────────────────────────────

/** Punto en pantalla (el `Coordinates` de dnd-kit no se exporta desde `@dnd-kit/core`). */
export interface Punto {
  readonly x: number;
  readonly y: number;
}

/** Lo mínimo que necesitamos de un `active`/`over` de dnd-kit para nombrarlo. */
export interface EntidadDnd {
  readonly id: UniqueIdentifier;
  readonly data?: { readonly current?: Record<string, unknown> | undefined };
}

/** Cómo se llama algo cuando no tiene `data.etiqueta` ni la pide el viewer. */
export const NOMBRE_GENERICO = { item: 'el elemento', zona: 'una zona' } as const;

/** Nombre legible: `data.etiqueta` (la pone quien declara el draggable/droppable) o el genérico. */
export function etiquetaDe(
  entidad: EntidadDnd | null | undefined,
  generico: string,
  resolver?: (id: UniqueIdentifier) => string | undefined,
): string {
  if (!entidad) return generico;
  const propia = entidad.data?.current?.etiqueta;
  if (typeof propia === 'string' && propia.trim() !== '') return propia.trim();
  return resolver?.(entidad.id)?.trim() || generico;
}

export interface ResolverEtiquetas {
  readonly item?: (id: UniqueIdentifier) => string | undefined;
  readonly zona?: (id: UniqueIdentifier) => string | undefined;
}

// ─── Instrucciones y anuncios ─────────────────────────────────────────────────

export const INSTRUCCIONES_DND_ES: ScreenReaderInstructions = {
  draggable:
    'Para levantar un elemento, presiona Espacio o Enter. Mientras lo tienes levantado, usa las flechas para moverlo de una zona a otra. Presiona Espacio o Enter para soltarlo en la zona elegida, o Escape para cancelar.',
};

/** Anuncios de dnd-kit en español. */
export function crearAnunciosDnd(resolver: ResolverEtiquetas = {}): Announcements {
  const item = (e: EntidadDnd) => etiquetaDe(e, NOMBRE_GENERICO.item, resolver.item);
  const zona = (e: EntidadDnd | null | undefined) => etiquetaDe(e, NOMBRE_GENERICO.zona, resolver.zona);
  return {
    onDragStart: ({ active }) => `Levantaste ${item(active)}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `${capitalizar(item(active))} está sobre ${zona(over)}.`
        : `${capitalizar(item(active))} ya no está sobre ninguna zona.`,
    onDragEnd: ({ active, over }) =>
      over
        ? `Soltaste ${item(active)} en ${zona(over)}.`
        : `Soltaste ${item(active)} fuera de las zonas. Quedó donde estaba.`,
    onDragCancel: ({ active }) => `Cancelaste el movimiento. ${capitalizar(item(active))} volvió a su lugar.`,
  };
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// ─── Flechas entre zonas ──────────────────────────────────────────────────────

export type Direccion = 'arriba' | 'abajo' | 'izquierda' | 'derecha';

export function direccionDeTecla(code: string): Direccion | null {
  switch (code) {
    case 'ArrowUp':
      return 'arriba';
    case 'ArrowDown':
      return 'abajo';
    case 'ArrowLeft':
      return 'izquierda';
    case 'ArrowRight':
      return 'derecha';
    default:
      return null;
  }
}

export interface RectLike {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

const centro = (r: RectLike): Punto => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });

/**
 * De varias zonas, la más cercana en `direccion` desde `desde` (su centro). Una zona cuenta
 * solo si su centro cae ESTRICTAMENTE hacia ese lado; se prefiere la alineada: el desvío
 * lateral pesa el doble que la distancia en el eje del movimiento. `null` si no hay ninguna.
 */
export function zonaEnDireccion<T extends { readonly rect: RectLike }>(
  desde: RectLike,
  candidatas: readonly T[],
  direccion: Direccion,
): T | null {
  const o = centro(desde);
  let mejor: T | null = null;
  let mejorPuntaje = Infinity;
  for (const c of candidatas) {
    const p = centro(c.rect);
    const dx = p.x - o.x;
    const dy = p.y - o.y;
    const [principal, lateral] =
      direccion === 'derecha' ? [dx, dy] : direccion === 'izquierda' ? [-dx, dy] : direccion === 'abajo' ? [dy, dx] : [-dy, dx];
    if (principal <= 0.5) continue;
    const puntaje = principal + 2 * Math.abs(lateral);
    if (puntaje < mejorPuntaje) {
      mejorPuntaje = puntaje;
      mejor = c;
    }
  }
  return mejor;
}

/**
 * `coordinateGetter` del `KeyboardSensor`: cada flecha SALTA al centro de la zona más cercana
 * en esa dirección (en vez de mover 25 px, que no llega a ninguna parte). Sin zona en esa
 * dirección, no se mueve. Las demás teclas las maneja dnd-kit (Espacio/Enter/Escape).
 */
export const coordenadasPorZonas: KeyboardCoordinateGetter = (event, { active, currentCoordinates, context }) => {
  const direccion = direccionDeTecla(event.code);
  if (!direccion) return undefined;
  event.preventDefault();
  const { collisionRect, droppableRects, droppableContainers } = context;
  if (!collisionRect) return undefined;

  const candidatas = droppableContainers
    .getEnabled()
    .filter((c: DroppableContainer) => c.id !== active && droppableRects.has(c.id))
    .map((c: DroppableContainer) => ({ id: c.id, rect: droppableRects.get(c.id)! }));
  const destino = zonaEnDireccion(collisionRect, candidatas, direccion);
  if (!destino) return undefined;

  const desde = centro(collisionRect);
  const hasta = centro(destino.rect);
  return { x: currentCoordinates.x + (hasta.x - desde.x), y: currentCoordinates.y + (hasta.y - desde.y) };
};
