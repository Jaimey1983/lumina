jest.mock('nanoid', () => ({ nanoid: jest.fn(() => 'mock-nanoid-id') }));
import { Test, TestingModule } from '@nestjs/testing';
import { ClassesService } from './classes.service';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { SessionGamificationService } from '../gamification/session-gamification.service';
import { ForbiddenException } from '@nestjs/common';

describe('ClassesService - Student Presentations', () => {
  let service: ClassesService;

  const mockPrisma = {
    class: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    course: {
      findUnique: jest.fn(),
    },
    slide: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    classSession: {
      findFirst: jest.fn(),
    },
    enrollment: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockCourseAuth = {
    verifyCourseReadAccess: jest.fn(),
    assertStaffCanManageCourse: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CourseAuthorizationService, useValue: mockCourseAuth },
        {
          provide: AnalyticsService,
          useValue: {
            closeSessionLog: jest.fn().mockResolvedValue(undefined),
            recordSlideEngagement: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: SessionGamificationService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ClassesService>(ClassesService);
  });

  describe('creación de presentación personal por estudiante', () => {
    it('crea una presentación personal con courseId = null y authorId = studentId', async () => {
      mockPrisma.class.findFirst.mockResolvedValueOnce(null); // generarCodigoUnico
      mockPrisma.class.create.mockResolvedValueOnce({
        id: 'pres-1',
        title: 'Mi Proyecto',
        courseId: null,
        authorId: 'student-1',
        modoEntrega: 'presentacion',
        status: 'PUBLISHED',
      });

      const result = await service.create(
        { title: 'Mi Proyecto' },
        'student-1',
        'STUDENT',
      );

      const createCall = (
        mockPrisma.class.create.mock.calls[0] as [
          {
            data: {
              title: string;
              courseId: string | null;
              authorId: string;
              modoEntrega: string;
            };
          },
        ]
      )[0];
      expect(createCall.data.title).toBe('Mi Proyecto');
      expect(createCall.data.courseId).toBeNull();
      expect(createCall.data.authorId).toBe('student-1');
      expect(createCall.data.modoEntrega).toBe('presentacion');
      expect(result.id).toBe('pres-1');
    });

    it('impide a un estudiante crear una clase con courseId docente', async () => {
      // Si el rol es STUDENT, automáticamente se crea como personal sin asociar a curso
      mockPrisma.class.findFirst.mockResolvedValueOnce(null);
      mockPrisma.class.create.mockResolvedValueOnce({
        id: 'pres-2',
        title: 'Mi Tarea',
        courseId: null,
        authorId: 'student-1',
        modoEntrega: 'presentacion',
      });

      await service.create(
        { title: 'Mi Tarea', courseId: 'teacher-course' },
        'student-1',
        'STUDENT',
      );

      const createCall = (
        mockPrisma.class.create.mock.calls[0] as [
          { data: { courseId: string | null; authorId: string } },
        ]
      )[0];
      expect(createCall.data.courseId).toBeNull();
      expect(createCall.data.authorId).toBe('student-1');
    });
  });

  describe('autoría y edición de diapositivas', () => {
    it('permite al estudiante autor modificar diapositivas de su presentación', async () => {
      mockPrisma.class.findUnique.mockResolvedValueOnce({
        id: 'pres-1',
        courseId: null,
        authorId: 'student-1',
        status: 'PUBLISHED',
      });
      mockPrisma.slide.findUnique.mockResolvedValueOnce({
        id: 'slide-1',
        classId: 'pres-1',
      });
      mockPrisma.slide.update.mockResolvedValueOnce({
        id: 'slide-1',
        title: 'Diapositiva Actualizada',
      });

      const updated = await service.updateSlide(
        'pres-1',
        'slide-1',
        { title: 'Diapositiva Actualizada' },
        'student-1',
      );

      expect(updated.title).toBe('Diapositiva Actualizada');
    });

    it('prohíbe a otro estudiante modificar una presentación que no es suya', async () => {
      mockPrisma.class.findUnique.mockResolvedValueOnce({
        id: 'pres-1',
        courseId: null,
        authorId: 'student-1',
        status: 'PUBLISHED',
      });

      await expect(
        service.updateSlide(
          'pres-1',
          'slide-1',
          { title: 'Hack' },
          'student-intruder',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('prohíbe al estudiante modificar diapositivas de una clase docente del curso', async () => {
      mockPrisma.class.findUnique.mockResolvedValueOnce({
        id: 'class-docente',
        courseId: 'course-1',
        authorId: 'teacher-1',
        status: 'PUBLISHED',
      });
      mockPrisma.course.findUnique.mockResolvedValueOnce({
        id: 'course-1',
        teacherId: 'teacher-1',
      });

      await expect(
        service.updateSlide(
          'class-docente',
          'slide-1',
          { title: 'Modificación no autorizada' },
          'student-1',
          'STUDENT',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('permite a un ADMIN actualizar una presentación personal de un estudiante', async () => {
      mockPrisma.class.findUnique.mockResolvedValueOnce({
        id: 'pres-1',
        courseId: null,
        authorId: 'student-1',
        status: 'PUBLISHED',
      });
      mockPrisma.class.update.mockResolvedValueOnce({
        id: 'pres-1',
        title: 'Título Corregido por Admin',
      });

      const res = await service.update(
        'pres-1',
        { title: 'Título Corregido por Admin' },
        'admin-1',
        'ADMIN',
      );

      expect(res.title).toBe('Título Corregido por Admin');
    });
  });

  describe('validación de acceso a clases en findOne', () => {
    it('verifica acceso al curso en findOne si la clase pertenece a un curso', async () => {
      mockPrisma.class.findUnique.mockResolvedValueOnce({
        id: 'class-curso-1',
        title: 'Clase de Ciencias',
        courseId: 'course-1',
        authorId: 'teacher-1',
        status: 'PUBLISHED',
        slides: [],
      });
      mockPrisma.classSession.findFirst.mockResolvedValueOnce(null);

      await service.findOne('class-curso-1', 'student-1', 'STUDENT');

      expect(mockCourseAuth.verifyCourseReadAccess).toHaveBeenCalledWith(
        'course-1',
        'student-1',
        'STUDENT',
      );
    });

    it('oculta clases en DRAFT a estudiantes en findOne retornando NotFoundException', async () => {
      mockPrisma.class.findUnique.mockResolvedValueOnce({
        id: 'class-draft',
        title: 'Clase en Borrador',
        courseId: 'course-1',
        authorId: 'teacher-1',
        status: 'DRAFT',
        slides: [],
      });

      await expect(
        service.findOne('class-draft', 'student-1', 'STUDENT'),
      ).rejects.toThrow('Clase no encontrada');
    });
  });

  describe('findEnrolledClasses', () => {
    it('retorna arreglo vacío si el estudiante no tiene cursos matriculados', async () => {
      mockPrisma.enrollment.findMany.mockResolvedValueOnce([]);

      const result = await service.findEnrolledClasses('student-sin-cursos');

      expect(result).toEqual([]);
      expect(mockPrisma.class.findMany).not.toHaveBeenCalled();
    });

    it('retorna clases matriculadas con bandera isConfigured y estado en vivo/autonomo', async () => {
      mockPrisma.enrollment.findMany.mockResolvedValueOnce([
        { courseId: 'course-1' },
      ]);
      mockPrisma.class.findMany.mockResolvedValueOnce([
        {
          id: 'class-1',
          title: 'Historia 1',
          description: 'Desc',
          code: 'hist-1',
          codigo: 'HIST1',
          status: 'PUBLISHED',
          modoEntrega: 'clase',
          courseId: 'course-1',
          createdAt: new Date(),
          course: { id: 'course-1', name: 'Historia', code: 'HIS101' },
          slides: [{ id: 's1', type: 'COVER', title: 'Portada', content: {} }],
          sessions: [{ id: 'sess-live', startedAt: new Date() }],
          autonomousSessions: [],
        },
        {
          id: 'class-2',
          title: 'Matemáticas Autónomo',
          description: null,
          code: 'mat-1',
          codigo: 'MAT1',
          status: 'PUBLISHED',
          modoEntrega: 'autonomo',
          courseId: 'course-1',
          createdAt: new Date(),
          course: { id: 'course-1', name: 'Matemáticas', code: 'MAT101' },
          slides: [],
          sessions: [],
          autonomousSessions: [
            {
              id: 'auto-1',
              status: 'scheduled',
              opensAt: new Date(),
              closesAt: new Date(),
            },
          ],
        },
        {
          id: 'class-3',
          title: 'Ciencias Sin Configurar',
          description: null,
          code: 'cie-1',
          codigo: 'CIE1',
          status: 'PUBLISHED',
          modoEntrega: 'autonomo',
          courseId: 'course-1',
          createdAt: new Date(),
          course: { id: 'course-1', name: 'Ciencias', code: 'CIE101' },
          slides: [],
          sessions: [],
          autonomousSessions: [], // sin sesión autónoma
        },
      ]);

      const result = await service.findEnrolledClasses('student-1');

      expect(result).toHaveLength(3);
      // Clase 1: En Vivo activa -> isConfigured = true, isLiveActive = true
      expect(result[0].isConfigured).toBe(true);
      expect(result[0].isLiveActive).toBe(true);
      // Clase 2: Autónomo programado -> isConfigured = true
      expect(result[1].isConfigured).toBe(true);
      expect(result[1].autonomousSession?.status).toBe('scheduled');
      // Clase 3: Autónomo sin sesión -> isConfigured = false
      expect(result[2].isConfigured).toBe(false);
    });
  });
});
