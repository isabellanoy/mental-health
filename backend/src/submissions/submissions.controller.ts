import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CreateSubmissionDto } from './dto/create-submission.dto.js';
import { SubmissionsService } from './submissions.service.js';

@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissions: SubmissionsService) {}

  // 5 envíos por minuto y por IP
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateSubmissionDto) {
    // Honeypot: si un bot lo llenó, se responde igual de bien pero no se guarda nada
    if (dto.website) return { ok: true };

    await this.submissions.create(dto);
    return { ok: true };
  }
}
