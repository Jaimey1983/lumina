import { TopoActivity } from '@/types/slide.types'

export function createDefaultTopo(): TopoActivity {
  return {
    tipo: 'topo',
    configuracion: {
      velocidad: 'normal',
      vidas: 3,
      tiempoLimite: 60,
      filas: 2,
      columnas: 3,
    },
    preguntas: [
      { id: 'q-1', enunciado: '¿Cuánto es 3 × 3?',    opciones: [{ texto: '9', correcta: true }, { texto: '6', correcta: false }, { texto: '12', correcta: false }] },
      { id: 'q-2', enunciado: '¿Planeta más grande?',  opciones: [{ texto: 'Júpiter', correcta: true }, { texto: 'Saturno', correcta: false }, { texto: 'Tierra', correcta: false }] },
      { id: 'q-3', enunciado: '¿Cuántos continentes?', opciones: [{ texto: '7', correcta: true }, { texto: '5', correcta: false }, { texto: '6', correcta: false }] },
    ],
  }
}
