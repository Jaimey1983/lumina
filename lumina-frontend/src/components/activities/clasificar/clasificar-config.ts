// Constantes y utilidades para clasificar
export const CLASIFICAR_MAX_CATEGORIAS = 4;
export const CLASIFICAR_MIN_CATEGORIAS = 2;
export const CLASIFICAR_MAX_ITEMS = 24;
export const CLASIFICAR_MIN_ITEMS = 4;

export function generarIdClasificar(prefijo: string): string {
  return `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
