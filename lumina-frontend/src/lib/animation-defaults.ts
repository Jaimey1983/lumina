import { nanoid } from 'nanoid'
import type { Animacion, AnimacionTipo, TransicionSlide } from '@/types/animation.types'

export const ANIMACION_DURACION_DEFAULT = 400
export const ANIMACION_DELAY_DEFAULT = 0
export const TRANSICION_DURACION_DEFAULT = 500

export function createDefaultAnimacion(
  tipo: AnimacionTipo = 'fade-in'
): Animacion {
  return {
    id: nanoid(8),
    tipo,
    momento: 'entrada',
    trigger: 'auto',
    duracion: ANIMACION_DURACION_DEFAULT,
    delay: ANIMACION_DELAY_DEFAULT,
    iteraciones: 1,
    easing: 'ease-out',
  }
}

export function createDefaultTransicion(): TransicionSlide {
  return {
    tipo: 'none',
    duracion: TRANSICION_DURACION_DEFAULT,
  }
}

// Catálogo de presets agrupados por categoría para el picker de UI
export const ANIMACION_PRESETS: {
  categoria: string
  tipos: AnimacionTipo[]
}[] = [
  {
    categoria: 'Entrada / Salida',
    tipos: ['fade-in', 'fade-out', 'slide-left', 'slide-right', 'slide-up', 'slide-down'],
  },
  {
    categoria: 'Escala',
    tipos: ['zoom-in', 'zoom-out'],
  },
  {
    categoria: 'Énfasis',
    tipos: ['bounce', 'spin', 'shake', 'pulse'],
  },
  {
    categoria: 'Volteo',
    tipos: ['flip-x', 'flip-y'],
  },
  {
    categoria: 'Cortina',
    tipos: ['wipe-left', 'wipe-right', 'wipe-up', 'wipe-down'],
  },
]

export const TRANSICION_PRESETS: {
  label: string
  tipo: TransicionSlide['tipo']
}[] = [
  { label: 'Ninguna', tipo: 'none' },
  { label: 'Fundido', tipo: 'fade' },
  { label: 'Deslizar izquierda', tipo: 'slide-left' },
  { label: 'Deslizar derecha', tipo: 'slide-right' },
  { label: 'Deslizar arriba', tipo: 'slide-up' },
  { label: 'Deslizar abajo', tipo: 'slide-down' },
  { label: 'Zoom', tipo: 'zoom' },
  { label: 'Voltear', tipo: 'flip' },
  { label: 'Cubo', tipo: 'cube' },
]
