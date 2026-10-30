import { Injectable, Logger, type OnModuleInit, type OnModuleDestroy } from '@nestjs/common';
import { Worker } from 'node:worker_threads';
import { IdentityService } from '../identity/identity-service.js';
@Injectable()
export class ImportWorkerHost implements OnModuleInit, OnModuleDestroy {
  private worker: Worker | undefined;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private stopped = false;
  private checking: Promise<void> | undefined;
  constructor(private readonly identity: IdentityService) {
  }
  onModuleInit() {
    this.check();
  }
  private check() {
    if (this.stopped)
      return;
    this.checking = (async () => {
      try {
        const pool = this.identity.backgroundDatabase(), pending = (await pool.query('SELECT * FROM app.pending_import_jobs()')).rows;
        if (pending.length && !this.stopped)
          this.start();
      }
      catch { /* Configuration or temporary database failure; retry locally. */
      }
      finally {
        if (!this.worker && !this.stopped)
          this.timer = setTimeout(() => this.check(), 1000);
      }
    })();
  }
  private start() {
    const o = this.identity.backgroundDatabase().options, config = { connectionString: o.connectionString, host: o.host, port: o.port, user: o.user, password: o.password, database: o.database, ssl: o.ssl };
    const worker = this.worker = new Worker(new URL('./import-worker.js', import.meta.url), { workerData: config });
    worker.on('error', () => new Logger('ImportWorker').error('Se reiniciará el trabajador de importaciones.'));
    worker.on('exit', () => {
      if (this.worker === worker)
        this.worker = undefined;
      if (!this.stopped)
        this.timer = setTimeout(() => this.check(), 1000);
    });
  }
  async onModuleDestroy() {
    this.stopped = true;
    if (this.timer)
      clearTimeout(this.timer);
    await this.checking;
    if (this.worker)
      await this.worker.terminate();
  }
}
