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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminGuard } from '../admin/auth/admin.guard.js';
import { IMAGE_RULES } from '../common/upload/image-validation.js';
import type { UploadedImage } from '../common/upload/image-validation.js';
import { AlliesService } from './allies.service.js';
import { CreateAllyDto } from './dto/create-ally.dto.js';
import { UpdateAllyDto } from './dto/update-ally.dto.js';

const INVALID_ID = 'El identificador no es válido.';
const logoInterceptor = () =>
  FileInterceptor('logo', { limits: { fileSize: IMAGE_RULES.logo.maxBytes, files: 1 } });

@UseGuards(AdminGuard)
@Controller('admin/allies')
export class AdminAlliesController {
  constructor(private readonly allies: AlliesService) {}

  @Get()
  list() {
    return this.allies.listAll();
  }

  @Post()
  @UseInterceptors(logoInterceptor())
  create(@Body() dto: CreateAllyDto, @UploadedFile() logo: UploadedImage | undefined) {
    return this.allies.create(dto, logo);
  }

  @Patch(':id')
  @UseInterceptors(logoInterceptor())
  update(
    @Param('id', new ParseUUIDPipe({ exceptionFactory: () => new BadRequestException(INVALID_ID) }))
    id: string,
    @Body() dto: UpdateAllyDto,
    @UploadedFile() logo: UploadedImage | undefined,
  ) {
    return this.allies.update(id, dto, logo);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Param('id', new ParseUUIDPipe({ exceptionFactory: () => new BadRequestException(INVALID_ID) }))
    id: string,
  ) {
    await this.allies.remove(id);
  }
}
