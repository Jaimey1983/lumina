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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtAuthUser } from '../auth/jwt-auth-user';
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
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.achievementsService.create(courseId, dto, user.id, user.role);
  }

  @Get()
  findAll(
    @Param('courseId') courseId: string,
    @Query() query: QueryAchievementDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.achievementsService.findAll(
      courseId,
      query,
      user.id,
      user.role,
    );
  }

  @Get(':achievementId')
  findOne(
    @Param('courseId') courseId: string,
    @Param('achievementId') achievementId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.achievementsService.findOne(
      courseId,
      achievementId,
      user.id,
      user.role,
    );
  }

  @Patch(':achievementId')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  update(
    @Param('courseId') courseId: string,
    @Param('achievementId') achievementId: string,
    @Body() dto: UpdateAchievementDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.achievementsService.update(
      courseId,
      achievementId,
      dto,
      user.id,
      user.role,
    );
  }

  @Delete(':achievementId')
  @HttpCode(HttpStatus.OK)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  remove(
    @Param('courseId') courseId: string,
    @Param('achievementId') achievementId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.achievementsService.remove(
      courseId,
      achievementId,
      user.id,
      user.role,
    );
  }
}
