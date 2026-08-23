import { GlobosActivity } from '@/types/slide.types'

export function createDefaultGlobos(): GlobosActivity {
  return {
    tipo: 'globos',
    configuracion: {
      velocidad: 'normal',
      vidas: 3,
      tiempoLimite: 60,
      colorGlobos: ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'],
    },
    preguntas: [
      {
        id: 'q-1',
        enunciado: '¿Cuánto es 2 + 2?',
        opciones: [
          { texto: '4', correcta: true },
          { texto: '3', correcta: false },
          { texto: '5', correcta: false },
          { texto: '22', correcta: false },
          { texto: '6', correcta: false },
        ],
      },
      {
        id: 'q-2',
        enunciado: '¿Capital de Colombia?',
        opciones: [
          { texto: 'Bogotá', correcta: true },
          { texto: 'Cali', correcta: false },
          { texto: 'Medellín', correcta: false },
          { texto: 'Cartagena', correcta: false },
          { texto: 'Barranquilla', correcta: false },
        ],
      },
      {
        id: 'q-3',
        enunciado: '¿Color del cielo?',
        opciones: [
          { texto: 'Azul', correcta: true },
          { texto: 'Rojo', correcta: false },
          { texto: 'Verde', correcta: false },
          { texto: 'Amarillo', correcta: false },
          { texto: 'Negro', correcta: false },
        ],
      },
    ],
  }
}
