import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';
import {
  deriveNodeStatus,
  layoutProgressNodes,
  mergeCompletedIds,
  resolveEdges,
  sanitizeEdges,
  type ProgressNodeStatus,
} from './progress-map.logic';
import type { MarkClassProgressDto } from './dto/mark-class-progress.dto';
import type { UpdateProgressEdgesDto } from './dto/update-progress-edges.dto';

const CLASS_SELECT = {
  id: true,
  title: true,
  status: true,
  modoEntrega: true,
  createdAt: true,
} as const;

export interface ProgressMapNodeDto {
  classId: string;
  title: string;
  classStatus: string;
  modoEntrega: string;
  status: ProgressNodeStatus;
  source: 'manual_teacher' | 'live' | 'autonomous' | null;
  x: number;
  y: number;
  completedCount?: number;
  enrolledCount?: number;
}

@Injectable()
export class ProgressMapService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseAuth: CourseAuthorizationService,
  ) {}

  async getMap(
    courseId: string,
    requesterId: string,
    requesterRole: string,
    studentId?: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.verifyCourseReadAccess(
      courseId,
      requesterId,
      requesterRole,
    );
    const staff = await this.courseAuth.isStaffForCourse(
      courseId,
      requesterId,
      requesterRole,
    );

    const targetUserId = staff ? (studentId ?? null) : requesterId;
    if (!staff && studentId && studentId !== requesterId) {
      throw new BadRequestException('Solo puedes ver tu propio mapa');
    }

    const [classes, enrollments, course] = await Promise.all([
      this.prisma.class.findMany({
        where: { courseId, status: { not: 'ARCHIVED' } },
        select: CLASS_SELECT,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.enrollment.findMany({
        where: { courseId },
        select: {
          userId: true,
          user: { select: { id: true, name: true, lastName: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.course.findUnique({
        where: { id: courseId },
        select: { progressMap: true },
      }),
    ]);

    const visible = staff
      ? classes
      : classes.filter((c) => c.status === 'PUBLISHED' || c.status === 'LIVE');
    const classIds = visible.map((c) => c.id);
    const valid = new Set(classIds);
    const { edges, custom } = resolveEdges(classIds, course?.progressMap);
    const positions = layoutProgressNodes(classIds);

    const enrolledIds = enrollments.map((e) => e.userId);
    const students = enrollments.map((e) => e.user);

    if (targetUserId && !staff) {
      const enrolled = enrolledIds.includes(targetUserId);
      if (!enrolled) {
        throw new BadRequestException('No estás matriculado en este curso');
      }
    }

    const [manualRows, liveClassIds, autoClassIds, inProgressAuto] =
      targetUserId
        ? await this.loadSignals(courseId, targetUserId, valid)
        : [
            new Map<string, string>(),
            new Set<string>(),
            new Set<string>(),
            new Set<string>(),
          ];

    const completed = targetUserId
      ? mergeCompletedIds(manualRows.keys(), liveClassIds, autoClassIds)
      : new Set<string>();

    const enrolledCount = enrolledIds.length;
    const overviewCounts = !targetUserId
      ? await this.loadOverviewCounts(courseId, classIds, enrolledIds)
      : null;

    const nodes: ProgressMapNodeDto[] = visible.map((cls) => {
      const status = targetUserId
        ? deriveNodeStatus(cls.id, completed, inProgressAuto, edges)
        : 'available';
      let source: ProgressMapNodeDto['source'] = null;
      if (manualRows.has(cls.id)) source = 'manual_teacher';
      else if (autoClassIds.has(cls.id)) source = 'autonomous';
      else if (liveClassIds.has(cls.id)) source = 'live';
      const pos = positions[cls.id] ?? { x: 40, y: 140 };
      return {
        classId: cls.id,
        title: cls.title,
        classStatus: cls.status,
        modoEntrega: cls.modoEntrega,
        status,
        source,
        x: pos.x,
        y: pos.y,
        ...(overviewCounts
          ? {
              completedCount: overviewCounts.get(cls.id) ?? 0,
              enrolledCount,
            }
          : {}),
      };
    });

    return {
      courseId,
      viewer: staff ? 'staff' : 'student',
      mode: targetUserId ? 'student' : 'overview',
      studentId: targetUserId,
      students: staff ? students : undefined,
      edgesCustom: custom,
      edges,
      nodes,
    };
  }

  async updateEdges(
    courseId: string,
    dto: UpdateProgressEdgesDto,
    requesterId: string,
    requesterRole: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      requesterId,
      requesterRole,
      'progressMap',
    );

    const classes = await this.prisma.class.findMany({
      where: { courseId, status: { not: 'ARCHIVED' } },
      select: { id: true },
    });
    const valid = new Set(classes.map((c) => c.id));

    if (dto.edges == null || dto.edges.length === 0) {
      await this.prisma.course.update({
        where: { id: courseId },
        data: { progressMap: null },
      });
      return this.getMap(courseId, requesterId, requesterRole);
    }

    const edges = sanitizeEdges(dto.edges, valid);
    await this.prisma.course.update({
      where: { id: courseId },
      data: { progressMap: { edges } as unknown as Prisma.InputJsonValue },
    });
    return this.getMap(courseId, requesterId, requesterRole);
  }

  async markStudent(
    courseId: string,
    classId: string,
    userId: string,
    dto: MarkClassProgressDto,
    requesterId: string,
    requesterRole: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      requesterId,
      requesterRole,
      'progressMap',
    );

    const [cls, enrollment] = await Promise.all([
      this.prisma.class.findFirst({
        where: { id: classId, courseId },
        select: { id: true },
      }),
      this.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
      }),
    ]);
    if (!cls) throw new NotFoundException('Clase no encontrada en este curso');
    if (!enrollment) {
      throw new BadRequestException('El estudiante no está matriculado');
    }

    if (dto.completed) {
      await this.prisma.studentClassProgress.upsert({
        where: { userId_classId: { userId, classId } },
        create: {
          userId,
          classId,
          courseId,
          status: 'COMPLETED',
          source: 'manual_teacher',
          completedAt: new Date(),
        },
        update: {
          status: 'COMPLETED',
          source: 'manual_teacher',
          completedAt: new Date(),
        },
      });
    } else {
      await this.prisma.studentClassProgress.deleteMany({
        where: { userId, classId },
      });
    }

    return this.getMap(courseId, requesterId, requesterRole, userId);
  }

  private async loadSignals(
    courseId: string,
    userId: string,
    validClassIds: Set<string>,
  ): Promise<[Map<string, string>, Set<string>, Set<string>, Set<string>]> {
    const [manual, liveResults, autoResults] = await Promise.all([
      this.prisma.studentClassProgress.findMany({
        where: { courseId, userId, status: 'COMPLETED' },
        select: { classId: true, source: true },
      }),
      this.prisma.classResult.findMany({
        where: {
          studentId: userId,
          classId: { in: [...validClassIds] },
          session: { endedAt: { not: null } },
        },
        select: { classId: true },
        distinct: ['classId'],
      }),
      this.prisma.autonomousResult.findMany({
        where: {
          studentId: userId,
          session: { class: { courseId, id: { in: [...validClassIds] } } },
        },
        select: { status: true, session: { select: { classId: true } } },
      }),
    ]);

    const manualMap = new Map<string, string>();
    for (const row of manual) {
      if (validClassIds.has(row.classId)) {
        manualMap.set(row.classId, row.source);
      }
    }

    const live = new Set(
      liveResults.map((r) => r.classId).filter((id) => validClassIds.has(id)),
    );
    const autoCompleted = new Set<string>();
    const autoInProgress = new Set<string>();
    for (const row of autoResults) {
      const id = row.session.classId;
      if (!validClassIds.has(id)) continue;
      if (row.status === 'completed') autoCompleted.add(id);
      else if (row.status === 'in_progress') autoInProgress.add(id);
    }

    return [manualMap, live, autoCompleted, autoInProgress];
  }

  private async loadOverviewCounts(
    courseId: string,
    classIds: string[],
    enrolledIds: string[],
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>(classIds.map((id) => [id, 0]));
    if (classIds.length === 0 || enrolledIds.length === 0) return counts;

    const [manual, live, auto] = await Promise.all([
      this.prisma.studentClassProgress.findMany({
        where: {
          courseId,
          status: 'COMPLETED',
          userId: { in: enrolledIds },
          classId: { in: classIds },
        },
        select: { classId: true, userId: true },
      }),
      this.prisma.classResult.findMany({
        where: {
          classId: { in: classIds },
          studentId: { in: enrolledIds },
          session: { endedAt: { not: null } },
        },
        select: { classId: true, studentId: true },
      }),
      this.prisma.autonomousResult.findMany({
        where: {
          studentId: { in: enrolledIds },
          status: 'completed',
          session: { classId: { in: classIds } },
        },
        select: { studentId: true, session: { select: { classId: true } } },
      }),
    ]);

    const pairs = new Set<string>();
    for (const r of manual) pairs.add(`${r.userId}:${r.classId}`);
    for (const r of live) pairs.add(`${r.studentId}:${r.classId}`);
    for (const r of auto) pairs.add(`${r.studentId}:${r.session.classId}`);
    for (const key of pairs) {
      const classId = key.split(':')[1];
      if (!classId) continue;
      counts.set(classId, (counts.get(classId) ?? 0) + 1);
    }
    return counts;
  }
}
