import { laVar } from '../_shared/activity-tokens.js'

export const HR_MAX_NODOS = 50
export const HR_MIN_NODOS = 2

export function generarIdHR(prefijo: string): string {
  return `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

/** Color de reserva de un tipo de nodo desconocido. */
export const COLOR_NODO_DEFAULT = laVar('color-bloqueado')

// Colores por tipo de nodo (editor de grafo y viewer): salen de los tokens de estado `--la-*`.
export const COLORES_NODO: Record<string, string> = {
  narracion:    laVar('color-seleccionado'),
  decision:     laVar('color-pista'),
  pregunta:     laVar('color-bloqueado'),
  final_bueno:  laVar('color-correcto'),
  final_malo:   laVar('color-incorrecto'),
}

export const ETIQUETAS_NODO: Record<string, string> = {
  narracion:   'Narración',
  decision:    'Decisión',
  pregunta:    'Pregunta',
  final_bueno: 'Final bueno',
  final_malo:  'Final malo',
}

// Verifica si un nodo es terminal (sin opciones de salida)
export function esNodoFinal(tipo: string): boolean {
  return tipo === 'final_bueno' || tipo === 'final_malo'
}

// Cuenta nodos alcanzables desde el nodo inicial (para validación)
export function nodosAlcanzables(
  nodoInicial: string,
  nodos: { id: string }[],
  conexiones: { desdeNodoId: string; haciaNodoId: string }[],
): Set<string> {
  const visitados = new Set<string>()
  const cola = [nodoInicial]
  while (cola.length > 0) {
    const actual = cola.shift()!
    if (visitados.has(actual)) continue
    visitados.add(actual)
    conexiones
      .filter(c => c.desdeNodoId === actual)
      .forEach(c => cola.push(c.haciaNodoId))
  }
  return visitados
}
