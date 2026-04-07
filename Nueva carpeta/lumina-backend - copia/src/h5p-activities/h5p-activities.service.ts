import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';
import { CreateH5pActivityDto } from './dto/create-h5p-activity.dto';
import { UpdateH5pActivityDto } from './dto/update-h5p-activity.dto';

@Injectable()
export class H5pActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseAuth: CourseAuthorizationService,
  ) {}

  async create(
    courseId: string,
    classId: string,
    dto: CreateH5pActivityDto,
    userId: string,
    role: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      userId,
      role,
      'h5pActivities',
    );
    await this.assertClassBelongsToCourse(classId, courseId);

    const lastSlide = await this.prisma.slide.findFirst({
      where: { classId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const nextOrder = (lastSlide?.order ?? 0) + 1;

    const content = { h5pType: dto.h5pType, params: dto.params };

    return this.prisma.slide.create({
      data: {
        type: 'ACTIVITY',
        title: dto.title,
        content: content as Prisma.InputJsonValue,
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

  async findAll(
    courseId: string,
    classId: string,
    userId: string,
    role: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, role);
    await this.assertClassBelongsToCourse(classId, courseId);

    return this.prisma.slide.findMany({
      where: { classId, type: 'ACTIVITY' },
      select: {
        id: true,
        order: true,
        type: true,
        title: true,
        content: true,
        createdAt: true,
      },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(
    courseId: string,
    classId: string,
    slideId: string,
    userId: string,
    role: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, role);
    await this.assertClassBelongsToCourse(classId, courseId);

    const slide = await this.prisma.slide.findUnique({
      where: { id: slideId },
      select: {
        id: true,
        order: true,
        type: true,
        title: true,
        content: true,
        classId: true,
        createdAt: true,
      },
    });

    if (!slide || slide.classId !== classId || slide.type !== 'ACTIVITY') {
      throw new NotFoundException('Actividad H5P no encontrada');
    }

    return {
      id: slide.id,
      order: slide.order,
      type: slide.type,
      title: slide.title,
      content: slide.content,
      createdAt: slide.createdAt,
    };
  }

  async update(
    courseId: string,
    classId: string,
    slideId: string,
    dto: UpdateH5pActivityDto,
    userId: string,
    role: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      userId,
      role,
      'h5pActivities',
    );
    await this.assertClassBelongsToCourse(classId, courseId);

    const slide = await this.prisma.slide.findUnique({
      where: { id: slideId },
      select: { id: true, classId: true, type: true, content: true },
    });

    if (!slide || slide.classId !== classId || slide.type !== 'ACTIVITY') {
      throw new NotFoundException('Actividad H5P no encontrada');
    }

    const existing = (slide.content as Record<string, unknown>) ?? {};
    const updatedContent = {
      h5pType: dto.h5pType ?? existing['h5pType'],
      params: dto.params ?? existing['params'],
    };

    return this.prisma.slide.update({
      where: { id: slideId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        content: updatedContent as Prisma.InputJsonValue,
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

  async remove(
    courseId: string,
    classId: string,
    slideId: string,
    userId: string,
    role: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      userId,
      role,
      'h5pActivities',
    );
    await this.assertClassBelongsToCourse(classId, courseId);

    const slide = await this.prisma.slide.findUnique({
      where: { id: slideId },
      select: { id: true, classId: true, type: true },
    });

    if (!slide || slide.classId !== classId || slide.type !== 'ACTIVITY') {
      throw new NotFoundException('Actividad H5P no encontrada');
    }

    await this.prisma.slide.delete({ where: { id: slideId } });

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

    return { message: 'Actividad H5P eliminada correctamente' };
  }

  private async assertClassBelongsToCourse(
    classId: string,
    courseId: string,
  ): Promise<void> {
    const cls = await this.prisma.class.findUnique({
      where: { id: classId },
      select: { id: true, courseId: true },
    });
    if (!cls || cls.courseId !== courseId) {
      throw new NotFoundException('Clase no encontrada en este curso');
    }
  }
}
