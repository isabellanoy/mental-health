import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  // Comprobación de salud: GET /api
  @Get()
  health() {
    return { status: 'ok' };
  }
}
