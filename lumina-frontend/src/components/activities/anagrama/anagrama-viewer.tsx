'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useDroppable, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { AnagramaActivity } from '@/types/slide.types'
import { evaluateActivityResponse, type ActivityEvaluationResult } from '@/lib/activity-scoring'
import { ActivityDragWord } from '../shared/activity-drag-word'
import { ActivityDndRoot } from '../shared/activity-dnd-root'
import { ActivityResultOverlay } from '../shared/activity-result-overlay'
import { mezclarLetras } from './anagrama-config'

// ── Slot destino para una letra ───────────────────────────────────────────────
interface SlotLetraProps {
  slotId: string
  letraColocada: string | null
  esperada: string
  verificado: boolean
}

function SlotLetra({ slotId, letraColocada, esperada, verificado }: SlotLetraProps) {
  const { setNodeRef, isOver } = useDroppable({ id: slotId })

  const estado = verificado && letraColocada !== null
    ? letraColocada === esperada ? 'correcto' : 'incorrecto'
    : 'neutro'

  return (
    <div
      ref={setNodeRef}
      className={`
        w-10 h-10 flex items-center justify-center
        rounded border-2 font-bold text-sm
        transition-all duration-200
        ${isOver ? 'bg-blue-100 border-blue-400' : 'bg-white border-gray-300'}
        ${estado === 'correcto' ? 'border-green-500 bg-green-50' : ''}
        ${estado === 'incorrecto' ? 'border-red-500 bg-red-50' : ''}
      `}
    >
      {letraColocada && (
        <span className={`
          ${estado === 'correcto' ? 'text-green-600' : ''}
          ${estado === 'incorrecto' ? 'text-red-600' : ''}
        `}>
          {letraColocada}
        </span>
      )}
    </div>
  )
}

// ── Viewer principal ──────────────────────────────────────────────────────────
interface AnagramaViewerProps {
  actividad: AnagramaActivity
  onComplete?: (response: unknown) => void
}

interface EstadoPalabra {
  letrasOrigen: { id: string; letra: string }[]
  slots: (string | null)[]
  intentosRestantes: number
  verificado: boolean
  correcta: boolean | null
}

export function AnagramaViewer({ actividad, onComplete }: AnagramaViewerProps) {
  const { configuracion, palabras } = actividad
  const [indicePalabra, setIndicePalabra] = useState(0)
  const [estados, setEstados] = useState<EstadoPalabra[]>(() =>
    palabras.map(p => {
      const letras = mezclarLetras(p.texto)
      return {
        letrasOrigen: letras.map((l, i) => ({ id: `letra-${i}-${l}`, letra: l })),
        slots: Array(p.texto.length).fill(null),
        intentosRestantes: configuracion.intentos === 0 ? Number.MAX_SAFE_INTEGER : configuracion.intentos,
        verificado: false,
        correcta: null,
      } as EstadoPalabra
    })
  )
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [mostrarResultado, setMostrarResultado] = useState(false)
  const [evaluation, setEvaluation] = useState<ActivityEvaluationResult | null>(null)

  const palabraActual = palabras[indicePalabra]
  const estadoActual = estados[indicePalabra]

  const todosCompletos = estadoActual.slots.every(s => s !== null)

  // Verificación automática al completar todos los slots
  useEffect(() => {
    if (!todosCompletos || estadoActual.verificado) return
    const target = palabraActual.texto.toUpperCase()
    const respuesta = estadoActual.slots.join('')
    const correcta = respuesta === target

    setEstados(prev => prev.map((e, i) =>
      i === indicePalabra ? { ...e, verificado: true as const, correcta } : e
    ) as EstadoPalabra[])
  }, [todosCompletos, estadoActual.verificado, estadoActual.slots, palabraActual, indicePalabra])

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setActiveDragId(e.active.id as string)
  }, [])

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e
    setActiveDragId(null)
    if (!over || estadoActual.verificado) return

    const activeId = active.id as string
    const overId = over.id as string

    if (!overId.startsWith('slot-')) return

    const slotIndex = parseInt(overId.replace('slot-', ''))
    const letra = estadoActual.letrasOrigen.find(l => l.id === activeId)
    if (!letra) return
    if (estadoActual.slots[slotIndex] !== null) return  // slot ocupado

    setEstados(prev => prev.map((e, i) => {
      if (i !== indicePalabra) return e
      const nuevosSlots = [...e.slots]
      nuevosSlots[slotIndex] = letra.letra
      return {
        ...e,
        slots: nuevosSlots,
        letrasOrigen: e.letrasOrigen.filter(l => l.id !== activeId),
      }
    }))
  }, [estadoActual, indicePalabra])

  const handleReiniciarPalabra = useCallback(() => {
    const letras = mezclarLetras(palabraActual.texto)
    setEstados(prev => prev.map((e, i) =>
      i !== indicePalabra ? e : {
        ...e,
        letrasOrigen: letras.map((l, idx) => ({ id: `letra-r${e.intentosRestantes}-${idx}-${l}`, letra: l })),
        slots: Array(palabraActual.texto.length).fill(null),
        verificado: false,
        correcta: null,
      }
    ))
  }, [palabraActual, indicePalabra])

  const handleSiguiente = useCallback(() => {
    if (indicePalabra < palabras.length - 1) {
      setIndicePalabra(i => i + 1)
    } else {
      // Fin del juego
      const raw = { slotsPorPalabra: estados.map((e) => [...e.slots]) }
      const evaluated = evaluateActivityResponse('anagrama', actividad, raw)
      setEvaluation(evaluated)
      onComplete?.(raw)
      setMostrarResultado(true)
    }
  }, [indicePalabra, palabras.length, estados, actividad, onComplete])

  const puedeReintentar =
    estadoActual.verificado &&
    estadoActual.correcta === false &&
    estadoActual.intentosRestantes > 0

  const activeLetter = activeDragId
    ? estadoActual.letrasOrigen.find(l => l.id === activeDragId)
    : null


  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4 overflow-y-auto p-4 bg-white">
      {/* Progreso */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">
          Palabra {indicePalabra + 1} de {palabras.length}
        </span>
        {configuracion.intentos > 0 && (
          <span className="text-xs text-gray-600">
            Intentos restantes: {estadoActual.intentosRestantes}
          </span>
        )}
      </div>

      {/* Pista */}
      {configuracion.mostrarPista && palabraActual.pista && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-sm text-blue-900">
            💡 "{palabraActual.pista}"
          </p>
        </div>
      )}

      <ActivityDndRoot
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        overlay={
          activeLetter ? (
            <div className="flex h-10 w-10 items-center justify-center rounded border-2 border-blue-600 bg-blue-500 text-sm font-bold text-white shadow-lg">
              {activeLetter.letra}
            </div>
          ) : null
        }
      >
        {/* Letras origen (mezcladas) */}
        <div className="bg-gray-50 p-4 rounded border border-gray-200">
          <p className="text-xs text-gray-600 mb-2">Letras disponibles:</p>
          <div className="flex gap-2 flex-wrap">
            {estadoActual.letrasOrigen.map(({ id, letra }) => (
              <ActivityDragWord
                key={id}
                id={id}
                texto={letra}
                variant="letra"
                disabled={estadoActual.verificado}
              />
            ))}
          </div>
        </div>

        {/* Slots destino */}
        <div className="bg-gray-50 p-4 rounded border border-gray-200">
          <p className="text-xs text-gray-600 mb-2">Coloca las letras aquí:</p>
          <div className="flex gap-2 flex-wrap">
            {estadoActual.slots.map((letraEnSlot, i) => (
              <SlotLetra
                key={`slot-${i}`}
                slotId={`slot-${i}`}
                letraColocada={letraEnSlot}
                esperada={palabraActual.texto[i]}
                verificado={estadoActual.verificado}
              />
            ))}
          </div>
        </div>
      </ActivityDndRoot>

      {/* Feedback + acciones */}
      {estadoActual.verificado && (
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
                  Respuesta: {palabraActual.texto.toUpperCase()}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {puedeReintentar && (
              <button
                onClick={handleReiniciarPalabra}
                className="px-3 py-2 text-sm rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium"
              >
                Reintentar
              </button>
            )}
            <button
              onClick={handleSiguiente}
              className="px-3 py-2 text-sm rounded bg-[#2563EB] hover:bg-blue-600 text-white font-medium"
            >
              {indicePalabra < palabras.length - 1 ? 'Siguiente' : 'Finalizar'}
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
            setEstados(estados.map(e => ({
              ...e,
              slots: Array(e.slots.length).fill(null),
              intentosRestantes: e.intentosRestantes,
              verificado: false,
              correcta: null,
            })))
            setIndicePalabra(0)
            setMostrarResultado(false)
            setEvaluation(null)
          }}
          mostrarReintentar={true}
        />
      )}
    </div>
  )
}
