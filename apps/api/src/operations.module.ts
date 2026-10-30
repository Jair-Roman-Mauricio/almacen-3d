import { Module, type DynamicModule } from '@nestjs/common';
import { IdentityModule } from './identity/identity-module.js';
import type { IdentityOptions } from './identity/identity-service.js';
import { OperationsController } from './platform/http/operations.controller.js';
import { CatalogueService } from './catalogue/catalogue-service.js';
import { HistoryService } from './inventory/history-service.js';
import { LocationService } from './inventory/location-service.js';
import { PhysicalOperationsService } from './inventory/physical-operations-service.js';
import { InventoryService } from './inventory/inventory-service.js';
import { LayoutService } from './warehouses/layout-service.js';
import { WarehouseService } from './warehouses/warehouse-service.js';
@Module({})
export class OperationsModule {
  static register(options: IdentityOptions): DynamicModule {
    return { module: OperationsModule, imports: [IdentityModule.register(options)], controllers: [OperationsController], providers: [WarehouseService, CatalogueService, LayoutService, InventoryService, PhysicalOperationsService, LocationService, HistoryService] };
  }
}
