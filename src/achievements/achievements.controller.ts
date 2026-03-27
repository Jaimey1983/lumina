import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { UpdateAchievementDto } from './dto/update-achievement.dto';
import { QueryAchievementDto } from './dto/query-achievement.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('courses/:courseId/achievements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Post()
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  create(
    @Param('courseId') courseId: string,
    @Body() dto: CreateAchievementDto,
    @Request() req,
  ) {
    return this.achievementsService.create(courseId, dto, req.user.id, req.user.role);
  }

  @Get()
  findAll(
    @Param('courseId') courseId: string,
    @Query() query: QueryAchievementDto,
    @Request() req,
  ) {
    return this.achievementsService.findAll(courseId, query, req.user.id, req.user.role);
  }

  @Get(':achievementId')
  findOne(
    @Param('courseId') courseId: string,
    @Param('achievementId') achievementId: string,
    @Request() req,
  ) {
    return this.achievementsService.findOne(courseId, achievementId, req.user.id, req.user.role);
  }

  @Patch(':achievementId')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  update(
    @Param('courseId') courseId: string,
    @Param('achievementId') achievementId: string,
    @Body() dto: UpdateAchievementDto,
    @Request() req,
  ) {
    return this.achievementsService.update(courseId, achievementId, dto, req.user.id, req.user.role);
  }

  @Delete(':achievementId')
  @HttpCode(HttpStatus.OK)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  remove(
    @Param('courseId') courseId: string,
    @Param('achievementId') achievementId: string,
    @Request() req,
  ) {
    return this.achievementsService.remove(courseId, achievementId, req.user.id, req.user.role);
  }
}
