'use client'

import { useLayoutEffect, useState, type RefObject } from 'react'
import { calcularTamanoCeldaAbrirCaja, ABRIR_CAJA_GAP_PX } from './abrir-caja-config'

export { ABRIR_CAJA_GAP_PX }

export function useAbrirCajaCellSize(
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
      setCellSize(
        calcularTamanoCeldaAbrirCaja(rect.width, rect.height, filas, columnas, ABRIR_CAJA_GAP_PX),
      )
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [containerRef, filas, columnas])

  return cellSize
}

export function tamanoEtiquetaCaja(cellSize: number): number {
  return Math.max(10, Math.floor(cellSize * 0.12))
}

export function tamanoIconoCaja(cellSize: number): number {
  return Math.max(16, Math.floor(cellSize * 0.28))
}

export function CajaIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  )
}
