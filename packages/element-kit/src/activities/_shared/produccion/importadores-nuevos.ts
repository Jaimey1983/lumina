/**
 * U12 / catálogo nuevo (U14+) — importadores de las actividades creadas después de U12.
 */
import type { RelacionarLineasActivity } from '@lumina/types/slide';

import { RELACIONAR_MAX_DERECHA, RELACIONAR_MAX_IZQUIERDA } from '../../relacionar-lineas/relacionar-lineas-config.js';
import { nuevoId, prepararFilas, type FilaDescartada, type Importador } from './importacion.js';
import { sinAcentos } from './tabla.js';

export const importadorRelacionarLineas: Importador<RelacionarLineasActivity> = {
  tipo: 'relacionar_lineas',
  titulo: 'Pares',
  formato: 'Izquierda ; Derecha  (una relación por fila; los distractores se agregan a mano)',
  ejemplo: 'Colombia;Bogotá\nPerú;Lima\nChile;Santiago',
  encabezados: ['izquierda', 'termino', 'concepto'],
  importar(actividad, filas, modo) {
    const izquierda = modo === 'reemplazar' ? [] : [...(actividad.izquierda ?? [])];
    const derecha = modo === 'reemplazar' ? [] : [...(actividad.derecha ?? [])];
    const relaciones = modo === 'reemplazar' ? [] : [...(actividad.relaciones ?? [])];
    const descartadas: FilaDescartada[] = [];
    let leidas = 0;
    for (const { fila, celdas } of prepararFilas(filas, ['izquierda', 'termino', 'concepto'], sinAcentos)) {
      const texto = celdas.join(' | ');
      const l = (celdas[0] ?? '').trim();
      const r = (celdas[1] ?? '').trim();
      if (!l || !r) {
        descartadas.push({ fila, motivo: 'Cada fila necesita los dos lados.', texto });
      } else if (izquierda.length >= RELACIONAR_MAX_IZQUIERDA) {
        descartadas.push({ fila, motivo: `Se superó el máximo de ${RELACIONAR_MAX_IZQUIERDA} a la izquierda.`, texto });
      } else if (derecha.length >= RELACIONAR_MAX_DERECHA) {
        descartadas.push({ fila, motivo: `Se superó el máximo de ${RELACIONAR_MAX_DERECHA} a la derecha.`, texto });
      } else {
        const izq = { id: nuevoId('izq'), texto: l };
        const der = { id: nuevoId('der'), texto: r };
        izquierda.push(izq);
        derecha.push(der);
        relaciones.push({ izquierdaId: izq.id, derechaId: der.id });
        leidas += 1;
      }
    }
    return { actividad: { ...actividad, izquierda, derecha, relaciones }, leidas, descartadas };
  },
};
