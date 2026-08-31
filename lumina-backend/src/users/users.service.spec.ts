import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;

  const mockPrisma = {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('permite que un usuario edite su propio perfil', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'u1',
      name: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      role: Role.TEACHER,
      avatar: null,
      institution: 'Colegio',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockPrisma.user.update.mockResolvedValueOnce({
      id: 'u1',
      name: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      role: Role.TEACHER,
      avatar: null,
      institution: 'Nueva',
      isActive: true,
      updatedAt: new Date(),
    });

    await expect(
      service.update('u1', { institution: 'Nueva' }, { id: 'u1', role: Role.TEACHER }),
    ).resolves.toEqual(expect.objectContaining({ institution: 'Nueva' }));
  });

  it('impide que un docente edite el perfil de otro usuario', async () => {
    await expect(
      service.update('other', { name: 'X' }, { id: 'u1', role: Role.TEACHER }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
