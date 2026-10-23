import type { Punto, TipoForma } from '../tipos.js';
import { TIPOS_FORMA } from '../tipos.js';
import { FORMAS, type DefinicionForma, type GrupoForma, type Rectangulo, type ValoresParametros } from './catalogo.js';

export { FORMAS, trazadoPoligono } from './catalogo.js';
export type { AsaAjuste, DefinicionForma, GrupoForma, LadoAsaAjuste, ParametroForma, Rectangulo, ValoresParametros } from './catalogo.js';

export interface OpcionesForma {
  /** Valores propios de la forma (`Forma.parametros`); lo que falte o esté fuera de rango se corrige. */
  parametros?: Record<string, number>;
  /** Radio de esquinas en unidades de escena (solo el rectángulo). */
  radio?: number;
}

const medida = (v: number): number => (Number.isFinite(v) ? Math.max(1, v) : 1);

/** Completa y acota los parámetros de una forma con los valores por defecto de su definición. */
export function resolverParametros(forma: TipoForma, parametros?: Record<string, number>): ValoresParametros {
  const salida: ValoresParametros = {};
  for (const def of FORMAS[forma].parametros) {
    const v = parametros?.[def.clave];
    salida[def.clave] = typeof v === 'number' && Number.isFinite(v) ? Math.min(def.max, Math.max(def.min, v)) : def.porDefecto;
  }
  return salida;
}

/** Path SVG (`d`) de la forma, en coordenadas locales (0, 0 = esquina superior izquierda). */
export function trazadoForma(forma: TipoForma, ancho: number, alto: number, opciones: OpcionesForma = {}): string {
  const radio = typeof opciones.radio === 'number' && Number.isFinite(opciones.radio) ? Math.max(0, opciones.radio) : 0;
  return FORMAS[forma].trazado(medida(ancho), medida(alto), resolverParametros(forma, opciones.parametros), radio);
}

/** Zona rectangular donde se escribe el texto de la forma. */
export function rectanguloTexto(forma: TipoForma, ancho: number, alto: number, opciones: OpcionesForma = {}): Rectangulo {
  return FORMAS[forma].rectanguloTexto(medida(ancho), medida(alto), resolverParametros(forma, opciones.parametros));
}

/** Puntos de unión de conectores (orden: arriba, derecha, abajo, izquierda). */
export function puertosForma(forma: TipoForma, ancho: number, alto: number, opciones: OpcionesForma = {}): Punto[] {
  return FORMAS[forma].puertos(medida(ancho), medida(alto), resolverParametros(forma, opciones.parametros));
}

/** Vértices de la forma si es un polígono (con el radio en 0); `undefined` si tiene curvas. */
export function poligonoForma(forma: TipoForma, ancho: number, alto: number, opciones: OpcionesForma = {}): Punto[] | undefined {
  const def = FORMAS[forma];
  return def.poligono?.(medida(ancho), medida(alto), resolverParametros(forma, opciones.parametros));
}

/** Formas agrupadas para la paleta del editor, en el orden del catálogo. */
export function formasPorGrupo(): Array<{ grupo: GrupoForma; nombre: string; formas: DefinicionForma[] }> {
  const nombres: Record<GrupoForma, string> = { basicas: 'Formas básicas', flechas: 'Flechas', diagramas: 'Diagramas' };
  return (['basicas', 'flechas', 'diagramas'] as const).map((grupo) => ({
    grupo,
    nombre: nombres[grupo],
    formas: TIPOS_FORMA.map((t) => FORMAS[t]).filter((f) => f.grupo === grupo),
  }));
}
