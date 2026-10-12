/**
 * U9b.1 — estado puro de Puzzle de palabras (sin React): una oración = piezas por colocar,
 * piezas colocadas y si ya se verificó. Los ids de las piezas (`tok-<i>-<texto>`, o
 * `tok-r<i>-<texto>` tras «Reintentar» esa oración) y de las zonas (`zona-origen`,
 * `zona-destino`) son el contrato del evento de arrastre y no cambian.
 */
import { mezclarTokens, tokenizarOracion } from './puzzle-palabras-config.js'

export interface TokenPuzzle {
  id: string
  texto: string
}

export interface EstadoOracion {
  tokensOrigen: TokenPuzzle[]
  tokensDestino: TokenPuzzle[]
  verificado: boolean
  correcta: boolean | null
}

export const ZONA_ORIGEN = 'zona-origen'
export const ZONA_DESTINO = 'zona-destino'

/** Estado inicial de una oración con sus palabras mezcladas. */
export function crearEstadoOracion(
  texto: string,
  semilla: number | null,
  sal: number,
  prefijo = 'tok-',
): EstadoOracion {
  const mezclados = mezclarTokens(tokenizarOracion(texto), semilla, sal)
  return {
    tokensOrigen: mezclados.map((t, i) => ({ id: `${prefijo}${i}-${t}`, texto: t })),
    tokensDestino: [],
    verificado: false,
    correcta: null,
  }
}

/** Suelta la pieza `id` sobre una zona. Una zona desconocida, o la pieza ya allí, no cambia nada. */
export function moverToken(est: EstadoOracion, id: string, sobre: string): EstadoOracion {
  const enOrigen = est.tokensOrigen.find((t) => t.id === id)
  const enDestino = est.tokensDestino.find((t) => t.id === id)
  const token = enOrigen ?? enDestino
  if (!token || est.verificado) return est

  if (sobre === ZONA_DESTINO) {
    if (enDestino) return est
    return {
      ...est,
      tokensOrigen: est.tokensOrigen.filter((t) => t.id !== id),
      tokensDestino: [...est.tokensDestino, token],
    }
  }
  if (sobre === ZONA_ORIGEN) {
    if (enOrigen) return est
    return {
      ...est,
      tokensDestino: est.tokensDestino.filter((t) => t.id !== id),
      tokensOrigen: [...est.tokensOrigen, token],
    }
  }
  return est
}

/** Marca la oración como verificada; es correcta si las piezas colocadas forman el texto. */
export function verificarOracion(est: EstadoOracion, textoOracion: string): EstadoOracion {
  const respuesta = est.tokensDestino.map((t) => t.texto).join(' ')
  return { ...est, verificado: true, correcta: respuesta === textoOracion.trim() }
}
