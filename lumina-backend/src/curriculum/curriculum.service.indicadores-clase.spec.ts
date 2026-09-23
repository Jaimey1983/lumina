import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CurriculumService } from './curriculum.service';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';
import type { GenerateIndicadoresClaseDto } from './dto/generate-indicadores-clase.dto';

type PrismaStub = {
  desempeno: { findUnique: jest.Mock };
};

type CourseAuthStub = {
  assertStaffCanManageCourse: jest.Mock;
  verifyCourseReadAccess: jest.Mock;
};

async function createService(env: Record<string, string | undefined> = {}) {
  const prisma: PrismaStub = { desempeno: { findUnique: jest.fn() } };
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

const DESEMPENO_CN = {
  id: 'd1',
  courseId: 'curso-1',
  area: 'ciencias-naturales',
  grado: '1',
  componenteEbc: 'entorno_vivo',
  competenciaIcfes: 'indagacion',
  enunciado: 'Desempeño de prueba sobre entorno vivo.',
};

describe('CurriculumService — Entrada 2 (J6.3, camino DBA/EBC + indicadores de clase)', () => {
  describe('listUnidadesDbaParaDesempeno', () => {
    it('verifica acceso de lectura y devuelve las unidades del componente con sus evidencias', async () => {
      const { service, prisma, courseAuth } = await createService();
      // grado 6 (no el 1 de DESEMPENO_CN) — es el único con dataset real hoy.
      prisma.desempeno.findUnique.mockResolvedValue({
        ...DESEMPENO_CN,
        grado: '6',
      });

      const result = await service.listUnidadesDbaParaDesempeno(
        'curso-1',
        'd1',
        'user-1',
        'STUDENT',
      );

      expect(courseAuth.verifyCourseReadAccess).toHaveBeenCalledWith(
        'curso-1',
        'user-1',
        'STUDENT',
      );
      // ciencias-naturales-6: unidades 3 y 4 son "Entorno vivo" (dataset real)
      expect(result.map((u) => u.unidadId).sort()).toEqual([3, 4]);
      expect(result[0].evidenciasAprendizaje.length).toBeGreaterThan(0);
    });

    it('lanza NotFoundException si el desempeño no pertenece al curso', async () => {
      const { service, prisma } = await createService();
      prisma.desempeno.findUnique.mockResolvedValue({
        ...DESEMPENO_CN,
        courseId: 'otro-curso',
      });

      await expect(
        service.listUnidadesDbaParaDesempeno('curso-1', 'd1', 'u', 'TEACHER'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listSubprocesosEbcParaDesempeno', () => {
    it('devuelve los subprocesos del ciclo EBC del componente (catálogo por ciclo, no por unidad)', async () => {
      const { service, prisma } = await createService();
      // Sale de EBC_ESTANDARES (ebc-estandares.ts), catálogo por ciclo de
      // grados — solo el ciclo 6-7 de ciencias-naturales está curado hoy.
      prisma.desempeno.findUnique.mockResolvedValue({
        ...DESEMPENO_CN,
        grado: '6',
      });

      const result = await service.listSubprocesosEbcParaDesempeno(
        'curso-1',
        'd1',
        'user-1',
        'TEACHER',
      );

      expect(result).toHaveLength(16);
    });

    it('devuelve vacío si el ciclo de ese grado todavía no está curado en el catálogo', async () => {
      const { service, prisma } = await createService();
      prisma.desempeno.findUnique.mockResolvedValue(DESEMPENO_CN); // grado 1, ciclo 1-3

      const result = await service.listSubprocesosEbcParaDesempeno(
        'curso-1',
        'd1',
        'user-1',
        'TEACHER',
      );

      expect(result).toEqual([]);
    });
  });

  describe('generateIndicadoresClase', () => {
    const originalFetch = global.fetch;
    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('verifica permisos con el scope "classEditor"', async () => {
      const { service, prisma, courseAuth } = await createService();
      prisma.desempeno.findUnique.mockResolvedValue(DESEMPENO_CN);

      await service.generateIndicadoresClase(
        'curso-1',
        'd1',
        {
          caminoCurricular: 'dba',
          dbaSeleccionado: { unidadId: 2, evidenciasElegidas: ['Evidencia X'] },
        },
        'user-1',
        'TEACHER',
      );

      expect(courseAuth.assertStaffCanManageCourse).toHaveBeenCalledWith(
        'curso-1',
        'user-1',
        'TEACHER',
        'classEditor',
      );
    });

    it('lanza BadRequestException si caminoCurricular=dba pero falta dbaSeleccionado', async () => {
      const { service, prisma } = await createService();
      prisma.desempeno.findUnique.mockResolvedValue(DESEMPENO_CN);

      await expect(
        service.generateIndicadoresClase(
          'curso-1',
          'd1',
          { caminoCurricular: 'dba' } as GenerateIndicadoresClaseDto,
          'u',
          'TEACHER',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException si vienen dbaSeleccionado Y ebcSeleccionado a la vez (excluyentes)', async () => {
      const { service, prisma } = await createService();
      prisma.desempeno.findUnique.mockResolvedValue(DESEMPENO_CN);

      await expect(
        service.generateIndicadoresClase(
          'curso-1',
          'd1',
          {
            caminoCurricular: 'dba',
            dbaSeleccionado: {
              unidadId: 2,
              evidenciasElegidas: ['Evidencia X'],
            },
            ebcSeleccionado: { subprocesosElegidos: ['Subproceso Y'] },
          },
          'u',
          'TEACHER',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException si la selección elegida viene vacía', async () => {
      const { service, prisma } = await createService();
      prisma.desempeno.findUnique.mockResolvedValue(DESEMPENO_CN);

      await expect(
        service.generateIndicadoresClase(
          'curso-1',
          'd1',
          {
            caminoCurricular: 'ebc',
            ebcSeleccionado: { subprocesosElegidos: [] },
          },
          'u',
          'TEACHER',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('sin GEMINI_API_KEY, genera los 3 tipos con el fallback determinista (D3), nunca vacíos', async () => {
      const { service, prisma } = await createService();
      prisma.desempeno.findUnique.mockResolvedValue(DESEMPENO_CN);

      const result = await service.generateIndicadoresClase(
        'curso-1',
        'd1',
        {
          caminoCurricular: 'ebc',
          ebcSeleccionado: { subprocesosElegidos: ['Subproceso de prueba'] },
        },
        'u',
        'TEACHER',
      );

      expect(result.cognitivo.length).toBeGreaterThanOrEqual(3);
      expect(result.procedimental.length).toBeGreaterThanOrEqual(3);
      expect(result.actitudinal.length).toBeGreaterThanOrEqual(3);
      // Enunciados DISTINTOS entre sí dentro de cada tipo (no niveles de intensidad).
      expect(new Set(result.cognitivo).size).toBe(result.cognitivo.length);
      for (const arr of [
        result.cognitivo,
        result.procedimental,
        result.actitudinal,
      ]) {
        expect(arr.some((s) => s.includes('Subproceso de prueba'))).toBe(true);
      }
    });

    it('con GEMINI_API_KEY, usa la respuesta de Gemini cuando trae los 3 tipos válidos', async () => {
      const fetchMock = jest.fn<Promise<Response>, [string, { body: string }]>(
        () =>
          Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                candidates: [
                  {
                    content: {
                      parts: [
                        {
                          text: JSON.stringify({
                            cognitivo: ['C1', 'C2', 'C3'],
                            procedimental: ['P1', 'P2', 'P3'],
                            actitudinal: ['A1', 'A2', 'A3'],
                          }),
                        },
                      ],
                    },
                  },
                ],
              }),
          } as Response),
      );
      (global as unknown as { fetch: typeof fetch }).fetch =
        fetchMock as unknown as typeof fetch;

      const { service, prisma } = await createService({
        GEMINI_API_KEY: 'fake-key',
      });
      prisma.desempeno.findUnique.mockResolvedValue(DESEMPENO_CN);

      const result = await service.generateIndicadoresClase(
        'curso-1',
        'd1',
        {
          caminoCurricular: 'dba',
          dbaSeleccionado: { unidadId: 2, evidenciasElegidas: ['Evidencia Z'] },
        },
        'u',
        'TEACHER',
      );

      expect(result).toEqual({
        cognitivo: ['C1', 'C2', 'C3'],
        procedimental: ['P1', 'P2', 'P3'],
        actitudinal: ['A1', 'A2', 'A3'],
      });
    });

    it('con GEMINI_API_KEY, si Gemini falla cae al fallback determinista (no revienta)', async () => {
      const fetchMock = jest.fn<Promise<Response>, [string, { body: string }]>(
        () => Promise.reject(new Error('network down')),
      );
      (global as unknown as { fetch: typeof fetch }).fetch =
        fetchMock as unknown as typeof fetch;

      const { service, prisma } = await createService({
        GEMINI_API_KEY: 'fake-key',
      });
      prisma.desempeno.findUnique.mockResolvedValue(DESEMPENO_CN);

      const result = await service.generateIndicadoresClase(
        'curso-1',
        'd1',
        {
          caminoCurricular: 'ebc',
          ebcSeleccionado: { subprocesosElegidos: ['Subproceso W'] },
        },
        'u',
        'TEACHER',
      );

      expect(result.cognitivo.length).toBeGreaterThanOrEqual(3);
    });
  });
});
