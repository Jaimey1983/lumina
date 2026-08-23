import { AnagramaActivity } from '@/types/slide.types'

export function createDefaultAnagrama(): AnagramaActivity {
  return {
    tipo: 'anagrama',
    configuracion: {
      mostrarPista: true,
      intentos: 3,
    },
    palabras: [
      { texto: 'COLOMBIA', pista: 'País de América del Sur' },
      { texto: 'ESCUELA', pista: 'Lugar donde se aprende' },
      { texto: 'CIENCIA', pista: 'Estudio del mundo natural' },
    ],
  }
}
