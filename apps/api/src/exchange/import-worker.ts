import { workerData, parentPort } from 'node:worker_threads';
import pg from 'pg';
import { applyImportJob } from './import-application.js';
import { parseJob } from './import-processing.js';
const pool = new pg.Pool({ ...workerData, max: 2 });
pool.on('error', () => {
});
let stopped = false;
parentPort?.on('message', () => {
  stopped = true;
});
try {
  while (!stopped) {
    const jobs = (await pool.query('SELECT * FROM app.pending_import_jobs()')).rows;
    for (const job of jobs) {
      if (stopped)
        break;
      await parseJob(pool, job.tenant_id, job.id);
      await applyImportJob(pool, job.tenant_id, job.id);
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
}
finally {
  await pool.end();
  parentPort?.close();
}
