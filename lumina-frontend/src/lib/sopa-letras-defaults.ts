import { SopaLetrasActivity } from '@/types/slide.types';

export function createDefaultSopaLetras(): SopaLetrasActivity {
  return {
    tipo: 'sopa_letras',
    configuracion: {
      filas: 12,
      columnas: 12,
      direcciones: ['horizontal', 'vertical'],
      tema: 'General',
      mostrarLista: true,
    },
    palabras: [
      { texto: 'COLOMBIA', pista: 'País de América del Sur' },
      { texto: 'ESCUELA', pista: 'Lugar de aprendizaje' },
      { texto: 'CIENCIA', pista: 'Estudio del mundo natural' },
      { texto: 'HISTORIA', pista: 'Estudio del pasado' },
      { texto: 'ARTE', pista: 'Expresión creativa' },
    ],
    grid: undefined,
  };
}
