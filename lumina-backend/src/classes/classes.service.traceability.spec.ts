// nanoid@5 es ESM puro y Jest corre en CJS — mock obligatorio.
jest.mock('nanoid', () => ({ nanoid: jest.fn(() => 'mock-nanoid-id') }));

import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ClassesService } from './classes.service';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { SessionGamificationService } from '../gamification/session-gamification.service';

const CLASS_ID = 'class-traceability-1';
const COURSE_ID = 'course-traceability-1';
const OTHER_COURSE_ID = 'course-otro';
const PI_ID = 'pi-indicador-1';
const PI_ACTIVITY_ID = 'pi-indicador-activity';
const SLIDE_ID = 'slide-1';
const STUDENT_ID = 'student-1';
const SESSION_ID = 'session-1';
const ADMIN_ID = 'admin-1';

interface UpsertClassResultArg {
  create?: {
    performanceIndicatorId?: string | null;
  };
  update?: {
    performanceIndicatorId?: string | null;
  };
}

function getLastUpsertArg(mockFn: jest.Mock): UpsertClassResultArg {
  const calls = mockFn.mock.calls as [UpsertClassResultArg][];
  const lastCall = calls[calls.length - 1];
  return lastCall[0];
}

function createService(mockPrisma: Record<string, unknown>) {
  return Test.createTestingModule({
    providers: [
      ClassesService,
      {
        provide: PrismaService,
        useValue: mockPrisma,
      },
      {
        provide: CourseAuthorizationService,
        useValue: {
          verifyTeacherOwnership: jest.fn().mockResolvedValue(undefined),
          verifyCourseReadAccess: jest.fn().mockResolvedValue(undefined),
        },
      },
      { provide: AnalyticsService, useValue: {} },
      { provide: SessionGamificationService, useValue: {} },
    ],
  })
    .compile()
    .then((m) => m.get<ClassesService>(ClassesService));
}

function baseMockPrisma(overrides: Record<string, unknown> = {}) {
  const mockClassResult = {
    findUnique: jest.fn().mockResolvedValue(null),
    upsert: jest.fn().mockResolvedValue({ id: 'cr-1' }),
  };
  return {
    class: {
      findUnique: jest.fn().mockResolvedValue({
        id: CLASS_ID,
        courseId: COURSE_ID,
        authorId: null,
        status: 'DRAFT',
        performanceIndicatorId: PI_ID,
      }),
      update: jest.fn().mockImplementation(({ data }: { data: unknown }) => ({
        id: CLASS_ID,
        ...(data as Record<string, unknown>),
      })),
    },
    course: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: COURSE_ID, teacherId: ADMIN_ID }),
    },
    performanceIndicator: {
      findUnique: jest.fn(),
    },
    slide: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    classSession: {
      findFirst: jest.fn().mockResolvedValue({ id: SESSION_ID }),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue({ id: STUDENT_ID }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    classResult: mockClassResult,
    slideEngagement: {
      upsert: jest.fn().mockResolvedValue({ id: 'se-1' }),
    },
    $transaction: jest
      .fn()
      .mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) =>
        cb({
          classResult: mockClassResult,
          slideEngagement: {
            upsert: jest.fn().mockResolvedValue({ id: 'se-1' }),
          },
        }),
      ),
    ...overrides,
  };
}

describe('Trazabilidad actividad → indicador de desempeño (Etapa J / J9)', () => {
  describe('ClassesService.update — vínculo de Clase a PerformanceIndicator', () => {
    it('persiste performanceIndicatorId si el indicador existe y pertenece al curso', async () => {
      const mockPrisma = baseMockPrisma();
      mockPrisma.performanceIndicator.findUnique.mockResolvedValue({
        id: PI_ID,
        achievement: { courseId: COURSE_ID },
      });
      const service = await createService(mockPrisma);

      await service.update(
        CLASS_ID,
        { performanceIndicatorId: PI_ID },
        ADMIN_ID,
        'ADMIN',
      );

      expect(mockPrisma.performanceIndicator.findUnique).toHaveBeenCalledWith({
        where: { id: PI_ID },
        select: { id: true, achievement: { select: { courseId: true } } },
      });
      const [[updateArg]] = mockPrisma.class.update.mock.calls as [
        [{ data: Record<string, unknown> }],
      ];
      expect(updateArg.data.performanceIndicatorId).toBe(PI_ID);
    });

    it('falla con BadRequestException si el indicador de desempeño no existe', async () => {
      const mockPrisma = baseMockPrisma();
      mockPrisma.performanceIndicator.findUnique.mockResolvedValue(null);
      const service = await createService(mockPrisma);

      await expect(
        service.update(
          CLASS_ID,
          { performanceIndicatorId: 'pi-inexistente' },
          ADMIN_ID,
          'ADMIN',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('falla con BadRequestException si el indicador pertenece a otro curso', async () => {
      const mockPrisma = baseMockPrisma();
      mockPrisma.performanceIndicator.findUnique.mockResolvedValue({
        id: PI_ID,
        achievement: { courseId: OTHER_COURSE_ID },
      });
      const service = await createService(mockPrisma);

      await expect(
        service.update(
          CLASS_ID,
          { performanceIndicatorId: PI_ID },
          ADMIN_ID,
          'ADMIN',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('ClassesService.upsertLiveStudentResponse — trazabilidad en vivo', () => {
    it('hereda performanceIndicatorId de la clase cuando la actividad no declara uno propio', async () => {
      const mockPrisma = baseMockPrisma();
      mockPrisma.slide.findFirst.mockResolvedValue({
        content: {
          bloques: [
            {
              tipo: 'actividad',
              actividad: {
                tipo: 'quiz_multiple',
                pregunta: '¿1+1?',
                opciones: [{ texto: '2', correcta: true }],
              },
            },
          ],
        },
        class: { performanceIndicatorId: PI_ID },
      });

      const service = await createService(mockPrisma);
      await service.upsertLiveStudentResponse({
        classId: CLASS_ID,
        slideId: SLIDE_ID,
        activityType: 'quiz_multiple',
        studentId: STUDENT_ID,
        response: { selectedOption: 0 },
      });

      const arg = getLastUpsertArg(mockPrisma.classResult.upsert);
      expect(arg.create?.performanceIndicatorId).toBe(PI_ID);
      expect(arg.update?.performanceIndicatorId).toBe(PI_ID);
    });

    it('utiliza el performanceIndicatorId del bloque de actividad si está especificado en el slide', async () => {
      const mockPrisma = baseMockPrisma();
      mockPrisma.slide.findFirst.mockResolvedValue({
        content: {
          bloques: [
            {
              tipo: 'actividad',
              actividad: {
                tipo: 'quiz_multiple',
                performanceIndicatorId: PI_ACTIVITY_ID,
                pregunta: '¿1+1?',
                opciones: [{ texto: '2', correcta: true }],
              },
            },
          ],
        },
        class: { performanceIndicatorId: PI_ID },
      });

      const service = await createService(mockPrisma);
      await service.upsertLiveStudentResponse({
        classId: CLASS_ID,
        slideId: SLIDE_ID,
        activityType: 'quiz_multiple',
        studentId: STUDENT_ID,
        response: { selectedOption: 0 },
      });

      const arg = getLastUpsertArg(mockPrisma.classResult.upsert);
      expect(arg.create?.performanceIndicatorId).toBe(PI_ACTIVITY_ID);
      expect(arg.update?.performanceIndicatorId).toBe(PI_ACTIVITY_ID);
    });

    it('deja performanceIndicatorId en null si ni la clase ni la actividad lo declaran (paridad)', async () => {
      const mockPrisma = baseMockPrisma();
      mockPrisma.slide.findFirst.mockResolvedValue({
        content: {
          bloques: [
            {
              tipo: 'actividad',
              actividad: {
                tipo: 'quiz_multiple',
                pregunta: '¿1+1?',
                opciones: [{ texto: '2', correcta: true }],
              },
            },
          ],
        },
        class: { performanceIndicatorId: null },
      });

      const service = await createService(mockPrisma);
      await service.upsertLiveStudentResponse({
        classId: CLASS_ID,
        slideId: SLIDE_ID,
        activityType: 'quiz_multiple',
        studentId: STUDENT_ID,
        response: { selectedOption: 0 },
      });

      const arg = getLastUpsertArg(mockPrisma.classResult.upsert);
      expect(arg.create?.performanceIndicatorId).toBeNull();
    });
  });

  describe('ClassesService.saveManualGrade — trazabilidad en notas manuales', () => {
    it('persiste performanceIndicatorId desde NotaManualDto si viene explícito', async () => {
      const mockPrisma = baseMockPrisma();
      const service = await createService(mockPrisma);

      await service.saveManualGrade(
        CLASS_ID,
        {
          studentId: STUDENT_ID,
          slideId: SLIDE_ID,
          score: 4.5,
          performanceIndicatorId: PI_ACTIVITY_ID,
        },
        ADMIN_ID,
      );

      const arg = getLastUpsertArg(mockPrisma.classResult.upsert);
      expect(arg.create?.performanceIndicatorId).toBe(PI_ACTIVITY_ID);
      expect(arg.update?.performanceIndicatorId).toBe(PI_ACTIVITY_ID);
    });

    it('hereda performanceIndicatorId de la clase si NotaManualDto no lo incluye', async () => {
      const mockPrisma = baseMockPrisma();
      const service = await createService(mockPrisma);

      await service.saveManualGrade(
        CLASS_ID,
        {
          studentId: STUDENT_ID,
          slideId: SLIDE_ID,
          score: 4.0,
        },
        ADMIN_ID,
      );

      const arg = getLastUpsertArg(mockPrisma.classResult.upsert);
      expect(arg.create?.performanceIndicatorId).toBe(PI_ID);
      expect(arg.update?.performanceIndicatorId).toBe(PI_ID);
    });
  });

  describe('ClassesService.saveResults / persistClassResults — trazabilidad por lote', () => {
    it('persiste performanceIndicatorId del ítem si viene en StudentResultDto', async () => {
      const mockPrisma = baseMockPrisma();
      const service = await createService(mockPrisma);

      await service.saveResults(CLASS_ID, {
        sessionId: SESSION_ID,
        resultados: [
          {
            studentId: STUDENT_ID,
            slideId: SLIDE_ID,
            activityType: 'quiz_multiple',
            score: 5.0,
            performanceIndicatorId: PI_ACTIVITY_ID,
          },
        ],
      });

      const arg = getLastUpsertArg(mockPrisma.classResult.upsert);
      expect(arg.create?.performanceIndicatorId).toBe(PI_ACTIVITY_ID);
      expect(arg.update?.performanceIndicatorId).toBe(PI_ACTIVITY_ID);
    });

    it('hereda performanceIndicatorId de la clase si el ítem no lo incluye', async () => {
      const mockPrisma = baseMockPrisma();
      const service = await createService(mockPrisma);

      await service.saveResults(CLASS_ID, {
        sessionId: SESSION_ID,
        resultados: [
          {
            studentId: STUDENT_ID,
            slideId: SLIDE_ID,
            activityType: 'quiz_multiple',
            score: 5.0,
          },
        ],
      });

      const arg = getLastUpsertArg(mockPrisma.classResult.upsert);
      expect(arg.create?.performanceIndicatorId).toBe(PI_ID);
      expect(arg.update?.performanceIndicatorId).toBe(PI_ID);
    });
  });

  describe('ClassesService.findOne — exposición de trazabilidad', () => {
    it('incluye performanceIndicatorId y performanceIndicator en el select', async () => {
      const mockPrisma = baseMockPrisma({
        class: {
          findUnique: jest.fn().mockResolvedValue({
            id: CLASS_ID,
            title: 'Clase con indicador',
            courseId: COURSE_ID,
            authorId: null,
            status: 'PUBLISHED',
            performanceIndicatorId: PI_ID,
            performanceIndicator: {
              id: PI_ID,
              statement: 'Identifica la estructura celular',
              competenceType: 'COGNITIVE',
              competenceScope: 'GENERAL',
            },
            slides: [],
          }),
        },
      });

      const service = await createService(mockPrisma);
      const result = await service.findOne(CLASS_ID, ADMIN_ID, 'ADMIN');

      expect(result.performanceIndicatorId).toBe(PI_ID);
      expect(result.performanceIndicator?.statement).toBe(
        'Identifica la estructura celular',
      );
    });
  });
});
