/**
 * Detección de «dónde se soltó» basada en el PUNTERO (no en el área de la pieza arrastrada).
 *
 * Con la detección por defecto de dnd-kit (`rectIntersection`) gana el contenedor con el que la
 * pieza arrastrada comparte más área. En «Etiquetar imagen» la pieza (una etiqueta ancha) es mucho
 * mayor que el marcador (un círculo pequeño), así que soltar «encima» del marcador acertaba solo si
 * el rectángulo de la etiqueta lo cubría bien, y a veces ganaba un marcador vecino. Aquí manda el
 * puntero: si está dentro de uno o más contenedores gana el de centro más cercano; si cae cerca de
 * uno (dentro de `tolerancia` px), se le perdona la puntería; y con teclado (sin puntero) se usa la
 * detección por área de siempre.
 */
import { rectIntersection, type CollisionDetection } from '@dnd-kit/core'

/** Distancia máxima (px de pantalla) del puntero al borde de un contenedor para darlo por bueno. */
export const TOLERANCIA_PUNTERO_PX = 36

export function colisionPorPuntero(tolerancia: number = TOLERANCIA_PUNTERO_PX): CollisionDetection {
  return (args) => {
    const { pointerCoordinates: p, droppableContainers, droppableRects } = args
    if (!p) return rectIntersection(args)

    const dentro: { id: (typeof droppableContainers)[number]['id']; d: number; container: (typeof droppableContainers)[number] }[] = []
    const cerca: typeof dentro = []
    for (const container of droppableContainers) {
      if (container.disabled) continue
      const r = droppableRects.get(container.id)
      if (!r) continue
      // Distancia del puntero al rectángulo (0 si está dentro) y al centro (para desempatar).
      const dx = Math.max(r.left - p.x, 0, p.x - r.right)
      const dy = Math.max(r.top - p.y, 0, p.y - r.bottom)
      const borde = Math.hypot(dx, dy)
      const centro = Math.hypot(p.x - (r.left + r.width / 2), p.y - (r.top + r.height / 2))
      if (borde === 0) dentro.push({ id: container.id, d: centro, container })
      else if (borde <= tolerancia) cerca.push({ id: container.id, d: borde, container })
    }
    const elegidos = (dentro.length > 0 ? dentro : cerca).sort((a, b) => a.d - b.d)
    return elegidos.map(({ id, container, d }) => ({ id, data: { droppableContainer: container, value: d } }))
  }
}
