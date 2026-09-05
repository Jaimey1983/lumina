import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

/**
 * Prueba de paridad del flujo "olvidé mi contraseña".
 *
 * Cubre lo no negociable de AGENTS.md (Reglas 5 y 9):
 *  - la respuesta de forgot-password es idéntica exista o no el correo;
 *  - token inválido / expirado / ya usado en reset-password;
 *  - un solo uso: al usarlo se invalidan los tokens vivos del usuario;
 *  - pedir un token nuevo invalida los anteriores.
 */
describe('AuthService — recuperación de contraseña', () => {
  let service: AuthService;
  let prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock };
    passwordResetToken: {
      findUnique: jest.Mock;
      create: jest.Mock;
      updateMany: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
  // matcher de fecha tipado: evita 'any' en los asserts de toHaveBeenCalledWith
  const anyDate = expect.any(Date) as unknown as Date;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';

    prisma = {
      user: { findUnique: jest.fn(), update: jest.fn() },
      passwordResetToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: { sign: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterAll(() => {
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
  });

  // ─── forgotPassword ────────────────────────────────────
  it('no filtra si el correo existe: misma respuesta en ambos casos', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    const desconocido = await service.forgotPassword({
      email: 'nadie@example.com',
    });

    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'u1',
      email: 'ada@example.com',
      isActive: true,
      deletedAt: null,
    });
    const conocido = await service.forgotPassword({ email: 'ada@example.com' });

    expect(desconocido.message).toBe(conocido.message);
  });

  it('no emite token cuando el correo no está registrado', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);

    const res = await service.forgotPassword({ email: 'nadie@example.com' });

    expect(res.devToken).toBeUndefined();
    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
    expect(prisma.passwordResetToken.updateMany).not.toHaveBeenCalled();
  });

  it('emite un token e invalida los anteriores cuando el correo existe', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'u1',
      email: 'ada@example.com',
      isActive: true,
      deletedAt: null,
    });

    const res = await service.forgotPassword({ email: 'ada@example.com' });

    // invalida los pendientes antes de crear el nuevo
    expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u1', usedAt: null },
      data: { usedAt: anyDate },
    });

    // en desarrollo se devuelve el token en claro para poder probar el flujo
    expect(res.devToken).toMatch(/^[a-f0-9]{64}$/);

    // se persiste el hash SHA-256 del token, nunca el valor en claro
    const expectedHash = createHash('sha256')
      .update(res.devToken)
      .digest('hex');
    expect(prisma.passwordResetToken.create).toHaveBeenCalledWith({
      data: {
        userId: 'u1',
        tokenHash: expectedHash,
        expiresAt: anyDate,
      },
    });
    expect(expectedHash).not.toBe(res.devToken);
  });

  it('no devuelve devToken en producción', async () => {
    process.env.NODE_ENV = 'production';
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'u1',
      email: 'ada@example.com',
      isActive: true,
      deletedAt: null,
    });

    const res = await service.forgotPassword({ email: 'ada@example.com' });

    expect(res.devToken).toBeUndefined();
    expect(prisma.passwordResetToken.create).toHaveBeenCalledTimes(1);
  });

  it('trata a un usuario inactivo como inexistente (sin emitir token)', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'u1',
      email: 'ada@example.com',
      isActive: false,
      deletedAt: null,
    });

    const res = await service.forgotPassword({ email: 'ada@example.com' });

    expect(res.devToken).toBeUndefined();
    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
  });

  // ─── resetPassword ─────────────────────────────────────
  it('rechaza un token inexistente', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.resetPassword({ token: 'no-existe', password: 'password456' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rechaza un token expirado', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValueOnce({
      id: 't1',
      userId: 'u1',
      usedAt: null,
      expiresAt: new Date(Date.now() - 1_000),
      user: { isActive: true, deletedAt: null },
    });

    await expect(
      service.resetPassword({ token: 'raw', password: 'password456' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rechaza un token ya usado', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValueOnce({
      id: 't1',
      userId: 'u1',
      usedAt: new Date(Date.now() - 5_000),
      expiresAt: new Date(Date.now() + 60_000),
      user: { isActive: true, deletedAt: null },
    });

    await expect(
      service.resetPassword({ token: 'raw', password: 'password456' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rechaza si el usuario dueño del token está inactivo', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValueOnce({
      id: 't1',
      userId: 'u1',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: { isActive: false, deletedAt: null },
    });

    await expect(
      service.resetPassword({ token: 'raw', password: 'password456' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('con un token válido fija la contraseña e invalida los tokens vivos en una transacción', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValueOnce({
      id: 't1',
      userId: 'u1',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: { isActive: true, deletedAt: null },
    });
    (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed-new');

    await expect(
      service.resetPassword({ token: 'raw', password: 'password456' }),
    ).resolves.toEqual({ message: 'Contraseña actualizada' });

    expect(bcrypt.hash).toHaveBeenCalledWith('password456', 12);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { password: 'hashed-new' },
    });
    expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u1', usedAt: null },
      data: { usedAt: anyDate },
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('el mismo token en claro no sirve dos veces (segundo intento = ya usado)', async () => {
    // 1er uso: token vivo
    prisma.passwordResetToken.findUnique.mockResolvedValueOnce({
      id: 't1',
      userId: 'u1',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: { isActive: true, deletedAt: null },
    });
    (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed-new');
    await service.resetPassword({ token: 'raw', password: 'password456' });

    // 2do uso: el registro ya quedó con usedAt
    prisma.passwordResetToken.findUnique.mockResolvedValueOnce({
      id: 't1',
      userId: 'u1',
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      user: { isActive: true, deletedAt: null },
    });

    await expect(
      service.resetPassword({ token: 'raw', password: 'otra-clave-99' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
