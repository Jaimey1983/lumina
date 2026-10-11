'use client'

import React from 'react'
import { useDraggable } from '@dnd-kit/core'

interface ActivityDragWordProps {
  id: string
  texto: string
  disabled?: boolean
  variant?: 'letra' | 'palabra' // letra: cuadrado compacto; palabra: pill horizontal
  estado?: 'correcto' | 'incorrecto' | 'neutro'
  /** Oculta el origen mientras se arrastra (el overlay muestra la pieza). */
  hideWhileDragging?: boolean
  /**
   * Atributos del modo «tocar y colocar» (`useTocarColocar().propsItem(id)`): se fusionan
   * después de los del arrastre. Con el arrastre apagado no hay conflicto.
   */
  propsTocar?: React.HTMLAttributes<HTMLDivElement>
}

export function ActivityDragWord({
  id,
  texto,
  disabled = false,
  variant = 'palabra',
  estado = 'neutro',
  hideWhileDragging = true,
  propsTocar,
}: ActivityDragWordProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled,
    // El nombre que oyen los lectores de pantalla (anuncios y rol), en español.
    data: { etiqueta: texto },
    attributes: { roleDescription: variant === 'letra' ? 'letra arrastrable' : 'palabra arrastrable' },
  })

  const useOverlay = hideWhileDragging
  const style: React.CSSProperties | undefined =
    isDragging && useOverlay
      ? { opacity: 0, pointerEvents: 'none' }
      : transform
        ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
        : undefined

  const borderColor =
    estado === 'correcto'
      ? '#16A34A'
      : estado === 'incorrecto'
      ? '#DC2626'
      : '#D1D5DB'

  const bgColor =
    estado === 'correcto'
      ? '#F0FDF4'
      : estado === 'incorrecto'
      ? '#FEF2F2'
      : '#FFFFFF'

  const isLetra = variant === 'letra'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      {...propsTocar}
      aria-disabled={disabled || undefined}
      className={`
        touch-none cursor-grab active:cursor-grabbing select-none
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--la-color-seleccionado,#2563eb)]
        ${propsTocar?.['aria-pressed'] ? 'ring-2 ring-[color:var(--la-color-seleccionado,#2563eb)]' : ''}
        ${isDragging && !useOverlay ? 'opacity-50' : 'opacity-100'}
        ${isDragging ? '' : 'transition-opacity duration-200'}
        ${disabled ? 'cursor-not-allowed opacity-40' : ''}
      `}
    >
      {isLetra ? (
        <div
          className="
            flex h-10 w-10 items-center justify-center
            rounded border-2 text-lg font-bold
            bg-white
          "
          style={{
            borderColor,
            backgroundColor: bgColor,
            color: estado === 'correcto' ? '#16A34A' : estado === 'incorrecto' ? '#DC2626' : '#000',
          }}
        >
          {texto}
        </div>
      ) : (
        <div
          className="
            whitespace-nowrap rounded-full border-2
            px-3 py-2 text-sm font-medium
          "
          style={{
            borderColor,
            backgroundColor: bgColor,
            color: estado === 'correcto' ? '#16A34A' : estado === 'incorrecto' ? '#DC2626' : '#000',
          }}
        >
          {texto}
        </div>
      )}
    </div>
  )
}
