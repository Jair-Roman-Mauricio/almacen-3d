import { Body, Controller, Post, Get, Param, Query, Req, Res, UseGuards, HttpCode, Put } from '@nestjs/common';
import type { Request, Response } from 'express';
import { createOrderSchema, reservationsSchema, assignmentSchema, allocationActionSchema, cancelOrderSchema, type AllocationActionInput, type ReservationsInput, type CreateOrderInput } from '@almacen/contracts';
import { OperationsQueryGuard } from '../platform/http/operations-query.guard.js';
import { mutationHeaders, commandResponse } from '../platform/http/operations.controller.js';
import { OrderWorkflowService } from './order-workflow-service.js';
import { OrderService } from './order-service.js';
class CreateOrderDto {
  static schema = createOrderSchema;
  declare code: CreateOrderInput['code'];
  declare warehouseId: CreateOrderInput['warehouseId'];
  declare lines: CreateOrderInput['lines'];
}
class ReservationsDto {
  static schema = reservationsSchema;
  declare lines: ReservationsInput['lines'];
}
class AssignmentDto {
  static schema = assignmentSchema;
  declare operatorId: string;
}
class AllocationActionDto {
  static schema = allocationActionSchema;
  declare lines: AllocationActionInput['lines'];
}
class CancelOrderDto {
  static schema = cancelOrderSchema;
}
@Controller('orders')
@UseGuards(OperationsQueryGuard)
export class OrdersController {
  constructor(private readonly orders: OrderService, private readonly workflow: OrderWorkflowService) {
  }
  @Post()
  async create(
  @Req()
  req: Request,
  @Body()
  body: CreateOrderDto,
  @Res({ passthrough: true })
  res: Response) {
    return commandResponse(await this.orders.create(mutationHeaders(req), body), res);
  }
  @Get()
  async listOrders(
  @Req()
  req: Request,
  @Query()
  query: Record<string, unknown>) {
    return this.orders.list(req.headers.cookie, query);
  }
  @Get(':id')
  async detail(
  @Req()
  req: Request,
  @Param('id')
  id: string) {
    return { data: await this.orders.detail(req.headers.cookie, id) };
  }
  @Post(':id/reservations')
  @HttpCode(200)
  async reserve(
  @Req()
  req: Request,
  @Param('id')
  id: string,
  @Body()
  body: ReservationsDto,
  @Res({ passthrough: true })
  res: Response) {
    return commandResponse(await this.workflow.reserve(mutationHeaders(req), id, body), res);
  }
  @Put(':id/assignment')
  async assign(
  @Req()
  req: Request,
  @Param('id')
  id: string,
  @Body()
  body: AssignmentDto,
  @Res({ passthrough: true })
  res: Response) {
    return commandResponse(await this.workflow.assign(mutationHeaders(req), id, body), res);
  }
  @Post(':id/preparations')
  @HttpCode(200)
  async prepare(
  @Req()
  req: Request,
  @Param('id')
  id: string,
  @Body()
  body: AllocationActionDto,
  @Res({ passthrough: true })
  res: Response) {
    return commandResponse(await this.workflow.prepare(mutationHeaders(req), id, body), res);
  }
  @Post(':id/dispatches')
  @HttpCode(200)
  async dispatch(
  @Req()
  req: Request,
  @Param('id')
  id: string,
  @Body()
  body: AllocationActionDto,
  @Res({ passthrough: true })
  res: Response) {
    return commandResponse(await this.workflow.dispatch(mutationHeaders(req), id, body), res);
  }
  @Post(':id/cancellation')
  @HttpCode(200)
  async cancel(
  @Req()
  req: Request,
  @Param('id')
  id: string,
  @Body()
  _body: CancelOrderDto,
  @Res({ passthrough: true })
  res: Response) {
    return commandResponse(await this.workflow.cancel(mutationHeaders(req), id), res);
  }
}
