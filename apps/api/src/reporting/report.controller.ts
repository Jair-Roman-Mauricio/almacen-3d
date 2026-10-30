import { Controller, Get, Req, Query, UseGuards, Put, Body, Res } from '@nestjs/common';
import { thresholdSchema } from '@almacen/contracts';
import { mutationHeaders, commandResponse } from '../platform/http/operations.controller.js';
import type { Request, Response } from 'express';
import { OperationsQueryGuard } from '../platform/http/operations-query.guard.js';
import { ReportService } from './report-service.js';
class ThresholdDto {
  static schema = thresholdSchema;
  declare warehouseId: string;
  declare productId: string;
  declare quantity: unknown;
}
@Controller()
@UseGuards(OperationsQueryGuard)
export class ReportController {
  constructor(private readonly reports: ReportService) {
  }
  @Put('thresholds')
  async threshold(
  @Req()
  req: Request,
  @Body()
  body: ThresholdDto,
  @Res({ passthrough: true })
  res: Response) {
    return commandResponse(await this.reports.threshold(mutationHeaders(req), body), res);
  }
  @Get('alerts')
  async alerts(
  @Req()
  req: Request,
  @Query()
  query: Record<string, unknown>) {
    return this.reports.alerts(req.headers.cookie, query);
  }
  @Get('dashboard')
  async dashboard(
  @Req()
  req: Request,
  @Query()
  query: Record<string, unknown>) {
    return { data: await this.reports.dashboard(req.headers.cookie, query) };
  }
}
