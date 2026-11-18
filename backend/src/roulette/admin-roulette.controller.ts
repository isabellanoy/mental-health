import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AdminGuard } from '../admin/auth/admin.guard.js';
import { IMAGE_RULES } from '../common/upload/image-validation.js';
import type { UploadedImage } from '../common/upload/image-validation.js';
import { UpdateRouletteImageDto } from './dto/update-roulette-image.dto.js';
import { RouletteService } from './roulette.service.js';

const MAX_FILES = 10;
const INVALID_ID = 'El identificador no es válido.';

@UseGuards(AdminGuard)
@Controller('admin/roulette-images')
export class AdminRouletteController {
  constructor(private readonly roulette: RouletteService) {}

  @Get()
  list() {
    return this.roulette.listAll();
  }

  @Post()
  @UseInterceptors(
    FilesInterceptor('files', MAX_FILES, {
      limits: { fileSize: IMAGE_RULES.roulette.maxBytes, files: MAX_FILES },
    }),
  )
  create(@UploadedFiles() files: UploadedImage[] | undefined) {
    return this.roulette.createMany(files);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe({ exceptionFactory: () => new BadRequestException(INVALID_ID) }))
    id: string,
    @Body() dto: UpdateRouletteImageDto,
  ) {
    return this.roulette.setActive(id, dto.active);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Param('id', new ParseUUIDPipe({ exceptionFactory: () => new BadRequestException(INVALID_ID) }))
    id: string,
  ) {
    await this.roulette.remove(id);
  }
}
