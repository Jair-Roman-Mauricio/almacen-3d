import type { OperationsFixture } from './operations-fixture.js';
import { waitForBlockedBy } from './concurrency-helpers.js';
export async function workflowRace<T>(f: OperationsFixture, table: 'stock_balances' | 'allocations' | 'orders' | 'transfer_lines' | 'counts' | 'users', startFirst: () => PromiseLike<T>, startSecond: () => PromiseLike<T>) {
  const gate = await f.db.owner.connect();
  await gate.query('SELECT pg_advisory_lock(4470075)');
  const pid = (await gate.query('SELECT pg_backend_pid() pid')).rows[0].pid;
  await gate.query(`CREATE FUNCTION app.pause_workflow_race() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN PERFORM pg_advisory_xact_lock(4470075); RETURN NEW; END $$;CREATE TRIGGER pause_workflow_race BEFORE UPDATE ON app.${table} FOR EACH ROW EXECUTE FUNCTION app.pause_workflow_race()`);
  const first = Promise.resolve(startFirst());
  let second: Promise<T> | undefined;
  try {
    const writer = await waitForBlockedBy(f.db.app, pid);
    second = Promise.resolve(startSecond());
    await waitForBlockedBy(f.db.app, writer);
  }
  finally {
    await gate.query('SELECT pg_advisory_unlock(4470075)');
    gate.release();
  }
  try {
    return await Promise.all([first, second!]);
  }
  finally {
    await f.db.owner.query(`DROP TRIGGER pause_workflow_race ON app.${table};DROP FUNCTION app.pause_workflow_race()`);
  }
}
