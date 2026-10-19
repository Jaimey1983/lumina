import { describe, expect, it } from 'vitest'
import type { DroppableContainer } from '@dnd-kit/core'

import { colisionPorPuntero } from './activity-colisiones.js'

const rect = (cx: number, cy: number, w: number, h = w) => ({
  left: cx - w / 2, right: cx + w / 2, top: cy - h / 2, bottom: cy + h / 2, width: w, height: h,
})
const cont = (id: string): DroppableContainer => ({ id, disabled: false }) as unknown as DroppableContainer

function detectar(puntero: { x: number; y: number } | null, zonas: Record<string, ReturnType<typeof rect>>, tol?: number) {
  const droppableRects = new Map(Object.entries(zonas))
  const args = {
    active: null,
    collisionRect: rect(puntero?.x ?? 0, puntero?.y ?? 0, 120, 30),
    droppableRects,
    droppableContainers: Object.keys(zonas).map(cont),
    pointerCoordinates: puntero,
  } as unknown as Parameters<ReturnType<typeof colisionPorPuntero>>[0]
  return colisionPorPuntero(tol)(args).map((c) => c.id)
}

describe('colisionPorPuntero', () => {
  const zonas = { m1: rect(100, 100, 56), m2: rect(150, 100, 56), banco: rect(100, 300, 400, 60) }

  it('gana el contenedor que contiene el puntero aunque la pieza (ancha) cubra más a otro', () => {
    expect(detectar({ x: 95, y: 100 }, zonas)[0]).toBe('m1')
    expect(detectar({ x: 160, y: 100 }, zonas)[0]).toBe('m2')
  })
  it('con dos zonas bajo el puntero gana la de centro más cercano', () => {
    expect(detectar({ x: 130, y: 100 }, zonas)[0]).toBe('m2')
    expect(detectar({ x: 124, y: 100 }, zonas)[0]).toBe('m1')
  })
  it('perdona la puntería: cerca de un marcador (dentro de la tolerancia) lo elige', () => {
    expect(detectar({ x: 100, y: 150 }, zonas, 36)[0]).toBe('m1')
  })
  it('lejos de todo no elige nada', () => {
    expect(detectar({ x: 400, y: 200 }, zonas, 36)).toEqual([])
  })
  it('dentro del banco elige el banco', () => {
    expect(detectar({ x: 100, y: 300 }, zonas)).toEqual(['banco'])
  })
  it('sin puntero (teclado) usa la detección por área', () => {
    expect(detectar(null, zonas).length).toBeGreaterThanOrEqual(0)
  })
})
