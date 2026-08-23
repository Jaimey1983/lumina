'use client'

import React, { useRef } from 'react'
import { AbrirCajaActivity } from '@/types/slide.types'
import {
  ABRIR_CAJA_GAP_PX,
  CajaIcon,
  tamanoEtiquetaCaja,
  tamanoIconoCaja,
  useAbrirCajaCellSize,
} from './abrir-caja-shared'
import { normalizarAbrirCaja } from './abrir-caja-config'

interface AbrirCajaEditorProps {
  actividad: AbrirCajaActivity
  isSelected?: boolean
}

export function AbrirCajaEditor({ actividad }: AbrirCajaEditorProps) {
  const { configuracion, cajas } = normalizarAbrirCaja(actividad)
  const { filas, columnas, colorCaja } = configuracion
  const gridAreaRef = useRef<HTMLDivElement>(null)
  const cellSize = useAbrirCajaCellSize(gridAreaRef, filas, columnas)
  const totalSlots = filas * columnas
  const iconSize = tamanoIconoCaja(cellSize || 48)
  const labelSize = tamanoEtiquetaCaja(cellSize || 48)

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-2 overflow-hidden p-3 select-none">
      <div className="flex shrink-0 items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Abrir caja
        </span>
        <span className="text-xs text-gray-400">
          {filas}×{columnas} · {cajas.length} cajas
        </span>
      </div>

      <p className="shrink-0 px-1 text-[11px] leading-snug text-gray-400">
        Vista previa: el estudiante tocará cada caja para descubrir su contenido.
      </p>

      <div
        ref={gridAreaRef}
        className="flex min-h-0 flex-1 items-center justify-center overflow-hidden"
      >
        {cellSize > 0 && (
          <div
            className="grid shrink-0"
            style={{
              gridTemplateColumns: `repeat(${columnas}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${filas}, ${cellSize}px)`,
              gap: ABRIR_CAJA_GAP_PX,
            }}
          >
            {Array.from({ length: totalSlots }, (_, index) => {
              const caja = cajas[index]
              if (!caja) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50"
                    style={{ width: cellSize, height: cellSize }}
                    aria-hidden
                  />
                )
              }

              return (
                <div
                  key={caja.id}
                  className="flex flex-col items-center justify-center gap-1 overflow-hidden rounded-xl p-2 shadow-sm"
                  style={{
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: colorCaja,
                  }}
                >
                  <CajaIcon size={iconSize} className="text-white opacity-90" />
                  <span
                    className="w-full truncate text-center font-semibold leading-tight text-white"
                    style={{ fontSize: labelSize }}
                  >
                    {caja.etiqueta}
                  </span>
                  {caja.contenido.texto ? (
                    <span
                      className="w-full truncate px-1 text-center leading-tight text-white/75"
                      style={{ fontSize: Math.max(8, labelSize - 2) }}
                    >
                      → {caja.contenido.texto}
                    </span>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
