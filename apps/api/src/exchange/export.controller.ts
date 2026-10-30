import { Controller, Get, Req, Res, Query, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { OperationsQueryGuard } from '../platform/http/operations-query.guard.js';
import { ExportService } from './export-service.js';
@Controller('exports')
@UseGuards(OperationsQueryGuard)
export class ExportController {
  constructor(private readonly exports: ExportService) {
  }
  private async download(req: Request, res: Response, query: Record<string, unknown>, kind: 'inventory' | 'history') {
    const result = await this.exports.data(req.headers.cookie, query, kind);
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('X-Export-Filters', encodeURIComponent(JSON.stringify(result.filters)));
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(result.fileName)}`);
    res.send(result.bytes);
  }
  @Get('inventory')
  async exportInventory(
  @Req()
  req: Request,
  @Res()
  res: Response,
  @Query()
  query: Record<string, unknown>) {
    await this.download(req, res, query, 'inventory');
  }
  @Get('history')
  async exportHistory(
  @Req()
  req: Request,
  @Res()
  res: Response,
  @Query()
  query: Record<string, unknown>) {
    await this.download(req, res, query, 'history');
  }
}
