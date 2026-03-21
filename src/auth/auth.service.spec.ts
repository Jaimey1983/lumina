import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Role } from './dto/register.dto';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwt: JwtService;
  let signMock: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: (signMock = jest.fn()),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwt = module.get<JwtService>(JwtService);
  });

  it('deberia registrar y devolver token', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
    (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed-password');
    (prisma.user.create as jest.Mock).mockResolvedValueOnce({
      id: 'u1',
      name: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      role: 'STUDENT',
      createdAt: new Date('2026-01-01'),
      isActive: true,
      password: 'hashed-password',
      avatar: null,
    });
    (jwt.sign as jest.Mock).mockReturnValueOnce('jwt-token');

    const res = await service.register({
      name: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      password: 'password123',
      role: Role.STUDENT,
    });

    expect(res.token).toBe('jwt-token');
    expect(signMock).toHaveBeenCalledWith({
      sub: 'u1',
      email: 'ada@example.com',
      role: 'STUDENT',
    });
  });

  it('deberia rechazar registro duplicado', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'u1',
      email: 'ada@example.com',
    });

    await expect(
      service.register({
        name: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        password: 'password123',
        role: Role.STUDENT,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('deberia rechazar login si el usuario no existe', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

    await expect(
      service.login({
        email: 'missing@example.com',
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('deberia rechazar login si la contraseña es inválida', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'u1',
      email: 'ada@example.com',
      password: 'hashed-password',
      isActive: true,
      name: 'Ada',
      lastName: 'Lovelace',
      role: 'STUDENT',
      avatar: null,
    });
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

    await expect(
      service.login({
        email: 'ada@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('deberia permitir obtener perfil cuando el usuario existe', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'u1',
      name: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      role: 'STUDENT',
      avatar: null,
      createdAt: new Date('2026-01-01'),
    });

    const user = await service.getProfile('u1');
    expect(user).toEqual(
      expect.objectContaining({
        id: 'u1',
        email: 'ada@example.com',
      }),
    );
  });
});
