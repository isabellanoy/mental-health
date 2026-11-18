import { Controller, Get } from '@nestjs/common';
import { RouletteService } from './roulette.service.js';

@Controller('roulette-images')
export class RouletteController {
  constructor(private readonly roulette: RouletteService) {}

  // [{ id, imageUrl }] solo de imágenes activas
  @Get()
  list() {
    return this.roulette.listPublic();
  }
}
