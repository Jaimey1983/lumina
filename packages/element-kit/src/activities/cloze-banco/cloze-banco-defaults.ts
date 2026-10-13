import type { ClozeBancoActivity } from '@lumina/types/slide';

export function createDefaultClozeBanco(): ClozeBancoActivity {
  return {
    tipo: 'cloze_banco',
    texto:
      'La {{blank:h1}} es el proceso por el que las plantas fabrican su alimento usando la luz del {{blank:h2}}. ' +
      'Absorben agua por las {{blank:h3}} y liberan {{blank:h4}} al aire.',
    blancos: [
      { id: 'h1', respuesta: 'fotosíntesis' },
      { id: 'h2', respuesta: 'sol' },
      { id: 'h3', respuesta: 'raíces' },
      { id: 'h4', respuesta: 'oxígeno' },
    ],
    distractores: ['respiración', 'luna'],
    puntos: 10,
  };
}
