import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { Role, VerificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { isTeacherRole } from '../verification/verification.util';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

/** Vida útil del token de restablecimiento: corta a propósito (30 min). */
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

/**
 * Respuesta única de `forgotPassword`: idéntica exista o no el correo, para no
 * filtrar qué cuentas están registradas (enumeración de usuarios).
 */
const FORGOT_PASSWORD_GENERIC_MESSAGE =
  'Si el correo está registrado, enviaremos instrucciones para restablecer la contraseña.';

function isPrismaUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: unknown }).code === 'P2002'
  );
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // ─── REGISTRO ─────────────────────────────────────────
  async register(dto: RegisterDto) {
    // Verificar si el email ya existe
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('El correo ya está registrado');
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // Crear usuario
    type CreatedUser = {
      id: string;
      name: string;
      lastName: string;
      email: string;
      role: string;
      createdAt: Date;
    };
    const role: Role = (dto.role ?? 'STUDENT') as Role;
    // Los roles docentes arrancan sin verificar (PENDING): pueden editar
    // borradores pero no publicar ni invitar hasta canjear un código de
    // invitación o adjuntar un correo institucional de dominio confiable (PR2).
    // El resto de roles quedan en NULL = "la verificación no aplica".
    const verificationStatus = isTeacherRole(role)
      ? VerificationStatus.PENDING
      : null;

    let user!: CreatedUser;
    try {
      user = await this.prisma.user.create({
        data: {
          name: dto.name,
          lastName: dto.lastName,
          email: dto.email,
          password: hashedPassword,
          role,
          verificationStatus,
        },
        select: {
          id: true,
          name: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
    } catch (err: unknown) {
      if (isPrismaUniqueConstraintError(err)) {
        throw new ConflictException('El correo ya está registrado');
      }
      throw err;
    }

    // Generar token
    const token = this.generateToken(user.id, user.email, user.role);

    return { user, token };
  }

  // ─── LOGIN ────────────────────────────────────────────
  async login(dto: LoginDto) {
    // Buscar usuario
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(dto.password, user.password);
    if (!validPassword) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // Generar token
    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      token,
    };
  }

  // ─── PERFIL ───────────────────────────────────────────
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        role: true,
        avatar: true,
        institution: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return user;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const validPassword = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );
    if (!validPassword) {
      throw new UnauthorizedException('La contraseña actual no es correcta');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'La nueva contraseña debe ser distinta a la actual',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Contraseña actualizada' };
  }

  // ─── OLVIDÉ MI CONTRASEÑA ─────────────────────────────
  /**
   * Genera un token de restablecimiento de un solo uso y expiración corta.
   * Pedir uno nuevo invalida los anteriores del mismo usuario.
   *
   * La respuesta es siempre la misma exista o no el correo (Regla 5: no
   * filtrar qué cuentas existen).
   *
   * TODO(email-provider): hoy NO se envía correo. En desarrollo el token en
   * claro se loguea y se devuelve en `devToken` para poder probar el flujo.
   * Antes de ir a producción hay que conectar un proveedor real de email
   * (SES / Resend / SMTP), enviar el enlace por correo y ELIMINAR tanto el log
   * como el campo `devToken` de la respuesta. Es una decisión aparte pendiente.
   */
  async forgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<{ message: string; devToken?: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.isActive || user.deletedAt) {
      return { message: FORGOT_PASSWORD_GENERIC_MESSAGE };
    }

    // Un solo token vivo por usuario: invalidar los pendientes antes de emitir.
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const rawToken = randomBytes(32).toString('hex');
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashResetToken(rawToken),
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    // TODO(email-provider): reemplazar este bloque por el envío real del correo.
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[DEV ONLY — no enviar así a producción] Token de restablecimiento para ${user.email}: ${rawToken}`,
      );
      return { message: FORGOT_PASSWORD_GENERIC_MESSAGE, devToken: rawToken };
    }

    return { message: FORGOT_PASSWORD_GENERIC_MESSAGE };
  }

  // ─── RESTABLECER CONTRASEÑA ───────────────────────────
  /**
   * Valida el token (existe / no expiró / no se usó) y fija la contraseña
   * nueva. El token se marca usado en la misma transacción que el cambio de
   * contraseña, junto con cualquier otro token vivo del usuario.
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: this.hashResetToken(dto.token) },
      include: { user: true },
    });

    const invalid =
      !record ||
      record.usedAt !== null ||
      record.expiresAt.getTime() <= Date.now() ||
      !record.user.isActive ||
      record.user.deletedAt !== null;

    if (invalid) {
      throw new BadRequestException(
        'El enlace de restablecimiento no es válido o expiró',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { password: hashedPassword },
      }),
      // Marca usado el token actual y cualquier otro pendiente del usuario.
      this.prisma.passwordResetToken.updateMany({
        where: { userId: record.userId, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Contraseña actualizada' };
  }

  private hashResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  // ─── GENERAR TOKEN ────────────────────────────────────
  private generateToken(userId: string, email: string, role: string) {
    return this.jwtService.sign({ sub: userId, email, role });
  }
}
