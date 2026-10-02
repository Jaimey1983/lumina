import { describe, expect, it } from 'vitest';
import type { Regla } from '@lumina/types/interaction';
import { usosDeVariable } from './uso.js';
import type { ReglaAplicable } from './tipos.js';

const regla = (p: Partial<Regla>): Regla => ({
  id: 'r',
  evento: 'clic',
  condiciones: [],
  acciones: [],
  activa: true,
  ...p,
});
const en = (r: Regla, slideId = 's1', bloqueId?: string): ReglaAplicable => ({
  regla: r,
  origen: bloqueId
    ? { tipo: 'bloque', bloqueId, slideId }
    : { tipo: 'slide', slideId },
});

describe('usosDeVariable', () => {
  it('encuentra usos en acciones, en condiciones anidadas y como valor asignado', () => {
    const reglas = [
      en(
        regla({
          id: 'a',
          acciones: [{ tipo: 'sumar_variable', variableId: 'v', cantidad: 1 }],
        }),
        's1',
        'b1',
      ),
      en(
        regla({
          id: 'b',
          condiciones: [
            {
              tipo: 'no',
              condicion: {
                tipo: 'y',
                condiciones: [
                  {
                    tipo: 'comparacion',
                    operador: '>=',
                    izquierda: { tipo: 'variable', variableId: 'v' },
                    derecha: { tipo: 'literal', valor: 3 },
                  },
                ],
              },
            },
          ],
        }),
        's2',
      ),
      en(
        regla({
          id: 'c',
          acciones: [
            {
              tipo: 'asignar_variable',
              variableId: 'otra',
              valor: { tipo: 'variable', variableId: 'v' },
            },
          ],
        }),
      ),
      en(regla({ id: 'd', acciones: [{ tipo: 'siguiente' }] })),
    ];
    expect(usosDeVariable(reglas, 'v')).toEqual([
      { reglaId: 'a', slideId: 's1', bloqueId: 'b1' },
      { reglaId: 'b', slideId: 's2' },
      { reglaId: 'c', slideId: 's1' },
    ]);
    expect(usosDeVariable(reglas, 'nadie')).toEqual([]);
  });
});
