import { gzip } from 'node:zlib';
import { promisify } from 'node:util';
import { Body, Controller, Get, Post, Query, Req, Res, Patch, Param, Delete, Put, HttpCode, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { createWarehouseSchema, createProductSchema, updateProductSchema, saveLayoutSchema, receiptSchema, moveSchema, blockLocationSchema, unblockLocationSchema, type MoveInput, type ReceiptInput, type SaveLayoutInput, type CreateProductInput, type CreateWarehouseInput } from '@almacen/contracts';
import { HistoryService } from '../../inventory/history-service.js';
import { LocationService } from '../../inventory/location-service.js';
import { PhysicalOperationsService } from '../../inventory/physical-operations-service.js';
import { InventoryService } from '../../inventory/inventory-service.js';
import { CatalogueService } from '../../catalogue/catalogue-service.js';
import { LayoutService } from '../../warehouses/layout-service.js';
import { OperationsQueryGuard } from './operations-query.guard.js';
import { WarehouseService } from '../../warehouses/warehouse-service.js';
export function mutationHeaders(request: Request) {
  return { cookie: request.headers.cookie, origin: request.get('origin'), csrf: request.get('x-csrf-token'), reference: request.get('idempotency-key'), contentType: request.get('content-type') };
}
export function commandResponse(result: {
  operation: unknown;
  replayed: boolean;
}, response: Response) {
  response.setHeader('Cache-Control', 'no-store');
  if (result.replayed)
    response.setHeader('Idempotent-Replayed', 'true');
  return { data: result.operation };
}
class CreateWarehouseDto {
  static schema = createWarehouseSchema;
  declare code: CreateWarehouseInput['code'];
  declare name: CreateWarehouseInput['name'];
  declare dimensions: CreateWarehouseInput['dimensions'];
}
class CreateProductDto {
  static schema = createProductSchema;
  declare sku: CreateProductInput['sku'];
  declare name: CreateProductInput['name'];
  declare unit: CreateProductInput['unit'];
}
class UpdateProductDto {
  static schema = updateProductSchema;
  declare name: unknown;
}
class SaveLayoutDto {
  static schema = saveLayoutSchema;
  declare baseRevision: SaveLayoutInput['baseRevision'];
  declare elements: SaveLayoutInput['elements'];
}
class ReceiptDto {
  static schema = receiptSchema;
  declare warehouseId: ReceiptInput['warehouseId'];
  declare lines: ReceiptInput['lines'];
}
class MoveDto {
  static schema = moveSchema;
  declare warehouseId: MoveInput['warehouseId'];
  declare lines: MoveInput['lines'];
}
class BlockLocationDto {
  static schema = blockLocationSchema;
}
class UnblockLocationDto {
  static schema = unblockLocationSchema;
  declare reason: unknown;
}
@Controller()
@UseGuards(OperationsQueryGuard)
export class OperationsController {
  constructor(private readonly warehouses: WarehouseService, private readonly catalogue: CatalogueService, private readonly layouts: LayoutService, private readonly inventory: InventoryService, private readonly physical: PhysicalOperationsService, private readonly locationsService: LocationService, private readonly historyService: HistoryService) {
  }
  @Post('warehouses')
  async createWarehouse(
  @Req()
  req: Request,
  @Body()
  body: CreateWarehouseDto,
  @Res({ passthrough: true })
  res: Response) {
    return commandResponse(await this.warehouses.create(mutationHeaders(req), body), res);
  }
  @Get('warehouses')
  async listWarehouses(
  @Req()
  req: Request,
  @Query()
  query: Record<string, unknown>) {
    return this.warehouses.list(req.headers.cookie, query);
  }
  @Post('products')
  async createProduct(
  @Req()
  req: Request,
  @Body()
  body: CreateProductDto,
  @Res({ passthrough: true })
  res: Response) {
    return commandResponse(await this.catalogue.create(mutationHeaders(req), body), res);
  }
  @Patch('products/:id')
  async updateProduct(
  @Req()
  req: Request,
  @Param('id')
  id: string,
  @Body()
  body: UpdateProductDto,
  @Res({ passthrough: true })
  res: Response) {
    return commandResponse(await this.catalogue.update(mutationHeaders(req), id, body), res);
  }
  @Get('products')
  async listProducts(
  @Req()
  req: Request,
  @Query()
  query: Record<string, unknown>) {
    return this.catalogue.list(req.headers.cookie, query);
  }
  @Delete('products/:id')
  async removeProduct(
  @Req()
  req: Request,
  @Param('id')
  id: string,
  @Res({ passthrough: true })
  res: Response) {
    return commandResponse(await this.catalogue.remove(mutationHeaders(req), id), res);
  }
  @Get('warehouses/:id/layout')
  async layout(
  @Req()
  req: Request,
  @Param('id')
  id: string,
  @Query()
  query: Record<string, unknown>,
  @Res()
  res: Response) {
    const data = { data: await this.warehouses.layout(req.headers.cookie, id, query) };
    res.setHeader('Cache-Control', 'no-store');
    res.vary('Accept-Encoding');
    if (req.get('accept-encoding') && req.acceptsEncodings('gzip')) {
      res.setHeader('Content-Encoding', 'gzip');
      res.type('json').send(await promisify(gzip)(JSON.stringify(data)));
    }
    else
      res.json(data);
  }
  @Get('warehouses/:id/locations')
  async locations(
  @Req()
  req: Request,
  @Param('id')
  id: string,
  @Query()
  query: Record<string, unknown>) {
    return this.warehouses.locations(req.headers.cookie, id, query);
  }
  @Put('warehouses/:id/layout')
  async saveLayout(
  @Req()
  req: Request,
  @Param('id')
  id: string,
  @Body()
  body: SaveLayoutDto,
  @Res({ passthrough: true })
  res: Response) {
    return commandResponse(await this.layouts.save(mutationHeaders(req), id, body), res);
  }
  @Get('warehouses/:id/spatial-search')
  async spatialSearch(
  @Req()
  req: Request,
  @Param('id')
  id: string,
  @Query()
  query: Record<string, unknown>) {
    return { data: await this.warehouses.spatialSearch(req.headers.cookie, id, query) };
  }
  @Get('inventory')
  async inventoryList(
  @Req()
  req: Request,
  @Query()
  query: Record<string, unknown>) {
    return this.inventory.list(req.headers.cookie, query);
  }
  @Get('inventory/totals')
  async inventoryTotals(
  @Req()
  req: Request,
  @Query()
  query: Record<string, unknown>) {
    return this.inventory.totals(req.headers.cookie, query);
  }
  @Get('locations/:id/inventory')
  async locationInventory(
  @Req()
  req: Request,
  @Param('id')
  id: string,
  @Query()
  query: Record<string, unknown>) {
    return this.inventory.list(req.headers.cookie, query, id);
  }
  @Post('receipts')
  async receipt(
  @Req()
  req: Request,
  @Body()
  body: ReceiptDto,
  @Res({ passthrough: true })
  res: Response) {
    return commandResponse(await this.physical.receipt(mutationHeaders(req), body), res);
  }
  @Post('internal-moves')
  async move(
  @Req()
  req: Request,
  @Body()
  body: MoveDto,
  @Res({ passthrough: true })
  res: Response) {
    return commandResponse(await this.physical.move(mutationHeaders(req), body), res);
  }
  @Post('locations/:id/block')
  @HttpCode(200)
  async block(
  @Req()
  req: Request,
  @Param('id')
  id: string,
  @Body()
  _body: BlockLocationDto,
  @Res({ passthrough: true })
  res: Response) {
    return commandResponse(await this.locationsService.change(mutationHeaders(req), id, true), res);
  }
  @Post('locations/:id/unblock')
  @HttpCode(200)
  async unblock(
  @Req()
  req: Request,
  @Param('id')
  id: string,
  @Body()
  body: UnblockLocationDto,
  @Res({ passthrough: true })
  res: Response) {
    return commandResponse(await this.locationsService.change(mutationHeaders(req), id, false, body.reason), res);
  }
  @Get('history')
  async history(
  @Req()
  req: Request,
  @Query()
  query: Record<string, unknown>) {
    return this.historyService.history(req.headers.cookie, query);
  }
  @Get('audit')
  async audit(
  @Req()
  req: Request,
  @Query()
  query: Record<string, unknown>) {
    return this.historyService.audit(req.headers.cookie, query);
  }
}
