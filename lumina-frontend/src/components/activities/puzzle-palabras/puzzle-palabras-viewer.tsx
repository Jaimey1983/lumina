'use client'

import React, { useState, useCallback } from 'react'
import { useDroppable, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { PuzzlePalabrasActivity } from '@/types/slide.types'
import { evaluateActivityResponse, type ActivityEvaluationResult } from '@/lib/activity-scoring'
import { ActivityDragWord } from '../shared/activity-drag-word'
import { ActivityDndRoot } from '../shared/activity-dnd-root'
import { ActivityResultOverlay } from '../shared/activity-result-overlay'
import { tokenizarOracion, mezclarTokens } from './puzzle-palabras-config'

// ── Zona droppable genérica ───────────────────────────────────────────────────
function ZonaDroppable({
  id,
  children,
  className,
}: {
  id: string
  children: React.ReactNode
  className?: string
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className={`
        transition-all duration-200
        ${isOver ? 'bg-blue-100 border-blue-400' : 'bg-gray-50 border-gray-200'}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

// ── Viewer principal ──────────────────────────────────────────────────────────
interface PuzzlePalabrasViewerProps {
  actividad: PuzzlePalabrasActivity
  onComplete?: (response: unknown) => void
}

interface EstadoOracion {
  tokensOrigen: { id: string; texto: string }[]
  tokensDestino: { id: string; texto: string }[]
  verificado: boolean
  correcta: boolean | null
}

export function PuzzlePalabrasViewer({ actividad, onComplete }: PuzzlePalabrasViewerProps) {
  const { configuracion, oraciones } = actividad
  const [indiceOracion, setIndiceOracion] = useState(0)
  const [estados, setEstados] = useState<EstadoOracion[]>(() =>
    oraciones.map(o => {
      const tokens = tokenizarOracion(o.texto)
      const mezclados = mezclarTokens(tokens)
      return {
        tokensOrigen: mezclados.map((t, i) => ({ id: `tok-${i}-${t}`, texto: t })),
        tokensDestino: [],
        verificado: false,
        correcta: null,
      } as EstadoOracion
    })
  )
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [mostrarResultado, setMostrarResultado] = useState(false)
  const [evaluation, setEvaluation] = useState<ActivityEvaluationResult | null>(null)

  const oracionActual = oraciones[indiceOracion]
  const estadoActual = estados[indiceOracion]

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setActiveDragId(e.active.id as string)
  }, [])

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e
    setActiveDragId(null)
    if (!over || estadoActual.verificado) return

    const activeId = active.id as string
    const overId = over.id as string

    setEstados(prev => prev.map((est, i) => {
      if (i !== indiceOracion) return est

      const enOrigen = est.tokensOrigen.find(t => t.id === activeId)
      const enDestino = est.tokensDestino.find(t => t.id === activeId)
      const token = enOrigen ?? enDestino
      if (!token) return est

      if (overId === 'zona-destino') {
        if (enDestino) return est  // ya está en destino
        return {
          ...est,
          tokensOrigen: est.tokensOrigen.filter(t => t.id !== activeId),
          tokensDestino: [...est.tokensDestino, token],
        }
      } else if (overId === 'zona-origen') {
        if (enOrigen) return est  // ya está en origen
        return {
          ...est,
          tokensDestino: est.tokensDestino.filter(t => t.id !== activeId),
          tokensOrigen: [...est.tokensOrigen, token],
        }
      }
      return est
    }))
  }, [estadoActual.verificado, indiceOracion])

  const handleVerificar = useCallback(() => {
    const respuesta = estadoActual.tokensDestino.map(t => t.texto).join(' ')
    const correcta = respuesta === oracionActual.texto.trim()

    setEstados(prev => prev.map((e, i) =>
      i === indiceOracion ? { ...e, verificado: true as const, correcta } : e
    ) as EstadoOracion[])
  }, [estadoActual, oracionActual, indiceOracion])

  const handleReintentar = useCallback(() => {
    const tokens = tokenizarOracion(oracionActual.texto)
    const mezclados = mezclarTokens(tokens)
    setEstados(prev => prev.map((e, i) =>
      i !== indiceOracion ? e : {
        tokensOrigen: mezclados.map((t, idx) => ({ id: `tok-r${idx}-${t}`, texto: t })),
        tokensDestino: [],
        verificado: false,
        correcta: null,
      }
    ))
  }, [oracionActual, indiceOracion])

  const handleSiguiente = useCallback(() => {
    if (indiceOracion < oraciones.length - 1) {
      setIndiceOracion(i => i + 1)
    } else {
      const raw = {
        tokensPorOracion: estados.map((e) => e.tokensDestino.map((t) => t.texto)),
      }
      const evaluated = evaluateActivityResponse('puzzle_palabras', actividad, raw)
      setEvaluation(evaluated)
      onComplete?.(raw)
      setMostrarResultado(true)
    }
  }, [indiceOracion, oraciones.length, estados, actividad, onComplete])

  const activeToken =
    activeDragId
      ? (estadoActual.tokensOrigen.find(t => t.id === activeDragId) ??
         estadoActual.tokensDestino.find(t => t.id === activeDragId))
      : null


  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4 overflow-y-auto p-4 bg-white">
      {/* Progreso */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">
          Oración {indiceOracion + 1} de {oraciones.length}
        </span>
      </div>

      {/* Pista */}
      {configuracion.mostrarPista && oracionActual.pista && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-sm text-blue-900">
            💡 &quot;{oracionActual.pista}&quot;
          </p>
        </div>
      )}

      <ActivityDndRoot
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        overlay={
          activeToken ? (
            <div className="whitespace-nowrap rounded-full border-2 border-blue-600 bg-blue-500 px-3 py-2 text-sm font-medium text-white shadow-lg">
              {activeToken.texto}
            </div>
          ) : null
        }
      >
        {/* Zona origen */}
        <ZonaDroppable id="zona-origen" className="p-4 rounded border border-gray-200">
          <p className="text-xs text-gray-600 mb-2">Palabras disponibles:</p>
          <div className="flex gap-2 flex-wrap">
            {estadoActual.tokensOrigen.map(({ id, texto }) => (
              <ActivityDragWord
                key={id}
                id={id}
                texto={texto}
                variant="palabra"
                disabled={estadoActual.verificado}
              />
            ))}
          </div>
        </ZonaDroppable>

        {/* Zona destino */}
        <ZonaDroppable
          id="zona-destino"
          className="p-4 rounded border-2 border-dashed min-h-20 flex items-center"
        >
          <div className="w-full">
            {estadoActual.tokensDestino.length > 0 ? (
              <div className="flex gap-2 flex-wrap">
                {estadoActual.tokensDestino.map(({ id, texto }) => (
                  <ActivityDragWord
                    key={id}
                    id={id}
                    texto={texto}
                    variant="palabra"
                    disabled={estadoActual.verificado}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Arrastra las palabras aquí</p>
            )}
          </div>
        </ZonaDroppable>
      </ActivityDndRoot>

      {/* Acciones */}
      {!estadoActual.verificado ? (
        <button
          onClick={handleVerificar}
          disabled={estadoActual.tokensDestino.length === 0}
          className="px-4 py-2 rounded bg-[#2563EB] hover:bg-blue-600 text-white font-medium text-sm disabled:opacity-40"
        >
          Verificar
        </button>
      ) : (
        <div className="space-y-3">
          <div className={`p-3 rounded border ${
            estadoActual.correcta
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {estadoActual.correcta ? (
              <p className="text-sm font-medium">✓ ¡Correcto!</p>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-medium">✗ Incorrecto</p>
                <p className="text-xs opacity-80">
                  Respuesta: {oracionActual.texto}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {configuracion.permitirReintento && !estadoActual.correcta && (
              <button
                onClick={handleReintentar}
                className="px-3 py-2 text-sm rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium"
              >
                Reintentar
              </button>
            )}
            <button
              onClick={handleSiguiente}
              className="px-3 py-2 text-sm rounded bg-[#2563EB] hover:bg-blue-600 text-white font-medium"
            >
              {indiceOracion < oraciones.length - 1 ? 'Siguiente' : 'Finalizar'}
            </button>
          </div>
        </div>
      )}

      {/* Resultado final */}
      {mostrarResultado && (
        <ActivityResultOverlay
          evaluation={evaluation ?? undefined}
          onReintentar={() => {
            // Reintentar toda la actividad
            setEstados(oraciones.map(o => {
              const tokens = tokenizarOracion(o.texto)
              const mezclados = mezclarTokens(tokens)
              return {
                tokensOrigen: mezclados.map((t, i) => ({ id: `tok-${i}-${t}`, texto: t })),
                tokensDestino: [],
                verificado: false,
                correcta: null,
              }
            }))
            setIndiceOracion(0)
            setMostrarResultado(false)
            setEvaluation(null)
          }}
          mostrarReintentar={true}
        />
      )}
    </div>
  )
}
