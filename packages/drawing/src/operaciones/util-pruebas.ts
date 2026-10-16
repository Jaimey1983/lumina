// Ayudas solo para las pruebas (no se publican: ver tsconfig.build.json).
import { normalizarEscena } from '../normalizar.js';
import type { Elemento, Escena, Forma, Grupo, Linea, Texto } from '../tipos.js';

export const forma = (id: string, x: number, y: number, ancho = 100, alto = 60, extra: Record<string, unknown> = {}): Record<string, unknown> => ({
  id,
  tipo: 'forma',
  forma: 'rectangulo',
  transformacion: { x, y, ancho, alto, rotacion: 0 },
  ...extra,
});

export const texto = (id: string, x: number, y: number, extra: Record<string, unknown> = {}): Record<string, unknown> => ({
  id,
  tipo: 'texto',
  texto: 'Hola',
  transformacion: { x, y, ancho: 80, alto: 30, rotacion: 0 },
  ...extra,
});

export const linea = (id: string, puntos: Array<[number, number]>, extra: Record<string, unknown> = {}): Record<string, unknown> => ({
  id,
  tipo: 'linea',
  puntos: puntos.map(([x, y]) => ({ x, y })),
  ...extra,
});

export const grupo = (id: string, hijos: string[], extra: Record<string, unknown> = {}): Record<string, unknown> => ({ id, tipo: 'grupo', hijos, ...extra });

export const escena = (...elementos: Array<Record<string, unknown>>): Escena => normalizarEscena({ ancho: 1000, alto: 600, elementos });

export const get = (e: Escena, id: string): Elemento => {
  const el = e.elementos.find((x) => x.id === id);
  if (!el) throw new Error(`No existe ${id}`);
  return el;
};
export const getForma = (e: Escena, id: string): Forma => get(e, id) as Forma;
export const getTexto = (e: Escena, id: string): Texto => get(e, id) as Texto;
export const getLinea = (e: Escena, id: string): Linea => get(e, id) as Linea;
export const getGrupo = (e: Escena, id: string): Grupo => get(e, id) as Grupo;
export const ids = (e: Escena): string[] => e.elementos.map((x) => x.id);
