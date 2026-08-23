export const MEMORIA_MAX_PARES = 18;
export const MEMORIA_MIN_PARES = 2;

export function generarIdMemoria(prefijo: string): string {
  return `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function calcularFilasMemoria(totalCartas: number, columnas: number): number {
  const cols = Math.max(1, columnas);
  return Math.max(1, Math.ceil(totalCartas / cols));
}
