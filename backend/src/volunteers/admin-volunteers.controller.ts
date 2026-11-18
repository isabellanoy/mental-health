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
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AdminGuard } from '../admin/auth/admin.guard.js';
import { UpdateVolunteerDto } from './dto/update-volunteer.dto.js';
import {
  ExportVolunteersQueryDto,
  ListVolunteersQueryDto,
} from './dto/volunteer-query.dto.js';
import { VolunteersService } from './volunteers.service.js';

const INVALID_ID = 'El identificador no es válido.';

@UseGuards(AdminGuard)
@Controller('admin/volunteers')
export class AdminVolunteersController {
  constructor(private readonly volunteers: VolunteersService) {}

  @Get()
  list(@Query() query: ListVolunteersQueryDto) {
    return this.volunteers.list(query);
  }

  @Get('export')
  async export(
    @Query() query: ExportVolunteersQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const csv = await this.volunteers.exportCsv(query);
    const stamp = new Date().toISOString().slice(0, 10);
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="voluntarios-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    });
    return csv;
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe({ exceptionFactory: () => new BadRequestException(INVALID_ID) }))
    id: string,
    @Body() dto: UpdateVolunteerDto,
  ) {
    if (dto.status === undefined && dto.notes === undefined) {
      throw new BadRequestException('Envía al menos "status" o "notes" para actualizar.');
    }
    return this.volunteers.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Param('id', new ParseUUIDPipe({ exceptionFactory: () => new BadRequestException(INVALID_ID) }))
    id: string,
  ) {
    await this.volunteers.remove(id);
  }
}
