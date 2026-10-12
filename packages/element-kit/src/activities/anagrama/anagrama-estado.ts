/**
 * U9c.2 — estado puro de Anagrama (sin React): por palabra, las letras que siguen sueltas, lo
 * colocado en cada hueco y si ya se verificó. Los ids del evento de arrastre (`letra-<i>-<L>`,
 * `letra-r<n>-<i>-<L>` tras «Reintentar» esa palabra, y `slot-<i>`) son un contrato y no cambian.
 */
import { mezclarLetras } from './anagrama-config.js'

export interface LetraSuelta {
  id: string
  letra: string
}

export interface EstadoPalabra {
  letrasOrigen: LetraSuelta[]
  slots: (string | null)[]
  intentosRestantes: number
  verificado: boolean
  correcta: boolean | null
}

export const idHueco = (i: number) => `slot-${i}`

export function intentosIniciales(intentos: number): number {
  return intentos === 0 ? Number.MAX_SAFE_INTEGER : intentos
}

/** Estado de una palabra con sus letras mezcladas. */
export function crearEstadoPalabra(
  texto: string,
  intentos: number,
  semilla: number | null,
  sal: number,
  prefijo = 'letra-',
): EstadoPalabra {
  const letras = mezclarLetras(texto, semilla, sal)
  return {
    letrasOrigen: letras.map((l, i) => ({ id: `${prefijo}${i}-${l}`, letra: l })),
    slots: Array(texto.length).fill(null),
    intentosRestantes: intentosIniciales(intentos),
    verificado: false,
    correcta: null,
  }
}

/**
 * Suelta la letra `idLetra` en el hueco `hueco`. Un hueco ocupado, una letra desconocida o una
 * palabra ya verificada no cambian nada. Si con esa letra se llena la palabra, se VERIFICA sola.
 */
export function colocarLetra(est: EstadoPalabra, idLetra: string, hueco: number, objetivo: string): EstadoPalabra {
  if (est.verificado) return est
  const letra = est.letrasOrigen.find((l) => l.id === idLetra)
  if (!letra || hueco < 0 || hueco >= est.slots.length || est.slots[hueco] !== null) return est
  const slots = [...est.slots]
  slots[hueco] = letra.letra
  const siguiente: EstadoPalabra = {
    ...est,
    slots,
    letrasOrigen: est.letrasOrigen.filter((l) => l.id !== idLetra),
  }
  if (slots.every((s) => s !== null)) {
    return { ...siguiente, verificado: true, correcta: slots.join('') === objetivo.toUpperCase() }
  }
  return siguiente
}
