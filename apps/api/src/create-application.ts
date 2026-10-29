import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import { AppModule } from './app.module.js';
import { ApiExceptionFilter } from './platform/http/api-exception.filter.js';
import type { RequestContext } from './platform/http/api-exception.filter.js';
import { ZodValidationPipe } from './platform/http/zod-validation.pipe.js';

export function configureApplication(app: INestApplication): void {
  app.setGlobalPrefix('api/v1');
  app.use((request: RequestContext, response: Response, next: NextFunction) => {
    request.requestId = randomUUID();
    response.setHeader('X-Request-ID', request.requestId);
    next();
  });
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new ApiExceptionFilter());
}

export async function createApplication(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  configureApplication(app);
  return app;
}
