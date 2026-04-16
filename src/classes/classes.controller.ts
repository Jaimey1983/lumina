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
import { ClassesGateway } from './classes.gateway';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { CreateSlideDto } from './dto/create-slide.dto';
import { UpdateSlideDto } from './dto/update-slide.dto';
import { CreateSlideVersionDto } from './dto/create-slide-version.dto';
import { GuardarResultadosDto } from './dto/save-results.dto';
import { NotaManualDto } from './dto/save-manual-grade.dto';
import { UpdateResultScoreDto } from './dto/update-result-score.dto';
import { JoinAsGuestDto } from './dto/join-as-guest.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('classes')
export class ClassesController {
  constructor(
    private readonly classesService: ClassesService,
    private readonly classesGateway: ClassesGateway,
  ) {}

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

  @Post('join/:codigo/guest')
  joinAsGuest(
    @Param('codigo') codigo: string,
    @Body() dto: JoinAsGuestDto,
  ) {
    return this.classesService.joinAsGuest(codigo, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.classesService.findOne(id);
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

  // ─── SESIONES ──────────────────────────────────────────

  @Post(':id/sessions/start')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  startSession(@Param('id') id: string, @CurrentUser() user: JwtAuthUser) {
    return this.classesService.startSession(id, user.id);
  }

  @Patch(':id/sessions/end')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  async endSession(@Param('id') id: string, @CurrentUser() user: JwtAuthUser) {
    const session = await this.classesService.endSession(id, user.id);
    this.classesGateway.server.to(`class-${id}`).emit('class-ended');
    return session;
  }

  // ─── RESULTADOS ────────────────────────────────────────

  @Post(':id/results')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'STUDENT')
  saveResults(
    @Param('id') id: string,
    @Body() dto: GuardarResultadosDto,
  ) {
    return this.classesService.saveResults(id, dto);
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
    @Body() dto: NotaManualDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.classesService.saveManualGrade(id, dto, user.id);
  }

  @Patch(':classId/results/:resultId')
  @UseGuards(JwtAuthGuard)
  updateResultScore(
    @Param('classId') classId: string,
    @Param('resultId') resultId: string,
    @Body() dto: UpdateResultScoreDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.classesService.updateResultScore(
      classId,
      resultId,
      dto.score,
      user.id,
    );
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

  @Get(':id/slides/:slideId/versions')
  @UseGuards(JwtAuthGuard)
  getSlideVersions(
    @Param('id') classId: string,
    @Param('slideId') slideId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.classesService.getSlideVersions(classId, slideId, user.id);
  }

  @Post(':id/slides/:slideId/versions')
  @UseGuards(JwtAuthGuard)
  createSlideVersion(
    @Param('id') classId: string,
    @Param('slideId') slideId: string,
    @Body() dto: CreateSlideVersionDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.classesService.createSlideVersion(
      classId,
      slideId,
      dto.content,
      user.id,
    );
  }

  @Post(':id/slides/:slideId/versions/:versionId/restore')
  @UseGuards(JwtAuthGuard)
  restoreSlideVersion(
    @Param('id') classId: string,
    @Param('slideId') slideId: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.classesService.restoreSlideVersion(
      classId,
      slideId,
      versionId,
      user.id,
    );
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
