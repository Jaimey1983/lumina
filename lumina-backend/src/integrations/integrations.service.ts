import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';
import { CreateWebhookDto, VALID_EVENTS } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';

// ─── Helpers ──────────────────────────────────────────────

const GLOBAL_ROLES = ['ADMIN', 'SUPERADMIN'];

function assertGlobalAdmin(role: string) {
  if (!GLOBAL_ROLES.includes(role)) {
    throw new ForbiddenException(
      'Solo ADMIN y SUPERADMIN pueden gestionar webhooks globales',
    );
  }
}

function signPayload(secret: string, payload: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

// ─── Service ──────────────────────────────────────────────

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseAuth: CourseAuthorizationService,
  ) {}

  // ── Validación de eventos ──────────────────────────────────

  private validateEvents(events: string[]) {
    const invalid = events.filter(
      (e) => !(VALID_EVENTS as readonly string[]).includes(e),
    );
    if (invalid.length) {
      throw new BadRequestException(
        `Eventos no válidos: ${invalid.join(', ')}. Válidos: ${VALID_EVENTS.join(', ')}`,
      );
    }
    if (!events.length) {
      throw new BadRequestException('Debes suscribir al menos un evento');
    }
  }

  // ── Permisos: verificar acceso al webhook ─────────────────

  private async assertCanManageWebhook(
    webhookId: string,
    userId: string,
    userRole: string,
  ) {
    const webhook = await this.prisma.webhook.findUnique({
      where: { id: webhookId },
      select: { id: true, courseId: true, isActive: true },
    });
    if (!webhook || !webhook.isActive)
      throw new NotFoundException('Webhook no encontrado');

    if (webhook.courseId) {
      await this.courseAuth.assertStaffCanManageCourse(
        webhook.courseId,
        userId,
        userRole,
        'grades',
      );
    } else {
      assertGlobalAdmin(userRole);
    }
    return webhook;
  }

  // ────────────────────────────────────────────────────────
  // CRUD WEBHOOKS
  // ────────────────────────────────────────────────────────

  async createWebhook(dto: CreateWebhookDto, userId: string, userRole: string) {
    this.validateEvents(dto.events);

    if (dto.courseId) {
      await this.courseAuth.assertStaffCanManageCourse(
        dto.courseId,
        userId,
        userRole,
        'grades',
      );
    } else {
      assertGlobalAdmin(userRole);
    }

    return this.prisma.webhook.create({
      data: {
        name: dto.name,
        url: dto.url,
        secret: dto.secret,
        events: dto.events,
        courseId: dto.courseId ?? null,
        createdById: userId,
      },
      select: {
        id: true,
        name: true,
        url: true,
        events: true,
        isActive: true,
        courseId: true,
        createdById: true,
        createdAt: true,
        // No devolver secret en respuesta
      },
    });
  }

  async listWebhooks(userId: string, userRole: string, courseId?: string) {
    if (courseId) {
      await this.courseAuth.assertStaffCanManageCourse(
        courseId,
        userId,
        userRole,
        'grades',
      );
      return this.prisma.webhook.findMany({
        where: { courseId, isActive: true },
        select: {
          id: true,
          name: true,
          url: true,
          events: true,
          isActive: true,
          courseId: true,
          createdAt: true,
          _count: { select: { logs: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Sin courseId → solo ADMIN/SUPERADMIN ven todos
    assertGlobalAdmin(userRole);
    return this.prisma.webhook.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        url: true,
        events: true,
        isActive: true,
        courseId: true,
        createdAt: true,
        _count: { select: { logs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWebhook(webhookId: string, userId: string, userRole: string) {
    await this.assertCanManageWebhook(webhookId, userId, userRole);

    return this.prisma.webhook.findUnique({
      where: { id: webhookId },
      select: {
        id: true,
        name: true,
        url: true,
        events: true,
        isActive: true,
        courseId: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateWebhook(
    webhookId: string,
    dto: UpdateWebhookDto,
    userId: string,
    userRole: string,
  ) {
    await this.assertCanManageWebhook(webhookId, userId, userRole);

    if (dto.events) this.validateEvents(dto.events);

    return this.prisma.webhook.update({
      where: { id: webhookId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.url !== undefined ? { url: dto.url } : {}),
        ...(dto.secret !== undefined ? { secret: dto.secret } : {}),
        ...(dto.events !== undefined ? { events: dto.events } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      select: {
        id: true,
        name: true,
        url: true,
        events: true,
        isActive: true,
        courseId: true,
        updatedAt: true,
      },
    });
  }

  async deleteWebhook(webhookId: string, userId: string, userRole: string) {
    await this.assertCanManageWebhook(webhookId, userId, userRole);

    await this.prisma.webhook.update({
      where: { id: webhookId },
      data: { isActive: false },
    });
    return { message: 'Webhook eliminado' };
  }

  // ────────────────────────────────────────────────────────
  // DESPACHO DE EVENTOS
  // ────────────────────────────────────────────────────────

  /**
   * Dispara todos los webhooks activos suscritos al evento dado.
   * Carga los webhooks que coinciden por evento (globales + del curso si aplica).
   * Llama a cada URL en paralelo y guarda log del resultado.
   * No lanza excepción si falla — el error queda registrado en WebhookLog.
   */
  async dispatch(event: string, data: Record<string, any>, courseId?: string) {
    const webhooks = await this.prisma.webhook.findMany({
      where: {
        isActive: true,
        events: { has: event },
        ...(courseId
          ? { OR: [{ courseId }, { courseId: null }] }
          : { courseId: null }),
      },
      select: { id: true, url: true, secret: true },
    });

    if (!webhooks.length) return;

    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data,
      ...(courseId ? { courseId } : {}),
    };
    const payloadStr = JSON.stringify(payload);

    await Promise.allSettled(
      webhooks.map(async (wh) => {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Lumina-Event': event,
        };

        if (wh.secret) {
          headers['X-Lumina-Signature'] =
            `sha256=${signPayload(wh.secret, payloadStr)}`;
        }

        let statusCode: number | null = null;
        let responseText: string | null = null;
        let success = false;

        try {
          const res = await fetch(wh.url, {
            method: 'POST',
            headers,
            body: payloadStr,
            signal: AbortSignal.timeout(10_000), // 10 s timeout
          });
          statusCode = res.status;
          responseText = await res.text().catch((): null => null);
          success = res.ok;
        } catch (err: unknown) {
          responseText = err instanceof Error ? err.message : 'Error de red';
          success = false;
        }

        await this.prisma.webhookLog.create({
          data: {
            webhookId: wh.id,
            event,
            payload,
            statusCode,
            response: responseText?.slice(0, 500) ?? null,
            success,
          },
        });
      }),
    );
  }

  // ────────────────────────────────────────────────────────
  // TEST MANUAL + LOGS
  // ────────────────────────────────────────────────────────

  /** Dispara el webhook manualmente con un payload de prueba. */
  async testWebhook(webhookId: string, userId: string, userRole: string) {
    const webhook = await this.assertCanManageWebhook(
      webhookId,
      userId,
      userRole,
    );

    await this.dispatch(
      'webhook.test',
      { triggeredBy: userId, webhookId },
      webhook.courseId ?? undefined,
    );
    return { message: 'Evento de prueba enviado', webhookId };
  }

  async getLogs(
    webhookId: string,
    userId: string,
    userRole: string,
    page = 1,
    limit = 20,
  ) {
    await this.assertCanManageWebhook(webhookId, userId, userRole);

    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.prisma.webhookLog.findMany({
        where: { webhookId },
        select: {
          id: true,
          event: true,
          statusCode: true,
          response: true,
          success: true,
          sentAt: true,
        },
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.webhookLog.count({ where: { webhookId } }),
    ]);

    return {
      data: logs,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ────────────────────────────────────────────────────────
  // LISTA DE EVENTOS DISPONIBLES
  // ────────────────────────────────────────────────────────

  getAvailableEvents() {
    return {
      events: VALID_EVENTS,
      descriptions: {
        'student.enrolled': 'Estudiante matriculado en un curso',
        'student.unenrolled': 'Estudiante desmatriculado de un curso',
        'grade.submitted': 'Nota registrada o actualizada para un estudiante',
        'grade.updated': 'Nota existente modificada',
        'session.started': 'Sesión en vivo iniciada',
        'session.ended': 'Sesión en vivo finalizada',
        'message.sent': 'Mensaje enviado en un curso',
        'forum.thread.created': 'Hilo creado en un foro',
        'forum.reply.created': 'Respuesta publicada en un hilo',
        'badge.awarded': 'Insignia otorgada a un estudiante',
      },
    };
  }
}
