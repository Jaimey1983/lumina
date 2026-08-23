export const PUZZLE_PALABRAS_MAX_ORACIONES = 20
export const PUZZLE_PALABRAS_MIN_ORACIONES = 1

// Tokeniza una oración en palabras (split por espacios, filtrando vacíos)
export function tokenizarOracion(texto: string): string[] {
  return texto.trim().split(/\s+/).filter(Boolean)
}

// Mezcla tokens garantizando orden diferente al original
export function mezclarTokens(tokens: string[]): string[] {
  if (tokens.length <= 1) return tokens
  let mezclado: string[]
  let intentos = 0
  do {
    mezclado = [...tokens].sort(() => Math.random() - 0.5)
    intentos++
  } while (mezclado.join(' ') === tokens.join(' ') && intentos < 10)
  return mezclado
}
