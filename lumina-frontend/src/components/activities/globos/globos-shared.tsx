'use client'

import { useLayoutEffect, useState, type RefObject } from 'react'
import { calcularTamanoGlobo } from './globos-config'

export function useGloboMetrics(
  containerRef: RefObject<HTMLElement | null>,
  optionCount: number,
) {
  const [metrics, setMetrics] = useState(() =>
    calcularTamanoGlobo(0, 0, optionCount),
  )

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    const update = () => {
      const rect = el.getBoundingClientRect()
      setMetrics(calcularTamanoGlobo(rect.width, rect.height, optionCount))
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [containerRef, optionCount])

  return metrics
}
