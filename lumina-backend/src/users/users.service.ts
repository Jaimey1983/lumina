import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // ─── LISTAR USUARIOS (solo ADMIN) ─────────────────────
  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          lastName: true,
          email: true,
          role: true,
          avatar: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── OBTENER UN USUARIO ───────────────────────────────
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        role: true,
        avatar: true,
        institution: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  // ─── ACTUALIZAR USUARIO ───────────────────────────────
  async update(
    id: string,
    dto: UpdateUserDto,
    requestingUser: { id: string; role: Role },
  ) {
    const isSelf = requestingUser.id === id;
    const isAdmin =
      requestingUser.role === Role.ADMIN ||
      requestingUser.role === Role.SUPERADMIN;

    if (!isSelf && !isAdmin) {
      throw new ForbiddenException(
        'No puedes editar el perfil de otro usuario',
      );
    }

    // Solo ADMIN puede cambiar roles o activar/desactivar usuarios
    if (
      (dto.role || dto.isActive !== undefined) &&
      requestingUser.role !== Role.ADMIN &&
      requestingUser.role !== Role.SUPERADMIN
    ) {
      throw new ForbiddenException(
        'No tienes permisos para realizar esta acción',
      );
    }

    // Verificar que el usuario existe
    await this.findOne(id);

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(dto.institution !== undefined && { institution: dto.institution }),
        ...(dto.avatar !== undefined && { avatar: dto.avatar }),
        ...(dto.role && { role: dto.role }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        role: true,
        avatar: true,
        institution: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  // ─── DESACTIVAR USUARIO (soft delete) ─────────────────
  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: `Usuario ${id} desactivado correctamente` };
  }

  // ─── BUSCAR POR EMAIL ─────────────────────────────────
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
  }
}
