// nanoid@5 es ESM puro y Jest corre en CJS — mock obligatorio.
jest.mock('nanoid', () => ({ nanoid: jest.fn(() => 'mock-nanoid-id') }));

import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClassesService } from './classes.service';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { SessionGamificationService } from '../gamification/session-gamification.service';
import type { UpdateClassDto } from './dto/update-class.dto';

/**
 * Etapa K / K6 — variables del motor de interacción (`Class.variables`).
 * Se validan con el mismo `validarVariables` que usa el editor.
 */
async function crear(clase: Record<string, unknown> = {}) {
  const prisma = {
    class: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'c1',
        courseId: 'curso1',
        authorId: null,
        status: 'DRAFT',
        isSystemTemplate: false,
        ...clase,
      }),
      update: jest.fn().mockImplementation(({ data }: { data: unknown }) => ({
        id: 'c1',
        ...(data as Record<string, unknown>),
      })),
    },
  };
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      ClassesService,
      { provide: PrismaService, useValue: prisma },
      { provide: CourseAuthorizationService, useValue: {} },
      { provide: AnalyticsService, useValue: {} },
      { provide: SessionGamificationService, useValue: {} },
    ],
  }).compile();
  return { service: module.get(ClassesService), prisma };
}

const dto = (variables: UpdateClassDto['variables']): UpdateClassDto =>
  ({ variables }) as UpdateClassDto;

describe('ClassesService.update — variables (K6)', () => {
  it('persiste variables válidas', async () => {
    const { service, prisma } = await crear();
    const vars = [
      {
        id: 'v1',
        nombre: 'intentos',
        tipo: 'numero' as const,
        valorInicial: 0,
      },
    ];
    await service.update('c1', dto(vars), 'admin', 'SUPERADMIN');
    const data = (
      prisma.class.update.mock.calls[0] as [{ data: Record<string, unknown> }]
    )[0].data;
    expect(data.variables).toEqual(vars);
  });

  it('rechaza (400) nombres duplicados, tipo incoherente o más de 50', async () => {
    const { service, prisma } = await crear();
    const dup = [
      { id: 'a', nombre: 'x', tipo: 'numero' as const, valorInicial: 0 },
      { id: 'b', nombre: 'X', tipo: 'numero' as const, valorInicial: 0 },
    ];
    await expect(
      service.update('c1', dto(dup), 'admin', 'SUPERADMIN'),
    ).rejects.toBeInstanceOf(BadRequestException);
    const mal = [
      { id: 'a', nombre: 'x', tipo: 'numero' as const, valorInicial: 'no' },
    ];
    await expect(
      service.update('c1', dto(mal), 'admin', 'SUPERADMIN'),
    ).rejects.toBeInstanceOf(BadRequestException);
    const muchas = Array.from({ length: 51 }, (_, i) => ({
      id: `v${i}`,
      nombre: `n${i}`,
      tipo: 'numero' as const,
      valorInicial: 0,
    }));
    await expect(
      service.update('c1', dto(muchas), 'admin', 'SUPERADMIN'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.class.update).not.toHaveBeenCalled();
  });

  it('no toca variables si el PATCH no las trae (compatibilidad)', async () => {
    const { service, prisma } = await crear();
    await service.update(
      'c1',
      { title: 'Nuevo título' } as UpdateClassDto,
      'admin',
      'SUPERADMIN',
    );
    const data = (
      prisma.class.update.mock.calls[0] as [{ data: Record<string, unknown> }]
    )[0].data;
    expect(data).not.toHaveProperty('variables');
  });

  it('no permite editar variables de la clase de sistema', async () => {
    const { service } = await crear({ isSystemTemplate: true });
    await expect(
      service.update('c1', dto([]), 'admin', 'SUPERADMIN'),
    ).rejects.toBeDefined();
  });
});
