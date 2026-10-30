import { Controller, UseGuards, Post, Get, Body, Param, Query, Req, Res, HttpCode } from '@nestjs/common';
import type { Request, Response } from 'express';
import { createTransferSchema, transferDepartureSchema, transferReceiptSchema, type TransferReceiptInput, type TransferDepartureInput, type CreateTransferInput } from '@almacen/contracts';
import { OperationsQueryGuard } from '../platform/http/operations-query.guard.js';
import { mutationHeaders, commandResponse } from '../platform/http/operations.controller.js';
import { TransferWorkflowService } from './transfer-workflow-service.js';
import { TransferService } from './transfer-service.js';
class CreateTransferDto {
  static schema = createTransferSchema;
  declare code: CreateTransferInput['code'];
  declare sourceWarehouseId: CreateTransferInput['sourceWarehouseId'];
  declare targetWarehouseId: CreateTransferInput['targetWarehouseId'];
  declare lines: CreateTransferInput['lines'];
}
class TransferDepartureDto {
  static schema = transferDepartureSchema;
  declare lines: TransferDepartureInput['lines'];
}
class TransferReceiptDto {
  static schema = transferReceiptSchema;
  declare lines: TransferReceiptInput['lines'];
}
@Controller('transfers')
@UseGuards(OperationsQueryGuard)
export class TransfersController {
  constructor(private readonly transfers: TransferService, private readonly workflow: TransferWorkflowService) {
  }
  @Post()
  async create(
  @Req()
  req: Request,
  @Body()
  body: CreateTransferDto,
  @Res({ passthrough: true })
  res: Response) {
    return commandResponse(await this.transfers.create(mutationHeaders(req), body), res);
  }
  @Get()
  async listTransfers(
  @Req()
  req: Request,
  @Query()
  query: Record<string, unknown>) {
    return this.transfers.list(req.headers.cookie, query);
  }
  @Get(':id')
  async detail(
  @Req()
  req: Request,
  @Param('id')
  id: string) {
    return { data: await this.transfers.detail(req.headers.cookie, id) };
  }
  @Post(':id/departure')
  @HttpCode(200)
  async depart(
  @Req()
  req: Request,
  @Param('id')
  id: string,
  @Body()
  body: TransferDepartureDto,
  @Res({ passthrough: true })
  res: Response) {
    return commandResponse(await this.workflow.depart(mutationHeaders(req), id, body), res);
  }
  @Post(':id/receipts')
  @HttpCode(200)
  async receive(
  @Req()
  req: Request,
  @Param('id')
  id: string,
  @Body()
  body: TransferReceiptDto,
  @Res({ passthrough: true })
  res: Response) {
    return commandResponse(await this.workflow.receive(mutationHeaders(req), id, body), res);
  }
}
