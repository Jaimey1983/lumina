import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { nanoid } from 'nanoid';

/** Clave estable de la única plantilla vigente (X.2). Ver `seed-help-guide.ts`. */
export const WELCOME_TEACHER_TEMPLATE_KEY = 'welcome-teacher';

@Injectable()
export class HelpGuideService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lectura de la guía — SIN chequeo de propiedad, a propósito (X.2). La
   * clase es de sistema, sin curso, propiedad de un SUPERADMIN; el flujo
   * estándar (`ClassesService.findOne`) la rechazaría para cualquier otro
   * docente. Acotado por `@Roles('TEACHER', ...)` en el controller.
   */
  async getGuide(userId: string) {
    const cls = await this.prisma.class.findUnique({
      where: { templateKey: WELCOME_TEACHER_TEMPLATE_KEY },
      select: {
        id: true,
        title: true,
        description: true,
        background: true,
        templateVersion: true,
        slides: {
          select: {
            id: true,
            order: true,
            type: true,
            title: true,
            content: true,
            contentVersion: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!cls) {
      throw new NotFoundException(
        'La guía de Lumina todavía no está disponible.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { welcomeGuideDismissedAt: true },
    });

    return {
      ...cls,
      dismissedAt: user?.welcomeGuideDismissedAt ?? null,
    };
  }

  /**
   * Clona la plantilla al espacio del docente como una presentación personal
   * normal (`isSystemTemplate: false`, sin `templateKey`) — mismo patrón que
   * `ClassesService.create` usa para presentaciones sin curso. No existía
   * ninguna lógica de duplicado reutilizable (verificado antes de escribir
   * esto) — es clonado nuevo: IDs de clase/slide regenerados,
   * `contentVersion` reseteado a 0.
   */
  async duplicateToPersonalSpace(userId: string) {
    const template = await this.prisma.class.findUnique({
      where: { templateKey: WELCOME_TEACHER_TEMPLATE_KEY },
      select: {
        title: true,
        background: true,
        slides: {
          select: { order: true, type: true, title: true, content: true },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!template) {
      throw new NotFoundException(
        'La guía de Lumina todavía no está disponible.',
      );
    }

    const codigo = await this.generarCodigoUnico();

    return this.prisma.class.create({
      data: {
        title: `${template.title} (mi copia)`,
        code: nanoid(8),
        codigo: codigo.toUpperCase(),
        courseId: null,
        authorId: userId,
        modoEntrega: 'presentacion',
        status: 'PUBLISHED',
        background: template.background,
        isSystemTemplate: false,
        slides: {
          create: template.slides.map((s) => ({
            order: s.order,
            type: s.type,
            title: s.title,
            content: s.content as Prisma.InputJsonValue,
            contentVersion: 0,
          })),
        },
      },
      select: { id: true, title: true },
    });
  }

  async dismiss(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { welcomeGuideDismissedAt: new Date() },
    });
    return { dismissed: true };
  }

  /** Mismo patrón que `ClassesService.generarCodigoUnico` (código legible LUM-XXXXXX). */
  private async generarCodigoUnico(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo: string;
    let existe: boolean;
    do {
      codigo =
        'LUM-' +
        Array.from(
          { length: 6 },
          () => chars[Math.floor(Math.random() * chars.length)],
        )
          .join('')
          .toUpperCase();
      existe = !!(await this.prisma.class.findFirst({
        where: { codigo: { equals: codigo, mode: 'insensitive' } },
      }));
    } while (existe);
    return codigo;
  }
}
