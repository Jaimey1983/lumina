'use client'

import React from 'react'
import { PuzzlePalabrasActivity } from '@/types/slide.types'
import { tokenizarOracion, mezclarTokens } from './puzzle-palabras-config'

interface PuzzlePalabrasEditorProps {
  actividad: PuzzlePalabrasActivity
  onActivityChange?: (actividad: PuzzlePalabrasActivity) => void
}

export function PuzzlePalabrasEditor({ actividad }: PuzzlePalabrasEditorProps) {
  const { oraciones } = actividad

  return (
    <div className="w-full p-4 bg-white rounded-lg border border-gray-200">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Puzzle de palabras
        </h3>
        <p className="text-xs text-gray-500">
          {oraciones.length} {oraciones.length === 1 ? 'oración' : 'oraciones'}
        </p>
      </div>

      {/* Preview primera oración */}
      <div className="bg-gray-50 p-4 rounded border border-gray-200">
        {oraciones.slice(0, 1).map((o, idx) => {
          const tokens = tokenizarOracion(o.texto)
          const mezclados = mezclarTokens(tokens)
          return (
            <div key={idx} className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                {mezclados.map((token, i) => (
                  <div
                    key={i}
                    className="
                      px-3 py-2 text-sm rounded-full
                      border-2 border-gray-300
                      bg-white
                    "
                  >
                    {token}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        {/* Área destino vacía */}
        <div className="mt-4 min-h-12 p-3 rounded border-2 border-dashed border-gray-300 bg-gray-100">
          <p className="text-xs text-gray-600">Área para arrastrar palabras</p>
        </div>
        {oraciones.length > 1 && (
          <div className="mt-3 text-xs text-gray-600">
            +{oraciones.length - 1} más
          </div>
        )}
      </div>
    </div>
  )
}
