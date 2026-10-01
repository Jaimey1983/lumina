jest.mock('nanoid', () => ({ nanoid: () => 'test-id' }));

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AutonomousSessionsService } from './autonomous-sessions.service';
import type { PrismaService } from '../prisma/prisma.service';

/**
 * Etapa K / K5 — persistencia del estado del motor.
 * C5: manipular el estado en el cliente no puede cambiar ninguna nota.
 */
function crear(
  opts: {
    resultado?: unknown;
    variables?: unknown;
  } = {},
) {
  const prisma = {
    autonomousResult: {
      findFirst: jest
        .fn()
        .mockResolvedValue('resultado' in opts ? opts.resultado : { id: 'r1' }),
      update: jest.fn().mockResolvedValue({}),
    },
    autonomousSession: {
      findUnique: jest.fn().mockResolvedValue({
        class: {
          variables:
            'variables' in opts
              ? opts.variables
              : [{ id: 'intentos', tipo: 'numero' }],
        },
      }),
    },
    autonomousProgress: { update: jest.fn(), create: jest.fn() },
  };
  return {
    prisma,
    service: new AutonomousSessionsService(prisma as unknown as PrismaService),
  };
}

const dto = (state: Record<string, unknown>) => ({
  studentId: 'u1',
  attemptNumber: 1,
  state,
});

describe('AutonomousSessionsService.saveInteractionState (K5)', () => {
  it('guarda el estado válido SOLO en interactionState', async () => {
    const { prisma, service } = crear();
    await service.saveInteractionState(
      's1',
      dto({ variables: { intentos: 3 }, estados: { b1: 'visitado' } }),
    );
    const call = (
      prisma.autonomousResult.update.mock.calls as [
        [
          {
            where: unknown;
            data: { interactionState: { variables: unknown } };
          },
        ],
      ]
    )[0][0];
    expect(call.where).toEqual({ id: 'r1' });
    expect(Object.keys(call.data)).toEqual(['interactionState']);
    expect(call.data.interactionState.variables).toEqual({ intentos: 3 });
  });

  it('C5: nunca escribe notas (ni progreso ni finalScore)', async () => {
    const { prisma, service } = crear();
    await service.saveInteractionState(
      's1',
      dto({ variables: { intentos: 99 } }),
    );
    expect(prisma.autonomousProgress.update).not.toHaveBeenCalled();
    expect(prisma.autonomousProgress.create).not.toHaveBeenCalled();
    const data = (
      prisma.autonomousResult.update.mock.calls as [[{ data: object }]]
    )[0][0].data;
    expect(data).not.toHaveProperty('finalScore');
    expect(data).not.toHaveProperty('score');
  });

  it('C5: un intento de colar una nota en el estado se rechaza', async () => {
    const { prisma, service } = crear();
    await expect(
      service.saveInteractionState('s1', dto({ finalScore: 5 })),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.autonomousResult.update).not.toHaveBeenCalled();
  });

  it('rechaza variable inexistente y tipo erróneo', async () => {
    const { service } = crear();
    await expect(
      service.saveInteractionState('s1', dto({ variables: { x: 1 } })),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.saveInteractionState(
        's1',
        dto({ variables: { intentos: 'tres' } }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('404 si no hay un intento en curso para ese alumno', async () => {
    const { prisma, service } = crear({ resultado: null });
    await expect(
      service.saveInteractionState('s1', dto({})),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.autonomousResult.update).not.toHaveBeenCalled();
  });

  it('una clase sin variables declaradas rechaza cualquier variable', async () => {
    const { service } = crear({ variables: null });
    await expect(
      service.saveInteractionState('s1', dto({ variables: { intentos: 1 } })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
