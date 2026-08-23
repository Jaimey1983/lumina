'use client'

import React, { useState, useCallback } from 'react'
import { HistoriaRamificadaActivity, HistoriaNodo } from '@/types/slide.types'
import { evaluateActivityResponse, type ActivityEvaluationResult } from '@/lib/activity-scoring'
import { ActivityResultOverlay } from '../shared/activity-result-overlay'
import { esNodoFinal, COLORES_NODO } from './historia-ramificada-config'

interface HistoriaRamificadaViewerProps {
  actividad: HistoriaRamificadaActivity
  onComplete?: (response: unknown) => void
}

interface PasoHistorial {
  nodoId: string
  opcionElegida?: string
  fueCorrecta?: boolean
}

export function HistoriaRamificadaViewer({ actividad, onComplete }: HistoriaRamificadaViewerProps) {
  const { configuracion, nodos, conexiones, nodoInicial } = actividad

  const [historial, setHistorial] = useState<PasoHistorial[]>([{ nodoId: nodoInicial }])
  const [mostrarResultado, setMostrarResultado] = useState(false)
  const [evaluation, setEvaluation] = useState<ActivityEvaluationResult | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const nodoActualId = historial[historial.length - 1].nodoId
  const nodoActual = nodos.find(n => n.id === nodoActualId)

  const esFinal = nodoActual ? esNodoFinal(nodoActual.tipo) : false

  // Determinar si la actividad tiene evaluación
  const tieneEvaluacion = nodos.some(
    (n) =>
      n.tipo === 'final_bueno' ||
      n.tipo === 'final_malo' ||
      (n.tipo === 'pregunta' && n.opciones?.some((o) => o.esCorrecta !== undefined)),
  )

  const handleOpcion = useCallback((opcionId: string) => {
    if (!nodoActual) return
    setFeedback(null)

    const opcion = nodoActual.opciones?.find(o => o.id === opcionId)
    if (!opcion) return

    // Mostrar feedback si existe
    if (opcion.feedback) {
      setFeedback(opcion.feedback)
    }

    // Buscar la conexión para esta opción
    const conexion = conexiones.find(
      c => c.desdeNodoId === nodoActualId && c.opcionId === opcionId
    )

    const fueCorrecta = opcion.esCorrecta === true

    setTimeout(() => {
      setFeedback(null)
      if (conexion) {
        const nuevoPaso: PasoHistorial = {
          nodoId: conexion.haciaNodoId,
          opcionElegida: opcionId,
          fueCorrecta: opcion.esCorrecta !== undefined ? fueCorrecta : undefined,
        }
        setHistorial(h => [...h, nuevoPaso])

        const nodoDestino = nodos.find(n => n.id === conexion.haciaNodoId)
        if (nodoDestino && esNodoFinal(nodoDestino.tipo)) {
          const historialFinal = [...historial, nuevoPaso]
          const raw = {
            historial: historialFinal.map(({ nodoId, opcionElegida }) => ({
              nodoId,
              ...(opcionElegida ? { opcionElegida } : {}),
            })),
          }
          const evaluated = evaluateActivityResponse('historia_ramificada', actividad, raw)
          setEvaluation(evaluated)
          onComplete?.(raw)
          if (evaluated.score !== null) {
            setTimeout(() => setMostrarResultado(true), 800)
          }
        }
      }
    }, opcion.feedback ? 1200 : 0)
  }, [nodoActual, nodoActualId, conexiones, nodos, historial, actividad, onComplete])

  const handleRetroceder = useCallback(() => {
    if (historial.length <= 1) return
    setHistorial(h => h.slice(0, -1))
    setFeedback(null)
  }, [historial])

  if (!nodoActual) return null

  const colorNodo = COLORES_NODO[nodoActual.tipo] ?? '#6B7280'
  const progreso = tieneEvaluacion
    ? historial.filter(p => {
        const n = nodos.find(nd => nd.id === p.nodoId)
        return n?.tipo === 'pregunta'
      }).length
    : historial.length - 1

  const totalPreguntas = nodos.filter(n => n.tipo === 'pregunta').length

  const correctasHistorial = historial.filter(p => p.fueCorrecta === true).length

  return (
    <div className="relative w-full h-full flex flex-col" style={{ minHeight: 300 }}>
      {/* Barra de progreso */}
      {configuracion.mostrarProgreso && (
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Progreso</span>
            <span>{historial.length - 1} pasos</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: totalPreguntas > 0 ? `${(progreso / totalPreguntas) * 100}%` : '10%',
                backgroundColor: colorNodo,
              }}
            />
          </div>
        </div>
      )}

      {/* Contenido del nodo */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-4 gap-4">
        {/* Badge de tipo */}
        <div
          className="px-3 py-1 rounded-full text-xs font-semibold text-white self-start"
          style={{ backgroundColor: colorNodo }}
        >
          {nodoActual.titulo ?? nodoActual.tipo}
        </div>

        {/* Imagen */}
        {nodoActual.contenido.imagen && (
          <img
            src={nodoActual.contenido.imagen}
            alt=""
            className="max-h-32 rounded-xl object-cover shadow-md"
          />
        )}

        {/* Texto */}
        {nodoActual.contenido.texto && (
          <p className="text-base text-gray-800 text-center leading-relaxed max-w-md">
            {nodoActual.contenido.texto}
          </p>
        )}

        {/* Feedback de opción */}
        {feedback && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-sm text-blue-700 text-center">
            {feedback}
          </div>
        )}

        {/* Opciones */}
        {!esFinal && nodoActual.opciones && nodoActual.opciones.length > 0 && !feedback && (
          <div className="flex flex-col gap-2 w-full max-w-sm">
            {nodoActual.opciones.map(opcion => {
              const tieneConexion = conexiones.some(
                c => c.desdeNodoId === nodoActualId && c.opcionId === opcion.id
              )
              return (
                <button
                  key={opcion.id}
                  onClick={() => handleOpcion(opcion.id)}
                  disabled={!tieneConexion}
                  className="px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-sm text-gray-700 font-medium hover:border-blue-400 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-left"
                >
                  {opcion.texto}
                  {!tieneConexion && (
                    <span className="text-xs text-gray-400 ml-2">(sin conexión)</span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Nodo final */}
        {esFinal && (
          <div className="flex flex-col items-center gap-3">
            <div className="text-4xl">
              {nodoActual.tipo === 'final_bueno' ? '🏆' : '😔'}
            </div>
            {tieneEvaluacion && (
              <div className="text-sm text-gray-500">
                Respuestas correctas: {correctasHistorial}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Botón retroceder */}
      {configuracion.permitirRetroceder && historial.length > 1 && !esFinal && (
        <div className="px-4 pb-3">
          <button
            onClick={handleRetroceder}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Volver atrás
          </button>
        </div>
      )}

      {/* Overlay resultado */}
      {mostrarResultado && tieneEvaluacion && (
        <ActivityResultOverlay
          evaluation={evaluation ?? undefined}
          mostrarReintentar={false}
        />
      )}
    </div>
  )
}
