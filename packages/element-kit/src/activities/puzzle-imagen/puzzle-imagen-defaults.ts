import { PuzzleImagenActivity } from '@lumina/types/slide';

export function createDefaultPuzzleImagen(): PuzzleImagenActivity {
  return {
    tipo: 'puzzle_imagen',
    configuracion: {
      filas: 3,
      columnas: 3,
      mostrarVista: true,
      dificultad: 'facil',
    },
    imagen: '',
  };
}
