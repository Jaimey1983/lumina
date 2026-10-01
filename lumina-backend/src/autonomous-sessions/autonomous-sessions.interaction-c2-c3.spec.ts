jest.mock('nanoid', () => ({ nanoid: () => 'test-id' }));

import { AutonomousSessionsService } from './autonomous-sessions.service';
import type { PrismaService } from '../prisma/prisma.service';

/**
 * Etapa K / K4 — C2 y C3 sobre el backend actual.
 *
 *  - C3: un slide saltado (el alumno nunca llegó: ruta del motor de reglas)
 *    no genera fila de progreso ni entra al promedio; nunca se registra como 0.
 *  - C2 (parte que HOY está garantizada): un `null` posterior no pisa la nota ya
 *    fijada. (Una segunda respuesta real al mismo slide sí recalcula: ver el
 *    hallazgo de K4 en AGENTS.md; no se cambia acá porque K4 no toca backend.)
 */
function crearServicio(opts: {
  existente?: { id: string; score: number | null; response: unknown } | null;
  progreso?: Array<{
    slideId: string;
    activityType: string | null;
    score: number | null;
  }>;
}) {
  const prisma = {
    autonomousProgress: {
      findFirst: jest.fn().mockResolvedValue(opts.existente ?? null),
      findMany: jest.fn().mockResolvedValue(opts.progreso ?? []),
      update: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue({}),
    },
    autonomousSession: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: 's1', classId: 'c1', purpose: 'practice' }),
    },
    autonomousResult: {
      findFirst: jest
        .fn()
        .mockResolvedValue({ id: 'r1', studentId: 'u1', studentName: 'Ana' }),
      update: jest.fn().mockResolvedValue({}),
    },
    autonomousGrade: { create: jest.fn() },
    slide: { findUnique: jest.fn().mockResolvedValue(null) },
    class: { findUnique: jest.fn() },
  };
  return {
    prisma,
    service: new AutonomousSessionsService(prisma as unknown as PrismaService),
  };
}

describe('K4 · C2/C3 con el backend autónomo', () => {
  it('C2: una respuesta null posterior no sobrescribe la nota ya fijada', async () => {
    const { service, prisma } = crearServicio({
      existente: { id: 'p1', score: 4.2, response: { ok: true } },
    });
    await service.saveProgress('s1', {
      studentId: 'u1',
      slideId: 'sl1',
      response: null,
      attemptNumber: 1,
      activityType: 'quiz_multiple',
    });
    expect(prisma.autonomousProgress.update).not.toHaveBeenCalled();
    expect(prisma.autonomousProgress.create).not.toHaveBeenCalled();
  });

  it('C3: al completar, un slide saltado (sin fila) no cuenta ni baja el promedio', async () => {
    // 3 slides de actividad; la ruta del motor saltó sl2: solo hay filas de sl1 y sl3.
    const { service, prisma } = crearServicio({
      progreso: [
        { slideId: 'sl1', activityType: 'quiz_multiple', score: 5 },
        { slideId: 'sl3', activityType: 'quiz_multiple', score: 3 },
      ],
    });
    const res = await service.complete('s1', {
      studentId: 'u1',
      attemptNumber: 1,
    });
    expect(res.finalScore).toBe(4);
    expect(prisma.autonomousProgress.create).not.toHaveBeenCalled();
    expect(prisma.class.findUnique).not.toHaveBeenCalled(); // no recalcula "por slide": no inventa un 0
  });

  it('C3: saltar un slide no crea ClassResult ni fila de progreso (saveProgress sin activityType es no-op)', async () => {
    const { service, prisma } = crearServicio({});
    const r = await service.saveProgress('s1', {
      studentId: 'u1',
      slideId: 'sl2',
      attemptNumber: 1,
    });
    expect(r).toEqual({ saved: true });
    expect(prisma.autonomousProgress.create).not.toHaveBeenCalled();
    expect(prisma.autonomousProgress.update).not.toHaveBeenCalled();
  });
});
