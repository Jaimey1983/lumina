'use client'

import React, { useCallback } from 'react'
import { HistoriaNodo, HistoriaOpcion, HistoriaNodoTipo } from '@/types/slide.types'
import { generarIdHR, ETIQUETAS_NODO, esNodoFinal } from './historia-ramificada-config'

interface NodeEditorProps {
  nodo: HistoriaNodo
  onUpdate: (nodo: HistoriaNodo) => void
  onClose: () => void
}

export function HistoriaRamificadaNodeEditor({ nodo, onUpdate, onClose }: NodeEditorProps) {
  const update = useCallback((partial: Partial<HistoriaNodo>) => {
    onUpdate({ ...nodo, ...partial })
  }, [nodo, onUpdate])

  const updateContenido = useCallback((partial: Partial<HistoriaNodo['contenido']>) => {
    update({ contenido: { ...nodo.contenido, ...partial } })
  }, [nodo.contenido, update])

  const addOpcion = useCallback(() => {
    const id = generarIdHR('op')
    update({ opciones: [...(nodo.opciones ?? []), { id, texto: 'Nueva opción' }] })
  }, [nodo.opciones, update])

  const removeOpcion = useCallback((id: string) => {
    update({ opciones: (nodo.opciones ?? []).filter(o => o.id !== id) })
  }, [nodo.opciones, update])

  const updateOpcion = useCallback((id: string, partial: Partial<HistoriaOpcion>) => {
    update({ opciones: (nodo.opciones ?? []).map(o => o.id === id ? { ...o, ...partial } : o) })
  }, [nodo.opciones, update])

  const esFinal = esNodoFinal(nodo.tipo)

  return (
    <div className="absolute right-4 top-4 z-50 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col max-h-[80vh] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: nodo.tipo === 'narracion' ? '#2563EB' : nodo.tipo === 'decision' ? '#D97706' : nodo.tipo === 'pregunta' ? '#7C3AED' : nodo.tipo === 'final_bueno' ? '#16A34A' : '#DC2626' }}
          />
          <span className="text-sm font-semibold text-gray-700">
            {ETIQUETAS_NODO[nodo.tipo]}
          </span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {/* Tipo */}
        <div>
          <label className="text-xs text-gray-500 block mb-1">Tipo de nodo</label>
          <select
            value={nodo.tipo}
            onChange={e => update({ tipo: e.target.value as HistoriaNodoTipo })}
            className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
          >
            <option value="narracion">Narración</option>
            <option value="decision">Decisión</option>
            <option value="pregunta">Pregunta</option>
            <option value="final_bueno">Final bueno</option>
            <option value="final_malo">Final malo</option>
          </select>
        </div>

        {/* Título */}
        <div>
          <label className="text-xs text-gray-500 block mb-1">Título (opcional)</label>
          <input
            type="text"
            value={nodo.titulo ?? ''}
            onChange={e => update({ titulo: e.target.value || undefined })}
            className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
            placeholder="Título del nodo"
          />
        </div>

        {/* Contenido texto */}
        <div>
          <label className="text-xs text-gray-500 block mb-1">Texto</label>
          <textarea
            value={nodo.contenido.texto ?? ''}
            onChange={e => updateContenido({ texto: e.target.value || undefined })}
            rows={3}
            className="w-full rounded border border-gray-300 px-2 py-1 text-xs resize-none"
            placeholder="Escribe el contenido del nodo..."
          />
        </div>

        {/* Imagen URL */}
        <div>
          <label className="text-xs text-gray-500 block mb-1">Imagen (URL, opcional)</label>
          <input
            type="text"
            value={nodo.contenido.imagen ?? ''}
            onChange={e => updateContenido({ imagen: e.target.value || undefined })}
            className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
            placeholder="https://..."
          />
        </div>

        {/* Opciones — solo para nodos no finales */}
        {!esFinal && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-500">Opciones de respuesta</label>
              <button
                onClick={addOpcion}
                className="text-xs px-2 py-0.5 rounded bg-[#2563EB] text-white"
              >
                + Añadir
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              {(nodo.opciones ?? []).map((op, idx) => (
                <div key={op.id} className="flex flex-col gap-1 p-2 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      checked={op.esCorrecta === true}
                      onChange={() => {
                        update({
                          opciones: (nodo.opciones ?? []).map(o => ({
                            ...o,
                            esCorrecta: o.id === op.id ? true : undefined,
                          })),
                        })
                      }}
                      title="Marcar como correcta"
                    />
                    <input
                      type="text"
                      value={op.texto}
                      onChange={e => updateOpcion(op.id, { texto: e.target.value })}
                      className="flex-1 rounded border border-gray-300 px-2 py-0.5 text-xs"
                      placeholder={`Opción ${idx + 1}`}
                    />
                    <button
                      onClick={() => removeOpcion(op.id)}
                      className="text-gray-400 hover:text-red-500 text-xs"
                    >✕</button>
                  </div>
                  <input
                    type="text"
                    value={op.feedback ?? ''}
                    onChange={e => updateOpcion(op.id, { feedback: e.target.value || undefined })}
                    className="w-full rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-400"
                    placeholder="Feedback (opcional)"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
