import { Controller, Get } from '@nestjs/common';
import { AlliesService } from './allies.service.js';

@Controller('allies')
export class AlliesController {
  constructor(private readonly allies: AlliesService) {}

  // [{ id, name, logoUrl, websiteUrl }] solo de aliados activos, ordenados por position
  @Get()
  list() {
    return this.allies.listPublic();
  }
}
