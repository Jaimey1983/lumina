import type { TopoActivity, TopoPregunta } from '@/types/slide.types'

export const TOPO_MAX_PREGUNTAS = 30
export const TOPO_MIN_PREGUNTAS = 1
export const TOPO_MIN_OPCIONES = 2
export const TOPO_MAX_OPCIONES = 8
export const TOPO_GAP_PX = 10

export const TIEMPO_VISIBLE_MS: Record<'lenta' | 'normal' | 'rapida', number> = {
  lenta: 2500,
  normal: 1800,
  rapida: 1100,
}

export function generarIdTopo(prefijo: string): string {
  return `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function crearOpcionesTopoDefault(): TopoPregunta['opciones'] {
  return [
    { texto: 'Correcta', correcta: true },
    { texto: 'Incorrecta 1', correcta: false },
    { texto: 'Incorrecta 2', correcta: false },
  ]
}

function clampFilas(value: unknown): 2 | 3 {
  return value === 3 ? 3 : 2
}

function clampColumnas(value: unknown): 3 | 4 {
  return value === 4 ? 4 : 3
}

function normalizarOpciones(opciones: TopoPregunta['opciones']): TopoPregunta['opciones'] {
  const limpias = opciones
    .map((op) => ({
      texto: typeof op.texto === 'string' ? op.texto.trim() : '',
      correcta: op.correcta === true,
    }))
    .filter((op) => op.texto.length > 0)

  if (limpias.length >= TOPO_MIN_OPCIONES) {
    if (!limpias.some((op) => op.correcta)) {
      return limpias.map((op, index) => ({ ...op, correcta: index === 0 }))
    }
    return limpias
  }

  return crearOpcionesTopoDefault()
}

export function normalizarTopo(act: TopoActivity): TopoActivity {
  const cfg = (act.configuracion ?? {}) as Partial<TopoActivity['configuracion']>
  const preguntasRaw = Array.isArray(act.preguntas) ? act.preguntas : []

  const preguntas: TopoPregunta[] =
    preguntasRaw.length > 0
      ? preguntasRaw.map((p, index) => ({
          id: typeof p.id === 'string' && p.id.length > 0 ? p.id : generarIdTopo('q'),
          enunciado:
            typeof p.enunciado === 'string' && p.enunciado.trim().length > 0
              ? p.enunciado.trim()
              : `Pregunta ${index + 1}`,
          opciones: normalizarOpciones(Array.isArray(p.opciones) ? p.opciones : []),
        }))
      : [
          {
            id: generarIdTopo('q'),
            enunciado: 'Selecciona la respuesta correcta',
            opciones: crearOpcionesTopoDefault(),
          },
        ]

  return {
    tipo: 'topo',
    configuracion: {
      velocidad: cfg.velocidad === 'lenta' || cfg.velocidad === 'rapida' ? cfg.velocidad : 'normal',
      vidas: typeof cfg.vidas === 'number' && cfg.vidas >= 1 ? Math.min(5, cfg.vidas) : 3,
      tiempoLimite:
        typeof cfg.tiempoLimite === 'number' && cfg.tiempoLimite > 0 ? cfg.tiempoLimite : 60,
      filas: clampFilas(cfg.filas),
      columnas: clampColumnas(cfg.columnas),
    },
    preguntas,
  }
}

export function topoFingerprint(act: TopoActivity): string {
  return JSON.stringify(normalizarTopo(act))
}

/** Tamaño cuadrado de cada hueco para que el grid quepa en el lienzo. */
export function calcularTamanoCeldaTopo(
  anchoDisponible: number,
  altoDisponible: number,
  filas: number,
  columnas: number,
  gapPx = TOPO_GAP_PX,
): number {
  if (anchoDisponible <= 0 || altoDisponible <= 0 || filas <= 0 || columnas <= 0) {
    return 0
  }
  const gapTotalW = gapPx * Math.max(columnas - 1, 0)
  const gapTotalH = gapPx * Math.max(filas - 1, 0)
  const maxW = (anchoDisponible - gapTotalW) / columnas
  const maxH = (altoDisponible - gapTotalH) / filas
  return Math.max(0, Math.floor(Math.min(maxW, maxH)))
}

export function tamanoTextoTopo(cellSize: number, texto = ''): number {
  const len = texto.trim().length
  let ratio = 0.28
  if (len > 12) ratio = 0.2
  else if (len > 8) ratio = 0.24
  const size = Math.floor(cellSize * ratio)
  return Math.max(14, Math.min(24, size))
}

export function mezclarIndicesTopo(count: number): number[] {
  const result = Array.from({ length: count }, (_, i) => i)
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
