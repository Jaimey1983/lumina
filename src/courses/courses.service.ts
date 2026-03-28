import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { EnrollStudentDto } from './dto/enroll-student.dto';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCourseDto, teacherId: string) {
    const existing = await this.prisma.course.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`El código de curso ${dto.code} ya existe`);
    }
    return this.prisma.course.create({
      data: {
        name: dto.name,
        description: dto.description,
        code: dto.code,
        teacherId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        code: true,
        isActive: true,
        teacherId: true,
        createdAt: true,
      },
    });
  }

  async findAll(page = 1, limit = 20, userId: string, role: string) {
    const skip = (page - 1) * limit;
    const where =
      role === 'ADMIN' || role === 'SUPERADMIN'
        ? {}
        : role === 'TEACHER'
          ? { teacherId: userId }
          : { enrollments: { some: { userId } } };

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        skip,
        take: limit,
        where,
        select: {
          id: true,
          name: true,
          description: true,
          code: true,
          isActive: true,
          createdAt: true,
          teacher: { select: { id: true, name: true, lastName: true } },
          _count: { select: { enrollments: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.course.count({ where }),
    ]);
    return {
      data: courses,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        code: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        teacher: {
          select: { id: true, name: true, lastName: true, email: true },
        },
        _count: { select: { enrollments: true, classes: true } },
      },
    });
    if (!course)
      throw new NotFoundException(`Curso con ID ${id} no encontrado`);
    return course;
  }

  async update(id: string, dto: UpdateCourseDto, userId: string, role: string) {
    const course = await this.findOne(id);
    if (
      role !== 'ADMIN' &&
      role !== 'SUPERADMIN' &&
      course.teacher.id !== userId
    ) {
      throw new ForbiddenException(
        'No tienes permisos para modificar este curso',
      );
    }
    return this.prisma.course.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        code: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string, userId: string, role: string) {
    const course = await this.findOne(id);
    if (
      role !== 'ADMIN' &&
      role !== 'SUPERADMIN' &&
      course.teacher.id !== userId
    ) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar este curso',
      );
    }
    await this.prisma.course.update({
      where: { id },
      data: { isActive: false },
    });
    return { message: `Curso ${course.name} desactivado correctamente` };
  }

  async enrollStudent(courseId: string, dto: EnrollStudentDto) {
    await this.findOne(courseId);
    const existing = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: dto.userId, courseId } },
    });
    if (existing)
      throw new ConflictException(
        'El estudiante ya está matriculado en este curso',
      );
    return this.prisma.enrollment.create({
      data: { userId: dto.userId, courseId },
      select: { id: true, userId: true, courseId: true, createdAt: true },
    });
  }

  async findStudents(courseId: string, page = 1, limit = 20) {
    await this.findOne(courseId);
    const skip = (page - 1) * limit;
    const [enrollments, total] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { courseId },
        skip,
        take: limit,
        select: {
          id: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.enrollment.count({ where: { courseId } }),
    ]);
    return {
      data: enrollments,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
