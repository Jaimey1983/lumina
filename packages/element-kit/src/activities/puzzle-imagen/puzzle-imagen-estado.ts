/**
 * U9b.5 — estado puro de Puzzle de imagen (sin React): qué piezas siguen sueltas (`origen`, en el
 * orden en que quedaron) y qué pieza ocupa cada casilla (`slots`). Los ids del evento de arrastre
 * (`pieza-<i>`, `slot-<p>`, `origen`) son un contrato y no cambian.
 */
export interface EstadoPuzzle {
  origen: number[]
  slots: (number | null)[]
}

export const ID_ORIGEN = 'origen'
export const idPieza = (i: number) => `pieza-${i}`
export const idSlot = (p: number) => `slot-${p}`
export const indiceDePieza = (id: string) => parseInt(id.replace('pieza-', ''), 10)

/** Estado de inicio: todas las piezas sueltas (ya mezcladas) y el tablero vacío. */
export function estadoInicial(ordenMezclado: number[]): EstadoPuzzle {
  return { origen: [...ordenMezclado], slots: Array(ordenMezclado.length).fill(null) }
}

/**
 * Suelta la pieza `pieza` en `destino` (`slot-<p>` u `origen`).
 * - En una casilla: sale del origen o de su casilla anterior y, si la casilla estaba ocupada, la
 *   pieza desplazada vuelve al FINAL del origen.
 * - En `origen`: si estaba en el tablero, vuelve al final del origen.
 * Cualquier otro destino no cambia nada.
 */
export function soltarPieza(est: EstadoPuzzle, pieza: number, destino: string): EstadoPuzzle {
  if (destino.startsWith('slot-')) {
    const pos = parseInt(destino.replace('slot-', ''), 10)
    if (!Number.isInteger(pos) || pos < 0 || pos >= est.slots.length) return est
    const slots = [...est.slots]
    let origen = [...est.origen]
    const anterior = est.slots.findIndex((s) => s === pieza)
    const desplazada = slots[pos]

    if (anterior !== -1) slots[anterior] = null
    if (desplazada !== null && desplazada !== pieza) origen = [...origen, desplazada!]
    slots[pos] = pieza
    if (anterior === -1) origen = origen.filter((p) => p !== pieza)
    return { origen, slots }
  }
  if (destino === ID_ORIGEN) {
    const anterior = est.slots.findIndex((s) => s === pieza)
    if (anterior === -1) return est
    const slots = [...est.slots]
    slots[anterior] = null
    return { origen: [...est.origen, pieza], slots }
  }
  return est
}
