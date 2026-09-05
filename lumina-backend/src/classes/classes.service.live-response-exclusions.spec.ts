// nanoid@5 es ESM puro y Jest corre en CJS — mock obligatorio para evitar SyntaxError
jest.mock('nanoid', () => ({ nanoid: jest.fn(() => 'mock-nanoid-id') }));

import { Test, TestingModule } from '@nestjs/testing';
import { ClassesService } from './classes.service';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { SessionGamificationService } from '../gamification/session-gamification.service';
import { wrapActivityDraftResponse } from './activity-scoring';

const CLASS_ID = 'class-excl-1';
const SESSION_ID = 'session-excl-1';
const SLIDE_ID = 'slide-excl-1';
const STUDENT_ID = 'student-excl-1';

describe('ClassesService.upsertLiveStudentResponse — exclusiones de class_results', () => {
  let service: ClassesService;
  let classResultUpsert: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();

    classResultUpsert = jest.fn().mockResolvedValue({ id: 'live-result' });

    const mockPrisma = {
      classSession: {
        findFirst: jest.fn().mockResolvedValue({ id: SESSION_ID }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: STUDENT_ID }),
      },
      slide: {
        findFirst: jest.fn().mockResolvedValue({ content: null }),
      },
      classResult: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: classResultUpsert,
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CourseAuthorizationService, useValue: {} },
        { provide: AnalyticsService, useValue: {} },
        { provide: SessionGamificationService, useValue: {} },
      ],
    }).compile();

    service = module.get<ClassesService>(ClassesService);
  });

  function responder(
    activityType: string,
    response: unknown = { answer: 'a' },
  ) {
    return service.upsertLiveStudentResponse({
      classId: CLASS_ID,
      slideId: SLIDE_ID,
      activityType,
      studentId: STUDENT_ID,
      correct: true,
      response,
    });
  }

  it('escape_room no crea ni actualiza class_results', async () => {
    await responder('escape_room', { roomId: 'sala-1', answer: 'llave' });

    expect(classResultUpsert).not.toHaveBeenCalled();
  });

  it('torneo sigue excluido (sin regresión)', async () => {
    await responder('torneo');

    expect(classResultUpsert).not.toHaveBeenCalled();
  });

  it('una actividad evaluable sí persiste', async () => {
    await responder('quiz_multiple');

    expect(classResultUpsert).toHaveBeenCalledTimes(1);
  });

  it('un draft sigue sin persistir', async () => {
    await responder(
      'quiz_multiple',
      wrapActivityDraftResponse({ answer: 'a' }),
    );

    expect(classResultUpsert).not.toHaveBeenCalled();
  });
});
