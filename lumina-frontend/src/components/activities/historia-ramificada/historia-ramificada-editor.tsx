'use client'

import React, { useCallback, useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { HistoriaRamificadaActivity, HistoriaNodo } from '@/types/slide.types'
import { HistoriaRamificadaNodeEditor } from './historia-ramificada-node-editor'
import { COLORES_NODO, ETIQUETAS_NODO, generarIdHR, esNodoFinal } from './historia-ramificada-config'

interface HistoriaRamificadaEditorProps {
  actividad: HistoriaRamificadaActivity
  onChange?: (actividad: HistoriaRamificadaActivity) => void
  isSelected?: boolean
}

// Convertir nodos Lumina → nodos React Flow
function luminaToRFNodes(nodos: HistoriaNodo[], nodoInicial: string): Node[] {
  return nodos.map(n => ({
    id: n.id,
    position: { x: n.editorX, y: n.editorY },
    data: {
      label: (
        <div className="flex flex-col items-start gap-0.5 p-1">
          <span
            className="text-xs font-bold px-1.5 py-0.5 rounded text-white"
            style={{ backgroundColor: COLORES_NODO[n.tipo] ?? '#6B7280' }}
          >
            {ETIQUETAS_NODO[n.tipo]}
          </span>
          <span className="text-xs text-gray-700 font-medium mt-0.5">{n.titulo ?? n.id}</span>
          {n.contenido.texto && (
            <span className="text-xs text-gray-400 leading-tight line-clamp-2">
              {n.contenido.texto}
            </span>
          )}
        </div>
      ),
    },
    style: {
      border: `2px solid ${COLORES_NODO[n.tipo] ?? '#6B7280'}`,
      borderRadius: 10,
      backgroundColor: n.id === nodoInicial ? '#EFF6FF' : '#FFFFFF',
      minWidth: 140,
      boxShadow: n.id === nodoInicial ? '0 0 0 3px #BFDBFE' : undefined,
    },
    type: 'default',
  }))
}

// Convertir conexiones Lumina → edges React Flow
function luminaToRFEdges(conexiones: HistoriaRamificadaActivity['conexiones'], nodos: HistoriaNodo[]): Edge[] {
  return conexiones.map(con => {
    const nodoOrigen = nodos.find(n => n.id === con.desdeNodoId)
    const opcion = nodoOrigen?.opciones?.find(o => o.id === con.opcionId)
    return {
      id: con.id,
      source: con.desdeNodoId,
      target: con.haciaNodoId,
      label: opcion?.texto ?? '',
      labelStyle: { fontSize: 10, fill: '#6B7280' },
      style: { stroke: '#9CA3AF' },
      animated: false,
    }
  })
}

export function HistoriaRamificadaEditor({ actividad, onChange }: HistoriaRamificadaEditorProps) {
  const { nodos, conexiones, nodoInicial } = actividad
  const [nodes, setNodes, onNodesChange] = useNodesState(luminaToRFNodes(nodos, nodoInicial))
  const [edges, setEdges, onEdgesChange] = useEdgesState(luminaToRFEdges(conexiones, nodos))
  const [nodoSeleccionado, setNodoSeleccionado] = useState<HistoriaNodo | null>(null)

  // Sincronizar posiciones de nodos al mover
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes)
    // Actualizar editorX/editorY en el modelo de datos
    const positionChanges = changes.filter((c: any) => c.type === 'position' && c.position)
    if (positionChanges.length > 0) {
      const nuevosNodos = nodos.map(n => {
        const change = positionChanges.find((c: any) => c.id === n.id)
        if (change?.position) {
          return { ...n, editorX: Math.round(change.position.x), editorY: Math.round(change.position.y) }
        }
        return n
      })
      onChange?.({ ...actividad, nodos: nuevosNodos })
    }
  }, [nodos, actividad, onChange, onNodesChange])

  // Crear conexión al arrastrar entre nodos
  const handleConnect = useCallback((params: Connection) => {
    if (!params.source || !params.target) return
    const nodoOrigen = nodos.find(n => n.id === params.source)
    if (!nodoOrigen?.opciones?.length) return

    // Usar la primera opción sin conexión asignada
    const opcionesConectadas = conexiones
      .filter(c => c.desdeNodoId === params.source)
      .map(c => c.opcionId)
    const opcionLibre = nodoOrigen.opciones.find(o => !opcionesConectadas.includes(o.id))
    if (!opcionLibre) return

    const nuevaConexion = {
      id: generarIdHR('con'),
      desdeNodoId: params.source,
      opcionId: opcionLibre.id,
      haciaNodoId: params.target,
    }
    const nuevasConexiones = [...conexiones, nuevaConexion]
    onChange?.({ ...actividad, conexiones: nuevasConexiones })
    setEdges((es: any) => addEdge({
      ...params,
      id: nuevaConexion.id,
      label: opcionLibre.texto,
      labelStyle: { fontSize: 10, fill: '#6B7280' },
      style: { stroke: '#9CA3AF' },
    }, es))
  }, [nodos, conexiones, actividad, onChange, setEdges])

  // Seleccionar nodo al hacer clic
  const handleNodeClick: NodeMouseHandler = useCallback((_: any, node: any) => {
    const nodo = nodos.find(n => n.id === node.id)
    setNodoSeleccionado(nodo ?? null)
  }, [nodos])

  // Actualizar nodo desde el panel de edición
  const handleUpdateNodo = useCallback((nodoActualizado: HistoriaNodo) => {
    const nuevosNodos = nodos.map(n => n.id === nodoActualizado.id ? nodoActualizado : n)
    onChange?.({ ...actividad, nodos: nuevosNodos })
    // Actualizar label en React Flow
    setNodes((ns: any[]) => ns.map((n: any) =>
      n.id === nodoActualizado.id
        ? { ...n, ...luminaToRFNodes([nodoActualizado], nodoInicial)[0] }
        : n
    ))
  }, [nodos, actividad, onChange, nodoInicial, setNodes])

  // Añadir nodo nuevo
  const handleAddNodo = useCallback(() => {
    const id = generarIdHR('nodo')
    const nuevoNodo: HistoriaNodo = {
      id,
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
    setNodes((ns: any[]) => [...ns, ...luminaToRFNodes([nuevoNodo], nodoInicial)])
  }, [nodos, actividad, onChange, nodoInicial, setNodes])

  // Eliminar nodo seleccionado
  const handleDeleteNodo = useCallback(() => {
    if (!nodoSeleccionado || nodoSeleccionado.id === nodoInicial) return
    const nuevosNodos = nodos.filter(n => n.id !== nodoSeleccionado.id)
    const nuevasConexiones = conexiones.filter(
      c => c.desdeNodoId !== nodoSeleccionado.id && c.haciaNodoId !== nodoSeleccionado.id
    )
    onChange?.({ ...actividad, nodos: nuevosNodos, conexiones: nuevasConexiones })
    setNodes((ns: any[]) => ns.filter((n: any) => n.id !== nodoSeleccionado.id))
    setEdges((es: any[]) => es.filter((e: any) => e.source !== nodoSeleccionado.id && e.target !== nodoSeleccionado.id))
    setNodoSeleccionado(null)
  }, [nodoSeleccionado, nodoInicial, nodos, conexiones, actividad, onChange, setNodes, setEdges])

  return (
    <div className="w-full h-full relative" style={{ minHeight: 400 }}>
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

      {/* React Flow */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        fitView
        attributionPosition="bottom-right"
      >
        <Background color="#E5E7EB" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={(n: any) => {
            const nodo = nodos.find(nd => nd.id === n.id)
            return COLORES_NODO[nodo?.tipo ?? ''] ?? '#6B7280'
          }}
        />
      </ReactFlow>

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
