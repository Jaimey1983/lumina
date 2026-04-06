import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

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
    let user!: CreatedUser;
    try {
      user = await this.prisma.user.create({
        data: {
          name: dto.name,
          lastName: dto.lastName,
          email: dto.email,
          password: hashedPassword,
          role: dto.role ?? 'STUDENT',
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

    if (!user || !user.isActive) {
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
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return user;
  }

  // ─── GENERAR TOKEN ────────────────────────────────────
  private generateToken(userId: string, email: string, role: string) {
    return this.jwtService.sign({ sub: userId, email, role });
  }
}
