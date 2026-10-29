import { HttpException } from '@nestjs/common';

export interface ErrorDetail {
  field?: string;
  row?: number;
  elementId?: string;
  reason: string;
}

export interface ErrorPayload {
  code: string;
  message: string;
  details: ErrorDetail[];
}

export class ApiException extends HttpException {
  constructor(status: number, readonly payload: ErrorPayload) {
    super(payload, status);
  }
}
