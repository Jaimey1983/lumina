import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';
import { CreateWhiteboardDto } from './dto/create-whiteboard.dto';
import { UpdateWhiteboardDto } from './dto/update-whiteboard.dto';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { AssignActivityDto } from './dto/assign-activity.dto';

// ─── Helpers de autorización ──────────────────────────────

const STAFF_ROLES = ['ADMIN', 'SUPERADMIN', 'TEACHER', 'TEACHER_ASSISTANT', 'DEPARTMENT_HEAD'];

function isStaff(role: string) {
  return STAFF_ROLES.includes(role);
}

// ─── Service ──────────────────────────────────────────────

@Injectable()
export class CollaborationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseAuth: CourseAuthorizationService,
  ) {}

  // ────────────────────────────────────────────────────────
  // PIZARRA COLABORATIVA
  // ────────────────────────────────────────────────────────

  /** Verifica que la clase pertenece al curso y retorna la clase. */
  private async assertClassBelongsToCourse(classId: string, courseId: string) {
    const cls = await this.prisma.class.findFirst({
      where: { id: classId, courseId },
      select: { id: true },
    });
    if (!cls) throw new NotFoundException('Clase no encontrada en este curso');
    return cls;
  }

  async createWhiteboard(
    courseId: string,
    classId: string,
    dto: CreateWhiteboardDto,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.assertStaffCanManageCourse(courseId, userId, userRole, 'classEditor');
    await this.assertClassBelongsToCourse(classId, courseId);

    return this.prisma.whiteboardSession.create({
      data: {
        name: dto.name,
        content: dto.content ?? {},
        classId,
        createdById: userId,
      },
      select: {
        id: true,
        name: true,
        content: true,
        isActive: true,
        classId: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async listWhiteboards(
    courseId: string,
    classId: string,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);
    await this.assertClassBelongsToCourse(classId, courseId);

    return this.prisma.whiteboardSession.findMany({
      where: { classId, isActive: true },
      select: {
        id: true,
        name: true,
        isActive: true,
        classId: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWhiteboard(
    courseId: string,
    classId: string,
    sessionId: string,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);
    await this.assertClassBelongsToCourse(classId, courseId);

    const session = await this.prisma.whiteboardSession.findFirst({
      where: { id: sessionId, classId, isActive: true },
    });
    if (!session) throw new NotFoundException('Sesión de pizarra no encontrada');
    return session;
  }

  async updateWhiteboard(
    courseId: string,
    classId: string,
    sessionId: string,
    dto: UpdateWhiteboardDto,
    userId: string,
    userRole: string,
  ) {
    // Cualquier miembro del curso puede actualizar el contenido de la pizarra
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);
    await this.assertClassBelongsToCourse(classId, courseId);

    const session = await this.prisma.whiteboardSession.findFirst({
      where: { id: sessionId, classId, isActive: true },
      select: { id: true },
    });
    if (!session) throw new NotFoundException('Sesión de pizarra no encontrada');

    return this.prisma.whiteboardSession.update({
      where: { id: sessionId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.content !== undefined ? { content: dto.content } : {}),
      },
      select: {
        id: true,
        name: true,
        content: true,
        isActive: true,
        classId: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deleteWhiteboard(
    courseId: string,
    classId: string,
    sessionId: string,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.assertStaffCanManageCourse(courseId, userId, userRole, 'classEditor');
    await this.assertClassBelongsToCourse(classId, courseId);

    const session = await this.prisma.whiteboardSession.findFirst({
      where: { id: sessionId, classId, isActive: true },
      select: { id: true },
    });
    if (!session) throw new NotFoundException('Sesión de pizarra no encontrada');

    await this.prisma.whiteboardSession.update({
      where: { id: sessionId },
      data: { isActive: false },
    });
    return { message: 'Sesión de pizarra eliminada' };
  }

  // ────────────────────────────────────────────────────────
  // NOTAS COLABORATIVAS
  // ────────────────────────────────────────────────────────

  async createNote(
    courseId: string,
    classId: string,
    dto: CreateNoteDto,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.assertStaffCanManageCourse(courseId, userId, userRole, 'classEditor');
    await this.assertClassBelongsToCourse(classId, courseId);

    return this.prisma.collabNote.create({
      data: {
        title: dto.title,
        content: dto.content ?? {},
        classId,
        createdById: userId,
      },
      select: {
        id: true,
        title: true,
        content: true,
        isActive: true,
        classId: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async listNotes(
    courseId: string,
    classId: string,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);
    await this.assertClassBelongsToCourse(classId, courseId);

    return this.prisma.collabNote.findMany({
      where: { classId, isActive: true },
      select: {
        id: true,
        title: true,
        isActive: true,
        classId: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getNote(
    courseId: string,
    classId: string,
    noteId: string,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);
    await this.assertClassBelongsToCourse(classId, courseId);

    const note = await this.prisma.collabNote.findFirst({
      where: { id: noteId, classId, isActive: true },
    });
    if (!note) throw new NotFoundException('Nota colaborativa no encontrada');
    return note;
  }

  async updateNote(
    courseId: string,
    classId: string,
    noteId: string,
    dto: UpdateNoteDto,
    userId: string,
    userRole: string,
  ) {
    // Cualquier miembro del curso puede editar el contenido de una nota colaborativa
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);
    await this.assertClassBelongsToCourse(classId, courseId);

    const note = await this.prisma.collabNote.findFirst({
      where: { id: noteId, classId, isActive: true },
      select: { id: true, content: true },
    });
    if (!note) throw new NotFoundException('Nota colaborativa no encontrada');

    // Guardar versión del contenido actual antes de actualizar (si hay contenido nuevo)
    if (dto.content !== undefined && note.content) {
      await this.prisma.noteVersion.create({
        data: {
          noteId,
          content: note.content,
          authorId: userId,
        },
      });
    }

    return this.prisma.collabNote.update({
      where: { id: noteId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.content !== undefined ? { content: dto.content } : {}),
      },
      select: {
        id: true,
        title: true,
        content: true,
        isActive: true,
        classId: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deleteNote(
    courseId: string,
    classId: string,
    noteId: string,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.assertStaffCanManageCourse(courseId, userId, userRole, 'classEditor');
    await this.assertClassBelongsToCourse(classId, courseId);

    const note = await this.prisma.collabNote.findFirst({
      where: { id: noteId, classId, isActive: true },
      select: { id: true },
    });
    if (!note) throw new NotFoundException('Nota colaborativa no encontrada');

    await this.prisma.collabNote.update({
      where: { id: noteId },
      data: { isActive: false },
    });
    return { message: 'Nota colaborativa eliminada' };
  }

  async getNoteHistory(
    courseId: string,
    classId: string,
    noteId: string,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);
    await this.assertClassBelongsToCourse(classId, courseId);

    const note = await this.prisma.collabNote.findFirst({
      where: { id: noteId, classId },
      select: { id: true },
    });
    if (!note) throw new NotFoundException('Nota colaborativa no encontrada');

    return this.prisma.noteVersion.findMany({
      where: { noteId },
      select: {
        id: true,
        content: true,
        authorId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ────────────────────────────────────────────────────────
  // GRUPOS DE TRABAJO
  // ────────────────────────────────────────────────────────

  async createGroup(
    courseId: string,
    dto: CreateGroupDto,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.assertStaffCanManageCourse(courseId, userId, userRole, 'grades');

    return this.prisma.workGroup.create({
      data: {
        name: dto.name,
        description: dto.description,
        courseId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        courseId: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { members: true, activities: true } },
      },
    });
  }

  async listGroups(courseId: string, userId: string, userRole: string) {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);

    return this.prisma.workGroup.findMany({
      where: { courseId, isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        courseId: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { members: true, activities: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getGroup(courseId: string, groupId: string, userId: string, userRole: string) {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);

    const group = await this.prisma.workGroup.findFirst({
      where: { id: groupId, courseId, isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        courseId: true,
        createdAt: true,
        updatedAt: true,
        members: {
          select: {
            id: true,
            joinedAt: true,
            user: { select: { id: true, name: true, lastName: true, email: true } },
          },
        },
        activities: {
          select: {
            id: true,
            assignedAt: true,
            activity: {
              select: {
                id: true,
                name: true,
                weight: true,
                maxScore: true,
                performanceIndicator: {
                  select: {
                    competenceType: true,
                    achievement: { select: { code: true, aspect: { select: { name: true } } } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!group) throw new NotFoundException('Grupo de trabajo no encontrado');
    return group;
  }

  async deleteGroup(courseId: string, groupId: string, userId: string, userRole: string) {
    await this.courseAuth.assertStaffCanManageCourse(courseId, userId, userRole, 'grades');

    const group = await this.prisma.workGroup.findFirst({
      where: { id: groupId, courseId, isActive: true },
      select: { id: true },
    });
    if (!group) throw new NotFoundException('Grupo de trabajo no encontrado');

    await this.prisma.workGroup.update({
      where: { id: groupId },
      data: { isActive: false },
    });
    return { message: 'Grupo de trabajo eliminado' };
  }

  // ── Miembros de grupo ──────────────────────────────────────

  async addMember(
    courseId: string,
    groupId: string,
    dto: AddMemberDto,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.assertStaffCanManageCourse(courseId, userId, userRole, 'grades');

    const group = await this.prisma.workGroup.findFirst({
      where: { id: groupId, courseId, isActive: true },
      select: { id: true },
    });
    if (!group) throw new NotFoundException('Grupo de trabajo no encontrado');

    // Verificar que el estudiante esté matriculado en el curso
    const enrolled = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: dto.userId, courseId } },
      select: { userId: true },
    });
    if (!enrolled) {
      throw new NotFoundException('El usuario no está matriculado en este curso');
    }

    try {
      return await this.prisma.workGroupMember.create({
        data: { groupId, userId: dto.userId },
        select: {
          id: true,
          joinedAt: true,
          user: { select: { id: true, name: true, lastName: true, email: true } },
        },
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException('El estudiante ya es miembro de este grupo');
      }
      throw err;
    }
  }

  async removeMember(
    courseId: string,
    groupId: string,
    memberId: string,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.assertStaffCanManageCourse(courseId, userId, userRole, 'grades');

    const group = await this.prisma.workGroup.findFirst({
      where: { id: groupId, courseId, isActive: true },
      select: { id: true },
    });
    if (!group) throw new NotFoundException('Grupo de trabajo no encontrado');

    const member = await this.prisma.workGroupMember.findFirst({
      where: { id: memberId, groupId },
      select: { id: true },
    });
    if (!member) throw new NotFoundException('Miembro no encontrado en el grupo');

    await this.prisma.workGroupMember.delete({ where: { id: memberId } });
    return { message: 'Miembro eliminado del grupo' };
  }

  // ── Actividades de grupo ───────────────────────────────────

  async assignActivity(
    courseId: string,
    groupId: string,
    dto: AssignActivityDto,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.assertStaffCanManageCourse(courseId, userId, userRole, 'grades');

    const group = await this.prisma.workGroup.findFirst({
      where: { id: groupId, courseId, isActive: true },
      select: { id: true },
    });
    if (!group) throw new NotFoundException('Grupo de trabajo no encontrado');

    // Verificar que la actividad pertenece al curso
    const activity = await this.prisma.activity.findFirst({
      where: {
        id: dto.activityId,
        performanceIndicator: { achievement: { aspect: { structure: { courseId } } } },
      },
      select: { id: true, name: true },
    });
    if (!activity) throw new NotFoundException('Actividad no encontrada en este curso');

    try {
      return await this.prisma.groupActivity.create({
        data: { groupId, activityId: dto.activityId },
        select: {
          id: true,
          assignedAt: true,
          activity: { select: { id: true, name: true, weight: true, maxScore: true } },
        },
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException('La actividad ya está asignada a este grupo');
      }
      throw err;
    }
  }

  async listGroupActivities(
    courseId: string,
    groupId: string,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);

    const group = await this.prisma.workGroup.findFirst({
      where: { id: groupId, courseId, isActive: true },
      select: { id: true },
    });
    if (!group) throw new NotFoundException('Grupo de trabajo no encontrado');

    return this.prisma.groupActivity.findMany({
      where: { groupId },
      select: {
        id: true,
        assignedAt: true,
        activity: {
          select: {
            id: true,
            name: true,
            weight: true,
            maxScore: true,
            performanceIndicator: {
              select: {
                competenceType: true,
                achievement: { select: { code: true, aspect: { select: { name: true } } } },
              },
            },
          },
        },
      },
      orderBy: { assignedAt: 'asc' },
    });
  }

  async removeGroupActivity(
    courseId: string,
    groupId: string,
    groupActivityId: string,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.assertStaffCanManageCourse(courseId, userId, userRole, 'grades');

    const group = await this.prisma.workGroup.findFirst({
      where: { id: groupId, courseId, isActive: true },
      select: { id: true },
    });
    if (!group) throw new NotFoundException('Grupo de trabajo no encontrado');

    const ga = await this.prisma.groupActivity.findFirst({
      where: { id: groupActivityId, groupId },
      select: { id: true },
    });
    if (!ga) throw new NotFoundException('Actividad no encontrada en este grupo');

    await this.prisma.groupActivity.delete({ where: { id: groupActivityId } });
    return { message: 'Actividad desasignada del grupo' };
  }
}
