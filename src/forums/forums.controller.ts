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
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtAuthUser } from '../auth/jwt-auth-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ForumsService } from './forums.service';
import { CreateForumDto } from './dto/create-forum.dto';
import { UpdateForumDto } from './dto/update-forum.dto';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { UpdateReplyDto } from './dto/update-reply.dto';

@UseGuards(JwtAuthGuard)
@Controller('courses/:courseId/forums')
export class ForumsController {
  constructor(private readonly forumsService: ForumsService) {}

  // ── Foros (categorías) — rutas literales antes de /:forumId ───────────

  @Post()
  createForum(
    @Param('courseId') courseId: string,
    @Body() dto: CreateForumDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.forumsService.createForum(courseId, dto, user.id, user.role);
  }

  @Get()
  listForums(
    @Param('courseId') courseId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.forumsService.listForums(courseId, user.id, user.role);
  }

  @Get(':forumId')
  getForum(
    @Param('courseId') courseId: string,
    @Param('forumId') forumId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.forumsService.getForum(courseId, forumId, user.id, user.role);
  }

  @Patch(':forumId')
  updateForum(
    @Param('courseId') courseId: string,
    @Param('forumId') forumId: string,
    @Body() dto: UpdateForumDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.forumsService.updateForum(
      courseId,
      forumId,
      dto,
      user.id,
      user.role,
    );
  }

  @Delete(':forumId')
  @HttpCode(HttpStatus.OK)
  deleteForum(
    @Param('courseId') courseId: string,
    @Param('forumId') forumId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.forumsService.deleteForum(
      courseId,
      forumId,
      user.id,
      user.role,
    );
  }

  // ── Hilos — nota: rutas con sub-segmentos literales antes de /:threadId ──

  @Post(':forumId/threads')
  createThread(
    @Param('courseId') courseId: string,
    @Param('forumId') forumId: string,
    @Body() dto: CreateThreadDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.forumsService.createThread(
      courseId,
      forumId,
      dto,
      user.id,
      user.role,
    );
  }

  @Post(':forumId/threads/:threadId/pin')
  @HttpCode(HttpStatus.OK)
  pinThread(
    @Param('courseId') courseId: string,
    @Param('forumId') forumId: string,
    @Param('threadId') threadId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.forumsService.pinThread(
      courseId,
      forumId,
      threadId,
      user.id,
      user.role,
    );
  }

  @Post(':forumId/threads/:threadId/lock')
  @HttpCode(HttpStatus.OK)
  lockThread(
    @Param('courseId') courseId: string,
    @Param('forumId') forumId: string,
    @Param('threadId') threadId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.forumsService.lockThread(
      courseId,
      forumId,
      threadId,
      user.id,
      user.role,
    );
  }

  @Get(':forumId/threads/:threadId')
  getThread(
    @Param('courseId') courseId: string,
    @Param('forumId') forumId: string,
    @Param('threadId') threadId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.forumsService.getThread(
      courseId,
      forumId,
      threadId,
      user.id,
      user.role,
    );
  }

  @Delete(':forumId/threads/:threadId')
  @HttpCode(HttpStatus.OK)
  deleteThread(
    @Param('courseId') courseId: string,
    @Param('forumId') forumId: string,
    @Param('threadId') threadId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.forumsService.deleteThread(
      courseId,
      forumId,
      threadId,
      user.id,
      user.role,
    );
  }

  // ── Respuestas ─────────────────────────────────────────────────────────

  @Post(':forumId/threads/:threadId/replies')
  createReply(
    @Param('courseId') courseId: string,
    @Param('forumId') forumId: string,
    @Param('threadId') threadId: string,
    @Body() dto: CreateReplyDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.forumsService.createReply(
      courseId,
      forumId,
      threadId,
      dto,
      user.id,
      user.role,
    );
  }

  @Patch(':forumId/threads/:threadId/replies/:replyId')
  updateReply(
    @Param('courseId') courseId: string,
    @Param('forumId') forumId: string,
    @Param('threadId') threadId: string,
    @Param('replyId') replyId: string,
    @Body() dto: UpdateReplyDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.forumsService.updateReply(
      courseId,
      forumId,
      threadId,
      replyId,
      dto,
      user.id,
      user.role,
    );
  }

  @Delete(':forumId/threads/:threadId/replies/:replyId')
  @HttpCode(HttpStatus.OK)
  deleteReply(
    @Param('courseId') courseId: string,
    @Param('forumId') forumId: string,
    @Param('threadId') threadId: string,
    @Param('replyId') replyId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.forumsService.deleteReply(
      courseId,
      forumId,
      threadId,
      replyId,
      user.id,
      user.role,
    );
  }
}
