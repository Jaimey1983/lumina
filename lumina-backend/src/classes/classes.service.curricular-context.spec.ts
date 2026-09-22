// nanoid@5 es ESM puro y Jest corre en CJS — mock obligatorio.
jest.mock('nanoid', () => ({ nanoid: jest.fn(() => 'mock-nanoid-id') }));

import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClassesService } from './classes.service';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { SessionGamificationService } from '../gamification/session-gamification.service';

const CLASS_ID = 'class-curricular-1';
const COURSE_ID = 'course-curricular-1';
const OTHER_COURSE_ID = 'course-curricular-otro';
const DESEMPENO_ID = 'desempeno-1';
const ADMIN_ID = 'admin-1';

async function createService(mockPrisma: Record<string, unknown>) {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      ClassesService,
      { provide: PrismaService, useValue: mockPrisma },
      { provide: CourseAuthorizationService, useValue: {} },
      { provide: AnalyticsService, useValue: {} },
      { provide: SessionGamificationService, useValue: {} },
    ],
  }).compile();
  return module.get<ClassesService>(ClassesService);
}

function baseMockPrisma(overrides: Record<string, unknown> = {}) {
  return {
    class: {
      findUnique: jest.fn().mockResolvedValue({
        id: CLASS_ID,
        courseId: COURSE_ID,
        authorId: null,
        status: 'DRAFT',
      }),
      update: jest.fn().mockImplementation(({ data }: { data: unknown }) => ({
        id: CLASS_ID,
        ...(data as Record<string, unknown>),
      })),
    },
    desempeno: {
      findUnique: jest.fn(),
    },
    ...overrides,
  };
}

describe('ClassesService.update — contexto curricular (J6.3, Entrada 2)', () => {
  it('persiste desempenoId/caminoCurricular/dbaSeleccionado/indicadores si el desempeño pertenece al curso de la clase', async () => {
    const mockPrisma = baseMockPrisma();
    mockPrisma.desempeno.findUnique.mockResolvedValue({
      courseId: COURSE_ID,
    });
    const service = await createService(mockPrisma);

    await service.update(
      CLASS_ID,
      {
        desempenoId: DESEMPENO_ID,
        caminoCurricular: 'dba',
        dbaSeleccionado: { unidadId: 1, evidenciasElegidas: ['Evidencia 1'] },
        indicadores: {
          cognitivo: ['a', 'b', 'c'],
          procedimental: ['a', 'b', 'c'],
          actitudinal: ['a', 'b', 'c'],
        },
      },
      ADMIN_ID,
      'ADMIN',
    );

    expect(mockPrisma.desempeno.findUnique).toHaveBeenCalledWith({
      where: { id: DESEMPENO_ID },
      select: { courseId: true },
    });
    const [[updateArg]] = mockPrisma.class.update.mock.calls as [
      [{ data: Record<string, unknown> }],
    ];
    expect(updateArg.data.desempenoId).toBe(DESEMPENO_ID);
    expect(updateArg.data.caminoCurricular).toBe('dba');
    expect(updateArg.data.dbaSeleccionado).toEqual({
      unidadId: 1,
      evidenciasElegidas: ['Evidencia 1'],
    });
  });

  it('lanza BadRequestException si el desempeño pertenece a OTRO curso', async () => {
    const mockPrisma = baseMockPrisma();
    mockPrisma.desempeno.findUnique.mockResolvedValue({
      courseId: OTHER_COURSE_ID,
    });
    const service = await createService(mockPrisma);

    await expect(
      service.update(
        CLASS_ID,
        { desempenoId: DESEMPENO_ID },
        ADMIN_ID,
        'ADMIN',
      ),
    ).rejects.toThrow(BadRequestException);
    expect(mockPrisma.class.update).not.toHaveBeenCalled();
  });

  it('lanza BadRequestException si el desempenoId no existe', async () => {
    const mockPrisma = baseMockPrisma();
    mockPrisma.desempeno.findUnique.mockResolvedValue(null);
    const service = await createService(mockPrisma);

    await expect(
      service.update(CLASS_ID, { desempenoId: 'no-existe' }, ADMIN_ID, 'ADMIN'),
    ).rejects.toThrow(BadRequestException);
  });

  it('no toca desempeno.findUnique si no se envía desempenoId (compatibilidad legado)', async () => {
    const mockPrisma = baseMockPrisma();
    const service = await createService(mockPrisma);

    await service.update(
      CLASS_ID,
      { title: 'Nuevo título' },
      ADMIN_ID,
      'ADMIN',
    );

    expect(mockPrisma.desempeno.findUnique).not.toHaveBeenCalled();
    const [[updateArg]] = mockPrisma.class.update.mock.calls as [
      [{ data: Record<string, unknown> }],
    ];
    expect(updateArg.data.title).toBe('Nuevo título');
    expect('desempenoId' in updateArg.data).toBe(false);
  });
});
