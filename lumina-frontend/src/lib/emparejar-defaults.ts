import type { MatchPairs } from '@/types/slide.types';

export function createDefaultEmparejar(): MatchPairs {
  return {
    tipo: 'emparejar',
    instruccion: 'Empareja cada concepto con su definición.',
    pares: [
      { id: 'par-1', izquierda: { texto: 'Gato' }, derecha: { texto: '🐱' } },
      { id: 'par-2', izquierda: { texto: 'Perro' }, derecha: { texto: '🐶' } },
      { id: 'par-3', izquierda: { texto: 'Pájaro' }, derecha: { texto: '🐦' } },
      { id: 'par-4', izquierda: { texto: 'Pez' }, derecha: { texto: '🐟' } },
    ],
    puntos: 10,
  };
}
