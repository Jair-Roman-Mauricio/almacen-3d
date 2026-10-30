import { Module, type DynamicModule } from '@nestjs/common';
import { IdentityController } from './identity-controller.js';
import { IdentityService, type IdentityOptions } from './identity-service.js';
@Module({})
export class IdentityModule {
  static register(options: IdentityOptions): DynamicModule { return { module: IdentityModule, controllers: [IdentityController], providers: [{ provide: IdentityService, useFactory: () => new IdentityService(options) }] }; }
}
