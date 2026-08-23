'use client'

import { useLayoutEffect, useState, type RefObject } from 'react'
import { calcularTamanoCeldaTopo, TOPO_GAP_PX } from './topo-config'

export { TOPO_GAP_PX }

export function useTopoCellSize(
  containerRef: RefObject<HTMLElement | null>,
  filas: number,
  columnas: number,
): number {
  const [cellSize, setCellSize] = useState(0)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    const update = () => {
      const rect = el.getBoundingClientRect()
      setCellSize(calcularTamanoCeldaTopo(rect.width, rect.height, filas, columnas, TOPO_GAP_PX))
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [containerRef, filas, columnas])

  return cellSize
}

export function tamanoIconoTopo(cellSize: number): number {
  return Math.max(20, Math.floor(cellSize * 0.36))
}
