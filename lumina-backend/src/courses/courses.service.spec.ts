import { Test, TestingModule } from '@nestjs/testing';
import { CoursesService } from './courses.service';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';

describe('CoursesService', () => {
  let service: CoursesService;

  const mockPrisma = {
    course: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    enrollment: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockCourseAuth = {
    assertCourseExists: jest.fn(),
    verifyCourseReadAccess: jest.fn(),
    assertStaffCanManageCourse: jest.fn(),
    isStaffForCourse: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CourseAuthorizationService, useValue: mockCourseAuth },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('propiedad del curso (IDOR)', () => {
    it('enrollStudent exige que el solicitante sea dueño del curso', async () => {
      mockCourseAuth.assertStaffCanManageCourse.mockRejectedValueOnce(
        new Error('forbidden'),
      );
      await expect(
        service.enrollStudent(
          'course-1',
          { userId: 'student-1' },
          'other-teacher',
          'TEACHER',
        ),
      ).rejects.toThrow('forbidden');
      expect(mockCourseAuth.assertStaffCanManageCourse).toHaveBeenCalledWith(
        'course-1',
        'other-teacher',
        'TEACHER',
        'enrollment',
      );
    });

    it('findStudents exige que el solicitante sea dueño del curso', async () => {
      mockCourseAuth.assertStaffCanManageCourse.mockRejectedValueOnce(
        new Error('forbidden'),
      );
      await expect(
        service.findStudents('course-1', 1, 20, 'other-teacher', 'TEACHER'),
      ).rejects.toThrow('forbidden');
      expect(mockCourseAuth.assertStaffCanManageCourse).toHaveBeenCalledWith(
        'course-1',
        'other-teacher',
        'TEACHER',
        'enrollment',
      );
    });

    it('findOneForUser exige acceso de lectura real, no cualquier usuario autenticado', async () => {
      mockCourseAuth.verifyCourseReadAccess.mockRejectedValueOnce(
        new Error('forbidden'),
      );
      await expect(
        service.findOneForUser('course-1', 'random-user', 'TEACHER'),
      ).rejects.toThrow('forbidden');
      expect(mockCourseAuth.verifyCourseReadAccess).toHaveBeenCalledWith(
        'course-1',
        'random-user',
        'TEACHER',
      );
    });
  });
});
