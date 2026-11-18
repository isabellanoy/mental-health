import { Module } from '@nestjs/common';
import { AuthModule } from '../admin/auth/auth.module.js';
import { AdminRouletteController } from './admin-roulette.controller.js';
import { RouletteController } from './roulette.controller.js';
import { RouletteService } from './roulette.service.js';

@Module({
  imports: [AuthModule],
  controllers: [RouletteController, AdminRouletteController],
  providers: [RouletteService],
})
export class RouletteModule {}
