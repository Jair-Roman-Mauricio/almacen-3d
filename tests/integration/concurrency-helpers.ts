import type { Pool } from 'pg';
export function signal() { let resolve!: () => void; const promise = new Promise<void>(done => { resolve = done; }); return { promise, resolve }; }
export async function waitForLock(owner: Pool, pid: number): Promise<void> {
  const deadline = Date.now() + 2000;
  while (Date.now() < deadline) {
    if ((await owner.query('SELECT cardinality(pg_blocking_pids($1)) > 0 AS blocked', [pid])).rows[0]?.blocked)
      return;
    await new Promise(done => setTimeout(done, 5));
  }
  throw new Error('La segunda conexión no quedó esperando un bloqueo real de PostgreSQL.');
}
export async function waitForBlockedBy(owner: Pool, blocker: number): Promise<number> {
  const deadline = Date.now() + 2000;
  while (Date.now() < deadline) {
    const row = (await owner.query('SELECT pid FROM pg_stat_activity WHERE datname=current_database() AND $1=ANY(pg_blocking_pids(pid))', [blocker])).rows[0];
    if (row)
      return row.pid;
    await new Promise(done => setTimeout(done, 5));
  }
  throw new Error('No se observó la espera entre las dos conexiones.');
}
