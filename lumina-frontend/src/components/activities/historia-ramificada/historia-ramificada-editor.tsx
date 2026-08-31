'use client'

import { useCallback, useMemo, useState } from 'react'

import { HistoriaRamificadaActivity, HistoriaNodo } from '@/types/slide.types'
import { GraphCanvas } from '@/lib/graph-editor'
import type {
  GraphConnectAttempt,
  GraphModel,
  GraphNodePositionPatch,
} from '@/lib/graph-editor'

import { HistoriaRamificadaNodeEditor } from './historia-ramificada-node-editor'
import { COLORES_NODO, ETIQUETAS_NODO, generarIdHR } from './historia-ramificada-config'

interface HistoriaRamificadaEditorProps {
  actividad: HistoriaRamificadaActivity
  onChange?: (actividad: HistoriaRamificadaActivity) => void
  /** El bloque canvas de la actividad está seleccionado (PLAN §7). */
  isSelected?: boolean
}

/**
 * Traduce la actividad al modelo agnóstico de graph-core. La presentación
 * (badge de tipo, colores, realce del nodo inicial) viaja en campos de datos;
 * `GraphCanvas` la pinta con su tarjeta interna.
 */
function actividadToGraphModel(actividad: HistoriaRamificadaActivity): GraphModel {
  const { nodos, conexiones, nodoInicial } = actividad
  return {
    nodes: nodos.map((n) => ({
      id: n.id,
      x: n.editorX,
      y: n.editorY,
      label: ETIQUETAS_NODO[n.tipo] ?? n.tipo,
      sublabel: n.titulo ?? n.id,
      body: n.contenido.texto,
      accent: COLORES_NODO[n.tipo] ?? '#6B7280',
      highlighted: n.id === nodoInicial,
      meta: { tipo: n.tipo },
    })),
    edges: conexiones.map((con) => {
      const nodoOrigen = nodos.find((n) => n.id === con.desdeNodoId)
      const opcion = nodoOrigen?.opciones?.find((o) => o.id === con.opcionId)
      return {
        id: con.id,
        source: con.desdeNodoId,
        target: con.haciaNodoId,
        label: opcion?.texto ?? '',
      }
    }),
  }
}

export function HistoriaRamificadaEditor({
  actividad,
  onChange,
  isSelected,
}: HistoriaRamificadaEditorProps) {
  const { nodos, conexiones, nodoInicial } = actividad
  const model = useMemo(() => actividadToGraphModel(actividad), [actividad])
  const [nodoSeleccionado, setNodoSeleccionado] = useState<HistoriaNodo | null>(null)

  // Drag de nodos → editorX/editorY. React Flow ya tiene la posición viva; esto
  // sólo persiste al modelo. (graph-core no persiste por frame — §1.13.)
  const handleNodesMove = useCallback(
    (patches: GraphNodePositionPatch[]) => {
      const byId = new Map(patches.map((p) => [p.id, p]))
      let changed = false
      const nuevosNodos = nodos.map((n) => {
        const patch = byId.get(n.id)
        if (!patch || (patch.x === n.editorX && patch.y === n.editorY)) return n
        changed = true
        return { ...n, editorX: patch.x, editorY: patch.y }
      })
      if (changed) onChange?.({ ...actividad, nodos: nuevosNodos })
    },
    [nodos, actividad, onChange],
  )

  // Conexión al arrastrar entre nodos: usa la primera opción libre del origen.
  const handleConnect = useCallback(
    (attempt: GraphConnectAttempt) => {
      const nodoOrigen = nodos.find((n) => n.id === attempt.source)
      if (!nodoOrigen?.opciones?.length) return

      const opcionesConectadas = conexiones
        .filter((c) => c.desdeNodoId === attempt.source)
        .map((c) => c.opcionId)
      const opcionLibre = nodoOrigen.opciones.find(
        (o) => !opcionesConectadas.includes(o.id),
      )
      if (!opcionLibre) return

      const nuevaConexion = {
        id: generarIdHR('con'),
        desdeNodoId: attempt.source,
        opcionId: opcionLibre.id,
        haciaNodoId: attempt.target,
      }
      onChange?.({ ...actividad, conexiones: [...conexiones, nuevaConexion] })
    },
    [nodos, conexiones, actividad, onChange],
  )

  const handleNodeSelect = useCallback(
    (id: string) => {
      setNodoSeleccionado(nodos.find((n) => n.id === id) ?? null)
    },
    [nodos],
  )

  const handleUpdateNodo = useCallback(
    (nodoActualizado: HistoriaNodo) => {
      const nuevosNodos = nodos.map((n) =>
        n.id === nodoActualizado.id ? nodoActualizado : n,
      )
      onChange?.({ ...actividad, nodos: nuevosNodos })
    },
    [nodos, actividad, onChange],
  )

  const handleAddNodo = useCallback(() => {
    const nuevoNodo: HistoriaNodo = {
      id: generarIdHR('nodo'),
      tipo: 'narracion',
      contenido: { texto: 'Nuevo nodo' },
      opciones: [
        { id: generarIdHR('op'), texto: 'Opción 1' },
        { id: generarIdHR('op'), texto: 'Opción 2' },
      ],
      editorX: 250 + Math.random() * 100,
      editorY: 250 + Math.random() * 100,
    }
    onChange?.({ ...actividad, nodos: [...nodos, nuevoNodo] })
  }, [nodos, actividad, onChange])

  const handleDeleteNodo = useCallback(() => {
    if (!nodoSeleccionado || nodoSeleccionado.id === nodoInicial) return
    const nuevosNodos = nodos.filter((n) => n.id !== nodoSeleccionado.id)
    const nuevasConexiones = conexiones.filter(
      (c) =>
        c.desdeNodoId !== nodoSeleccionado.id &&
        c.haciaNodoId !== nodoSeleccionado.id,
    )
    onChange?.({ ...actividad, nodos: nuevosNodos, conexiones: nuevasConexiones })
    setNodoSeleccionado(null)
  }, [nodoSeleccionado, nodoInicial, nodos, conexiones, actividad, onChange])

  return (
    <div className="w-full h-full relative" style={{ minHeight: 400 }}>
      <GraphCanvas
        model={model}
        interactive={isSelected !== false}
        onNodesMove={handleNodesMove}
        onConnect={handleConnect}
        onNodeSelect={handleNodeSelect}
      >
        {/* Toolbar */}
        <div className="absolute top-3 left-3 z-10 flex gap-2">
          <button
            onClick={handleAddNodo}
            className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold shadow hover:bg-blue-700 transition-colors"
          >
            + Nodo
          </button>
          {nodoSeleccionado && nodoSeleccionado.id !== nodoInicial && (
            <button
              onClick={handleDeleteNodo}
              className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold shadow hover:bg-red-600 transition-colors"
            >
              Eliminar
            </button>
          )}
        </div>
      </GraphCanvas>

      {/* Panel de edición de nodo */}
      {nodoSeleccionado && (
        <HistoriaRamificadaNodeEditor
          nodo={nodoSeleccionado}
          onUpdate={handleUpdateNodo}
          onClose={() => setNodoSeleccionado(null)}
        />
      )}
    </div>
  )
}
