import type { LineaTiempoActivity } from '@lumina/types/slide';

export function createDefaultLineaTiempo(): LineaTiempoActivity {
  return {
    tipo: 'linea_tiempo',
    instruccion: 'Ordena estos hechos de la historia de Colombia, del más antiguo al más reciente.',
    eventos: [
      { id: 'evt-1', texto: 'Grito de Independencia', fechaTexto: '1810', orden: 1 },
      { id: 'evt-2', texto: 'Batalla de Boyacá', fechaTexto: '1819', orden: 2 },
      { id: 'evt-3', texto: 'Constitución Política de Colombia', fechaTexto: '1886', orden: 3 },
      { id: 'evt-4', texto: 'Nueva Constitución Política', fechaTexto: '1991', orden: 4 },
    ],
    mostrarFechasAlFinal: true,
    puntos: 10,
  };
}
