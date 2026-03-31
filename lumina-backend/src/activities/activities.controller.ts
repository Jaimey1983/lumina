import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtAuthUser } from '../auth/jwt-auth-user';

@Controller('courses/:courseId')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post('performance-indicators/:piId/activities')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  create(
    @Param('courseId') courseId: string,
    @Param('piId') piId: string,
    @Body() dto: CreateActivityDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.activitiesService.create(
      courseId,
      piId,
      dto,
      user.id,
      user.role,
    );
  }

  @Get('performance-indicators/:piId/activities')
  findAllByPI(
    @Param('courseId') courseId: string,
    @Param('piId') piId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.activitiesService.findAllByPI(
      courseId,
      piId,
      user.id,
      user.role,
    );
  }

  @Get('activities/:activityId')
  findOne(
    @Param('courseId') courseId: string,
    @Param('activityId') activityId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.activitiesService.findOne(
      courseId,
      activityId,
      user.id,
      user.role,
    );
  }

  @Patch('activities/:activityId')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  update(
    @Param('courseId') courseId: string,
    @Param('activityId') activityId: string,
    @Body() dto: UpdateActivityDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.activitiesService.update(
      courseId,
      activityId,
      dto,
      user.id,
      user.role,
    );
  }

  @Delete('activities/:activityId')
  @HttpCode(HttpStatus.OK)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  remove(
    @Param('courseId') courseId: string,
    @Param('activityId') activityId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.activitiesService.remove(
      courseId,
      activityId,
      user.id,
      user.role,
    );
  }
}
