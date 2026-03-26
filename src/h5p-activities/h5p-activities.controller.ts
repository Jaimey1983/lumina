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
  Request,
} from '@nestjs/common';
import { H5pActivitiesService } from './h5p-activities.service';
import { CreateH5pActivityDto } from './dto/create-h5p-activity.dto';
import { UpdateH5pActivityDto } from './dto/update-h5p-activity.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('courses/:courseId/classes/:classId/h5p-activities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class H5pActivitiesController {
  constructor(private readonly h5pService: H5pActivitiesService) {}

  @Post()
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  create(
    @Param('courseId') courseId: string,
    @Param('classId') classId: string,
    @Body() dto: CreateH5pActivityDto,
    @Request() req,
  ) {
    return this.h5pService.create(
      courseId,
      classId,
      dto,
      req.user.id,
      req.user.role,
    );
  }

  @Get()
  findAll(
    @Param('courseId') courseId: string,
    @Param('classId') classId: string,
    @Request() req,
  ) {
    return this.h5pService.findAll(
      courseId,
      classId,
      req.user.id,
      req.user.role,
    );
  }

  @Get(':slideId')
  findOne(
    @Param('courseId') courseId: string,
    @Param('classId') classId: string,
    @Param('slideId') slideId: string,
    @Request() req,
  ) {
    return this.h5pService.findOne(
      courseId,
      classId,
      slideId,
      req.user.id,
      req.user.role,
    );
  }

  @Patch(':slideId')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  update(
    @Param('courseId') courseId: string,
    @Param('classId') classId: string,
    @Param('slideId') slideId: string,
    @Body() dto: UpdateH5pActivityDto,
    @Request() req,
  ) {
    return this.h5pService.update(
      courseId,
      classId,
      slideId,
      dto,
      req.user.id,
      req.user.role,
    );
  }

  @Delete(':slideId')
  @HttpCode(HttpStatus.OK)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  remove(
    @Param('courseId') courseId: string,
    @Param('classId') classId: string,
    @Param('slideId') slideId: string,
    @Request() req,
  ) {
    return this.h5pService.remove(
      courseId,
      classId,
      slideId,
      req.user.id,
      req.user.role,
    );
  }
}
