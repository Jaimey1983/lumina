'use client'

import React from 'react'
import { AnagramaActivity } from '@/types/slide.types'
import { mezclarLetras } from './anagrama-config'

interface AnagramaEditorProps {
  actividad: AnagramaActivity
  onActivityChange?: (actividad: AnagramaActivity) => void
}

export function AnagramaEditor({ actividad }: AnagramaEditorProps) {
  const { configuracion, palabras } = actividad

  return (
    <div className="w-full p-4 bg-white rounded-lg border border-gray-200">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Anagrama
        </h3>
        <p className="text-xs text-gray-500">
          {palabras.length} {palabras.length === 1 ? 'palabra' : 'palabras'}
        </p>
      </div>

      {/* Preview de primera palabra */}
      <div className="bg-gray-50 p-4 rounded border border-gray-200">
        {palabras.slice(0, 1).map((p, idx) => (
          <div key={idx} className="space-y-3">
            {/* Pista */}
            {configuracion.mostrarPista && p.pista && (
              <div className="text-xs text-gray-600 italic">
                "{p.pista}"
              </div>
            )}
            {/* Letras mezcladas */}
            <div className="flex gap-2 flex-wrap">
              {mezclarLetras(p.texto).map((letra, i) => (
                <div
                  key={i}
                  className="
                    w-10 h-10 flex items-center justify-center
                    rounded border-2 border-gray-300
                    bg-white font-bold text-sm
                  "
                >
                  {letra}
                </div>
              ))}
            </div>

            {/* Slots destino vacíos */}
            <div className="mt-4 flex gap-2 flex-wrap">
              {p.texto.split('').map((_, i) => (
                <div
                  key={`slot-${i}`}
                  className="
                    w-10 h-10 rounded border-2 border-dashed border-gray-300
                    bg-gray-100
                  "
                />
              ))}
            </div>
          </div>
        ))}
        {palabras.length > 1 && (
          <div className="mt-3 text-xs text-gray-600">
            +{palabras.length - 1} más
          </div>
        )}
      </div>
    </div>
  )
}
