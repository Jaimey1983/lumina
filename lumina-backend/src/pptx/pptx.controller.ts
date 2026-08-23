import {
  Controller,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PptxService } from './pptx.service'

@UseGuards(JwtAuthGuard)
@Controller('classes/:classId/import-pptx')
export class PptxController {
  constructor(private readonly pptxService: PptxService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 50 * 1024 * 1024 },   // 50 MB máximo
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.pptx$/i)) {
        return cb(new BadRequestException('Solo se aceptan archivos .pptx'), false)
      }
      cb(null, true)
    },
  }))
  async importPptx(
    @Param('classId') classId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo')
    const slides = await this.pptxService.importPptx(file.buffer)
    return { classId, slidesImportados: slides.length, slides }
  }
}
