import { DomainError } from '@almacen/domain';
import { randomUUID } from 'node:crypto';
import { Catch, HttpException, Logger } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiException } from './api-exception.js';
import type { ErrorPayload } from './api-exception.js';

export interface RequestContext extends Request { requestId?: string }

const internal = { code: 'INTERNAL_ERROR', message: 'No se pudo completar la solicitud.' };
const domainStatuses:Record<string,number>={DEMO_UNAVAILABLE:404,IMPORT_INVALID_ROWS:422,INITIAL_STOCK_EXISTS:409,IMPORT_STATE_CONFLICT:409,IMPORT_NOT_VALIDATED:409,CONTENT_CHANGED:409,FILE_TOO_LARGE:413,INVALID_FILE:422,FORMAT:422,ROW_LIMIT:422,COUNT_ALREADY_ADJUSTED:409,COUNT_STALE:409,RESERVED_STOCK_PROTECTED:409,INVALID_COUNT:422,NOT_DEPARTED:409,TRANSIT_BALANCE_EXCEEDED:409,INVALID_TRANSFER:422,ALREADY_DEPARTED:409,SAME_WAREHOUSE:422,ORDER_ALREADY_PREPARED:409,ORDER_ALREADY_DISPATCHED:409,PREPARED_BALANCE_EXCEEDED:409,RESERVATION_BALANCE_EXCEEDED:409,NOT_ASSIGNED:403,PREPARATION_BALANCE_EXCEEDED:409,INVALID_ASSIGNEE:422,ORDER_BALANCE_EXCEEDED:409,ORDER_CLOSED:409,INVALID_DATE_RANGE:400,LOCATION_BLOCKED:409,REASON_REQUIRED:422,SAME_LOCATION:422,INSUFFICIENT_AVAILABLE:409,INVALID_QUANTITY:422,UNIT_PRECISION:422,ELEMENT_OCCUPIED:409,OPEN_WORK:409,LAYOUT_STALE:409,INVALID_HIERARCHY:422,CONTAINMENT:422,PRODUCT_IN_USE:409,INVALID_UNIT:422,SKU_EXISTS:409,INVALID_DIMENSIONS:422,CODE_EXISTS:409,INVALID_NAME:422,INVALID_CODE:422,INVALID_EMAIL:422,INVALID_TIME_ZONE:422,INVALID_ROLE:422,REQUIRED_FIELD:422,INVALID_REFERENCE:400,SESSION_INVALID:401,INVALID_CREDENTIALS:401,FORBIDDEN:403,CSRF_INVALID:403,ORIGIN_INVALID:403,NOT_FOUND:404,RESULT_NOT_RECORDED:404,MODE_UNAVAILABLE:404,COMPANY_CODE_EXISTS:409,EMAIL_EXISTS:409,ALREADY_CONFIGURED:409,LAST_ACTIVE_ADMIN:409,REFERENCE_REUSED:409,TEMPORARY_FAILURE:503};
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
    const domain=exception instanceof DomainError&&domainStatuses[exception.code]?exception:null;
    const bodyError=exception&&typeof exception==='object'&&'type' in exception?(exception.type==='entity.too.large'?413:exception.type==='entity.parse.failed'?400:null):null;
    const status = bodyError??(exception instanceof HttpException ? exception.getStatus() : domain?domainStatuses[domain.code]!:500);
    const payload: ErrorPayload = exception instanceof ApiException
      ? exception.payload
      : domain?{code:domain.code,message:domain.message,details:Object.keys(domain.details).length?[{...domain.details,reason:domain.message}]:[]}: { ...(statusErrors[status] ?? internal), details: [] };
    if (status >= 500) this.logger.error(`Fallo interno en solicitud ${requestId}`);
    response.setHeader('X-Request-ID', requestId);
    response.status(status).json({ error: { ...payload, requestId } });
  }
}
