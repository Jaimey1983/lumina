import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PerformanceIndicatorsService } from './performance-indicators.service';
import { CreateAspectDto } from './dto/create-aspect.dto';
import { UpdateAspectDto } from './dto/update-aspect.dto';
import { CreateIndicatorDto } from './dto/create-indicator.dto';
import { UpdateIndicatorDto } from './dto/update-indicator.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('courses/:courseId/gradebook')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PerformanceIndicatorsController {
  constructor(
    private readonly performanceIndicatorsService: PerformanceIndicatorsService,
  ) {}

  @Post()
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  createStructure(@Param('courseId') courseId: string, @Request() req) {
    return this.performanceIndicatorsService.createStructure(
      courseId,
      req.user.id,
      req.user.role,
    );
  }

  @Get()
  getStructure(@Param('courseId') courseId: string, @Request() req) {
    return this.performanceIndicatorsService.getStructure(
      courseId,
      req.user.id,
      req.user.role,
    );
  }

  @Post('aspects')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  createAspect(
    @Param('courseId') courseId: string,
    @Body() dto: CreateAspectDto,
    @Request() req,
  ) {
    return this.performanceIndicatorsService.createAspect(
      courseId,
      dto,
      req.user.id,
      req.user.role,
    );
  }

  @Patch('aspects/:aspectId')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  updateAspect(
    @Param('courseId') courseId: string,
    @Param('aspectId') aspectId: string,
    @Body() dto: UpdateAspectDto,
    @Request() req,
  ) {
    return this.performanceIndicatorsService.updateAspect(
      courseId,
      aspectId,
      dto,
      req.user.id,
      req.user.role,
    );
  }

  @Delete('aspects/:aspectId')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  deleteAspect(
    @Param('courseId') courseId: string,
    @Param('aspectId') aspectId: string,
    @Request() req,
  ) {
    return this.performanceIndicatorsService.deleteAspect(
      courseId,
      aspectId,
      req.user.id,
      req.user.role,
    );
  }

  @Post('aspects/:aspectId/indicators')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  createIndicator(
    @Param('courseId') courseId: string,
    @Param('aspectId') aspectId: string,
    @Body() dto: CreateIndicatorDto,
    @Request() req,
  ) {
    return this.performanceIndicatorsService.createIndicator(
      courseId,
      aspectId,
      dto,
      req.user.id,
      req.user.role,
    );
  }

  @Patch('indicators/:indicatorId')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  updateIndicator(
    @Param('courseId') courseId: string,
    @Param('indicatorId') indicatorId: string,
    @Body() dto: UpdateIndicatorDto,
    @Request() req,
  ) {
    return this.performanceIndicatorsService.updateIndicator(
      courseId,
      indicatorId,
      dto,
      req.user.id,
      req.user.role,
    );
  }

  @Delete('indicators/:indicatorId')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  deleteIndicator(
    @Param('courseId') courseId: string,
    @Param('indicatorId') indicatorId: string,
    @Request() req,
  ) {
    return this.performanceIndicatorsService.deleteIndicator(
      courseId,
      indicatorId,
      req.user.id,
      req.user.role,
    );
  }
}
