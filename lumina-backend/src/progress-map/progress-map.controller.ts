import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtAuthUser } from '../auth/jwt-auth-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ProgressMapService } from './progress-map.service';
import { MarkClassProgressDto } from './dto/mark-class-progress.dto';
import { UpdateProgressEdgesDto } from './dto/update-progress-edges.dto';

@Controller('courses/:courseId/progress-map')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgressMapController {
  constructor(private readonly service: ProgressMapService) {}

  @Get()
  getMap(
    @Param('courseId') courseId: string,
    @Query('userId') userId: string | undefined,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.service.getMap(courseId, user.id, user.role, userId);
  }

  @Patch()
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  updateEdges(
    @Param('courseId') courseId: string,
    @Body() dto: UpdateProgressEdgesDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.service.updateEdges(courseId, dto, user.id, user.role);
  }

  @Put('classes/:classId/students/:userId')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  markStudent(
    @Param('courseId') courseId: string,
    @Param('classId') classId: string,
    @Param('userId') userId: string,
    @Body() dto: MarkClassProgressDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.service.markStudent(
      courseId,
      classId,
      userId,
      dto,
      user.id,
      user.role,
    );
  }
}
