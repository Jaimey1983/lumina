import type { EmparejaLado, MatchPairs } from '@/types/slide.types';

export const EMPAREJAR_MAX_PARES = 8;
export const EMPAREJAR_MIN_PARES = 2;

export function generarIdEmparejar(prefijo: string): string {
  return `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function normalizarLado(lado: unknown, imagenLegacy?: string): EmparejaLado {
  if (typeof lado === 'string') {
    const result: EmparejaLado = { texto: lado };
    if (imagenLegacy) result.imagen = imagenLegacy;
    return result;
  }
  if (lado && typeof lado === 'object' && !Array.isArray(lado)) {
    const o = lado as Record<string, unknown>;
    const result: EmparejaLado = {};
    if (typeof o.texto === 'string' && o.texto.length > 0) result.texto = o.texto;
    if (typeof o.imagen === 'string' && o.imagen.length > 0) result.imagen = o.imagen;
    return result;
  }
  if (imagenLegacy) return { imagen: imagenLegacy };
  return {};
}

export function normalizarEmparejar(actividad: MatchPairs | Record<string, unknown>): MatchPairs {
  const raw = actividad as MatchPairs & {
    pares?: Array<Record<string, unknown>>;
  };

  return {
    ...raw,
    tipo: 'emparejar',
    instruccion: typeof raw.instruccion === 'string' ? raw.instruccion : '',
    pares: (raw.pares ?? []).map((par) => {
      const legacy = par as unknown as Record<string, unknown>;
      return {
        id: String(legacy.id ?? generarIdEmparejar('par')),
        izquierda: normalizarLado(legacy.izquierda, legacy.imagenIzquierda as string | undefined),
        derecha: normalizarLado(legacy.derecha, legacy.imagenDerecha as string | undefined),
      };
    }),
  };
}

export function ladoTieneImagen(lado: EmparejaLado): boolean {
  return !!lado.imagen;
}

export function etiquetaLado(lado: EmparejaLado): string {
  if (lado.texto) return lado.texto;
  if (lado.imagen) return '[Imagen]';
  return '';
}
