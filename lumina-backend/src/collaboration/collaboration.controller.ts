import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtAuthUser } from '../auth/jwt-auth-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CollaborationService } from './collaboration.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { AssignActivityDto } from './dto/assign-activity.dto';

/**
 * Funcionalidades de colaboración a nivel de curso:
 * grupos de trabajo y asignación de actividades a grupos.
 */
@UseGuards(JwtAuthGuard)
@Controller('courses/:courseId/collaboration')
export class CollaborationController {
  constructor(private readonly collabService: CollaborationService) {}

  // ── Grupos de trabajo ─────────────────────────────────────

  @Post('groups')
  createGroup(
    @Param('courseId') courseId: string,
    @Body() dto: CreateGroupDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.collabService.createGroup(courseId, dto, user.id, user.role);
  }

  @Get('groups')
  listGroups(
    @Param('courseId') courseId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.collabService.listGroups(courseId, user.id, user.role);
  }

  @Get('groups/:groupId')
  getGroup(
    @Param('courseId') courseId: string,
    @Param('groupId') groupId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.collabService.getGroup(courseId, groupId, user.id, user.role);
  }

  @Delete('groups/:groupId')
  @HttpCode(HttpStatus.OK)
  deleteGroup(
    @Param('courseId') courseId: string,
    @Param('groupId') groupId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.collabService.deleteGroup(
      courseId,
      groupId,
      user.id,
      user.role,
    );
  }

  // ── Miembros de grupo ──────────────────────────────────────

  @Post('groups/:groupId/members')
  addMember(
    @Param('courseId') courseId: string,
    @Param('groupId') groupId: string,
    @Body() dto: AddMemberDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.collabService.addMember(
      courseId,
      groupId,
      dto,
      user.id,
      user.role,
    );
  }

  @Delete('groups/:groupId/members/:memberId')
  @HttpCode(HttpStatus.OK)
  removeMember(
    @Param('courseId') courseId: string,
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.collabService.removeMember(
      courseId,
      groupId,
      memberId,
      user.id,
      user.role,
    );
  }

  // ── Actividades de grupo ───────────────────────────────────

  @Post('groups/:groupId/activities')
  assignActivity(
    @Param('courseId') courseId: string,
    @Param('groupId') groupId: string,
    @Body() dto: AssignActivityDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.collabService.assignActivity(
      courseId,
      groupId,
      dto,
      user.id,
      user.role,
    );
  }

  @Get('groups/:groupId/activities')
  listGroupActivities(
    @Param('courseId') courseId: string,
    @Param('groupId') groupId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.collabService.listGroupActivities(
      courseId,
      groupId,
      user.id,
      user.role,
    );
  }

  @Delete('groups/:groupId/activities/:groupActivityId')
  @HttpCode(HttpStatus.OK)
  removeGroupActivity(
    @Param('courseId') courseId: string,
    @Param('groupId') groupId: string,
    @Param('groupActivityId') groupActivityId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.collabService.removeGroupActivity(
      courseId,
      groupId,
      groupActivityId,
      user.id,
      user.role,
    );
  }
}
