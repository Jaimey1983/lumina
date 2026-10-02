jest.mock('nanoid', () => ({ nanoid: () => 'test-id' }));

import { AutonomousSessionsService } from './autonomous-sessions.service';
import type { PrismaService } from '../prisma/prisma.service';

/**
 * Etapa K / K4 — C2 y C3 sobre el backend actual.
 *
 *  - C3: un slide saltado (el alumno nunca llegó: ruta del motor de reglas)
 *    no genera fila de progreso ni entra al promedio; nunca se registra como 0.
 *  - C2: la nota usa solo la primera respuesta calificada; ni un `null` ni una
 *    segunda respuesta real (volver atrás y reabrir) la pisan. Los borradores
 *    (`draft`) y video_interactivo (respuesta fusionada) siguen actualizándose.
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

  it('C2: una segunda respuesta real al mismo slide no recalcula ni pisa la nota', async () => {
    const { service, prisma } = crearServicio({
      existente: { id: 'p1', score: 5, response: { a: 1 } },
    });
    await service.saveProgress('s1', {
      studentId: 'u1',
      slideId: 'sl1',
      response: { a: 2 },
      attemptNumber: 1,
      activityType: 'quiz_multiple',
    });
    expect(prisma.autonomousProgress.update).not.toHaveBeenCalled();
    expect(prisma.slide.findUnique).toHaveBeenCalled(); // se evalúa pero se descarta
  });

  it('C2: un borrador sí se guarda aunque ya exista score; y sin score previo la primera respuesta se registra', async () => {
    const a = crearServicio({
      existente: { id: 'p1', score: 5, response: { a: 1 } },
    });
    await a.service.saveProgress('s1', {
      studentId: 'u1',
      slideId: 'sl1',
      response: { a: 2 },
      attemptNumber: 1,
      activityType: 'quiz_multiple',
      draft: true,
    });
    expect(a.prisma.autonomousProgress.update).toHaveBeenCalledTimes(1);
    const [llamada] = a.prisma.autonomousProgress.update.mock.calls as [
      [{ data: Record<string, unknown> }],
    ];
    const data = llamada[0].data;
    expect(data).not.toHaveProperty('score');

    const b = crearServicio({
      existente: { id: 'p2', score: null, response: null },
    });
    await b.service.saveProgress('s1', {
      studentId: 'u1',
      slideId: 'sl1',
      response: { a: 1 },
      attemptNumber: 1,
      activityType: 'quiz_multiple',
    });
    expect(b.prisma.autonomousProgress.update).toHaveBeenCalledTimes(1);
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
