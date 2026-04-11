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
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtAuthUser } from '../auth/jwt-auth-user';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { CreateSlideDto } from './dto/create-slide.dto';
import { UpdateSlideDto } from './dto/update-slide.dto';
import { SaveResultsDto } from './dto/save-results.dto';
import { SaveManualGradeDto } from './dto/save-manual-grade.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  // ─── CLASES ────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  create(@Body() dto: CreateClassDto, @CurrentUser() user: JwtAuthUser) {
    return this.classesService.create(dto, user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query('courseId') courseId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.classesService.findAllByCourse(courseId, user.id, user.role);
  }

  @Get('join/:codigo')
  findByCodigo(@Param('codigo') codigo: string) {
    return this.classesService.findByCodigo(codigo);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @CurrentUser() user: JwtAuthUser) {
    return this.classesService.findOne(id, user.id, user.role);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClassDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.classesService.update(id, dto, user.id);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  publish(@Param('id') id: string, @CurrentUser() user: JwtAuthUser) {
    return this.classesService.publish(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  remove(@Param('id') id: string, @CurrentUser() user: JwtAuthUser) {
    return this.classesService.remove(id, user.id);
  }

  @Post(':id/sessions/start')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  startSession(@Param('id') id: string, @CurrentUser() user: JwtAuthUser) {
    return this.classesService.startSession(id, user.id);
  }

  @Patch(':id/sessions/end')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  endSession(@Param('id') id: string, @CurrentUser() user: JwtAuthUser) {
    return this.classesService.endSession(id, user.id);
  }

  @Post(':id/results')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  saveResults(
    @Param('id') id: string,
    @Body() dto: SaveResultsDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.classesService.saveResults(id, dto, user.id);
  }

  @Get(':id/gradebook')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  getGradebook(@Param('id') id: string, @CurrentUser() user: JwtAuthUser) {
    return this.classesService.getGradebook(id, user.id);
  }

  @Patch(':id/results/manual')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  saveManualGrade(
    @Param('id') id: string,
    @Body() dto: SaveManualGradeDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.classesService.saveManualGrade(id, dto, user.id);
  }

  // ─── SLIDES ────────────────────────────────────────────

  @Patch(':id/slides/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  reorderSlides(
    @Param('id') classId: string,
    @Body() body: { order: { id: string; order: number }[] },
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.classesService.reorderSlides(classId, user.id, body.order);
  }

  @Post(':id/slides/insert')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  addSlideAtPosition(
    @Param('id') classId: string,
    @Body() body: { afterOrder: number; slide: CreateSlideDto },
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.classesService.addSlideAtPosition(
      classId,
      user.id,
      body.afterOrder,
      body.slide,
    );
  }

  @Post(':id/slides')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  addSlide(
    @Param('id') classId: string,
    @Body() dto: CreateSlideDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.classesService.addSlide(classId, dto, user.id);
  }

  @Patch(':id/slides/:slideId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  updateSlide(
    @Param('id') classId: string,
    @Param('slideId') slideId: string,
    @Body() dto: UpdateSlideDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.classesService.updateSlide(classId, slideId, dto, user.id);
  }

  @Delete(':id/slides/:slideId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  removeSlide(
    @Param('id') classId: string,
    @Param('slideId') slideId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.classesService.removeSlide(classId, slideId, user.id);
  }
}
