import {
    Injectable,
    NotFoundException,
    ForbiddenException,
  } from '@nestjs/common';
  import { PrismaService } from '../prisma/prisma.service';
  import { CourseAuthorizationService } from '../common/course-authorization.service';
  import { CreateClassDto } from './dto/create-class.dto';
  import { UpdateClassDto } from './dto/update-class.dto';
  import { CreateSlideDto } from './dto/create-slide.dto';
  import { UpdateSlideDto } from './dto/update-slide.dto';
  import { nanoid } from 'nanoid';
  
  @Injectable()
  export class ClassesService {
    constructor(
      private readonly prisma: PrismaService,
      private readonly courseAuth: CourseAuthorizationService,
    ) {}
  
    // ─── CLASES ────────────────────────────────────────────
  
    async create(dto: CreateClassDto, userId: string) {
      // Verificar que el curso existe y pertenece al teacher
      const course = await this.prisma.course.findUnique({
        where: { id: dto.courseId },
        select: { id: true, teacherId: true },
      });
      if (!course) throw new NotFoundException('Curso no encontrado');
      if (course.teacherId !== userId) {
        throw new ForbiddenException('No tienes permiso para crear clases en este curso');
      }
  
      return this.prisma.class.create({
        data: {
          title: dto.title,
          description: dto.description,
          code: nanoid(8),
          courseId: dto.courseId,
        },
        select: {
          id: true,
          title: true,
          description: true,
          code: true,
          status: true,
          courseId: true,
          createdAt: true,
        },
      });
    }
  
    async findAllByCourse(courseId: string, userId: string, userRole: string) {
      // Verificar acceso al curso
      await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);
  
      return this.prisma.class.findMany({
        where: {
          courseId,
          status: { not: 'ARCHIVED' },
        },
        select: {
          id: true,
          title: true,
          description: true,
          code: true,
          status: true,
          createdAt: true,
          _count: { select: { slides: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }
  
    async findOne(id: string, userId: string, userRole: string) {
      const cls = await this.prisma.class.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          description: true,
          code: true,
          status: true,
          courseId: true,
          createdAt: true,
          updatedAt: true,
          slides: {
            select: {
              id: true,
              order: true,
              type: true,
              title: true,
              content: true,
              createdAt: true,
            },
            orderBy: { order: 'asc' },
          },
        },
      });
      if (!cls) throw new NotFoundException('Clase no encontrada');
      await this.courseAuth.verifyCourseReadAccess(
        cls.courseId,
        userId,
        userRole,
      );
      return cls;
    }
  
    async update(id: string, dto: UpdateClassDto, userId: string) {
      const cls = await this.findOneRaw(id);
      await this.verifyTeacherOwnership(cls.courseId, userId);
  
      return this.prisma.class.update({
        where: { id },
        data: dto,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          updatedAt: true,
        },
      });
    }
  
    async publish(id: string, userId: string) {
      const cls = await this.findOneRaw(id);
      await this.verifyTeacherOwnership(cls.courseId, userId);
  
      return this.prisma.class.update({
        where: { id },
        data: { status: 'PUBLISHED' },
        select: { id: true, status: true },
      });
    }
  
    async remove(id: string, userId: string) {
      const cls = await this.findOneRaw(id);
      await this.verifyTeacherOwnership(cls.courseId, userId);
  
      return this.prisma.class.update({
        where: { id },
        data: { status: 'ARCHIVED' },
        select: { id: true, status: true },
      });
    }
  
    // ─── SLIDES ────────────────────────────────────────────
  
    async addSlide(classId: string, dto: CreateSlideDto, userId: string) {
      const cls = await this.findOneRaw(classId);
      await this.verifyTeacherOwnership(cls.courseId, userId);
  
      // Calcular el siguiente order
      const lastSlide = await this.prisma.slide.findFirst({
        where: { classId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      const nextOrder = (lastSlide?.order ?? 0) + 1;
  
      return this.prisma.slide.create({
        data: {
          type: dto.type,
          title: dto.title,
          content: dto.content as any,
          order: nextOrder,
          class: { connect: { id: classId } },
        },
        select: {
          id: true,
          order: true,
          type: true,
          title: true,
          content: true,
          createdAt: true,
        },
      });
    }
  
    async updateSlide(classId: string, slideId: string, dto: UpdateSlideDto, userId: string) {
      const cls = await this.findOneRaw(classId);
      await this.verifyTeacherOwnership(cls.courseId, userId);
  
      const slide = await this.prisma.slide.findUnique({ where: { id: slideId } });
      if (!slide || slide.classId !== classId) {
        throw new NotFoundException('Slide no encontrado');
      }
  
      return this.prisma.slide.update({
        where: { id: slideId },
        data: {
          type: dto.type,
          title: dto.title,
          content: dto.content as any,
        },
      });
    }
  
    async removeSlide(classId: string, slideId: string, userId: string) {
      const cls = await this.findOneRaw(classId);
      await this.verifyTeacherOwnership(cls.courseId, userId);
  
      const slide = await this.prisma.slide.findUnique({ where: { id: slideId } });
      if (!slide || slide.classId !== classId) {
        throw new NotFoundException('Slide no encontrado');
      }
  
      // Eliminar el slide (cascade en DB lo maneja)
      await this.prisma.slide.delete({ where: { id: slideId } });
  
      // Reordenar los slides restantes
      const remaining = await this.prisma.slide.findMany({
        where: { classId },
        orderBy: { order: 'asc' },
        select: { id: true },
      });
      await Promise.all(
        remaining.map((s, index) =>
          this.prisma.slide.update({
            where: { id: s.id },
            data: { order: index + 1 },
          }),
        ),
      );
  
      return { message: 'Slide eliminado correctamente' };
    }
  
    // ─── HELPERS PRIVADOS ──────────────────────────────────
  
    private async findOneRaw(id: string) {
      const cls = await this.prisma.class.findUnique({
        where: { id },
        select: { id: true, courseId: true, status: true },
      });
      if (!cls) throw new NotFoundException('Clase no encontrada');
      return cls;
    }
  
    private async verifyTeacherOwnership(courseId: string, userId: string) {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        select: { teacherId: true },
      });
      if (!course || course.teacherId !== userId) {
        throw new ForbiddenException('No tienes permiso para modificar esta clase');
      }
    }
  
  }
