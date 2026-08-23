import type { AbrirCajaActivity, AbrirCajaCaja } from '@/types/slide.types'

export const ABRIR_CAJA_MAX_CAJAS = 12
export const ABRIR_CAJA_MIN_CAJAS = 2
export const ABRIR_CAJA_GAP_PX = 8
export const ABRIR_CAJA_COLOR_DEFAULT = '#2563EB'
export const ABRIR_CAJA_FILAS_DEFAULT = 2 as const
export const ABRIR_CAJA_COLUMNAS_DEFAULT = 3 as const
export const ABRIR_CAJA_ANIMACION_DEFAULT = 'flip' as const
export const ABRIR_CAJA_DURACION_CIERRE_MS = 180

export function duracionRevelacionAbrirCaja(
  animacion: 'flip' | 'zoom' | 'fade',
): number {
  return animacion === 'zoom' ? 300 : 400
}

export function duracionTotalAperturaAbrirCaja(
  animacion: 'flip' | 'zoom' | 'fade',
): number {
  if (animacion === 'flip') {
    return ABRIR_CAJA_DURACION_CIERRE_MS + duracionRevelacionAbrirCaja('flip')
  }
  return duracionRevelacionAbrirCaja(animacion)
}

export function generarIdCaja(prefijo: string): string {
  return `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function clampFilas(value: unknown): 2 | 3 {
  return value === 3 ? 3 : 2
}

function clampColumnas(value: unknown): 2 | 3 | 4 {
  if (value === 2 || value === 3 || value === 4) return value
  return ABRIR_CAJA_COLUMNAS_DEFAULT
}

function clampAnimacion(value: unknown): 'flip' | 'zoom' | 'fade' {
  if (value === 'zoom' || value === 'fade') return value
  return ABRIR_CAJA_ANIMACION_DEFAULT
}

function normalizeColor(value: unknown): string {
  if (typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value)) return value
  return ABRIR_CAJA_COLOR_DEFAULT
}

function normalizarCaja(raw: unknown, index: number): AbrirCajaCaja {
  const c = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const contenidoRaw =
    c.contenido && typeof c.contenido === 'object' && !Array.isArray(c.contenido)
      ? (c.contenido as Record<string, unknown>)
      : {}

  const esCorrecta = contenidoRaw.esCorrecta
  const contenido: AbrirCajaCaja['contenido'] = {
    ...(typeof contenidoRaw.texto === 'string' ? { texto: contenidoRaw.texto } : {}),
    ...(typeof contenidoRaw.imagen === 'string' ? { imagen: contenidoRaw.imagen } : {}),
    ...(esCorrecta === true || esCorrecta === false ? { esCorrecta } : {}),
  }

  return {
    id:
      typeof c.id === 'string' && c.id.length > 0
        ? c.id
        : `caja-${index + 1}`,
    etiqueta:
      typeof c.etiqueta === 'string' && c.etiqueta.length > 0
        ? c.etiqueta
        : typeof c.titulo === 'string' && c.titulo.length > 0
          ? c.titulo
          : `Caja ${index + 1}`,
    contenido,
  }
}

/** Repara actividades guardadas con configuración o cajas incompletas. */
export function normalizarAbrirCaja(act: AbrirCajaActivity): AbrirCajaActivity {
  const cfg = (act.configuracion ?? {}) as Partial<AbrirCajaActivity['configuracion']>
  const cajasRaw = Array.isArray(act.cajas) ? act.cajas : []
  const cajas = cajasRaw.map((caja, index) => normalizarCaja(caja, index))

  return {
    tipo: 'abrir_caja',
    configuracion: {
      filas: clampFilas(cfg.filas),
      columnas: clampColumnas(cfg.columnas),
      colorCaja: normalizeColor(cfg.colorCaja),
      animacionApertura: clampAnimacion(cfg.animacionApertura),
    },
    cajas:
      cajas.length >= ABRIR_CAJA_MIN_CAJAS
        ? cajas
        : [
            { id: generarIdCaja('caja'), etiqueta: 'Caja 1', contenido: { texto: '' } },
            { id: generarIdCaja('caja'), etiqueta: 'Caja 2', contenido: { texto: '' } },
          ],
  }
}

/** Huella estable para memoizar normalización y resetear estado del viewer. */
export function abrirCajaFingerprint(act: AbrirCajaActivity): string {
  return JSON.stringify(normalizarAbrirCaja(act))
}

// Determina si la actividad es evaluable:
// lo es si AL MENOS UNA caja tiene esCorrecta !== undefined
export function esEvaluable(cajas: { contenido: { esCorrecta?: boolean } }[]): boolean {
  return cajas.some(c => c.contenido.esCorrecta !== undefined)
}

/** Tamaño cuadrado de cada caja para que el grid quepa en el espacio disponible. */
export function calcularTamanoCeldaAbrirCaja(
  anchoDisponible: number,
  altoDisponible: number,
  filas: number,
  columnas: number,
  gapPx = ABRIR_CAJA_GAP_PX,
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
