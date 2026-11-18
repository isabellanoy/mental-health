import { Module } from '@nestjs/common';
import { AuthModule } from '../admin/auth/auth.module.js';
import { AdminAlliesController } from './admin-allies.controller.js';
import { AlliesController } from './allies.controller.js';
import { AlliesService } from './allies.service.js';

@Module({
  imports: [AuthModule],
  controllers: [AlliesController, AdminAlliesController],
  providers: [AlliesService],
})
export class AlliesModule {}
