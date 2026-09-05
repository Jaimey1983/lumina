import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TeacherVerifiedGuard } from '../verification/teacher-verified.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtAuthUser } from '../auth/jwt-auth-user';
import { AutonomousSessionsService } from './autonomous-sessions.service';
import { CreateAutonomousSessionDto } from './dto/create-autonomous-session.dto';
import { UpdateAutonomousSessionDto } from './dto/update-autonomous-session.dto';
import { JoinAutonomousSessionDto } from './dto/join-autonomous-session.dto';
import { SaveProgressDto, CompleteSessionDto } from './dto/save-progress.dto';
import { UpdateAutonomousProgressScoreDto } from './dto/update-autonomous-progress-score.dto';

// Routes: POST/GET /classes/:classId/autonomous-sessions
@Controller('classes')
export class ClassAutonomousSessionsController {
  constructor(private readonly service: AutonomousSessionsService) {}

  @Post(':classId/autonomous-sessions')
  @UseGuards(JwtAuthGuard, TeacherVerifiedGuard)
  create(
    @Param('classId') classId: string,
    @Body() dto: CreateAutonomousSessionDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.service.create(classId, user.id, dto);
  }

  @Get(':classId/autonomous-sessions')
  @UseGuards(JwtAuthGuard)
  findAll(@Param('classId') classId: string) {
    return this.service.findAllByClass(classId);
  }
}

// Routes: /autonomous-sessions/:sessionId
@Controller('autonomous-sessions')
export class AutonomousSessionsController {
  constructor(private readonly service: AutonomousSessionsService) {}

  @Get(':sessionId')
  findOne(@Param('sessionId') sessionId: string) {
    return this.service.findOne(sessionId);
  }

  @Post(':sessionId/join')
  join(
    @Param('sessionId') sessionId: string,
    @Body() dto: JoinAutonomousSessionDto,
  ) {
    return this.service.join(sessionId, dto);
  }

  @Post(':sessionId/progress')
  saveProgress(
    @Param('sessionId') sessionId: string,
    @Body() dto: SaveProgressDto,
  ) {
    return this.service.saveProgress(sessionId, dto);
  }

  @Patch(':sessionId/progress/:progressId')
  @UseGuards(JwtAuthGuard)
  updateProgressScore(
    @Param('sessionId') sessionId: string,
    @Param('progressId') progressId: string,
    @Body() dto: UpdateAutonomousProgressScoreDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.service.updateProgressScore(
      sessionId,
      progressId,
      user.id,
      dto.score,
    );
  }

  @Post(':sessionId/complete')
  complete(
    @Param('sessionId') sessionId: string,
    @Body() dto: CompleteSessionDto,
  ) {
    return this.service.complete(sessionId, dto);
  }

  @Patch(':sessionId')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('sessionId') sessionId: string,
    @Body() dto: UpdateAutonomousSessionDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.service.update(sessionId, user.id, dto);
  }

  @Delete(':sessionId')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.service.remove(sessionId, user.id);
  }

  @Get(':sessionId/results')
  @UseGuards(JwtAuthGuard)
  getResults(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.service.getResults(sessionId, user.id);
  }
}
