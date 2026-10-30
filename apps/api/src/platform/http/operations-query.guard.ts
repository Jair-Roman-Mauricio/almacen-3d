import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request, Response } from 'express';
import { invalidInput } from './operation-input.js';
const filters: Record<string, readonly string[]> = {
  listCounts:['warehouseId','productId','locationId','cursor','limit'],
  listTransfers:['warehouseId','status','cursor','limit'],
  listOrders:['warehouseId','status','assignedToMe','q','cursor','limit'],
  history: ['warehouseId', 'productId', 'from', 'to', 'cursor', 'limit'], audit: ['entityId', 'from', 'to', 'cursor', 'limit'],
  listWarehouses: ['q', 'cursor', 'limit'], listProducts: ['q', 'cursor', 'limit'], locations: ['q', 'blocked', 'cursor', 'limit'], spatialSearch: ['kind', 'code'],
  inventoryList: ['warehouseId', 'productId', 'locationId', 'q', 'cursor', 'limit'], inventoryTotals: ['warehouseId', 'productId', 'q', 'cursor', 'limit'], locationInventory: ['cursor', 'limit'],
};
export class OperationsQueryGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp(), request = http.getRequest<Request>();
    http.getResponse<Response>().setHeader('Cache-Control', 'no-store');
    const allowed = filters[context.getHandler().name] ?? [];
    if (Object.keys(request.query).some(key => !allowed.includes(key)))
      invalidInput('La solicitud contiene filtros no admitidos.');
    return true;
  }
}
