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
import { UpdateSubmissionDto } from './dto/update-submission.dto.js';
import {
  ExportSubmissionsQueryDto,
  ListSubmissionsQueryDto,
} from './dto/submission-query.dto.js';
import { SubmissionsService } from './submissions.service.js';

const INVALID_ID = 'El identificador no es válido.';

@UseGuards(AdminGuard)
@Controller('admin')
export class AdminSubmissionsController {
  constructor(private readonly submissions: SubmissionsService) {}

  @Get('stats')
  stats() {
    return this.submissions.stats();
  }

  @Get('submissions')
  list(@Query() query: ListSubmissionsQueryDto) {
    return this.submissions.list(query);
  }

  @Get('submissions/export')
  async export(
    @Query() query: ExportSubmissionsQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const csv = await this.submissions.exportCsv(query);
    const stamp = new Date().toISOString().slice(0, 10);
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="solicitudes-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    });
    return csv;
  }

  @Patch('submissions/:id')
  update(
    @Param('id', new ParseUUIDPipe({ exceptionFactory: () => new BadRequestException(INVALID_ID) }))
    id: string,
    @Body() dto: UpdateSubmissionDto,
  ) {
    if (dto.status === undefined && dto.notes === undefined) {
      throw new BadRequestException('Envía al menos "status" o "notes" para actualizar.');
    }
    return this.submissions.update(id, dto);
  }

  @Delete('submissions/:id')
  @HttpCode(204)
  async remove(
    @Param('id', new ParseUUIDPipe({ exceptionFactory: () => new BadRequestException(INVALID_ID) }))
    id: string,
  ) {
    await this.submissions.remove(id);
  }
}
