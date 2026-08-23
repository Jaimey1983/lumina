import type { AhorcadoActivity, AhorcadoConfig } from '@/types/slide.types';

export const AHORCADO_DEFAULT: AhorcadoConfig = {
  palabra: 'EJEMPLO',
  pista: '',
  categoria: '',
  maxIntentos: 6,
};

export function createDefaultAhorcado(): AhorcadoActivity {
  return {
    tipo: 'ahorcado',
    configuracion: { ...AHORCADO_DEFAULT },
  };
}
