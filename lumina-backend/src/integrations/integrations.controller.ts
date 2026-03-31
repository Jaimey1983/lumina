import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtAuthUser } from '../auth/jwt-auth-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IntegrationsService } from './integrations.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';

@UseGuards(JwtAuthGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  // Nota: rutas literales ('events') antes de rutas con param ('/:webhookId')

  /** GET /integrations/events — lista todos los eventos disponibles del sistema */
  @Get('events')
  getAvailableEvents() {
    return this.integrationsService.getAvailableEvents();
  }

  /** POST /integrations/webhooks — crear webhook (global o por curso vía body.courseId) */
  @Post('webhooks')
  createWebhook(
    @Body() dto: CreateWebhookDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.integrationsService.createWebhook(dto, user.id, user.role);
  }

  /** GET /integrations/webhooks?courseId= — listar webhooks (global o por curso) */
  @Get('webhooks')
  listWebhooks(
    @Query('courseId') courseId: string | undefined,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.integrationsService.listWebhooks(user.id, user.role, courseId);
  }

  /** GET /integrations/webhooks/:webhookId */
  @Get('webhooks/:webhookId')
  getWebhook(
    @Param('webhookId') webhookId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.integrationsService.getWebhook(webhookId, user.id, user.role);
  }

  /** PATCH /integrations/webhooks/:webhookId */
  @Patch('webhooks/:webhookId')
  updateWebhook(
    @Param('webhookId') webhookId: string,
    @Body() dto: UpdateWebhookDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.integrationsService.updateWebhook(
      webhookId,
      dto,
      user.id,
      user.role,
    );
  }

  /** DELETE /integrations/webhooks/:webhookId — soft delete */
  @Delete('webhooks/:webhookId')
  @HttpCode(HttpStatus.OK)
  deleteWebhook(
    @Param('webhookId') webhookId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.integrationsService.deleteWebhook(
      webhookId,
      user.id,
      user.role,
    );
  }

  /** POST /integrations/webhooks/:webhookId/test — disparo manual de prueba */
  @Post('webhooks/:webhookId/test')
  @HttpCode(HttpStatus.OK)
  testWebhook(
    @Param('webhookId') webhookId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.integrationsService.testWebhook(webhookId, user.id, user.role);
  }

  /** GET /integrations/webhooks/:webhookId/logs?page=&limit= — historial de envíos */
  @Get('webhooks/:webhookId/logs')
  getLogs(
    @Param('webhookId') webhookId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.integrationsService.getLogs(
      webhookId,
      user.id,
      user.role,
      Number(page),
      Number(limit),
    );
  }
}
