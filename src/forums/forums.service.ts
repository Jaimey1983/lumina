import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';
import { CreateForumDto } from './dto/create-forum.dto';
import { UpdateForumDto } from './dto/update-forum.dto';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { UpdateReplyDto } from './dto/update-reply.dto';

// ─── Helpers ──────────────────────────────────────────────

function isStaff(role: string) {
  return [
    'ADMIN',
    'SUPERADMIN',
    'TEACHER',
    'TEACHER_ASSISTANT',
    'DEPARTMENT_HEAD',
  ].includes(role);
}

// ─── Service ──────────────────────────────────────────────

@Injectable()
export class ForumsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseAuth: CourseAuthorizationService,
  ) {}

  // ────────────────────────────────────────────────────────
  // FOROS (categorías)
  // ────────────────────────────────────────────────────────

  async createForum(
    courseId: string,
    dto: CreateForumDto,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      userId,
      userRole,
      'grades',
    );

    return this.prisma.forum.create({
      data: { name: dto.name, description: dto.description, courseId },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        courseId: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { threads: true } },
      },
    });
  }

  async listForums(courseId: string, userId: string, userRole: string) {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);

    return this.prisma.forum.findMany({
      where: { courseId, isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        courseId: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { threads: { where: { isActive: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getForum(
    courseId: string,
    forumId: string,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);

    const forum = await this.prisma.forum.findFirst({
      where: { id: forumId, courseId, isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        courseId: true,
        createdAt: true,
        updatedAt: true,
        threads: {
          where: { isActive: true },
          select: {
            id: true,
            title: true,
            isPinned: true,
            isLocked: true,
            authorId: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { replies: { where: { isActive: true } } } },
          },
          orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        },
      },
    });

    if (!forum) throw new NotFoundException('Foro no encontrado');
    return forum;
  }

  async updateForum(
    courseId: string,
    forumId: string,
    dto: UpdateForumDto,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      userId,
      userRole,
      'grades',
    );

    const forum = await this.prisma.forum.findFirst({
      where: { id: forumId, courseId, isActive: true },
      select: { id: true },
    });
    if (!forum) throw new NotFoundException('Foro no encontrado');

    return this.prisma.forum.update({
      where: { id: forumId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
      },
      select: {
        id: true,
        name: true,
        description: true,
        courseId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deleteForum(
    courseId: string,
    forumId: string,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      userId,
      userRole,
      'grades',
    );

    const forum = await this.prisma.forum.findFirst({
      where: { id: forumId, courseId, isActive: true },
      select: { id: true },
    });
    if (!forum) throw new NotFoundException('Foro no encontrado');

    await this.prisma.forum.update({
      where: { id: forumId },
      data: { isActive: false },
    });
    return { message: 'Foro eliminado' };
  }

  // ────────────────────────────────────────────────────────
  // HILOS (threads)
  // ────────────────────────────────────────────────────────

  private async assertForumBelongsToCourse(forumId: string, courseId: string) {
    const forum = await this.prisma.forum.findFirst({
      where: { id: forumId, courseId, isActive: true },
      select: { id: true },
    });
    if (!forum) throw new NotFoundException('Foro no encontrado en este curso');
    return forum;
  }

  async createThread(
    courseId: string,
    forumId: string,
    dto: CreateThreadDto,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);
    const forum = await this.assertForumBelongsToCourse(forumId, courseId);

    // Verificar que el foro no está cerrado (solo staff puede publicar en foro cerrado)
    const forumData = await this.prisma.forum.findUnique({
      where: { id: forum.id },
      select: { id: true },
    });
    if (!forumData) throw new NotFoundException('Foro no encontrado');

    return this.prisma.forumThread.create({
      data: { title: dto.title, body: dto.body, forumId, authorId: userId },
      select: {
        id: true,
        title: true,
        body: true,
        isPinned: true,
        isLocked: true,
        authorId: true,
        forumId: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { replies: true } },
      },
    });
  }

  async getThread(
    courseId: string,
    forumId: string,
    threadId: string,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);
    await this.assertForumBelongsToCourse(forumId, courseId);

    const thread = await this.prisma.forumThread.findFirst({
      where: { id: threadId, forumId, isActive: true },
      select: {
        id: true,
        title: true,
        body: true,
        isPinned: true,
        isLocked: true,
        authorId: true,
        forumId: true,
        createdAt: true,
        updatedAt: true,
        replies: {
          where: { isActive: true },
          select: {
            id: true,
            body: true,
            authorId: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!thread) throw new NotFoundException('Hilo no encontrado');
    return thread;
  }

  async pinThread(
    courseId: string,
    forumId: string,
    threadId: string,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      userId,
      userRole,
      'grades',
    );
    await this.assertForumBelongsToCourse(forumId, courseId);

    const thread = await this.prisma.forumThread.findFirst({
      where: { id: threadId, forumId, isActive: true },
      select: { id: true, isPinned: true },
    });
    if (!thread) throw new NotFoundException('Hilo no encontrado');

    return this.prisma.forumThread.update({
      where: { id: threadId },
      data: { isPinned: !thread.isPinned },
      select: { id: true, title: true, isPinned: true, isLocked: true },
    });
  }

  async lockThread(
    courseId: string,
    forumId: string,
    threadId: string,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      userId,
      userRole,
      'grades',
    );
    await this.assertForumBelongsToCourse(forumId, courseId);

    const thread = await this.prisma.forumThread.findFirst({
      where: { id: threadId, forumId, isActive: true },
      select: { id: true, isLocked: true },
    });
    if (!thread) throw new NotFoundException('Hilo no encontrado');

    return this.prisma.forumThread.update({
      where: { id: threadId },
      data: { isLocked: !thread.isLocked },
      select: { id: true, title: true, isPinned: true, isLocked: true },
    });
  }

  async deleteThread(
    courseId: string,
    forumId: string,
    threadId: string,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);
    await this.assertForumBelongsToCourse(forumId, courseId);

    const thread = await this.prisma.forumThread.findFirst({
      where: { id: threadId, forumId, isActive: true },
      select: { id: true, authorId: true },
    });
    if (!thread) throw new NotFoundException('Hilo no encontrado');

    // Solo el autor o staff pueden eliminar
    if (thread.authorId !== userId && !isStaff(userRole)) {
      throw new ForbiddenException(
        'Solo el autor o un docente puede eliminar este hilo',
      );
    }

    await this.prisma.forumThread.update({
      where: { id: threadId },
      data: { isActive: false },
    });
    return { message: 'Hilo eliminado' };
  }

  // ────────────────────────────────────────────────────────
  // RESPUESTAS (replies)
  // ────────────────────────────────────────────────────────

  async createReply(
    courseId: string,
    forumId: string,
    threadId: string,
    dto: CreateReplyDto,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);
    await this.assertForumBelongsToCourse(forumId, courseId);

    const thread = await this.prisma.forumThread.findFirst({
      where: { id: threadId, forumId, isActive: true },
      select: { id: true, isLocked: true },
    });
    if (!thread) throw new NotFoundException('Hilo no encontrado');

    if (thread.isLocked && !isStaff(userRole)) {
      throw new ForbiddenException(
        'Este hilo está cerrado — solo el personal docente puede responder',
      );
    }

    return this.prisma.forumReply.create({
      data: { body: dto.body, threadId, authorId: userId },
      select: {
        id: true,
        body: true,
        authorId: true,
        threadId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateReply(
    courseId: string,
    forumId: string,
    threadId: string,
    replyId: string,
    dto: UpdateReplyDto,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);
    await this.assertForumBelongsToCourse(forumId, courseId);

    const reply = await this.prisma.forumReply.findFirst({
      where: { id: replyId, threadId, isActive: true },
      select: { id: true, authorId: true },
    });
    if (!reply) throw new NotFoundException('Respuesta no encontrada');

    // Solo el autor puede editar su respuesta
    if (reply.authorId !== userId) {
      throw new ForbiddenException('Solo el autor puede editar esta respuesta');
    }

    return this.prisma.forumReply.update({
      where: { id: replyId },
      data: { body: dto.body },
      select: {
        id: true,
        body: true,
        authorId: true,
        threadId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deleteReply(
    courseId: string,
    forumId: string,
    threadId: string,
    replyId: string,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);
    await this.assertForumBelongsToCourse(forumId, courseId);

    const reply = await this.prisma.forumReply.findFirst({
      where: { id: replyId, threadId, isActive: true },
      select: { id: true, authorId: true },
    });
    if (!reply) throw new NotFoundException('Respuesta no encontrada');

    // Solo el autor o staff pueden eliminar
    if (reply.authorId !== userId && !isStaff(userRole)) {
      throw new ForbiddenException(
        'Solo el autor o un docente puede eliminar esta respuesta',
      );
    }

    await this.prisma.forumReply.update({
      where: { id: replyId },
      data: { isActive: false },
    });
    return { message: 'Respuesta eliminada' };
  }
}
