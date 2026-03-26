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
  } from '@nestjs/common';
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
    create(@Body() dto: CreateClassDto, @Request() req) {
      return this.classesService.create(dto, req.user.id);
    }
  
    @Get()
    findAll(@Query('courseId') courseId: string, @Request() req) {
      return this.classesService.findAllByCourse(courseId, req.user.id, req.user.role);
    }
  
    @Get(':id')
    findOne(@Param('id') id: string, @Request() req) {
      return this.classesService.findOne(id, req.user.id, req.user.role);
    }
  
    @Patch(':id')
    @UseGuards(RolesGuard)
    @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
    update(@Param('id') id: string, @Body() dto: UpdateClassDto, @Request() req) {
      return this.classesService.update(id, dto, req.user.id);
    }
  
    @Post(':id/publish')
    @UseGuards(RolesGuard)
    @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
    publish(@Param('id') id: string, @Request() req) {
      return this.classesService.publish(id, req.user.id);
    }
  
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @UseGuards(RolesGuard)
    @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
    remove(@Param('id') id: string, @Request() req) {
      return this.classesService.remove(id, req.user.id);
    }
  
    // ─── SLIDES ────────────────────────────────────────────
  
    @Post(':id/slides')
    @UseGuards(RolesGuard)
    @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
    addSlide(
      @Param('id') classId: string,
      @Body() dto: CreateSlideDto,
      @Request() req,
    ) {
      return this.classesService.addSlide(classId, dto, req.user.id);
    }
  
    @Patch(':id/slides/:slideId')
    @UseGuards(RolesGuard)
    @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
    updateSlide(
      @Param('id') classId: string,
      @Param('slideId') slideId: string,
      @Body() dto: UpdateSlideDto,
      @Request() req,
    ) {
      return this.classesService.updateSlide(classId, slideId, dto, req.user.id);
    }
  
    @Delete(':id/slides/:slideId')
    @HttpCode(HttpStatus.OK)
    @UseGuards(RolesGuard)
    @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
    removeSlide(
      @Param('id') classId: string,
      @Param('slideId') slideId: string,
      @Request() req,
    ) {
      return this.classesService.removeSlide(classId, slideId, req.user.id);
    }
  }
