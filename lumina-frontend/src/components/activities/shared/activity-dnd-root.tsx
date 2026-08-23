'use client'

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type Modifier,
} from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { useSlideCanvasRoot } from '@/components/widgets/shared/slide-canvas-root-context'
import { useCallback, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'

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

export function useActivityDnDSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )
}

interface ActivityDndRootProps {
  children: ReactNode
  overlay: ReactNode
  onDragStart?: (event: DragStartEvent) => void
  onDragEnd?: (event: DragEndEvent) => void
}

/** DndContext con corrección de escala del slide y overlay centrado en el cursor. */
export function ActivityDndRoot({
  children,
  overlay,
  onDragStart,
  onDragEnd,
}: ActivityDndRootProps) {
  const sensors = useActivityDnDSensors()
  const scaleModifier = useCanvasScaleModifier()
  const modifiers = useMemo(
    () => [snapCenterToCursor, scaleModifier],
    [scaleModifier],
  )

  return (
    <DndContext
      sensors={sensors}
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
