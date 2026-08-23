// ─────────────────────────────────────────────
// TIPOS: Sistema de Animaciones y Transiciones
// Lumina — Grupo 3
// ─────────────────────────────────────────────

export type AnimacionTipo =
  | 'fade-in'
  | 'fade-out'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'zoom-in'
  | 'zoom-out'
  | 'bounce'
  | 'spin'
  | 'shake'
  | 'pulse'
  | 'flip-x'
  | 'flip-y'
  | 'wipe-left'
  | 'wipe-right'
  | 'wipe-up'
  | 'wipe-down'

export type AnimacionTrigger = 'auto' | 'click' | 'hover'

export type AnimacionMomento = 'entrada' | 'salida' | 'enfasis'

export type AnimacionEasing =
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'linear'

export interface Animacion {
  id: string                   // nanoid(8)
  tipo: AnimacionTipo
  momento: AnimacionMomento
  trigger: AnimacionTrigger
  duracion: number             // milisegundos — default 400
  delay: number                // milisegundos — default 0
  iteraciones: number          // 1 = una vez | -1 = infinito (para énfasis)
  easing: AnimacionEasing
}

// Se añade como campo opcional a Block (slide.types.ts)
// animaciones?: Animacion[]

// ─────────────────────────────────────────────
// Transiciones entre slides
// Se añade como campo opcional a Slide (slide.types.ts)
// transicion?: TransicionSlide
// ─────────────────────────────────────────────

export type TransicionTipo =
  | 'none'
  | 'fade'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'zoom'
  | 'flip'
  | 'cube'

export interface TransicionSlide {
  tipo: TransicionTipo
  duracion: number             // milisegundos — default 500
}
