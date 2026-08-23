import type { AhorcadoActivity, AhorcadoConfig, AhorcadoState } from '@/types/slide.types';

export const AHORCADO_MIN_INTENTOS = 4;
export const AHORCADO_MAX_INTENTOS = 10;
export const AHORCADO_DEFAULT_INTENTOS = 6;

export const TECLADO_AHORCADO = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
] as const;

export function normalizarPalabraAhorcado(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-ZÑ\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function esPalabraAhorcadoValida(palabra: string): boolean {
  return normalizarPalabraAhorcado(palabra).replace(/\s/g, '').length >= 1;
}

export function normalizarAhorcado(act: AhorcadoActivity): AhorcadoActivity {
  const cfg = act.configuracion ?? ({} as Partial<AhorcadoConfig>);
  const palabra = normalizarPalabraAhorcado(cfg.palabra ?? '') || 'EJEMPLO';
  const maxIntentos =
    typeof cfg.maxIntentos === 'number'
      ? Math.min(AHORCADO_MAX_INTENTOS, Math.max(AHORCADO_MIN_INTENTOS, cfg.maxIntentos))
      : AHORCADO_DEFAULT_INTENTOS;

  return {
    tipo: 'ahorcado',
    configuracion: {
      palabra,
      pista: typeof cfg.pista === 'string' ? cfg.pista.trim() : '',
      categoria: typeof cfg.categoria === 'string' ? cfg.categoria.trim() : '',
      maxIntentos,
    },
  };
}

export function ahorcadoFingerprint(act: AhorcadoActivity): string {
  return JSON.stringify(normalizarAhorcado(act));
}

export function crearEstadoInicialAhorcado(maxIntentos: number): AhorcadoState {
  return {
    letrasAdivinadas: [],
    letrasFalladas: [],
    intentosRestantes: maxIntentos,
    completado: false,
    ganado: null,
  };
}

export function procesarLetra(
  estado: AhorcadoState,
  config: AhorcadoConfig,
  letra: string,
): AhorcadoState {
  if (estado.completado) return estado;

  const letraNorm = letra.toUpperCase();
  if (
    estado.letrasAdivinadas.includes(letraNorm) ||
    estado.letrasFalladas.includes(letraNorm)
  ) {
    return estado;
  }

  const palabraNormalizada = normalizarPalabraAhorcado(config.palabra);

  if (palabraNormalizada.includes(letraNorm)) {
    const nuevasLetras = [...estado.letrasAdivinadas, letraNorm];
    const completado = palabraNormalizada
      .split('')
      .every((ch) => ch === ' ' || nuevasLetras.includes(ch));

    return {
      ...estado,
      letrasAdivinadas: nuevasLetras,
      completado,
      ganado: completado ? true : null,
    };
  }

  const nuevosFallos = [...estado.letrasFalladas, letraNorm];
  const intentosRestantes = config.maxIntentos - nuevosFallos.length;
  const perdido = intentosRestantes <= 0;

  return {
    ...estado,
    letrasFalladas: nuevosFallos,
    intentosRestantes,
    completado: perdido,
    ganado: perdido ? false : null,
  };
}

export function puntajeOverlayAhorcado(
  ganado: boolean,
  fallos: number,
  maxIntentos: number,
): { correctas: number; total: number } {
  if (!ganado) return { correctas: 0, total: 1 };
  return { correctas: Math.max(0, maxIntentos - fallos), total: maxIntentos };
}

export function revelarPalabraAhorcado(
  palabra: string,
  letrasAdivinadas: string[],
  revelarCompleta = false,
): string[] {
  return normalizarPalabraAhorcado(palabra).split('').map((ch) => {
    if (ch === ' ') return ' ';
    if (revelarCompleta || letrasAdivinadas.includes(ch)) return ch;
    return '_';
  });
}
