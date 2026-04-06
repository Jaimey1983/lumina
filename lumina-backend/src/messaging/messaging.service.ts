import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';
import { SendMessageDto } from './dto/send-message.dto';
import { SendDirectMessageDto } from './dto/send-direct-message.dto';

const MESSAGE_SELECT = {
  id: true,
  content: true,
  isDeleted: true,
  courseId: true,
  senderId: true,
  recipientId: true,
  parentId: true,
  createdAt: true,
  updatedAt: true,
  sender: { select: { id: true, name: true, lastName: true, avatar: true } },
  reads: { select: { userId: true, readAt: true } },
  _count: { select: { replies: true } },
};

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseAuth: CourseAuthorizationService,
  ) {}

  // ── Mensajes de curso ──────────────────────────────────────

  async sendMessage(
    courseId: string,
    userId: string,
    userRole: string,
    dto: SendMessageDto,
  ) {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);

    if (dto.parentId) {
      const parent = await this.prisma.message.findUnique({
        where: { id: dto.parentId },
        select: { courseId: true, recipientId: true },
      });
      if (!parent || parent.courseId !== courseId) {
        throw new NotFoundException(
          'Mensaje padre no encontrado en este curso',
        );
      }
    }

    return this.prisma.message.create({
      data: {
        content: dto.content,
        courseId,
        senderId: userId,
        parentId: dto.parentId ?? null,
      },
      select: MESSAGE_SELECT,
    });
  }

  async listMessages(
    courseId: string,
    userId: string,
    userRole: string,
    page: number,
    limit: number,
  ) {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);

    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.message.findMany({
        where: { courseId, recipientId: null, parentId: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: MESSAGE_SELECT,
      }),
      this.prisma.message.count({
        where: { courseId, recipientId: null, parentId: null },
      }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getMessage(
    courseId: string,
    messageId: string,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);

    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: {
        ...MESSAGE_SELECT,
        replies: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'asc' },
          select: MESSAGE_SELECT,
        },
      },
    });

    if (!message || message.courseId !== courseId) {
      throw new NotFoundException('Mensaje no encontrado');
    }

    return message;
  }

  async markAsRead(
    courseId: string,
    messageId: string,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);

    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { courseId: true, senderId: true },
    });

    if (!message || message.courseId !== courseId) {
      throw new NotFoundException('Mensaje no encontrado');
    }

    if (message.senderId === userId) {
      throw new ForbiddenException(
        'No puedes marcar tu propio mensaje como leído',
      );
    }

    return this.prisma.messageRead.upsert({
      where: { messageId_userId: { messageId, userId } },
      create: { messageId, userId },
      update: { readAt: new Date() },
    });
  }

  async deleteMessage(
    courseId: string,
    messageId: string,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);

    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { courseId: true, senderId: true },
    });

    if (!message || message.courseId !== courseId) {
      throw new NotFoundException('Mensaje no encontrado');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('Solo puedes eliminar tus propios mensajes');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true, content: '' },
      select: { id: true, isDeleted: true },
    });
  }

  // ── Mensajes directos ─────────────────────────────────────

  async sendDirectMessage(
    courseId: string,
    userId: string,
    userRole: string,
    dto: SendDirectMessageDto,
  ) {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);

    // Verificar que el destinatario es miembro del curso
    const recipientAccess = await this.prisma.enrollment
      .findUnique({
        where: {
          userId_courseId: { userId: dto.recipientId, courseId },
        },
        select: { userId: true },
      })
      .then(async (enrollment) => {
        if (enrollment) return true;
        // También puede ser el docente
        const course = await this.prisma.course.findUnique({
          where: { id: courseId },
          select: { teacherId: true },
        });
        return course?.teacherId === dto.recipientId;
      });

    if (!recipientAccess) {
      throw new ForbiddenException(
        'El destinatario no es miembro de este curso',
      );
    }

    if (dto.parentId) {
      const parent = await this.prisma.message.findUnique({
        where: { id: dto.parentId },
        select: { courseId: true },
      });
      if (!parent || parent.courseId !== courseId) {
        throw new NotFoundException(
          'Mensaje padre no encontrado en este curso',
        );
      }
    }

    return this.prisma.message.create({
      data: {
        content: dto.content,
        courseId,
        senderId: userId,
        recipientId: dto.recipientId,
        parentId: dto.parentId ?? null,
      },
      select: MESSAGE_SELECT,
    });
  }

  async listDirectMessages(
    courseId: string,
    otherUserId: string,
    userId: string,
    userRole: string,
    page: number,
    limit: number,
  ) {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);

    const skip = (page - 1) * limit;

    const where = {
      courseId,
      OR: [
        { senderId: userId, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: userId },
      ],
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.message.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: MESSAGE_SELECT,
      }),
      this.prisma.message.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
