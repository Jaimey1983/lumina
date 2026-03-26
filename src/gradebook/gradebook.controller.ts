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
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { GradebookService } from './gradebook.service';
import { CreatePeriodDto } from './dto/create-period.dto';
import { UpdatePeriodDto } from './dto/update-period.dto';
import { CreateGradeEntryDto } from './dto/create-grade-entry.dto';
import { UpdateGradeEntryDto } from './dto/update-grade-entry.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('courses/:courseId')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GradebookController {
  constructor(private readonly gradebookService: GradebookService) {}

  @Post('periods')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  createPeriod(
    @Param('courseId') courseId: string,
    @Body() dto: CreatePeriodDto,
    @Request() req,
  ) {
    return this.gradebookService.createPeriod(
      courseId,
      dto,
      req.user.id,
      req.user.role,
    );
  }

  @Get('periods')
  findPeriods(@Param('courseId') courseId: string, @Request() req) {
    return this.gradebookService.findPeriods(
      courseId,
      req.user.id,
      req.user.role,
    );
  }

  @Patch('periods/:periodId')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  updatePeriod(
    @Param('courseId') courseId: string,
    @Param('periodId') periodId: string,
    @Body() dto: UpdatePeriodDto,
    @Request() req,
  ) {
    return this.gradebookService.updatePeriod(
      courseId,
      periodId,
      dto,
      req.user.id,
      req.user.role,
    );
  }

  @Delete('periods/:periodId')
  @HttpCode(HttpStatus.OK)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  removePeriod(
    @Param('courseId') courseId: string,
    @Param('periodId') periodId: string,
    @Request() req,
  ) {
    return this.gradebookService.removePeriod(
      courseId,
      periodId,
      req.user.id,
      req.user.role,
    );
  }

  @Post('grade-entries')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  upsertGradeEntry(
    @Param('courseId') courseId: string,
    @Body() dto: CreateGradeEntryDto,
    @Request() req,
  ) {
    return this.gradebookService.upsertGradeEntry(
      courseId,
      dto,
      req.user.id,
      req.user.role,
    );
  }

  @Patch('grade-entries/:entryId')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  updateGradeEntry(
    @Param('courseId') courseId: string,
    @Param('entryId') entryId: string,
    @Body() dto: UpdateGradeEntryDto,
    @Request() req,
  ) {
    return this.gradebookService.updateGradeEntry(
      courseId,
      entryId,
      dto,
      req.user.id,
      req.user.role,
    );
  }

  @Get('grades')
  getGradesView(
    @Param('courseId') courseId: string,
    @Query('periodId') periodId: string,
    @Request() req,
  ) {
    if (!periodId?.trim()) {
      throw new BadRequestException(
        'Query periodId es obligatorio (ej. ?periodId=...)',
      );
    }
    return this.gradebookService.getGradesView(
      courseId,
      periodId.trim(),
      req.user.id,
      req.user.role,
    );
  }
}
