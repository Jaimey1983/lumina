import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import { Socket } from 'socket.io';
import { CourseAuthorizationService } from '../common/course-authorization.service';

export type LiveSocketUser = {
  id: string;
  role: string;
  name: string;
  lastName: string;
};

/** Estado de diapositiva actual (memoria de proceso; en cluster usar Redis). */
export type LiveSlideState = {
  slideId: string;
  order: number;
  updatedBy: string;
  updatedAt: string;
};

type SlideStateEntry = {
  slideId: string;
  order: number;
  updatedBy: string;
  updatedAtMs: number;
};

function liveRoom(classId: string): string {
  return `live:${classId}`;
}

function toPublicState(e: SlideStateEntry): LiveSlideState {
  return {
    slideId: e.slideId,
    order: e.order,
    updatedBy: e.updatedBy,
    updatedAt: new Date(e.updatedAtMs).toISOString(),
  };
}

@Injectable()
export class LiveSessionsService {
  /** Estado por claseId (solo esta instancia Node). */
  private readonly slideStateByClass = new Map<string, SlideStateEntry>();

  constructor(
    private readonly prisma: PrismaClient,
    private readonly courseAuth: CourseAuthorizationService,
    private readonly jwtService: JwtService,
  ) {}

  async authenticateConnection(client: Socket): Promise<void> {
    const token = this.extractBearerToken(client);
    if (!token) {
      throw new UnauthorizedException('Token requerido (auth.token o Authorization)');
    }

    let sub: string;
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(token);
      sub = payload.sub;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: sub },
      select: {
        id: true,
        name: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario no autorizado');
    }

    (client.data as { user?: LiveSocketUser }).user = {
      id: user.id,
      role: user.role,
      name: user.name,
      lastName: user.lastName,
    };
  }

  getUser(client: Socket): LiveSocketUser {
    const user = (client.data as { user?: LiveSocketUser }).user;
    if (!user) {
      throw new UnauthorizedException('Sesión no autenticada');
    }
    return user;
  }

  getSlideState(classId: string): LiveSlideState | null {
    const e = this.slideStateByClass.get(classId);
    return e ? toPublicState(e) : null;
  }

  private setSlideState(
    classId: string,
    slideId: string,
    order: number,
    updatedBy: string,
  ): LiveSlideState {
    const entry: SlideStateEntry = {
      slideId,
      order,
      updatedBy,
      updatedAtMs: Date.now(),
    };
    this.slideStateByClass.set(classId, entry);
    return toPublicState(entry);
  }

  private clearSlideState(classId: string): void {
    this.slideStateByClass.delete(classId);
  }

  private async loadClassForLive(classId: string) {
    const cls = await this.prisma.class.findUnique({
      where: { id: classId },
      select: {
        id: true,
        courseId: true,
        status: true,
      },
    });
    if (!cls) {
      throw new NotFoundException('Clase no encontrada');
    }
    if (cls.status === 'ARCHIVED') {
      throw new BadRequestException('Esta clase está archivada');
    }
    return cls;
  }

  /**
   * Entra en la sala. Anfitrión puede unirse en PUBLISHED o LIVE; resto solo LIVE.
   * El ack incluye la diapositiva actual para quien entra tarde.
   */
  async joinLiveClass(
    client: Socket,
    classId: string,
  ): Promise<{ room: string; currentSlide: LiveSlideState | null; isHost: boolean }> {
    const user = this.getUser(client);
    const cls = await this.loadClassForLive(classId);

    await this.courseAuth.verifyCourseReadAccess(
      cls.courseId,
      user.id,
      user.role,
    );

    const isHost = await this.courseAuth.isStaffForCourse(
      cls.courseId,
      user.id,
      user.role,
    );

    if (!isHost) {
      if (cls.status !== 'LIVE') {
        throw new BadRequestException(
          'La sesión en vivo no está activa. Espera a que el docente la inicie.',
        );
      }
    } else {
      if (cls.status === 'DRAFT') {
        throw new BadRequestException(
          'Publica la clase antes de usar la sesión en vivo.',
        );
      }
      if (cls.status !== 'PUBLISHED' && cls.status !== 'LIVE') {
        throw new BadRequestException('Estado de clase no válido para sesión en vivo');
      }
    }

    const room = liveRoom(classId);
    await client.join(room);
    const currentSlide = this.getSlideState(classId);
    return { room, currentSlide, isHost };
  }

  /**
   * Docente/admin: PUBLISHED → LIVE (limpia slides en memoria) o ya LIVE (reentrada sin borrar estado).
   */
  async startLiveSession(
    client: Socket,
    classId: string,
  ): Promise<{ room: string; transitionedToLive: boolean }> {
    const user = this.getUser(client);
    const cls = await this.loadClassForLive(classId);

    await this.courseAuth.assertStaffCanManageCourse(
      cls.courseId,
      user.id,
      user.role,
      'liveSessions',
    );

    if (cls.status === 'DRAFT') {
      throw new BadRequestException(
        'Publica la clase antes de iniciar la sesión en vivo.',
      );
    }

    if (cls.status !== 'PUBLISHED' && cls.status !== 'LIVE') {
      throw new BadRequestException('No se puede iniciar sesión en vivo en este estado');
    }

    let transitionedToLive = false;
    if (cls.status === 'PUBLISHED') {
      await this.prisma.class.update({
        where: { id: classId },
        data: { status: 'LIVE' },
      });
      this.clearSlideState(classId);
      transitionedToLive = true;
    }

    const room = liveRoom(classId);
    await client.join(room);
    return { room, transitionedToLive };
  }

  /**
   * Docente/admin: LIVE → PUBLISHED, borra estado en memoria.
   */
  async endLiveSession(client: Socket, classId: string): Promise<{ room: string }> {
    const user = this.getUser(client);
    const cls = await this.loadClassForLive(classId);

    await this.courseAuth.assertStaffCanManageCourse(
      cls.courseId,
      user.id,
      user.role,
      'liveSessions',
    );

    if (cls.status !== 'LIVE') {
      throw new BadRequestException('No hay una sesión en vivo activa para esta clase');
    }

    await this.prisma.class.update({
      where: { id: classId },
      data: { status: 'PUBLISHED' },
    });

    this.clearSlideState(classId);
    return { room: liveRoom(classId) };
  }

  /** Lectura del estado actual sin unirse (mismas reglas que join). */
  async getSlideStateForClient(
    user: LiveSocketUser,
    classId: string,
  ): Promise<LiveSlideState | null> {
    const cls = await this.loadClassForLive(classId);

    await this.courseAuth.verifyCourseReadAccess(
      cls.courseId,
      user.id,
      user.role,
    );

    const isHost = await this.courseAuth.isStaffForCourse(
      cls.courseId,
      user.id,
      user.role,
    );

    if (!isHost && cls.status !== 'LIVE') {
      throw new BadRequestException(
        'La sesión en vivo no está activa. Espera a que el docente la inicie.',
      );
    }
    if (isHost && cls.status === 'DRAFT') {
      throw new BadRequestException(
        'Publica la clase antes de usar la sesión en vivo.',
      );
    }

    return this.getSlideState(classId);
  }

  async assertSlideSyncAllowed(
    user: LiveSocketUser,
    classId: string,
    slideId: string,
  ): Promise<{ slideId: string; order: number }> {
    const cls = await this.prisma.class.findUnique({
      where: { id: classId },
      select: { id: true, courseId: true, status: true },
    });

    if (!cls) {
      throw new NotFoundException('Clase no encontrada');
    }

    if (cls.status !== 'LIVE') {
      throw new BadRequestException(
        'Solo se puede sincronizar diapositivas durante una sesión en vivo (LIVE).',
      );
    }

    await this.courseAuth.assertStaffCanManageCourse(
      cls.courseId,
      user.id,
      user.role,
      'liveSessions',
    );

    const slide = await this.prisma.slide.findFirst({
      where: { id: slideId, classId },
      select: { id: true, order: true },
    });

    if (!slide) {
      throw new NotFoundException('Diapositiva no encontrada en esta clase');
    }

    return { slideId: slide.id, order: slide.order };
  }

  /** Persiste estado y devuelve payload público para broadcast/ack. */
  applySlideSync(
    classId: string,
    slideId: string,
    order: number,
    updatedBy: string,
  ): LiveSlideState {
    return this.setSlideState(classId, slideId, order, updatedBy);
  }

  async leaveLiveClass(client: Socket, classId: string): Promise<void> {
    this.getUser(client);
    await client.leave(liveRoom(classId));
  }

  roomName(classId: string): string {
    return liveRoom(classId);
  }

  private extractBearerToken(client: Socket): string | null {
    const rawAuth = client.handshake.auth as { token?: unknown } | undefined;
    if (typeof rawAuth?.token === 'string') {
      return rawAuth.token.replace(/^Bearer\s+/i, '').trim() || null;
    }

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string') {
      const token = header.replace(/^Bearer\s+/i, '').trim();
      return token || null;
    }

    return null;
  }
}
