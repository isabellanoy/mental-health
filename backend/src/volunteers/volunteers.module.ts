import { Module } from '@nestjs/common';
import { AuthModule } from '../admin/auth/auth.module.js';
import { AdminVolunteersController } from './admin-volunteers.controller.js';
import { VolunteersController } from './volunteers.controller.js';
import { VolunteersService } from './volunteers.service.js';

@Module({
  imports: [AuthModule],
  controllers: [VolunteersController, AdminVolunteersController],
  providers: [VolunteersService],
})
export class VolunteersModule {}
