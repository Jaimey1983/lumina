'use client'

import React from 'react'
import { RuletaActivity } from '@/types/slide.types'
import { RuletaWheel } from './ruleta-wheel'

interface RuletaEditorProps {
  actividad: RuletaActivity
  isSelected?: boolean
}

export function RuletaEditor({ actividad }: RuletaEditorProps) {
  const { configuracion, items } = actividad

  return (
    <div className="h-full w-full min-h-0 select-none p-2">
      <RuletaWheel items={items} colores={configuracion.colores} />
    </div>
  )
}
