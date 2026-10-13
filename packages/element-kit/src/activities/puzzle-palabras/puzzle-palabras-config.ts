import { barajar } from '../_shared/barajar.js'

export const PUZZLE_PALABRAS_MAX_ORACIONES = 20
export const PUZZLE_PALABRAS_MIN_ORACIONES = 1

// Tokeniza una oración en palabras (split por espacios, filtrando vacíos)
export function tokenizarOracion(texto: string): string[] {
  return texto.trim().split(/\s+/).filter(Boolean)
}

// Mezcla tokens garantizando orden diferente al original. Con `semilla` el orden es
// reproducible (el mismo para toda la clase); `sal` da otro orden dentro de la misma semilla.
export function mezclarTokens(tokens: string[], semilla?: number | null, sal = 0): string[] {
  if (tokens.length <= 1) return tokens
  let mezclado: string[]
  let intentos = 0
  do {
    // Cada intento usa otra sal: con semilla, repetir la misma daría siempre el mismo orden.
    mezclado = barajar(tokens, semilla, sal + intentos)
    intentos++
  } while (mezclado.join(' ') === tokens.join(' ') && intentos < 10)
  return mezclado
}
