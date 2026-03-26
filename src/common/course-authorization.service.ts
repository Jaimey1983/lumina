import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Ámbito de permisos de gestión (mensajes de error homogéneos por recurso) */
export type CourseManageScope =
  | 'grades'
  | 'gradebook'
  | 'activities'
  | 'selfEvaluations'
  | 'peerEvaluations'
  | 'liveSessions'
  | 'h5pActivities'
  | 'gamification';

const MANAGE_SCOPE_MESSAGES: Record<
  CourseManageScope,
  { wrongCourse: string; notStaff: string }
> = {
  grades: {
    wrongCourse:
      'No tienes permiso para gestionar calificaciones en este curso',
    notStaff: 'No tienes permiso para gestionar calificaciones',
  },
  gradebook: {
    wrongCourse:
      'No tienes permiso para editar la estructura de calificación de este curso',
    notStaff:
      'No tienes permiso para editar la estructura de calificación',
  },
  activities: {
    wrongCourse:
      'No tienes permiso para gestionar actividades de calificación en este curso',
    notStaff:
      'No tienes permiso para gestionar actividades de calificación',
  },
  selfEvaluations: {
    wrongCourse:
      'No tienes permiso para gestionar autoevaluaciones en este curso',
    notStaff: 'No tienes permiso para gestionar autoevaluaciones',
  },
  peerEvaluations: {
    wrongCourse:
      'No tienes permiso para gestionar coevaluaciones en este curso',
    notStaff: 'No tienes permiso para gestionar coevaluaciones',
  },
  liveSessions: {
    wrongCourse:
      'No tienes permiso para dirigir la sesión en vivo de este curso',
    notStaff: 'No tienes permiso para dirigir sesiones en vivo',
  },
  h5pActivities: {
    wrongCourse:
      'No tienes permiso para gestionar actividades H5P en este curso',
    notStaff: 'No tienes permiso para gestionar actividades H5P',
  },
  gamification: {
    wrongCourse:
      'No tienes permiso para gestionar la gamificación en este curso',
    notStaff: 'No tienes permiso para gestionar la gamificación',
  },
};

@Injectable()
export class CourseAuthorizationService {
  constructor(private readonly prisma: PrismaService) {}

  async assertCourseExists(courseId: string): Promise<void> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });
    if (!course) throw new NotFoundException('Curso no encontrado');
  }

  /**
   * Lectura: ADMIN/SUPERADMIN, docente dueño del curso, o estudiante matriculado.
   */
  async verifyCourseReadAccess(
    courseId: string,
    userId: string,
    userRole: string,
  ): Promise<void> {
    if (userRole === 'ADMIN' || userRole === 'SUPERADMIN') return;

    if (userRole === 'TEACHER') {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        select: { teacherId: true },
      });
      if (!course || course.teacherId !== userId) {
        throw new ForbiddenException('No tienes acceso a este curso');
      }
      return;
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) {
      throw new ForbiddenException('No estás matriculado en este curso');
    }
  }

  /**
   * Mutaciones calificación / estructura: solo ADMIN, SUPERADMIN o docente titular.
   */
  async assertStaffCanManageCourse(
    courseId: string,
    userId: string,
    role: string,
    scope: CourseManageScope,
  ): Promise<void> {
    const msg = MANAGE_SCOPE_MESSAGES[scope];

    if (role === 'ADMIN' || role === 'SUPERADMIN') return;

    if (role === 'TEACHER') {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        select: { teacherId: true },
      });
      if (!course || course.teacherId !== userId) {
        throw new ForbiddenException(msg.wrongCourse);
      }
      return;
    }

    throw new ForbiddenException(msg.notStaff);
  }

  /**
   * Docente titular del curso o ADMIN/SUPERADMIN (sin lanzar excepción).
   * Útil para ramificar lógica (p. ej. sesión en vivo: anfitrión vs estudiante).
   */
  async isStaffForCourse(
    courseId: string,
    userId: string,
    role: string,
  ): Promise<boolean> {
    if (role === 'ADMIN' || role === 'SUPERADMIN') return true;

    if (role === 'TEACHER') {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        select: { teacherId: true },
      });
      return !!course && course.teacherId === userId;
    }

    return false;
  }
}
