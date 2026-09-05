// nanoid@5 es ESM puro y Jest corre en CJS — mock obligatorio para evitar SyntaxError
jest.mock('nanoid', () => ({ nanoid: jest.fn(() => 'mock-nanoid-id') }));

import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClassesService } from './classes.service';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { SessionGamificationService } from '../gamification/session-gamification.service';

// ─── Constantes de escenario ──────────────────────────────────────────────────

const CLASS_ID = 'class-tx-test-1';
const COURSE_ID = 'course-tx-test-1';
const TEACHER_ID = 'teacher-tx-test-1';
const SESSION_ID = 'session-tx-test-1';
const STUDENT_A = 'student-tx-a';
const STUDENT_B = 'student-tx-b';

const RESULTADO_A = {
  studentId: STUDENT_A,
  slideId: 'slide-a',
  activityType: 'quiz_multiple',
  correct: true as boolean | null,
  slideIndex: 0,
};

const RESULTADO_B = {
  studentId: STUDENT_B,
  slideId: 'slide-b',
  activityType: 'verdadero_falso',
  correct: false as boolean | null,
  slideIndex: 1,
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('ClassesService — endSession — atomicidad de la transacción (Test 3)', () => {
  let service: ClassesService;

  // Mocks del contexto de transacción (tx)
  let txUpsert: jest.Mock;
  let txSessionUpdate: jest.Mock;

  // Mock de prisma directo (fuera de la transacción)
  let directUpsert: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Mocks de tx — se configuran por test
    txUpsert = jest.fn();
    txSessionUpdate = jest.fn().mockResolvedValue({
      id: SESSION_ID,
      classId: CLASS_ID,
      startedAt: new Date('2026-01-01T10:00:00Z'),
      endedAt: new Date('2026-01-01T11:00:00Z'),
    });

    const txMock = {
      classResult: { upsert: txUpsert },
      classSession: { update: txSessionUpdate },
    };

    // Upsert directo (path de upsertLiveStudentResponse — Fase 3.5)
    directUpsert = jest.fn().mockResolvedValue({ id: 'live-result-a' });

    const mockPrisma = {
      class: {
        findUnique: jest.fn().mockResolvedValue({
          id: CLASS_ID,
          courseId: COURSE_ID,
          status: 'PUBLISHED',
        }),
      },
      course: {
        findUnique: jest.fn().mockResolvedValue({ teacherId: TEACHER_ID }),
      },
      classSession: {
        findFirst: jest.fn().mockResolvedValue({ id: SESSION_ID }),
      },
      classResult: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: directUpsert,
      },
      user: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue({ id: STUDENT_A }),
      },
      slide: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue({ content: null }),
      },
      $transaction: jest
        .fn()
        .mockImplementation((fn: (tx: typeof txMock) => Promise<unknown>) =>
          fn(txMock),
        ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CourseAuthorizationService, useValue: {} },
        {
          provide: AnalyticsService,
          useValue: {
            closeSessionLog: jest.fn().mockResolvedValue(undefined),
            recordSlideEngagement: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: SessionGamificationService,
          useValue: { terminarSesion: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<ClassesService>(ClassesService);
  });

  // ─── Assertion 1 + 2: fallo propaga el error y la sesión no se cierra ─────

  it('Assertion 1: propaga el error si una escritura dentro de $transaction falla (no lo traga)', async () => {
    txUpsert
      .mockResolvedValueOnce({ id: 'result-a' }) // resultadoA: OK
      .mockRejectedValueOnce(new Error('DB write simulado')); // resultadoB: falla

    await expect(
      service.endSession(CLASS_ID, TEACHER_ID, {
        resultados: [RESULTADO_A, RESULTADO_B],
      }),
    ).rejects.toThrow('DB write simulado');
  });

  it('Assertion 2: tras el error, classSession.update NO fue llamado (sesión sigue con endedAt: null)', async () => {
    txUpsert
      .mockResolvedValueOnce({ id: 'result-a' })
      .mockRejectedValueOnce(new Error('DB write simulado'));

    await expect(
      service.endSession(CLASS_ID, TEACHER_ID, {
        resultados: [RESULTADO_A, RESULTADO_B],
      }),
    ).rejects.toThrow();

    // El update de classSession (que setea endedAt) dentro de la tx NO llegó a ejecutarse
    expect(txSessionUpdate).not.toHaveBeenCalled();
  });

  // ─── Assertion 3: resultado previo del upsert en vivo sigue intacto ────────

  it('Assertion 3: el resultado guardado por upsertLiveStudentResponse antes del cierre sigue presente tras el fallo', async () => {
    // Simula el upsert en vivo de Fase 3.5 (llamado durante la clase, ANTES del cierre)
    await service.upsertLiveStudentResponse({
      classId: CLASS_ID,
      slideId: RESULTADO_A.slideId,
      activityType: RESULTADO_A.activityType,
      studentId: RESULTADO_A.studentId,
      correct: true,
      response: { answer: 'a' },
    });

    // Confirma que el upsert directo se realizó (Fase 3.5)
    expect(directUpsert).toHaveBeenCalledTimes(1);

    // Ahora intenta cerrar la sesión — el segundo resultado falla
    txUpsert
      .mockResolvedValueOnce({ id: 'result-a' })
      .mockRejectedValueOnce(new Error('DB write simulado'));

    await expect(
      service.endSession(CLASS_ID, TEACHER_ID, {
        resultados: [RESULTADO_A, RESULTADO_B],
      }),
    ).rejects.toThrow();

    // El upsert directo (fuera de la tx fallida) sigue con exactamente 1 llamada —
    // la transacción fallida no alteró el registro que ya existía fuera de ella
    expect(directUpsert).toHaveBeenCalledTimes(1);
  });

  // ─── Assertion 4: retry sin el mock cierra la sesión y guarda ambos ────────

  it('Assertion 4: retry sin el mock falla → cierra la sesión y guarda ambos resultados sin duplicar', async () => {
    // Primera llamada: falla el segundo resultado
    txUpsert
      .mockResolvedValueOnce({ id: 'result-a' })
      .mockRejectedValueOnce(new Error('DB write simulado'));

    await expect(
      service.endSession(CLASS_ID, TEACHER_ID, {
        resultados: [RESULTADO_A, RESULTADO_B],
      }),
    ).rejects.toThrow();

    // Resetea el mock de tx para que ambas escrituras sean exitosas
    txUpsert.mockReset();
    txUpsert.mockResolvedValue({ id: 'result' });
    txSessionUpdate.mockClear();

    // Retry: ambas escrituras exitosas
    const retryResult = await service.endSession(CLASS_ID, TEACHER_ID, {
      resultados: [RESULTADO_A, RESULTADO_B],
    });

    // La sesión fue cerrada (endedAt definido en el resultado)
    expect(retryResult.endedAt).toBeDefined();

    // classSession.update fue llamado exactamente una vez (no más)
    expect(txSessionUpdate).toHaveBeenCalledTimes(1);

    // tx.classResult.upsert fue llamado exactamente 2 veces (una por resultado, sin duplicados)
    expect(txUpsert).toHaveBeenCalledTimes(2);

    // Verifica que los slideIds correctos fueron procesados (A y B, sin extras)
    const upsertedSlideIds = txUpsert.mock.calls.map((call: unknown[]) => {
      const arg = call[0] as
        | {
            create?: { slideId?: string };
            where?: {
              classId_studentId_slideId_sessionId?: { slideId?: string };
            };
          }
        | undefined;
      return (
        arg?.create?.slideId ??
        arg?.where?.classId_studentId_slideId_sessionId?.slideId
      );
    });
    expect(upsertedSlideIds).toContain(RESULTADO_A.slideId);
    expect(upsertedSlideIds).toContain(RESULTADO_B.slideId);
  });
});

// ─── F1.4: optimistic locking de updateSlide ─────────────────────────────────

describe('ClassesService — updateSlide — optimistic locking (F1.4)', () => {
  let service: ClassesService;
  let slideFindUnique: jest.Mock;
  let slideFindFirst: jest.Mock;
  let slideUpdateMany: jest.Mock;
  let slideUpdate: jest.Mock;
  let slideFindUniqueOrThrow: jest.Mock;

  const SLIDE_ID = 'slide-ol-1';

  beforeEach(async () => {
    jest.clearAllMocks();

    slideFindUnique = jest.fn().mockResolvedValue({
      id: SLIDE_ID,
      classId: CLASS_ID,
      contentVersion: 3,
      content: { bloques: [] },
    });
    slideFindFirst = jest.fn().mockResolvedValue({ contentVersion: 4 });
    slideUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
    slideUpdate = jest.fn().mockResolvedValue({
      id: SLIDE_ID,
      contentVersion: 4,
    });
    slideFindUniqueOrThrow = jest.fn().mockResolvedValue({
      id: SLIDE_ID,
      contentVersion: 4,
      content: { v: 'ok' },
    });

    const mockPrisma = {
      class: {
        findUnique: jest.fn().mockResolvedValue({
          id: CLASS_ID,
          courseId: COURSE_ID,
          status: 'DRAFT',
        }),
      },
      course: {
        findUnique: jest.fn().mockResolvedValue({ teacherId: TEACHER_ID }),
      },
      slide: {
        findUnique: slideFindUnique,
        findFirst: slideFindFirst,
        updateMany: slideUpdateMany,
        update: slideUpdate,
        findUniqueOrThrow: slideFindUniqueOrThrow,
        findMany: jest.fn().mockResolvedValue([]),
      },
      classResult: { upsert: jest.fn(), findUnique: jest.fn() },
      classSession: { findFirst: jest.fn() },
      user: { findMany: jest.fn(), findUnique: jest.fn() },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CourseAuthorizationService, useValue: {} },
        {
          provide: AnalyticsService,
          useValue: {
            closeSessionLog: jest.fn(),
            recordSlideEngagement: jest.fn(),
          },
        },
        {
          provide: SessionGamificationService,
          useValue: { terminarSesion: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(ClassesService);
  });

  it('con expectedVersion coincidente: updateMany + incrementa versión', async () => {
    const result = await service.updateSlide(
      CLASS_ID,
      SLIDE_ID,
      { content: { bloques: [1] }, expectedVersion: 3 },
      TEACHER_ID,
    );

    expect(slideUpdateMany).toHaveBeenCalledTimes(1);
    const updateManyCalls = slideUpdateMany.mock.calls as unknown as Array<
      [{ where: unknown; data: { contentVersion: { increment: number } } }]
    >;
    const callArg = updateManyCalls[0][0];
    expect(callArg.where).toEqual({
      id: SLIDE_ID,
      classId: CLASS_ID,
      contentVersion: 3,
    });
    expect(callArg.data.contentVersion).toEqual({ increment: 1 });
    expect(result.contentVersion).toBe(4);
    expect(slideUpdate).not.toHaveBeenCalled();
  });

  it('con expectedVersion desfasada: 409 ConflictException (no pisa)', async () => {
    slideUpdateMany.mockResolvedValue({ count: 0 });

    const err = await service
      .updateSlide(
        CLASS_ID,
        SLIDE_ID,
        { content: { bloques: [2] }, expectedVersion: 3 },
        TEACHER_ID,
      )
      .catch((e: unknown) => e);

    expect(err).toBeInstanceOf(ConflictException);
    const body = (err as ConflictException).getResponse() as {
      message: string;
      currentVersion: number;
      expectedVersion: number;
    };
    expect(body.message).toContain('Conflicto de versión');
    expect(body.currentVersion).toBe(4);
    expect(body.expectedVersion).toBe(3);
    expect(slideFindUniqueOrThrow).not.toHaveBeenCalled();
  });

  it('sin expectedVersion: compat last-write-wins pero igual incrementa versión', async () => {
    await service.updateSlide(
      CLASS_ID,
      SLIDE_ID,
      { content: { bloques: [3] } },
      TEACHER_ID,
    );

    expect(slideUpdate).toHaveBeenCalledTimes(1);
    const updateCalls = slideUpdate.mock.calls as unknown as Array<
      [
        {
          where: { id: string };
          data: { contentVersion: { increment: number } };
        },
      ]
    >;
    const callArg = updateCalls[0][0];
    expect(callArg.where).toEqual({ id: SLIDE_ID });
    expect(callArg.data.contentVersion).toEqual({ increment: 1 });
    expect(slideUpdateMany).not.toHaveBeenCalled();
  });
});
