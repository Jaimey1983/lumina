'use client'

import React, { useMemo, useRef } from 'react'
import { TopoActivity } from '@/types/slide.types'
import { topoFingerprint, normalizarTopo, tamanoTextoTopo } from './topo-config'
import { TOPO_GAP_PX, tamanoIconoTopo, useTopoCellSize } from './topo-shared'
import styles from './topo.module.css'

interface TopoEditorProps {
  actividad: TopoActivity
  isSelected?: boolean
}

export function TopoEditor({ actividad }: TopoEditorProps) {
  const fingerprint = topoFingerprint(actividad)
  const { configuracion, preguntas } = useMemo(
    () => normalizarTopo(actividad),
    [fingerprint],
  )
  const { filas, columnas } = configuracion
  const totalHuecos = filas * columnas
  const gridAreaRef = useRef<HTMLDivElement>(null)
  const cellSize = useTopoCellSize(gridAreaRef, filas, columnas)
  const labelSize = tamanoTextoTopo(cellSize || 48)
  const iconSize = tamanoIconoTopo(cellSize || 48)
  const previewActivo = Math.min(1, totalHuecos - 1)

  return (
    <div className="flex h-full min-h-0 w-full select-none flex-col gap-2 overflow-hidden p-3">
      <div className="flex shrink-0 items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Golpea al topo
        </span>
        <span className="text-xs text-gray-400">
          {filas}×{columnas} · {preguntas.length} preguntas
        </span>
      </div>

      <p className="shrink-0 px-1 text-[11px] leading-snug text-gray-400">
        Vista previa: el estudiante golpeará el topo con la respuesta correcta cuando aparezca.
      </p>

      {preguntas[0] && (
        <div className="shrink-0 truncate rounded-lg bg-gray-50 px-2 py-1.5 text-center text-sm font-medium text-gray-700">
          {preguntas[0].enunciado}
        </div>
      )}

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
              gap: TOPO_GAP_PX,
            }}
          >
            {Array.from({ length: totalHuecos }, (_, i) => {
              const activo = i === previewActivo
              return (
                <div
                  key={i}
                  className={`${styles.hueco} ${activo ? styles.huecoPreviewActivo : styles.huecoPreview}`}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    fontSize: labelSize,
                    color: '#fff',
                  }}
                >
                  {activo ? (
                    <span style={{ fontSize: iconSize }} aria-hidden>
                      🐹
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
