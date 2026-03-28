import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtAuthUser } from '../auth/jwt-auth-user';
import { ClassEditorService } from './class-editor.service';
import { ReorderSlidesDto } from './dto/reorder-slides.dto';
import { ChangeSlideTypeDto } from './dto/change-slide-type.dto';
import { BulkUpdateSlidesDto } from './dto/bulk-update-slides.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('classes/:classId/editor')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassEditorController {
  constructor(private readonly editorService: ClassEditorService) {}

  // ── Reordenar slides ──────────────────────────────────────

  /**
   * PATCH /classes/:classId/editor/slides/reorder
   * El frontend envía el array de { id, order } con los slides reordenados.
   */
  @Patch('slides/reorder')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  reorderSlides(
    @Param('classId') classId: string,
    @Body() dto: ReorderSlidesDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.editorService.reorderSlides(classId, dto, user.id, user.role);
  }

  // ── Bulk update de slides ─────────────────────────────────

  /**
   * PATCH /classes/:classId/editor/slides/bulk
   * Actualiza title y/o content de múltiples slides en una sola llamada.
   * Registrada antes de slides/:slideId/* para evitar conflicto de rutas.
   */
  @Patch('slides/bulk')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  bulkUpdateSlides(
    @Param('classId') classId: string,
    @Body() dto: BulkUpdateSlidesDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.editorService.bulkUpdateSlides(
      classId,
      dto,
      user.id,
      user.role,
    );
  }

  // ── Cambiar tipo de slide ─────────────────────────────────

  /**
   * PATCH /classes/:classId/editor/slides/:slideId/type
   * Cambia el SlideType de una slide individual.
   */
  @Patch('slides/:slideId/type')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  changeSlideType(
    @Param('classId') classId: string,
    @Param('slideId') slideId: string,
    @Body() dto: ChangeSlideTypeDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.editorService.changeSlideType(
      classId,
      slideId,
      dto,
      user.id,
      user.role,
    );
  }

  // ── Duplicar slide ────────────────────────────────────────

  /**
   * POST /classes/:classId/editor/slides/:slideId/duplicate
   * Copia la slide al final de la clase con el mismo tipo y content.
   */
  @Post('slides/:slideId/duplicate')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  duplicateSlide(
    @Param('classId') classId: string,
    @Param('slideId') slideId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.editorService.duplicateSlide(
      classId,
      slideId,
      user.id,
      user.role,
    );
  }

  // ── Duplicar clase ────────────────────────────────────────

  /**
   * POST /classes/:classId/editor/duplicate
   * Crea una nueva clase DRAFT con todas las slides copiadas en orden.
   */
  @Post('duplicate')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  duplicateClass(
    @Param('classId') classId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.editorService.duplicateClass(classId, user.id, user.role);
  }

  // ── Preview ───────────────────────────────────────────────

  /**
   * GET /classes/:classId/editor/preview
   * Devuelve la clase con todas sus slides ordenadas. Solo lectura.
   * Accesible para todos los matriculados en el curso.
   */
  @Get('preview')
  previewClass(
    @Param('classId') classId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.editorService.previewClass(classId, user.id, user.role);
  }
}
