'use client'

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type Modifier,
} from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { useSlideCanvasRoot } from '@lumina/editor-shared/slide-canvas-root-context'
import { useCallback, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'

import {
  INSTRUCCIONES_DND_ES,
  coordenadasPorZonas,
  crearAnunciosDnd,
  type ResolverEtiquetas,
} from './activity-dnd-a11y.js'

/** Compensa `transform: scale()` en el lienzo del slide (preview / miniaturas). */
function useCanvasScaleModifier(): Modifier {
  const root = useSlideCanvasRoot()
  const scaleRef = useRef(1)

  useLayoutEffect(() => {
    if (!root) {
      scaleRef.current = 1
      return
    }

    const measure = () => {
      const rect = root.getBoundingClientRect()
      const logicalWidth = root.clientWidth || rect.width
      scaleRef.current =
        logicalWidth > 0 && rect.width > 0 ? rect.width / logicalWidth : 1
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    return () => observer.disconnect()
  }, [root])

  return useCallback(({ transform }) => {
    const scale = scaleRef.current || 1
    if (scale === 1) return transform
    return {
      ...transform,
      x: transform.x / scale,
      y: transform.y / scale,
    }
  }, [])
}

/**
 * Sensores del arrastre (U6, DU8). Mouse (5 px de umbral), táctil (se mantiene 150 ms para
 * no robarle el gesto al scroll) y teclado: Espacio/Enter levanta y suelta, las flechas
 * SALTAN entre zonas (`coordenadasPorZonas`) y Escape cancela. Con `activo = false` no hay
 * ninguno: es el modo «tocar y colocar», donde el arrastre no debe interferir con el toque.
 */
export function useActivityDnDSensors(activo = true) {
  const mouse = useSensor(MouseSensor, { activationConstraint: { distance: 5 } })
  const toque = useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  const teclado = useSensor(KeyboardSensor, { coordinateGetter: coordenadasPorZonas })
  return useSensors(...(activo ? [mouse, toque, teclado] : []))
}

interface ActivityDndRootProps {
  children: ReactNode
  overlay: ReactNode
  onDragStart?: (event: DragStartEvent) => void
  onDragEnd?: (event: DragEndEvent) => void
  /**
   * Nombres legibles para los anuncios: se usan cuando el draggable/droppable no declara
   * `data: { etiqueta }`. Sin nada, se dice «el elemento» y «una zona».
   */
  etiquetas?: ResolverEtiquetas
  /** `false` desactiva el arrastre (modo «tocar y colocar»). Por defecto `true`. */
  arrastreActivo?: boolean
}

/**
 * DndContext con corrección de escala del slide, overlay centrado en el cursor y, desde U6,
 * accesibilidad: teclado, táctil, anuncios e instrucciones en español.
 */
export function ActivityDndRoot({
  children,
  overlay,
  onDragStart,
  onDragEnd,
  etiquetas,
  arrastreActivo = true,
}: ActivityDndRootProps) {
  const sensors = useActivityDnDSensors(arrastreActivo)
  const accesibilidad = useMemo(
    () => ({
      announcements: crearAnunciosDnd(etiquetas),
      screenReaderInstructions: INSTRUCCIONES_DND_ES,
    }),
    [etiquetas],
  )
  const scaleModifier = useCanvasScaleModifier()
  const modifiers = useMemo(
    () => [snapCenterToCursor, scaleModifier],
    [scaleModifier],
  )

  return (
    <DndContext
      sensors={sensors}
      accessibility={accesibilidad}
      modifiers={modifiers}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {children}
      <DragOverlay dropAnimation={null} zIndex={2000}>
        {overlay}
      </DragOverlay>
    </DndContext>
  )
}
