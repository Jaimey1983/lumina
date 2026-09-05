jest.mock('nanoid', () => ({ nanoid: jest.fn(() => 'mock-nanoid-id') }));

import { Test, TestingModule } from '@nestjs/testing';
import { ClassesService } from './classes.service';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { SessionGamificationService } from '../gamification/session-gamification.service';

const CLASS_A = 'class-verify-a';
const CLASS_B = 'class-verify-b';
const GUEST_ID = 'guest-user-1';
const OTHER_USER = 'enrolled-other-class';

describe('ClassesService.verifyGuestStudent', () => {
  let service: ClassesService;
  let userFindUnique: jest.Mock;
  let classResultFindFirst: jest.Mock;
  let classGuestFindUnique: jest.Mock;

  beforeEach(async () => {
    userFindUnique = jest.fn();
    classResultFindFirst = jest.fn();
    classGuestFindUnique = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassesService,
        {
          provide: PrismaService,
          useValue: {
            user: { findUnique: userFindUnique },
            classResult: { findFirst: classResultFindFirst },
            classGuest: { findUnique: classGuestFindUnique },
          },
        },
        { provide: CourseAuthorizationService, useValue: {} },
        { provide: AnalyticsService, useValue: {} },
        { provide: SessionGamificationService, useValue: {} },
      ],
    }).compile();

    service = module.get(ClassesService);
  });

  it('guest unido a esta clase (ClassGuest, sin ClassResult) → valid true', async () => {
    userFindUnique.mockResolvedValue({
      id: GUEST_ID,
      name: 'Ana Pérez',
      email: 'guest_123_abc@lumina.guest',
      isActive: true,
    });
    classResultFindFirst.mockResolvedValue(null);
    classGuestFindUnique.mockResolvedValue({ id: 'join-1' });

    await expect(
      service.verifyGuestStudent(CLASS_A, GUEST_ID),
    ).resolves.toEqual({
      valid: true,
      studentName: 'Ana Pérez',
    });
    expect(classGuestFindUnique).toHaveBeenCalledWith({
      where: { classId_userId: { classId: CLASS_A, userId: GUEST_ID } },
      select: { id: true },
    });
  });

  it('guest de la Clase A verificado contra la Clase B → valid false', async () => {
    userFindUnique.mockResolvedValue({
      id: GUEST_ID,
      name: 'Ana Pérez',
      email: 'guest_123_abc@lumina.guest',
      isActive: true,
    });
    classResultFindFirst.mockResolvedValue(null);
    classGuestFindUnique.mockResolvedValue(null);

    await expect(
      service.verifyGuestStudent(CLASS_B, GUEST_ID),
    ).resolves.toEqual({
      valid: false,
    });
  });

  it('id inventado → valid false', async () => {
    userFindUnique.mockResolvedValue(null);

    await expect(
      service.verifyGuestStudent(CLASS_A, 'no-existe'),
    ).resolves.toEqual({ valid: false });
  });

  it('usuario de otra clase (sin email guest ni ClassResult) → valid false', async () => {
    userFindUnique.mockResolvedValue({
      id: OTHER_USER,
      name: 'Carlos',
      email: 'carlos@colegio.edu.co',
      isActive: true,
    });
    classResultFindFirst.mockResolvedValue(null);

    await expect(
      service.verifyGuestStudent(CLASS_A, OTHER_USER),
    ).resolves.toEqual({ valid: false });
    expect(classResultFindFirst).toHaveBeenCalledWith({
      where: { classId: CLASS_A, studentId: OTHER_USER },
      select: { id: true },
    });
    expect(classGuestFindUnique).not.toHaveBeenCalled();
  });

  it('tiene ClassResult en esta clase aunque no sea guest email → valid true', async () => {
    userFindUnique.mockResolvedValue({
      id: OTHER_USER,
      name: 'Carlos',
      email: 'carlos@colegio.edu.co',
      isActive: true,
    });
    classResultFindFirst.mockResolvedValue({ id: 'result-1' });

    await expect(
      service.verifyGuestStudent(CLASS_A, OTHER_USER),
    ).resolves.toEqual({
      valid: true,
      studentName: 'Carlos',
    });
    expect(classGuestFindUnique).not.toHaveBeenCalled();
  });
});
