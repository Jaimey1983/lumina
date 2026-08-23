import { CrucigramaActivity } from '@/types/slide.types';

export function createDefaultCrucigrama(): CrucigramaActivity {
  return {
    tipo: 'crucigrama',
    configuracion: {
      tamanoCelda: 36,
      colorCelda: '#FFFFFF',
      colorTexto: '#1F2937',
    },
    palabras: [
      { id: 'p-1', texto: 'SOL', pista: 'Estrella de nuestro sistema', direccion: 'horizontal', fila: 0, columna: 0 },
      { id: 'p-2', texto: 'LUNA', pista: 'Satélite natural de la Tierra', direccion: 'vertical', fila: 0, columna: 2 },
      { id: 'p-3', texto: 'MAR', pista: 'Gran masa de agua salada', direccion: 'horizontal', fila: 3, columna: 1 },
    ],
  };
}
