import { Module } from '@nestjs/common';
import { AuthModule } from '../admin/auth/auth.module.js';
import { AdminSubmissionsController } from './admin-submissions.controller.js';
import { SubmissionsController } from './submissions.controller.js';
import { SubmissionsService } from './submissions.service.js';

@Module({
  imports: [AuthModule],
  controllers: [SubmissionsController, AdminSubmissionsController],
  providers: [SubmissionsService],
})
export class SubmissionsModule {}
