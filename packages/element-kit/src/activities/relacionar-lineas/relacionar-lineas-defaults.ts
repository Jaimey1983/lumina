import type { RelacionarLineasActivity } from '@lumina/types/slide';

export function createDefaultRelacionarLineas(): RelacionarLineasActivity {
  return {
    tipo: 'relacionar_lineas',
    instruccion: 'Une cada país con su capital.',
    izquierda: [
      { id: 'izq-1', texto: 'Colombia' },
      { id: 'izq-2', texto: 'Perú' },
      { id: 'izq-3', texto: 'Chile' },
      { id: 'izq-4', texto: 'Argentina' },
    ],
    derecha: [
      { id: 'der-1', texto: 'Bogotá' },
      { id: 'der-2', texto: 'Lima' },
      { id: 'der-3', texto: 'Santiago' },
      { id: 'der-4', texto: 'Buenos Aires' },
      { id: 'der-5', texto: 'Quito' },
    ],
    relaciones: [
      { izquierdaId: 'izq-1', derechaId: 'der-1' },
      { izquierdaId: 'izq-2', derechaId: 'der-2' },
      { izquierdaId: 'izq-3', derechaId: 'der-3' },
      { izquierdaId: 'izq-4', derechaId: 'der-4' },
    ],
    puntos: 10,
  };
}
