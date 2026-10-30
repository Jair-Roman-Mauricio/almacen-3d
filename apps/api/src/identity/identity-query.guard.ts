import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { ApiException } from '../platform/http/api-exception.js';
/** Identity routes accept filters only on the team list. */
export class IdentityQueryGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const allowed = context.getHandler().name === 'users' ? ['q', 'cursor', 'limit'] : [];
    const request = context.switchToHttp().getRequest<Request>();
    if (Object.keys(request.query).some(key => !allowed.includes(key)))
      throw new ApiException(400, { code: 'INVALID_INPUT', message: 'La solicitud contiene filtros no admitidos.', details: [] });
    return true;
  }
}
