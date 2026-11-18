import { createParamDecorator } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { AuthenticatedAdmin, AuthenticatedRequest } from './admin.types.js';

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedAdmin =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().admin,
);
