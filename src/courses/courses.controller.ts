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
  } from '@nestjs/common';
  import { CoursesService } from './courses.service';
  import { CreateCourseDto } from './dto/create-course.dto';
  import { UpdateCourseDto } from './dto/update-course.dto';
  import { EnrollStudentDto } from './dto/enroll-student.dto';
  import { JwtAuthGuard } from '../auth/jwt-auth.guard';
  import { RolesGuard } from '../auth/roles.guard';
  import { Roles } from '../auth/roles.decorator';
  
  @Controller('courses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  export class CoursesController {
    constructor(private readonly coursesService: CoursesService) {}
  
    // POST /courses
    @Post()
    @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
    create(@Body() dto: CreateCourseDto, @Request() req) {
      return this.coursesService.create(dto, req.user.id);
    }
  
    // GET /courses?page=1&limit=20
    @Get()
    findAll(
      @Query('page') page = '1',
      @Query('limit') limit = '20',
      @Request() req,
    ) {
      return this.coursesService.findAll(+page, +limit, req.user.id, req.user.role);
    }
  
    // GET /courses/:id
    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.coursesService.findOne(id);
    }
  
    // PATCH /courses/:id
    @Patch(':id')
    @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
    update(
      @Param('id') id: string,
      @Body() dto: UpdateCourseDto,
      @Request() req,
    ) {
      return this.coursesService.update(id, dto, req.user.id, req.user.role);
    }
  
    // DELETE /courses/:id
    @Delete(':id')
    @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
    remove(@Param('id') id: string, @Request() req) {
      return this.coursesService.remove(id, req.user.id, req.user.role);
    }
  
    // POST /courses/:id/enroll
    @Post(':id/enroll')
    @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
    enrollStudent(
      @Param('id') courseId: string,
      @Body() dto: EnrollStudentDto,
    ) {
      return this.coursesService.enrollStudent(courseId, dto);
    }
  
    // GET /courses/:id/students
    @Get(':id/students')
    @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
    findStudents(
      @Param('id') courseId: string,
      @Query('page') page = '1',
      @Query('limit') limit = '20',
    ) {
      return this.coursesService.findStudents(courseId, +page, +limit);
    }
}
  
