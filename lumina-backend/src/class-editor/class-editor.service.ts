import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { nanoid } from 'nanoid';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';
import { ReorderSlidesDto } from './dto/reorder-slides.dto';
import { ChangeSlideTypeDto } from './dto/change-slide-type.dto';
import { BulkUpdateSlidesDto } from './dto/bulk-update-slides.dto';

// ── Select reutilizable para slides ─────────────────────────
const SLIDE_SELECT = {
  id: true,
  order: true,
  type: true,
  title: true,
  content: true,
  createdAt: true,
} as const;

@Injectable()
export class ClassEditorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseAuth: CourseAuthorizationService,
  ) {}

  // ══════════════════════════════════════════════════════════
  //  REORDENAR SLIDES
  // ══════════════════════════════════════════════════════════

  /**
   * Actualiza el campo `order` de los slides indicados.
   * El frontend envía el subset de slides cuyos órdenes cambiaron.
   * Valida que todos los IDs pertenecen a la clase antes de operar.
   */
  async reorderSlides(
    classId: string,
    dto: ReorderSlidesDto,
    userId: string,
    role: string,
  ) {
    const cls = await this.assertClassAndGetCourse(classId);
    await this.courseAuth.assertStaffCanManageCourse(
      cls.courseId,
      userId,
      role,
      'classEditor',
    );

    const incomingIds = dto.slides.map((s) => s.id);
    const owned = await this.prisma.slide.findMany({
      where: { classId, id: { in: incomingIds } },
      select: { id: true },
    });
    if (owned.length !== incomingIds.length) {
      throw new BadRequestException(
        'Uno o más slides no pertenecen a esta clase',
      );
    }

    await this.prisma.$transaction(
      dto.slides.map((s) =>
        this.prisma.slide.update({
          where: { id: s.id },
          data: { order: s.order },
        }),
      ),
    );

    return this.prisma.slide.findMany({
      where: { classId },
      select: { id: true, order: true, type: true, title: true },
      orderBy: { order: 'asc' },
    });
  }

  // ══════════════════════════════════════════════════════════
  //  DUPLICAR SLIDE
  // ══════════════════════════════════════════════════════════

  /**
   * Copia una slide al final de la clase con el mismo tipo y content.
   * El título lleva el sufijo " (copia)".
   */
  async duplicateSlide(
    classId: string,
    slideId: string,
    userId: string,
    role: string,
  ) {
    const cls = await this.assertClassAndGetCourse(classId);
    await this.courseAuth.assertStaffCanManageCourse(
      cls.courseId,
      userId,
      role,
      'classEditor',
    );

    const slide = await this.prisma.slide.findUnique({
      where: { id: slideId },
    });
    if (!slide || slide.classId !== classId) {
      throw new NotFoundException('Slide no encontrado en esta clase');
    }

    const lastSlide = await this.prisma.slide.findFirst({
      where: { classId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const nextOrder = (lastSlide?.order ?? 0) + 1;

    return this.prisma.slide.create({
      data: {
        type: slide.type,
        title: `${slide.title} (copia)`,
        content: slide.content as Prisma.InputJsonValue,
        order: nextOrder,
        class: { connect: { id: classId } },
      },
      select: SLIDE_SELECT,
    });
  }

  // ══════════════════════════════════════════════════════════
  //  DUPLICAR CLASE
  // ══════════════════════════════════════════════════════════

  /**
   * Crea una nueva clase (status DRAFT) con todas las slides copiadas en
   * el mismo orden. El título lleva el sufijo " (copia)".
   */
  async duplicateClass(classId: string, userId: string, role: string) {
    const cls = await this.prisma.class.findUnique({
      where: { id: classId },
      select: {
        id: true,
        title: true,
        description: true,
        courseId: true,
        slides: {
          select: {
            type: true,
            title: true,
            content: true,
            order: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!cls) throw new NotFoundException('Clase no encontrada');

    await this.courseAuth.assertStaffCanManageCourse(
      cls.courseId,
      userId,
      role,
      'classEditor',
    );

    return this.prisma.class.create({
      data: {
        title: `${cls.title} (copia)`,
        description: cls.description,
        code: nanoid(8),
        courseId: cls.courseId,
        slides: {
          create: cls.slides.map((s) => ({
            type: s.type,
            title: s.title,
            content: s.content as Prisma.InputJsonValue,
            order: s.order,
          })),
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        code: true,
        status: true,
        courseId: true,
        createdAt: true,
        _count: { select: { slides: true } },
      },
    });
  }

  // ══════════════════════════════════════════════════════════
  //  CAMBIAR TIPO DE SLIDE
  // ══════════════════════════════════════════════════════════

  /** Cambia el `type` de una slide (SlideType enum). */
  async changeSlideType(
    classId: string,
    slideId: string,
    dto: ChangeSlideTypeDto,
    userId: string,
    role: string,
  ) {
    const cls = await this.assertClassAndGetCourse(classId);
    await this.courseAuth.assertStaffCanManageCourse(
      cls.courseId,
      userId,
      role,
      'classEditor',
    );

    const slide = await this.prisma.slide.findUnique({
      where: { id: slideId },
    });
    if (!slide || slide.classId !== classId) {
      throw new NotFoundException('Slide no encontrado en esta clase');
    }

    return this.prisma.slide.update({
      where: { id: slideId },
      data: { type: dto.type },
      select: SLIDE_SELECT,
    });
  }

  // ══════════════════════════════════════════════════════════
  //  BULK UPDATE DE SLIDES
  // ══════════════════════════════════════════════════════════

  /**
   * Actualiza `title` y/o `content` de múltiples slides en una sola llamada.
   * Todas las operaciones se ejecutan en una transacción.
   */
  async bulkUpdateSlides(
    classId: string,
    dto: BulkUpdateSlidesDto,
    userId: string,
    role: string,
  ) {
    const cls = await this.assertClassAndGetCourse(classId);
    await this.courseAuth.assertStaffCanManageCourse(
      cls.courseId,
      userId,
      role,
      'classEditor',
    );

    const incomingIds = dto.slides.map((s) => s.id);
    const owned = await this.prisma.slide.findMany({
      where: { classId, id: { in: incomingIds } },
      select: { id: true },
    });
    if (owned.length !== incomingIds.length) {
      throw new BadRequestException(
        'Uno o más slides no pertenecen a esta clase',
      );
    }

    const updated = await this.prisma.$transaction(
      dto.slides.map((s) =>
        this.prisma.slide.update({
          where: { id: s.id },
          data: {
            ...(s.title !== undefined && { title: s.title }),
            ...(s.content !== undefined && {
              content: s.content as Prisma.InputJsonValue,
            }),
          },
          select: SLIDE_SELECT,
        }),
      ),
    );

    return {
      data: updated,
      meta: { updated: updated.length },
    };
  }

  // ══════════════════════════════════════════════════════════
  //  PREVIEW DE CLASE
  // ══════════════════════════════════════════════════════════

  /**
   * Devuelve la clase completa con todas sus slides ordenadas.
   * Solo lectura — accesible para todos los matriculados en el curso.
   */
  async previewClass(classId: string, userId: string, role: string) {
    const cls = await this.prisma.class.findUnique({
      where: { id: classId },
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
          select: SLIDE_SELECT,
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!cls) throw new NotFoundException('Clase no encontrada');

    await this.courseAuth.verifyCourseReadAccess(cls.courseId, userId, role);

    return cls;
  }

  // ══════════════════════════════════════════════════════════
  //  HELPERS PRIVADOS
  // ══════════════════════════════════════════════════════════

  private async assertClassAndGetCourse(classId: string) {
    const cls = await this.prisma.class.findUnique({
      where: { id: classId },
      select: { id: true, courseId: true },
    });
    if (!cls) throw new NotFoundException('Clase no encontrada');
    return cls;
  }
}
