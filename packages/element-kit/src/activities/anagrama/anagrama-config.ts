import { barajar } from '../_shared/barajar.js'

export const ANAGRAMA_MAX_PALABRAS = 20
export const ANAGRAMA_MIN_PALABRAS = 1

export function generarIdAnagrama(prefijo: string): string {
  return `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

// Mezcla las letras de una palabra garantizando orden diferente al original. Con `semilla` el
// orden es reproducible (el mismo para toda la clase); `sal` da otro orden dentro de la semilla.
export function mezclarLetras(palabra: string, semilla?: number | null, sal = 0): string[] {
  const letras = palabra.toUpperCase().split('')
  let mezclado: string[]
  let intentos = 0
  do {
    // Cada intento usa otra sal: con semilla, repetir la misma daría siempre el mismo orden.
    mezclado = barajar(letras, semilla, sal + intentos)
    intentos++
  } while (mezclado.join('') === letras.join('') && intentos < 10)
  return mezclado
}
