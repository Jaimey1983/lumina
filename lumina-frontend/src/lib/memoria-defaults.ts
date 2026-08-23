import { MemoriaActivity } from '@/types/slide.types';

export function createDefaultMemoria(): MemoriaActivity {
  return {
    tipo: 'memoria',
    configuracion: {
      columnas: 4,
      tiempoVolteo: 1000,
      colorDorso: '#2563EB',
      simboloDorso: '?',
      colorSimboloDorso: '#FFFFFF',
      mostrarTimer: true,
    },
    pares: [
      { id: 'par-1', lado1: { texto: 'Gato' }, lado2: { texto: '🐱' } },
      { id: 'par-2', lado1: { texto: 'Perro' }, lado2: { texto: '🐶' } },
      { id: 'par-3', lado1: { texto: 'Pájaro' }, lado2: { texto: '🐦' } },
      { id: 'par-4', lado1: { texto: 'Pez' }, lado2: { texto: '🐟' } },
      { id: 'par-5', lado1: { texto: 'Conejo' }, lado2: { texto: '🐰' } },
      { id: 'par-6', lado1: { texto: 'Rana' }, lado2: { texto: '🐸' } },
    ],
  };
}
