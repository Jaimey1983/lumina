import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
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
    @Request() req: any,
  ) {
    return this.collabService.createGroup(courseId, dto, req.user.id, req.user.role);
  }

  @Get('groups')
  listGroups(@Param('courseId') courseId: string, @Request() req: any) {
    return this.collabService.listGroups(courseId, req.user.id, req.user.role);
  }

  @Get('groups/:groupId')
  getGroup(
    @Param('courseId') courseId: string,
    @Param('groupId') groupId: string,
    @Request() req: any,
  ) {
    return this.collabService.getGroup(courseId, groupId, req.user.id, req.user.role);
  }

  @Delete('groups/:groupId')
  @HttpCode(HttpStatus.OK)
  deleteGroup(
    @Param('courseId') courseId: string,
    @Param('groupId') groupId: string,
    @Request() req: any,
  ) {
    return this.collabService.deleteGroup(courseId, groupId, req.user.id, req.user.role);
  }

  // ── Miembros de grupo ──────────────────────────────────────

  @Post('groups/:groupId/members')
  addMember(
    @Param('courseId') courseId: string,
    @Param('groupId') groupId: string,
    @Body() dto: AddMemberDto,
    @Request() req: any,
  ) {
    return this.collabService.addMember(courseId, groupId, dto, req.user.id, req.user.role);
  }

  @Delete('groups/:groupId/members/:memberId')
  @HttpCode(HttpStatus.OK)
  removeMember(
    @Param('courseId') courseId: string,
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
    @Request() req: any,
  ) {
    return this.collabService.removeMember(courseId, groupId, memberId, req.user.id, req.user.role);
  }

  // ── Actividades de grupo ───────────────────────────────────

  @Post('groups/:groupId/activities')
  assignActivity(
    @Param('courseId') courseId: string,
    @Param('groupId') groupId: string,
    @Body() dto: AssignActivityDto,
    @Request() req: any,
  ) {
    return this.collabService.assignActivity(courseId, groupId, dto, req.user.id, req.user.role);
  }

  @Get('groups/:groupId/activities')
  listGroupActivities(
    @Param('courseId') courseId: string,
    @Param('groupId') groupId: string,
    @Request() req: any,
  ) {
    return this.collabService.listGroupActivities(courseId, groupId, req.user.id, req.user.role);
  }

  @Delete('groups/:groupId/activities/:groupActivityId')
  @HttpCode(HttpStatus.OK)
  removeGroupActivity(
    @Param('courseId') courseId: string,
    @Param('groupId') groupId: string,
    @Param('groupActivityId') groupActivityId: string,
    @Request() req: any,
  ) {
    return this.collabService.removeGroupActivity(
      courseId,
      groupId,
      groupActivityId,
      req.user.id,
      req.user.role,
    );
  }
}
