import type { GlobosActivity, GlobosPregunta } from '@/types/slide.types'

export const GLOBOS_MAX_PREGUNTAS = 30
export const GLOBOS_MIN_PREGUNTAS = 1
export const GLOBOS_MIN_OPCIONES = 3
export const GLOBOS_MAX_OPCIONES = 8
export const GLOBOS_OPCIONES_SUGERIDAS = 5

export const VELOCIDAD_PX: Record<'lenta' | 'normal' | 'rapida', number> = {
  lenta: 60,
  normal: 100,
  rapida: 160,
}

export function generarIdGlobos(prefijo: string): string {
  return `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

/** Mezcla opciones/globos para que la respuesta correcta no quede siempre a la izquierda. */
export function mezclarOpcionesGlobos<T>(opciones: T[]): T[] {
  const result = [...opciones]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function crearOpcionesGlobosDefault(): GlobosPregunta['opciones'] {
  return [
    { texto: 'Respuesta correcta', correcta: true },
    { texto: 'Distractor 1', correcta: false },
    { texto: 'Distractor 2', correcta: false },
    { texto: 'Distractor 3', correcta: false },
    { texto: 'Distractor 4', correcta: false },
  ]
}

function normalizarOpciones(
  opciones: GlobosPregunta['opciones'],
): GlobosPregunta['opciones'] {
  const limpias = opciones
    .map((op) => ({
      texto: typeof op.texto === 'string' ? op.texto.trim() : '',
      correcta: op.correcta === true,
    }))
    .filter((op) => op.texto.length > 0)

  if (limpias.length >= GLOBOS_MIN_OPCIONES) {
    if (!limpias.some((op) => op.correcta)) {
      return limpias.map((op, index) => ({ ...op, correcta: index === 0 }))
    }
    return limpias
  }

  return crearOpcionesGlobosDefault()
}

/** Repara actividades guardadas con pocas opciones o textos vacíos. */
export function normalizarGlobos(act: GlobosActivity): GlobosActivity {
  const cfg = act.configuracion ?? ({} as GlobosActivity['configuracion'])
  const preguntasRaw = Array.isArray(act.preguntas) ? act.preguntas : []

  const preguntas: GlobosPregunta[] =
    preguntasRaw.length > 0
      ? preguntasRaw.map((p, index) => ({
          id: typeof p.id === 'string' && p.id.length > 0 ? p.id : generarIdGlobos('q'),
          enunciado:
            typeof p.enunciado === 'string' && p.enunciado.trim().length > 0
              ? p.enunciado.trim()
              : `Pregunta ${index + 1}`,
          opciones: normalizarOpciones(Array.isArray(p.opciones) ? p.opciones : []),
        }))
      : [
          {
            id: generarIdGlobos('q'),
            enunciado: 'Selecciona la respuesta correcta',
            opciones: crearOpcionesGlobosDefault(),
          },
        ]

  const colores =
    Array.isArray(cfg.colorGlobos) && cfg.colorGlobos.length > 0
      ? cfg.colorGlobos
      : ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

  return {
    tipo: 'globos',
    configuracion: {
      velocidad: cfg.velocidad === 'lenta' || cfg.velocidad === 'rapida' ? cfg.velocidad : 'normal',
      vidas: typeof cfg.vidas === 'number' && cfg.vidas >= 1 ? Math.min(5, cfg.vidas) : 3,
      tiempoLimite:
        typeof cfg.tiempoLimite === 'number' && cfg.tiempoLimite > 0 ? cfg.tiempoLimite : 60,
      colorGlobos: colores,
    },
    preguntas,
  }
}

export function globosFingerprint(act: GlobosActivity): string {
  return JSON.stringify(normalizarGlobos(act))
}

export function calcularTamanoGlobo(
  containerWidth: number,
  containerHeight: number,
  optionCount: number,
): { width: number; height: number; fontSize: number } {
  if (containerWidth <= 0 || containerHeight <= 0) {
    return { width: 96, height: 116, fontSize: 14 }
  }

  const count = Math.max(optionCount, 1)
  const cols = Math.min(count, 4)
  const gap = 12
  const maxByWidth = (containerWidth - gap * (cols + 1)) / cols
  const maxByHeight = containerHeight * 0.28
  const width = Math.max(72, Math.min(128, Math.floor(Math.min(maxByWidth, maxByHeight / 1.2))))
  const height = Math.round(width * 1.18)
  const fontSize = Math.max(11, Math.min(16, Math.floor(width * 0.15)))

  return { width, height, fontSize }
}
