import {ChangesController} from './changes/changes.controller.js';
import {ChangeService} from './changes/change-service.js';
import {ExportService} from './exchange/export-service.js';
import {ExportController} from './exchange/export.controller.js';
import {ImportWorkerHost} from './exchange/import-worker-host.js';
import {ImportService} from './exchange/import-service.js';
import {ImportController} from './exchange/import.controller.js';
import {ReportService} from './reporting/report-service.js';
import {ReportController} from './reporting/report.controller.js';
import { Module, type DynamicModule } from '@nestjs/common';
import {CountService} from './counts/count-service.js';
import {CountsController} from './counts/counts.controller.js';
import {TransferWorkflowService} from './transfers/transfer-workflow-service.js';
import {TransferService} from './transfers/transfer-service.js';
import {TransfersController} from './transfers/transfers.controller.js';
import {OrderWorkflowService} from './orders/order-workflow-service.js';
import {OrdersController} from './orders/orders.controller.js';
import {OrderService} from './orders/order-service.js';
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
    return {
      module: OperationsModule,
      imports: [IdentityModule.register(options)],
      controllers: [
        ChangesController, ExportController, ImportController, ReportController,
        OperationsController, OrdersController, TransfersController, CountsController,
      ],
      providers: [
        ChangeService, ExportService, ImportWorkerHost, ImportService, ReportService,
        CountService, TransferWorkflowService, TransferService, OrderWorkflowService,
        OrderService, WarehouseService, CatalogueService, LayoutService,
        InventoryService, PhysicalOperationsService, LocationService, HistoryService,
      ],
    };
  }
}
