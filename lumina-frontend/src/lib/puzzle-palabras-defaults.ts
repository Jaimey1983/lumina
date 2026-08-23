import { PuzzlePalabrasActivity } from '@/types/slide.types'

export function createDefaultPuzzlePalabras(): PuzzlePalabrasActivity {
  return {
    tipo: 'puzzle_palabras',
    configuracion: {
      mostrarPista: true,
      permitirReintento: true,
    },
    oraciones: [
      { texto: 'El sol sale por el oriente cada mañana' },
      { texto: 'Los estudiantes aprenden con entusiasmo' },
      { texto: 'Colombia tiene una gran biodiversidad' },
    ],
  }
}
