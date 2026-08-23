export const ANAGRAMA_MAX_PALABRAS = 20
export const ANAGRAMA_MIN_PALABRAS = 1

export function generarIdAnagrama(prefijo: string): string {
  return `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

// Mezcla las letras de una palabra garantizando orden diferente al original
export function mezclarLetras(palabra: string): string[] {
  const letras = palabra.toUpperCase().split('')
  let mezclado: string[]
  let intentos = 0
  do {
    mezclado = [...letras].sort(() => Math.random() - 0.5)
    intentos++
  } while (mezclado.join('') === letras.join('') && intentos < 10)
  return mezclado
}
