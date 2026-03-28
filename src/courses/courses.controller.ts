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
  create(@Body() dto: CreateCourseDto, @CurrentUser() user: JwtAuthUser) {
    return this.coursesService.create(dto, user.id);
  }

  // GET /courses?page=1&limit=20
  @Get()
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.coursesService.findAll(+page, +limit, user.id, user.role);
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
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.coursesService.update(id, dto, user.id, user.role);
  }

  // DELETE /courses/:id
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  remove(@Param('id') id: string, @CurrentUser() user: JwtAuthUser) {
    return this.coursesService.remove(id, user.id, user.role);
  }

  // POST /courses/:id/enroll
  @Post(':id/enroll')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  enrollStudent(@Param('id') courseId: string, @Body() dto: EnrollStudentDto) {
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
