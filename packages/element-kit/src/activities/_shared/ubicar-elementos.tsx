'use client'

/**
 * U10.4 — motor de interacción común de «ubicar elementos en contenedores» (etapa U).
 *
 * `clasificar` (piezas → categorías) y `arrastrar_soltar` (fichas → zonas) se juegan igual: se
 * arrastra con ratón, dedo o teclado, o se usa «tocar y colocar», con anuncios en español y el
 * progreso de lo ya colocado en el shell. Este módulo lleva ese cableado; cada actividad conserva
 * SU modelo de datos, SU regla de colocación (capacidad de zona, volver al origen), SU respuesta y
 * SU evaluador de `@lumina/scoring`.
 */
import { useCallback, useEffect, useState } from 'react'
import { useDraggable, useDroppable, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'

import { useModoEntrada, useTocarColocar } from './activity-tap-place.js'

/** `elemento id → id del contenedor donde está` (`null` = sin ubicar). */
export type Ubicaciones = Record<string, string | null>

/** Todas las piezas sin ubicar. */
export const sinUbicarTodas = (items: readonly { id: string }[]): Ubicaciones =>
  Object.fromEntries(items.map((i) => [i.id, null]))

/** Pieza arrastrable con el nombre que oyen los lectores de pantalla al arrastrar con teclado. */
export function usePiezaArrastrable(id: string, etiqueta: string, disabled?: boolean) {
  return useDraggable({
    id,
    disabled,
    data: { etiqueta },
    attributes: { roleDescription: 'elemento arrastrable' },
  })
}

/** Contenedor que recibe piezas; `etiqueta` es su nombre para los anuncios. */
export function useContenedorSoltable(id: string, etiqueta: string) {
  return useDroppable({ id, data: { etiqueta } })
}

interface OpcionesUbicar {
  /** Nada se mueve (terminó, ya se envió o se agotó el tiempo). */
  bloqueado: boolean
  items: readonly { id: string; texto: string }[]
  /** Nombre hablado de un contenedor (incluido el de «sin ubicar»). */
  nombreContenedor: (id: string) => string | undefined
  /** Cuántos elementos hay ya ubicados (alimenta el progreso del shell). */
  ubicados: number
  /** Mueve `itemId` a `destino`; cada actividad decide si lo acepta. */
  aplicar: (itemId: string, destino: string) => void
  setProgreso: (actual: number) => void
}

export function useUbicarElementos({
  bloqueado,
  items,
  nombreContenedor,
  ubicados,
  aplicar,
  setProgreso,
}: OpcionesUbicar) {
  const [activo, setActivo] = useState<string | null>(null)
  const entrada = useModoEntrada()
  const tocar = entrada.modo === 'tocar'

  // El encabezado del shell cuenta las piezas ya ubicadas.
  useEffect(() => {
    setProgreso(ubicados)
  }, [ubicados, setProgreso])

  const textoDe = useCallback((id: string) => items.find((i) => i.id === id)?.texto, [items])

  const tocarColocar = useTocarColocar({
    onColocar: aplicar,
    etiquetaItem: textoDe,
    etiquetaZona: nombreContenedor,
    deshabilitado: !tocar || bloqueado,
  })

  const alEmpezar = useCallback((e: DragStartEvent) => setActivo(e.active.id as string), [])

  const alSoltar = useCallback(
    (e: DragEndEvent) => {
      setActivo(null)
      if (!e.over) return
      aplicar(e.active.id as string, e.over.id as string)
    },
    [aplicar],
  )

  return {
    /** Id de la pieza que se está arrastrando, o `null`. */
    activo,
    entrada,
    tocar,
    tocarColocar,
    textoDe,
    alEmpezar,
    alSoltar,
    /** Atributos «tocar y colocar» de una pieza (solo en ese modo). */
    propsPieza: (id: string) => (tocar ? tocarColocar.propsItem(id) : undefined),
    /** Atributos «tocar y colocar» de un contenedor (solo en ese modo). */
    propsContenedor: (id: string) => (tocar ? tocarColocar.propsZona(id) : undefined),
  }
}
