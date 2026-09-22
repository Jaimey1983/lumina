import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CurriculumService } from './curriculum.service';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';
import type { CreateDesempenoDto } from './dto/create-desempeno.dto';

type PrismaStub = {
  course: { findUnique: jest.Mock };
  desempeno: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    delete: jest.Mock;
  };
};

type CourseAuthStub = {
  assertStaffCanManageCourse: jest.Mock;
  verifyCourseReadAccess: jest.Mock;
};

async function createService(env: Record<string, string | undefined> = {}) {
  const prisma: PrismaStub = {
    course: { findUnique: jest.fn() },
    desempeno: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };
  const courseAuth: CourseAuthStub = {
    assertStaffCanManageCourse: jest.fn().mockResolvedValue(undefined),
    verifyCourseReadAccess: jest.fn().mockResolvedValue(undefined),
  };
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      CurriculumService,
      { provide: PrismaService, useValue: prisma },
      { provide: CourseAuthorizationService, useValue: courseAuth },
      { provide: ConfigService, useValue: { get: (k: string) => env[k] } },
    ],
  }).compile();
  return {
    service: module.get<CurriculumService>(CurriculumService),
    prisma,
    courseAuth,
  };
}

const DTO_VALIDO: CreateDesempenoDto = {
  componenteEbc: 'entorno_vivo',
  competenciaIcfes: 'indagacion',
};

describe('CurriculumService — Entrada 1 (J6.2, Desempeño de curso)', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('generateDesempenoCurso', () => {
    it('verifica permisos de gestión del curso con el scope "courseSettings"', async () => {
      const { service, prisma, courseAuth } = await createService();
      prisma.course.findUnique.mockResolvedValue({
        area: 'ciencias-naturales',
        grado: '1',
      });
      prisma.desempeno.create.mockResolvedValue({ id: 'd1' });

      await service.generateDesempenoCurso(
        'curso-1',
        DTO_VALIDO,
        'user-1',
        'TEACHER',
      );

      expect(courseAuth.assertStaffCanManageCourse).toHaveBeenCalledWith(
        'curso-1',
        'user-1',
        'TEACHER',
        'courseSettings',
      );
    });

    it('lanza NotFoundException si el curso no existe', async () => {
      const { service, prisma } = await createService();
      prisma.course.findUnique.mockResolvedValue(null);

      await expect(
        service.generateDesempenoCurso(
          'curso-x',
          DTO_VALIDO,
          'user-1',
          'TEACHER',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza BadRequestException si el curso no tiene área/grado (J1)', async () => {
      const { service, prisma } = await createService();
      prisma.course.findUnique.mockResolvedValue({ area: null, grado: null });

      await expect(
        service.generateDesempenoCurso(
          'curso-1',
          DTO_VALIDO,
          'user-1',
          'TEACHER',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException si el componente EBC no pertenece al área del curso', async () => {
      const { service, prisma } = await createService();
      prisma.course.findUnique.mockResolvedValue({
        area: 'matematicas',
        grado: '3',
      });

      await expect(
        service.generateDesempenoCurso(
          'curso-1',
          {
            componenteEbc: 'entorno_vivo',
            competenciaIcfes: 'razonamiento_argumentacion',
          },
          'user-1',
          'TEACHER',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException si la competencia ICFES no pertenece al área del curso', async () => {
      const { service, prisma } = await createService();
      prisma.course.findUnique.mockResolvedValue({
        area: 'matematicas',
        grado: '3',
      });

      await expect(
        service.generateDesempenoCurso(
          'curso-1',
          {
            componenteEbc: 'pensamiento_numerico',
            competenciaIcfes: 'indagacion',
          },
          'user-1',
          'TEACHER',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('sin GEMINI_API_KEY, persiste con el enunciado de plantilla determinista', async () => {
      const { service, prisma } = await createService();
      prisma.course.findUnique.mockResolvedValue({
        area: 'ciencias-naturales',
        grado: '1',
      });
      prisma.desempeno.create.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) => ({
          id: 'd1',
          ...data,
        }),
      );

      const result = await service.generateDesempenoCurso(
        'curso-1',
        DTO_VALIDO,
        'user-1',
        'TEACHER',
      );

      expect(prisma.desempeno.create).toHaveBeenCalledTimes(1);
      const [[callArg]] = prisma.desempeno.create.mock.calls as [
        [{ data: Record<string, unknown> }],
      ];
      expect(callArg.data.courseId).toBe('curso-1');
      expect(callArg.data.area).toBe('ciencias-naturales');
      expect(callArg.data.grado).toBe('1');
      expect(callArg.data.componenteEbc).toBe('entorno_vivo');
      expect(callArg.data.competenciaIcfes).toBe('indagacion');
      expect(typeof result.enunciado).toBe('string');
      expect(result.enunciado.length).toBeGreaterThan(0);
    });

    it('con GEMINI_API_KEY y sin contenido curado del componente en el área/grado, usa grounding y cae a plantilla si Gemini falla', async () => {
      const fetchMock = jest.fn<Promise<Response>, [string, { body: string }]>(
        () => Promise.reject(new Error('network down')),
      );
      (global as unknown as { fetch: typeof fetch }).fetch =
        fetchMock as unknown as typeof fetch;

      const { service, prisma } = await createService({
        GEMINI_API_KEY: 'fake-key',
      });
      // matemáticas grado 11 no tiene ebc_factor variado en el dataset
      // curado (J3) — fuerza el camino de grounding.
      prisma.course.findUnique.mockResolvedValue({
        area: 'matematicas',
        grado: '11',
      });
      prisma.desempeno.create.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) => ({
          id: 'd1',
          ...data,
        }),
      );

      const result = await service.generateDesempenoCurso(
        'curso-1',
        {
          componenteEbc: 'pensamiento_numerico',
          competenciaIcfes: 'razonamiento_argumentacion',
        },
        'user-1',
        'TEACHER',
      );

      expect(fetchMock).toHaveBeenCalled();
      const body = JSON.parse(
        (fetchMock.mock.calls[0][1] as { body: string }).body,
      ) as { tools?: unknown };
      expect(body.tools).toEqual([{ google_search: {} }]);
      expect(typeof result.enunciado).toBe('string');
    });
  });

  describe('listDesempenosCurso', () => {
    it('verifica acceso de lectura y devuelve la lista ordenada por fecha', async () => {
      const { service, prisma, courseAuth } = await createService();
      prisma.desempeno.findMany.mockResolvedValue([{ id: 'd1' }]);

      const result = await service.listDesempenosCurso(
        'curso-1',
        'user-1',
        'STUDENT',
      );

      expect(courseAuth.verifyCourseReadAccess).toHaveBeenCalledWith(
        'curso-1',
        'user-1',
        'STUDENT',
      );
      expect(prisma.desempeno.findMany).toHaveBeenCalledWith({
        where: { courseId: 'curso-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([{ id: 'd1' }]);
    });
  });

  describe('removeDesempenoCurso', () => {
    it('borra el desempeño si pertenece al curso', async () => {
      const { service, prisma, courseAuth } = await createService();
      prisma.desempeno.findUnique.mockResolvedValue({ courseId: 'curso-1' });

      const result = await service.removeDesempenoCurso(
        'curso-1',
        'd1',
        'user-1',
        'TEACHER',
      );

      expect(courseAuth.assertStaffCanManageCourse).toHaveBeenCalledWith(
        'curso-1',
        'user-1',
        'TEACHER',
        'courseSettings',
      );
      expect(prisma.desempeno.delete).toHaveBeenCalledWith({
        where: { id: 'd1' },
      });
      expect(result).toEqual({ success: true });
    });

    it('lanza NotFoundException si el desempeño no existe o es de otro curso', async () => {
      const { service, prisma } = await createService();
      prisma.desempeno.findUnique.mockResolvedValue({ courseId: 'otro-curso' });

      await expect(
        service.removeDesempenoCurso('curso-1', 'd1', 'user-1', 'TEACHER'),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.desempeno.delete).not.toHaveBeenCalled();
    });
  });
});
