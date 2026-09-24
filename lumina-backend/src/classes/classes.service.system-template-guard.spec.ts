// nanoid@5 es ESM puro y Jest corre en CJS — mock obligatorio (mismo patrón
// que classes.service.traceability.spec.ts).
jest.mock('nanoid', () => ({ nanoid: jest.fn(() => 'mock-nanoid-id') }));

import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ClassesService } from './classes.service';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { SessionGamificationService } from '../gamification/session-gamification.service';

const SYSTEM_CLASS_ID = 'help-guide-class-1';
const SUPERADMIN_ID = 'superadmin-1';

/**
 * "Guía de Lumina" (X.2) — la clase de sistema (`isSystemTemplate: true`) no
 * se edita, publica, elimina ni inicia en vivo por ningún endpoint de
 * usuario, ni siquiera si el requester es ADMIN/SUPERADMIN (que
 * `verifyOwnership`/`verifyTeacherOwnership` dejarían pasar). Solo el seed
 * (`seed-help-guide.ts`) la modifica.
 */
async function createService() {
  let findManyMock: jest.Mock;

  const module = await Test.createTestingModule({
    providers: [
      ClassesService,
      {
        provide: PrismaService,
        useValue: {
          class: {
            findUnique: jest.fn().mockResolvedValue({
              id: SYSTEM_CLASS_ID,
              courseId: null,
              authorId: SUPERADMIN_ID,
              status: 'PUBLISHED',
              performanceIndicatorId: null,
              isSystemTemplate: true,
            }),
            findFirst: jest.fn().mockResolvedValue(null),
            findMany: (findManyMock = jest.fn().mockResolvedValue([])),
            update: jest.fn(),
          },
          classSession: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        },
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
  }).compile();

  return {
    service: module.get<ClassesService>(ClassesService),
    findManyMock: findManyMock,
  };
}

describe('ClassesService — guarda de la clase de sistema (X.2)', () => {
  it('update() rechaza incluso para SUPERADMIN', async () => {
    const { service } = await createService();
    await expect(
      service.update(
        SYSTEM_CLASS_ID,
        { title: 'hackeo' },
        SUPERADMIN_ID,
        'SUPERADMIN',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('publish() rechaza incluso para SUPERADMIN', async () => {
    const { service } = await createService();
    await expect(
      service.publish(SYSTEM_CLASS_ID, SUPERADMIN_ID, 'SUPERADMIN'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('remove() rechaza incluso para SUPERADMIN', async () => {
    const { service } = await createService();
    await expect(
      service.remove(SYSTEM_CLASS_ID, SUPERADMIN_ID, 'SUPERADMIN'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('startSession() rechaza incluso para el dueño (SUPERADMIN) — nunca genera sesión en vivo', async () => {
    const { service } = await createService();
    await expect(
      service.startSession(SYSTEM_CLASS_ID, SUPERADMIN_ID),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('findAllByCourse() (presentaciones personales) excluye isSystemTemplate del where', async () => {
    const { service, findManyMock } = await createService();
    await service.findAllByCourse(undefined, SUPERADMIN_ID, 'SUPERADMIN');

    const calls = findManyMock.mock.calls as [
      { where: { isSystemTemplate?: boolean } },
    ][];
    const lastArg = calls[calls.length - 1][0];
    expect(lastArg.where.isSystemTemplate).toBe(false);
  });
});
