import { Controller, Get, Req, Res, UseGuards, type OnModuleDestroy } from '@nestjs/common';
import type { Request, Response } from 'express';
import { IdentityService } from '../identity/identity-service.js';
import { OperationsQueryGuard } from '../platform/http/operations-query.guard.js';
import { ChangeService, type ChangeNotice } from './change-service.js';
const roles = ['admin', 'supervisor', 'operator'];
@Controller()
@UseGuards(OperationsQueryGuard)
export class ChangesController implements OnModuleDestroy {
  private readonly closers = new Set<() => void>();
  constructor(private readonly identity: IdentityService, private readonly changes: ChangeService) {
  }
  @Get('changes')
  async changesStream(
  @Req()
  req: Request,
  @Res()
  res: Response) {
    const cookie = req.headers.cookie, tenant = await this.identity.withIdentity(cookie, roles, ctx => Promise.resolve(ctx.tenantId));
    let closed = false, timer: ReturnType<typeof setTimeout> | undefined, unlisten: () => unknown = () => {
    };
    const close = () => {
      if (closed)
        return;
      closed = true;
      if (timer)
        clearTimeout(timer);
      unlisten();
      this.closers.delete(close);
      res.end();
    };
    const valid = async () => {
      try {
        await this.identity.withIdentity(cookie, roles, () => Promise.resolve());
        return !closed;
      }
      catch {
        close();
        return false;
      }
    };
    const send = async (notice: ChangeNotice) => {
      try {
        // Send while holding the same permissions barrier as revocation.
        await this.identity.withIdentity(cookie, roles, async () => {
          if (!closed && !res.write(`id: ${notice.eventId}\nevent: change\ndata: ${JSON.stringify(notice)}\n\n`))
            close();
        });
      }
      catch {
        close();
      }
    };
    unlisten = this.changes.listen(tenant, send);
    this.closers.add(close);
    res.on('close', close);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    res.write('event: ready\ndata: {"refresh":true}\n\n');
    const heartbeat = () => {
      if (!closed)
        timer = setTimeout(async () => {
          if (await valid()) {
            if (!res.write(': keepalive\n\n'))
              close();
            heartbeat();
          }
        }, 1000);
    };
    heartbeat();
  }
  onModuleDestroy() {
    for (const close of this.closers)
      close();
  }
}
