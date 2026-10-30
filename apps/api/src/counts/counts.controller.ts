import { Controller, UseGuards, Post, Get, Body, Param, Query, Req, Res, HttpCode } from '@nestjs/common';
import type { Request, Response } from 'express';
import { createCountSchema, adjustmentSchema, type CreateCountInput } from '@almacen/contracts';
import { OperationsQueryGuard } from '../platform/http/operations-query.guard.js';
import { mutationHeaders, commandResponse } from '../platform/http/operations.controller.js';
import { CountService } from './count-service.js';
class CreateCountDto {
  static schema = createCountSchema;
  declare warehouseId: CreateCountInput['warehouseId'];
  declare locationId: CreateCountInput['locationId'];
  declare productId: CreateCountInput['productId'];
  declare observed: CreateCountInput['observed'];
}
class AdjustmentDto {
  static schema = adjustmentSchema;
  declare reason: unknown;
}
@Controller('counts')
@UseGuards(OperationsQueryGuard)
export class CountsController {
  constructor(private readonly counts: CountService) {
  }
  @Post()
  async create(
  @Req()
  req: Request,
  @Body()
  body: CreateCountDto,
  @Res({ passthrough: true })
  res: Response) {
    return commandResponse(await this.counts.create(mutationHeaders(req), body), res);
  }
  @Get()
  async listCounts(
  @Req()
  req: Request,
  @Query()
  query: Record<string, unknown>) {
    return this.counts.list(req.headers.cookie, query);
  }
  @Get(':id')
  async detail(
  @Req()
  req: Request,
  @Param('id')
  id: string) {
    return { data: await this.counts.detail(req.headers.cookie, id) };
  }
  @Post(':id/adjustment')
  @HttpCode(200)
  async adjust(
  @Req()
  req: Request,
  @Param('id')
  id: string,
  @Body()
  body: AdjustmentDto,
  @Res({ passthrough: true })
  res: Response) {
    return commandResponse(await this.counts.adjust(mutationHeaders(req), id, body), res);
  }
}
