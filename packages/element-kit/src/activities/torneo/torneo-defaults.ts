import type { TorneoActivity } from '@lumina/types/slide';
import { BLOCK_FALLBACKS } from '@lumina/types/slide';

/** Actividad de torneo nueva: las preguntas de ejemplo de `BLOCK_FALLBACKS`. */
export function createDefaultTorneo(): TorneoActivity {
  const fb = BLOCK_FALLBACKS.torneo;
  return {
    tipo: 'torneo',
    preguntas: fb.preguntas.map((p) => ({
      enunciado: p.enunciado,
      opciones: [...p.opciones],
      correcta: p.correcta,
      tiempoSegundos: p.tiempoSegundos,
    })),
    puntosBase: fb.puntosBase,
    bonusVelocidad: fb.bonusVelocidad,
  };
}
