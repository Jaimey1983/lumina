// Ayudas solo para las pruebas del editor (no se publican: ver tsconfig.build.json).
import { normalizarEscena, type Elemento, type Escena, type Forma, type Linea } from "@lumina/drawing";

type Crudo = Record<string, unknown>;

export const forma = (id: string, x: number, y: number, ancho = 100, alto = 60, extra: Crudo = {}): Crudo => ({
  id,
  tipo: "forma",
  forma: "rectangulo",
  transformacion: { x, y, ancho, alto, rotacion: 0 },
  ...extra,
});

export const linea = (id: string, puntos: Array<[number, number]>, extra: Crudo = {}): Crudo => ({
  id,
  tipo: "linea",
  puntos: puntos.map(([x, y]) => ({ x, y })),
  ...extra,
});

export const grupo = (id: string, hijos: string[], extra: Crudo = {}): Crudo => ({ id, tipo: "grupo", hijos, ...extra });

export const escena = (...elementos: Crudo[]): Escena => normalizarEscena({ ancho: 1000, alto: 600, elementos });

export const get = (e: Escena, id: string): Elemento => {
  const el = e.elementos.find((x) => x.id === id);
  if (!el) throw new Error(`No existe ${id}`);
  return el;
};
export const getForma = (e: Escena, id: string): Forma => get(e, id) as Forma;
export const getLinea = (e: Escena, id: string): Linea => get(e, id) as Linea;
export const ids = (e: Escena): string[] => e.elementos.map((x) => x.id);
