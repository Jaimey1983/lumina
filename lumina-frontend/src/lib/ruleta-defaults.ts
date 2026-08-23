import { RuletaActivity } from '@/types/slide.types'

export function createDefaultRuleta(): RuletaActivity {
  return {
    tipo: 'ruleta',
    configuracion: {
      colores: ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'],
      sonido: false,
      duracionGiro: 3000,
      mostrarGanador: true,
    },
    items: [
      { id: 'i-1', texto: 'Equipo 1' },
      { id: 'i-2', texto: 'Equipo 2' },
      { id: 'i-3', texto: 'Equipo 3' },
      { id: 'i-4', texto: 'Equipo 4' },
      { id: 'i-5', texto: 'Equipo 5' },
      { id: 'i-6', texto: 'Equipo 6' },
    ],
  }
}
