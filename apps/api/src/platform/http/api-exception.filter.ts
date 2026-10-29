import { randomUUID } from 'node:crypto';
import { Catch, HttpException, Logger } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiException } from './api-exception.js';
import type { ErrorPayload } from './api-exception.js';

export interface RequestContext extends Request { requestId?: string }

const internal = { code: 'INTERNAL_ERROR', message: 'No se pudo completar la solicitud.' };
const statusErrors: Record<number, { code: string; message: string }> = {
  400: { code: 'INVALID_INPUT', message: 'Revisa los datos enviados.' },
  401: { code: 'SESSION_INVALID', message: 'Inicia sesión para continuar.' },
  403: { code: 'FORBIDDEN', message: 'No tienes permiso para realizar esta acción.' },
  404: { code: 'NOT_FOUND', message: 'No se encontró el recurso solicitado.' },
  409: { code: 'CONFLICT', message: 'La operación entra en conflicto con el estado actual.' },
  413: { code: 'FILE_TOO_LARGE', message: 'El archivo supera el tamaño admitido.' },
  422: { code: 'BUSINESS_VALIDATION', message: 'La operación no cumple las reglas de validación.' },
  500: internal,
  503: { code: 'TEMPORARY_FAILURE', message: 'El servicio no está disponible temporalmente.' },
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<RequestContext>();
    const response = context.getResponse<Response>();
    const requestId = request.requestId ?? randomUUID();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    const payload: ErrorPayload = exception instanceof ApiException
      ? exception.payload
      : { ...(statusErrors[status] ?? internal), details: [] };
    if (status >= 500) this.logger.error(`Fallo interno en solicitud ${requestId}`);
    response.setHeader('X-Request-ID', requestId);
    response.status(status).json({ error: { ...payload, requestId } });
  }
}
