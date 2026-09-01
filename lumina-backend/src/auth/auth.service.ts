import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Role, VerificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { isTeacherRole } from '../verification/verification.util';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

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

    const validPassword = await bcrypt.compare(dto.currentPassword, user.password);
    if (!validPassword) {
      throw new UnauthorizedException('La contraseña actual no es correcta');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('La nueva contraseña debe ser distinta a la actual');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Contraseña actualizada' };
  }

  // ─── GENERAR TOKEN ────────────────────────────────────
  private generateToken(userId: string, email: string, role: string) {
    return this.jwtService.sign({ sub: userId, email, role });
  }
}
