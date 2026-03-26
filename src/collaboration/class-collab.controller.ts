import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CollaborationService } from './collaboration.service';
import { CreateWhiteboardDto } from './dto/create-whiteboard.dto';
import { UpdateWhiteboardDto } from './dto/update-whiteboard.dto';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

/**
 * Funcionalidades de colaboración a nivel de clase:
 * pizarras colaborativas y notas colaborativas.
 */
@UseGuards(JwtAuthGuard)
@Controller('courses/:courseId/classes/:classId/collaboration')
export class ClassCollabController {
  constructor(private readonly collabService: CollaborationService) {}

  // ── Pizarras ──────────────────────────────────────────────

  @Post('whiteboards')
  createWhiteboard(
    @Param('courseId') courseId: string,
    @Param('classId') classId: string,
    @Body() dto: CreateWhiteboardDto,
    @Request() req: any,
  ) {
    return this.collabService.createWhiteboard(courseId, classId, dto, req.user.id, req.user.role);
  }

  @Get('whiteboards')
  listWhiteboards(
    @Param('courseId') courseId: string,
    @Param('classId') classId: string,
    @Request() req: any,
  ) {
    return this.collabService.listWhiteboards(courseId, classId, req.user.id, req.user.role);
  }

  @Get('whiteboards/:sessionId')
  getWhiteboard(
    @Param('courseId') courseId: string,
    @Param('classId') classId: string,
    @Param('sessionId') sessionId: string,
    @Request() req: any,
  ) {
    return this.collabService.getWhiteboard(courseId, classId, sessionId, req.user.id, req.user.role);
  }

  @Patch('whiteboards/:sessionId')
  updateWhiteboard(
    @Param('courseId') courseId: string,
    @Param('classId') classId: string,
    @Param('sessionId') sessionId: string,
    @Body() dto: UpdateWhiteboardDto,
    @Request() req: any,
  ) {
    return this.collabService.updateWhiteboard(courseId, classId, sessionId, dto, req.user.id, req.user.role);
  }

  @Delete('whiteboards/:sessionId')
  @HttpCode(HttpStatus.OK)
  deleteWhiteboard(
    @Param('courseId') courseId: string,
    @Param('classId') classId: string,
    @Param('sessionId') sessionId: string,
    @Request() req: any,
  ) {
    return this.collabService.deleteWhiteboard(courseId, classId, sessionId, req.user.id, req.user.role);
  }

  // ── Notas colaborativas ───────────────────────────────────

  @Post('notes')
  createNote(
    @Param('courseId') courseId: string,
    @Param('classId') classId: string,
    @Body() dto: CreateNoteDto,
    @Request() req: any,
  ) {
    return this.collabService.createNote(courseId, classId, dto, req.user.id, req.user.role);
  }

  @Get('notes')
  listNotes(
    @Param('courseId') courseId: string,
    @Param('classId') classId: string,
    @Request() req: any,
  ) {
    return this.collabService.listNotes(courseId, classId, req.user.id, req.user.role);
  }

  // Nota: 'notes/:noteId/history' (literal 'history') registrado antes de 'notes/:noteId'
  @Get('notes/:noteId/history')
  getNoteHistory(
    @Param('courseId') courseId: string,
    @Param('classId') classId: string,
    @Param('noteId') noteId: string,
    @Request() req: any,
  ) {
    return this.collabService.getNoteHistory(courseId, classId, noteId, req.user.id, req.user.role);
  }

  @Get('notes/:noteId')
  getNote(
    @Param('courseId') courseId: string,
    @Param('classId') classId: string,
    @Param('noteId') noteId: string,
    @Request() req: any,
  ) {
    return this.collabService.getNote(courseId, classId, noteId, req.user.id, req.user.role);
  }

  @Patch('notes/:noteId')
  updateNote(
    @Param('courseId') courseId: string,
    @Param('classId') classId: string,
    @Param('noteId') noteId: string,
    @Body() dto: UpdateNoteDto,
    @Request() req: any,
  ) {
    return this.collabService.updateNote(courseId, classId, noteId, dto, req.user.id, req.user.role);
  }

  @Delete('notes/:noteId')
  @HttpCode(HttpStatus.OK)
  deleteNote(
    @Param('courseId') courseId: string,
    @Param('classId') classId: string,
    @Param('noteId') noteId: string,
    @Request() req: any,
  ) {
    return this.collabService.deleteNote(courseId, classId, noteId, req.user.id, req.user.role);
  }
}
