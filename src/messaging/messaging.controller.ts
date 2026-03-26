import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MessagingService } from './messaging.service';
import { SendMessageDto } from './dto/send-message.dto';
import { SendDirectMessageDto } from './dto/send-direct-message.dto';

@UseGuards(JwtAuthGuard)
@Controller('courses/:courseId/messages')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  // ── Mensajes directos (antes de /:messageId) ──────────────

  @Post('direct')
  sendDirectMessage(
    @Param('courseId') courseId: string,
    @Request() req: any,
    @Body() dto: SendDirectMessageDto,
  ) {
    return this.messagingService.sendDirectMessage(
      courseId,
      req.user.userId,
      req.user.role,
      dto,
    );
  }

  @Get('direct/:userId')
  listDirectMessages(
    @Param('courseId') courseId: string,
    @Param('userId') otherUserId: string,
    @Request() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.messagingService.listDirectMessages(
      courseId,
      otherUserId,
      req.user.userId,
      req.user.role,
      Number(page),
      Number(limit),
    );
  }

  // ── Mensajes de curso ─────────────────────────────────────

  @Post()
  sendMessage(
    @Param('courseId') courseId: string,
    @Request() req: any,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagingService.sendMessage(
      courseId,
      req.user.userId,
      req.user.role,
      dto,
    );
  }

  @Get()
  listMessages(
    @Param('courseId') courseId: string,
    @Request() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.messagingService.listMessages(
      courseId,
      req.user.userId,
      req.user.role,
      Number(page),
      Number(limit),
    );
  }

  @Get(':messageId')
  getMessage(
    @Param('courseId') courseId: string,
    @Param('messageId') messageId: string,
    @Request() req: any,
  ) {
    return this.messagingService.getMessage(
      courseId,
      messageId,
      req.user.userId,
      req.user.role,
    );
  }

  @Post(':messageId/read')
  @HttpCode(HttpStatus.OK)
  markAsRead(
    @Param('courseId') courseId: string,
    @Param('messageId') messageId: string,
    @Request() req: any,
  ) {
    return this.messagingService.markAsRead(
      courseId,
      messageId,
      req.user.userId,
      req.user.role,
    );
  }

  @Delete(':messageId')
  @HttpCode(HttpStatus.OK)
  deleteMessage(
    @Param('courseId') courseId: string,
    @Param('messageId') messageId: string,
    @Request() req: any,
  ) {
    return this.messagingService.deleteMessage(
      courseId,
      messageId,
      req.user.userId,
      req.user.role,
    );
  }
}
