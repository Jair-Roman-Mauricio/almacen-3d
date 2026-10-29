import { Body, ConflictException, Controller, ForbiddenException, Get, Module, Post, UnauthorizedException } from '@nestjs/common';
import { quantityInputSchema } from '@almacen/contracts';
import { AppModule } from '../../apps/api/dist/app.module.js';

class QuantityInput {
  static schema = quantityInputSchema;
  declare quantity: unknown;
}

@Controller('probe')
class ProbeController {
  @Post('quantity')
  quantity(@Body() body: QuantityInput) { return { data: body }; }

  @Get('unauthorized')
  unauthorized(): never { throw new UnauthorizedException('Internal auth details'); }

  @Get('forbidden')
  forbidden(): never { throw new ForbiddenException('Internal role details'); }

  @Get('conflict')
  conflict(): never { throw new ConflictException('Internal conflict details'); }

  @Get('internal')
  internal(): never { throw new Error('Internal sensitive details'); }
}

@Module({ imports: [AppModule], controllers: [ProbeController] })
export class HttpFixtureModule {}
