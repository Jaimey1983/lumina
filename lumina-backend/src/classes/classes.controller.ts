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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('classes')
@UseGuards(JwtAuthGuard)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  // ─── CLASES ────────────────────────────────────────────

  @Post()
  @UseGuards(RolesGuard)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  create(@Body() dto: CreateClassDto, @CurrentUser() user: JwtAuthUser) {
    return this.classesService.create(dto, user.id);
  }

  @Get()
  findAll(
    @Query('courseId') courseId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.classesService.findAllByCourse(courseId, user.id, user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtAuthUser) {
    return this.classesService.findOne(id, user.id, user.role);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClassDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.classesService.update(id, dto, user.id);
  }

  @Post(':id/publish')
  @UseGuards(RolesGuard)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  publish(@Param('id') id: string, @CurrentUser() user: JwtAuthUser) {
    return this.classesService.publish(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  remove(@Param('id') id: string, @CurrentUser() user: JwtAuthUser) {
    return this.classesService.remove(id, user.id);
  }

  // ─── SLIDES ────────────────────────────────────────────

  @Patch(':id/slides/reorder')
  @UseGuards(RolesGuard)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  reorderSlides(
    @Param('id') classId: string,
    @Body() body: { order: { id: string; order: number }[] },
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.classesService.reorderSlides(classId, user.id, body.order);
  }

  @Post(':id/slides/insert')
  @UseGuards(RolesGuard)
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
  @UseGuards(RolesGuard)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  addSlide(
    @Param('id') classId: string,
    @Body() dto: CreateSlideDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.classesService.addSlide(classId, dto, user.id);
  }

  @Patch(':id/slides/:slideId')
  @UseGuards(RolesGuard)
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
  @UseGuards(RolesGuard)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  removeSlide(
    @Param('id') classId: string,
    @Param('slideId') slideId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.classesService.removeSlide(classId, slideId, user.id);
  }
}
